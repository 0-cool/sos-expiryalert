/**
 * Database tests for the documents schema, Row Level Security and account deletion.
 *
 * Runs the real migration on PGlite (PostgreSQL compiled to WebAssembly) with a
 * minimal stand-in for Supabase's `auth` schema, roles and `auth.uid()`:
 *
 *   npm run test:db
 *
 * No Docker or Supabase project required.
 */
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, '..', 'migrations');

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

/** Mirrors the parts of Supabase the migration relies on. */
const SUPABASE_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create or replace function auth.uid() returns uuid
    language sql stable
    as $$
      select nullif(
        coalesce(
          current_setting('request.jwt.claim.sub', true),
          (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
        ),
        ''
      )::uuid
    $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  -- Supabase grants broad default privileges on public; the migration must lock them down itself.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`;

let db;

async function as(role, userId, run) {
  await db.exec(`set role ${role};`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? '']);
  try {
    return await run();
  } finally {
    await db.exec('reset role;');
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}

const asUser = (userId, run) => as('authenticated', userId, run);
const asAnon = (run) => as('anon', null, run);

async function insertDocument(fields = {}) {
  const document = {
    document_type: 'passport',
    document_name: 'Juan Rojas',
    expiration_date: '2030-11-15',
    ...fields,
  };
  const columns = Object.keys(document);
  const values = Object.values(document);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const result = await db.query(
    `insert into public.documents (${columns.join(', ')}) values (${placeholders}) returning *`,
    values,
  );
  return result.rows[0];
}

before(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    await db.exec(await readFile(path.join(migrationsDir, file), 'utf8'));
  }
  await db.query(`insert into auth.users (id, email) values ($1, 'a@example.com'), ($2, 'b@example.com')`, [
    USER_A,
    USER_B,
  ]);
});

describe('privacy: schema', () => {
  test('documents table has no columns for identification numbers or images', async () => {
    const result = await db.query(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'documents' order by ordinal_position`,
    );
    assert.deepEqual(
      result.rows.map((row) => row.column_name),
      [
        'id',
        'user_id',
        'document_type',
        'document_name',
        'expiration_date',
        'notes',
        'reminder_days',
        'created_at',
        'updated_at',
      ],
    );
  });

  test('row level security is enabled', async () => {
    const result = await db.query(`select relrowsecurity from pg_class where oid = 'public.documents'::regclass`);
    assert.equal(result.rows[0].relrowsecurity, true);
  });
});

describe('row level security', () => {
  let documentOfA;

  before(async () => {
    documentOfA = await asUser(USER_A, () => insertDocument());
  });

  test('user_id defaults to the signed-in user', () => {
    assert.equal(documentOfA.user_id, USER_A);
    assert.deepEqual(documentOfA.reminder_days, [90, 30, 7, 1]);
  });

  test('a user can read their own documents', async () => {
    const rows = await asUser(USER_A, async () => (await db.query('select id from public.documents')).rows);
    assert.deepEqual(
      rows.map((row) => row.id),
      [documentOfA.id],
    );
  });

  test("another user cannot read someone else's documents", async () => {
    const rows = await asUser(USER_B, async () => (await db.query('select id from public.documents')).rows);
    assert.equal(rows.length, 0);
  });

  test("another user cannot update someone else's documents", async () => {
    const result = await asUser(USER_B, () =>
      db.query(`update public.documents set document_name = 'hacked' where id = $1`, [documentOfA.id]),
    );
    assert.equal(result.affectedRows ?? 0, 0);
    const check = await db.query('select document_name from public.documents where id = $1', [documentOfA.id]);
    assert.equal(check.rows[0].document_name, 'Juan Rojas');
  });

  test("another user cannot delete someone else's documents", async () => {
    await asUser(USER_B, () => db.query('delete from public.documents where id = $1', [documentOfA.id]));
    const check = await db.query('select count(*)::int as count from public.documents where id = $1', [
      documentOfA.id,
    ]);
    assert.equal(check.rows[0].count, 1);
  });

  test('a user cannot insert a document for someone else', async () => {
    await assert.rejects(
      asUser(USER_B, () => insertDocument({ user_id: USER_A })),
      /row-level security/i,
    );
  });

  test('a user cannot move their document to another account', async () => {
    await assert.rejects(
      asUser(USER_A, () => db.query('update public.documents set user_id = $1 where id = $2', [USER_B, documentOfA.id])),
      /row-level security/i,
    );
  });

  test('anonymous clients have no access', async () => {
    await assert.rejects(
      asAnon(() => db.query('select * from public.documents')),
      /permission denied/i,
    );
    await assert.rejects(
      asAnon(() => insertDocument({ user_id: USER_A })),
      /permission denied/i,
    );
  });

  test('updated_at changes on update', async () => {
    const before = documentOfA.updated_at;
    await new Promise((resolve) => setTimeout(resolve, 10));
    const updated = await asUser(USER_A, async () =>
      (
        await db.query(`update public.documents set notes = 'Renew at the consulate' where id = $1 returning updated_at`, [
          documentOfA.id,
        ])
      ).rows[0],
    );
    assert.ok(new Date(updated.updated_at).getTime() > new Date(before).getTime());
  });
});

describe('constraints', () => {
  const invalid = [
    ['unknown document type', { document_type: 'credit_card' }],
    ['empty name', { document_name: '   ' }],
    ['name longer than 80 characters', { document_name: 'x'.repeat(81) }],
    ['notes longer than 500 characters', { notes: 'x'.repeat(501) }],
    ['reminder offset not in the allowed set', { reminder_days: [5] }],
    ['negative reminder offset', { reminder_days: [-1] }],
    ['date before 1900', { expiration_date: '1899-12-31' }],
    ['impossible date', { expiration_date: '2023-02-29' }],
  ];

  for (const [label, fields] of invalid) {
    test(`rejects ${label}`, async () => {
      await assert.rejects(asUser(USER_A, () => insertDocument(fields)));
    });
  }

  test('accepts a leap day and every allowed reminder offset', async () => {
    const row = await asUser(USER_A, () =>
      insertDocument({ expiration_date: '2028-02-29', reminder_days: [180, 90, 60, 30, 14, 7, 3, 1, 0] }),
    );
    assert.equal(row.reminder_days.length, 9);
  });
});

describe('account deletion', () => {
  test('anonymous clients cannot call delete_current_user', async () => {
    await assert.rejects(
      asAnon(() => db.query('select public.delete_current_user()')),
      /permission denied/i,
    );
  });

  test("delete_current_user removes only the caller's account and documents", async () => {
    await asUser(USER_B, () => insertDocument({ document_name: 'Ana', document_type: 'visa' }));
    await asUser(USER_A, () => db.query('select public.delete_current_user()'));

    const users = await db.query('select id from auth.users order by id');
    assert.deepEqual(
      users.rows.map((row) => row.id),
      [USER_B],
    );
    const owners = await db.query('select distinct user_id from public.documents');
    assert.deepEqual(
      owners.rows.map((row) => row.user_id),
      [USER_B],
    );
  });
});
