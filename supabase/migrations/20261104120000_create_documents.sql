-- SOS – ExpiryAlert: initial schema
--
-- Privacy by design: this table intentionally has NO columns for document
-- numbers, scans, photos or any other identification data. It stores only what
-- is needed to send expiration reminders.

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  document_type   text not null,
  document_name   text not null,
  expiration_date date not null,
  notes           text,
  reminder_days   smallint[] not null default '{90,30,7,1}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Keep in sync with DOCUMENT_TYPES in src/features/documents/types.ts
  constraint documents_document_type_check check (
    document_type in (
      'passport',
      'drivers_license',
      'national_id',
      'visa',
      'residence_permit',
      'vehicle_registration',
      'vehicle_insurance',
      'medical_insurance',
      'professional_certification',
      'other'
    )
  ),
  constraint documents_document_name_check check (char_length(btrim(document_name)) between 1 and 80),
  constraint documents_expiration_date_check check (expiration_date between date '1900-01-01' and date '2200-12-31'),
  constraint documents_notes_check check (notes is null or char_length(notes) <= 500),
  -- Keep in sync with REMINDER_DAY_OPTIONS in src/features/reminders/reminderOptions.ts
  constraint documents_reminder_days_check check (
    cardinality(reminder_days) <= 9
    and array_position(reminder_days, null) is null
    and reminder_days <@ array[0, 1, 3, 7, 14, 30, 60, 90, 180]::smallint[]
  )
);

comment on table public.documents is
  'Documents tracked for expiration reminders. Never store identification numbers or images here.';
comment on column public.documents.document_name is
  'Friendly name or owner name chosen by the user (e.g. "John Smith"). Not a document number.';
comment on column public.documents.reminder_days is
  'Days before expiration_date when a local reminder should fire.';

-- Most queries list a user's documents ordered by expiration date.
create index if not exists documents_user_id_expiration_date_idx
  on public.documents (user_id, expiration_date);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: every user can only see and change their own rows.
-- ---------------------------------------------------------------------------
alter table public.documents enable row level security;

-- Anonymous (logged-out) clients get no access at all.
revoke all on table public.documents from anon;
grant select, insert, update, delete on table public.documents to authenticated;

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
  on public.documents
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
  on public.documents
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own"
  on public.documents
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
  on public.documents
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Account deletion (required by the App Store and Google Play).
--
-- Runs with the privileges of its owner so the app never needs a service-role
-- key. It can only ever delete the caller's own account (auth.uid()).
-- Documents are removed explicitly and also by the ON DELETE CASCADE above.
-- ---------------------------------------------------------------------------
create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  delete from public.documents where user_id = current_user_id;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public;
revoke all on function public.delete_current_user() from anon;
grant execute on function public.delete_current_user() to authenticated;
