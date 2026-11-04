/**
 * Normalised application errors. Every failure shown to the user is mapped to a
 * code that has a translation under `errors.<code>` in every locale.
 */
export const APP_ERROR_CODES = [
  'generic',
  'network',
  'notConfigured',
  'invalidCredentials',
  'emailNotConfirmed',
  'userAlreadyExists',
  'weakPassword',
  'samePassword',
  'invalidCode',
  'rateLimited',
  'notFound',
  'sessionExpired',
  'permissionDenied',
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
  readonly code: AppErrorCode;
  override readonly cause?: unknown;

  constructor(code: AppErrorCode, cause?: unknown) {
    super(`AppError(${code})`);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

interface ErrorLike {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  status?: unknown;
}

const AUTH_CODE_MAP: Record<string, AppErrorCode> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  user_already_exists: 'userAlreadyExists',
  email_exists: 'userAlreadyExists',
  weak_password: 'weakPassword',
  same_password: 'samePassword',
  otp_expired: 'invalidCode',
  otp_disabled: 'invalidCode',
  over_email_send_rate_limit: 'rateLimited',
  over_request_rate_limit: 'rateLimited',
  over_sms_send_rate_limit: 'rateLimited',
  session_expired: 'sessionExpired',
  session_not_found: 'sessionExpired',
  refresh_token_not_found: 'sessionExpired',
  user_not_found: 'sessionExpired',
};

const POSTGREST_CODE_MAP: Record<string, AppErrorCode> = {
  PGRST116: 'notFound',
  PGRST301: 'sessionExpired',
  '42501': 'permissionDenied',
};

function isNetworkFailure(error: ErrorLike): boolean {
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const name = typeof error.name === 'string' ? error.name : '';
  return (
    name === 'AuthRetryableFetchError' ||
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('network error') ||
    message.includes('timeout')
  );
}

/** Maps any thrown value (Supabase auth/PostgREST errors, fetch errors, ...) to an AppError. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error && typeof error === 'object') {
    const candidate = error as ErrorLike;
    if (candidate.name === 'AppConfigurationError') return new AppError('notConfigured', error);
    if (isNetworkFailure(candidate)) return new AppError('network', error);

    if (typeof candidate.code === 'string') {
      const mapped = AUTH_CODE_MAP[candidate.code] ?? POSTGREST_CODE_MAP[candidate.code];
      if (mapped) return new AppError(mapped, error);
    }

    const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : '';
    if (message.includes('invalid login credentials')) return new AppError('invalidCredentials', error);
    if (message.includes('email not confirmed')) return new AppError('emailNotConfirmed', error);
    if (message.includes('already registered')) return new AppError('userAlreadyExists', error);
    if (message.includes('token has expired') || message.includes('otp')) {
      return new AppError('invalidCode', error);
    }
    if (candidate.status === 429) return new AppError('rateLimited', error);
  }
  return new AppError('generic', error);
}
