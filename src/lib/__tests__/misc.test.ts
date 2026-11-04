import { describeDaysRemaining, describeRelative } from '@/features/documents/describe';
import { canAddDocument, canCustomizeReminders, PLAN_LIMITS_ENFORCED, PLANS } from '@/features/plans/plans';
import {
  normalizeCode,
  validateCode,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '@/features/auth/validation';
import i18n from '@/i18n';
import { createCoalescingRunner } from '@/lib/coalesce';
import { looksLikeSecretKey, resolveEnv } from '@/lib/env';
import { AppError, toAppError } from '@/lib/errors';

function fakeJwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('environment configuration', () => {
  it('detects missing configuration', () => {
    expect(resolveEnv(undefined, undefined).supabaseProblem).toBe('missing');
    expect(resolveEnv('https://x.supabase.co', '').isSupabaseConfigured).toBe(false);
  });

  it('accepts a project URL with a publishable key', () => {
    const env = resolveEnv(' https://abc.supabase.co/ ', 'sb_publishable_1234567890');
    expect(env).toMatchObject({ isSupabaseConfigured: true, supabaseUrl: 'https://abc.supabase.co' });
  });

  it('refuses secret and service-role keys so they can never ship in the app', () => {
    expect(looksLikeSecretKey('sb_secret_abcdef')).toBe(true);
    expect(looksLikeSecretKey(fakeJwt({ role: 'service_role' }))).toBe(true);
    expect(looksLikeSecretKey(fakeJwt({ role: 'anon' }))).toBe(false);
    expect(resolveEnv('https://abc.supabase.co', 'sb_secret_abcdef').supabaseProblem).toBe('secret-key');
  });

  it('rejects malformed URLs', () => {
    expect(resolveEnv('abc.supabase.co', 'sb_publishable_123').supabaseProblem).toBe('invalid-url');
  });
});

describe('error mapping', () => {
  it.each([
    [{ code: 'invalid_credentials', message: 'Invalid login credentials' }, 'invalidCredentials'],
    [{ code: 'email_not_confirmed' }, 'emailNotConfirmed'],
    [{ code: 'user_already_exists' }, 'userAlreadyExists'],
    [{ code: 'otp_expired' }, 'invalidCode'],
    [{ code: 'over_email_send_rate_limit' }, 'rateLimited'],
    [{ code: 'PGRST116' }, 'notFound'],
    [new TypeError('Network request failed'), 'network'],
    [{ name: 'AuthRetryableFetchError', message: 'Failed to fetch' }, 'network'],
    [{ name: 'AppConfigurationError' }, 'notConfigured'],
    ['weird', 'generic'],
  ])('maps %p to %s', (input, code) => {
    expect(toAppError(input).code).toBe(code);
  });

  it('keeps AppErrors as they are', () => {
    const error = new AppError('notFound');
    expect(toAppError(error)).toBe(error);
  });
});

describe('auth validation', () => {
  it('validates emails', () => {
    expect(validateEmail('')).toBe('emailRequired');
    expect(validateEmail('juan@')).toBe('emailInvalid');
    expect(validateEmail(' juan@example.com ')).toBeNull();
  });

  it('validates passwords', () => {
    expect(validatePassword('', 'login')).toBe('passwordRequired');
    expect(validatePassword('short', 'login')).toBeNull();
    expect(validatePassword('short', 'new')).toBe('passwordTooShort');
    expect(validatePassword('long enough', 'new')).toBeNull();
    expect(validatePasswordConfirmation('a', 'b')).toBe('passwordsDontMatch');
  });

  it('validates one-time codes', () => {
    expect(normalizeCode(' 123-456 ')).toBe('123456');
    expect(validateCode('123 456')).toBeNull();
    expect(validateCode('12345')).toBe('codeInvalid');
  });
});

describe('plans (subscription seam)', () => {
  it('does not enforce limits in the MVP', () => {
    expect(PLAN_LIMITS_ENFORCED).toBe(false);
    expect(canAddDocument('free', 100)).toBe(true);
    expect(canCustomizeReminders('free')).toBe(true);
  });

  it('is ready to enforce limits later', () => {
    expect(canAddDocument('free', PLANS.free.maxDocuments, true)).toBe(false);
    expect(canAddDocument('free', 4, true)).toBe(true);
    expect(canAddDocument('premium', 10_000, true)).toBe(true);
    expect(canCustomizeReminders('free', true)).toBe(false);
  });
});

describe('days remaining descriptions', () => {
  const t = i18n.t.bind(i18n);
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  it.each([
    [0, 'Expires today'],
    [1, 'Expires tomorrow'],
    [-1, 'Expired yesterday'],
    [-12, 'Expired 12 days ago'],
    [45, '45 days left'],
  ])('describeDaysRemaining(%i)', (days, text) => {
    expect(describeDaysRemaining(days, t)).toBe(text);
  });

  it.each([
    [10, 'in 10 days'],
    [61, 'in 2 months'],
    [365, 'in 11 months'],
    [800, 'in 2 years'],
  ])('describeRelative(%i)', (days, text) => {
    expect(describeRelative(days, t)).toBe(text);
  });
});

describe('coalescing runner', () => {
  it('never runs concurrently and collapses bursts into one extra run', async () => {
    let running = 0;
    let maxConcurrent = 0;
    let runs = 0;
    const runner = createCoalescingRunner(async () => {
      running += 1;
      maxConcurrent = Math.max(maxConcurrent, running);
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
    });
    await Promise.all([runner.run(), runner.run(), runner.run(), runner.run()]);
    expect(maxConcurrent).toBe(1);
    expect(runs).toBe(2);
  });

  it('keeps working after a failing run', async () => {
    let calls = 0;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const runner = createCoalescingRunner(async () => {
      calls += 1;
      if (calls === 1) throw new Error('boom');
    });
    await runner.run();
    await runner.run();
    expect(calls).toBe(2);
    warn.mockRestore();
  });
});
