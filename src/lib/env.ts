/**
 * Runtime configuration read from EXPO_PUBLIC_* environment variables.
 * Expo inlines these at build time, so they must be referenced statically.
 */

function decodeBase64Url(segment: string): string | null {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return typeof atob === 'function' ? atob(padded) : null;
  } catch {
    return null;
  }
}

/**
 * Detects keys that must never ship in a mobile app: new-style secret keys
 * (`sb_secret_...`) and legacy JWT keys whose role is `service_role`.
 */
export function looksLikeSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length !== 3 || !parts[1]) return false;
  const payload = decodeBase64Url(parts[1]);
  if (!payload) return false;
  try {
    const parsed = JSON.parse(payload) as { role?: unknown };
    return parsed.role === 'service_role';
  } catch {
    return false;
  }
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value);
}

export type SupabaseConfigProblem = 'missing' | 'invalid-url' | 'secret-key';

export interface AppEnv {
  supabaseUrl: string;
  supabaseKey: string;
  supabaseProblem: SupabaseConfigProblem | null;
  isSupabaseConfigured: boolean;
}

export function resolveEnv(rawUrl: string | undefined, rawKey: string | undefined): AppEnv {
  const supabaseUrl = (rawUrl ?? '').trim().replace(/\/+$/, '');
  const supabaseKey = (rawKey ?? '').trim();

  let supabaseProblem: SupabaseConfigProblem | null = null;
  if (!supabaseUrl || !supabaseKey) supabaseProblem = 'missing';
  else if (!isHttpUrl(supabaseUrl)) supabaseProblem = 'invalid-url';
  else if (looksLikeSecretKey(supabaseKey)) supabaseProblem = 'secret-key';

  return {
    supabaseUrl,
    supabaseKey,
    supabaseProblem,
    isSupabaseConfigured: supabaseProblem === null,
  };
}

export const env: AppEnv = resolveEnv(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

if (__DEV__ && env.supabaseProblem === 'secret-key') {
  console.error(
    '[SOS ExpiryAlert] A secret/service_role Supabase key was provided. ' +
      'It has been ignored. Use the publishable (anon) key in the app.',
  );
}
