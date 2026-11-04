import { AppError, toAppError } from '@/lib/errors';
import { requireSupabase } from '@/lib/supabase/client';

import { normalizeCode, normalizeEmail } from './validation';

/**
 * Authentication flows backed by Supabase Auth (email + password).
 *
 * Email verification and password recovery use one-time codes typed into the app
 * (no deep links needed). The Supabase email templates must include `{{ .Token }}`;
 * see README → "Supabase setup".
 */

async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toAppError(error);
  }
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  await run(async () => {
    const { error } = await requireSupabase().auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw error;
  });
}

export interface SignUpResult {
  /** True when the project requires email confirmation before the first login. */
  needsEmailVerification: boolean;
}

export async function signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
  return run(async () => {
    const { data, error } = await requireSupabase().auth.signUp({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw error;
    // With email enumeration protection, an existing confirmed user gets a fake user with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new AppError('userAlreadyExists');
    }
    return { needsEmailVerification: !data.session };
  });
}

export async function verifySignUpCode(email: string, code: string): Promise<void> {
  await run(async () => {
    const { error } = await requireSupabase().auth.verifyOtp({
      email: normalizeEmail(email),
      token: normalizeCode(code),
      type: 'email',
    });
    if (error) throw error;
  });
}

export async function resendSignUpCode(email: string): Promise<void> {
  await run(async () => {
    const { error } = await requireSupabase().auth.resend({ type: 'signup', email: normalizeEmail(email) });
    if (error) throw error;
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await run(async () => {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(normalizeEmail(email));
    if (error) throw error;
  });
}

/** Verifies the recovery code (which signs the user in) and sets the new password. */
export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void> {
  await run(async () => {
    const client = requireSupabase();
    const { error: verifyError } = await client.auth.verifyOtp({
      email: normalizeEmail(email),
      token: normalizeCode(code),
      type: 'recovery',
    });
    if (verifyError) throw verifyError;
    const { error: updateError } = await client.auth.updateUser({ password: newPassword });
    if (updateError) throw updateError;
  });
}

export async function signOut(): Promise<void> {
  await run(async () => {
    // "local" only ends the session on this device.
    const { error } = await requireSupabase().auth.signOut({ scope: 'local' });
    if (error) throw error;
  });
}

/**
 * Permanently deletes the signed-in user and all of their documents.
 * Implemented as a SECURITY DEFINER database function so the app never needs a
 * service-role key (see supabase/migrations).
 */
export async function deleteCurrentAccount(): Promise<void> {
  await run(async () => {
    const client = requireSupabase();
    const { error } = await client.rpc('delete_current_user');
    if (error) throw error;
    // The user no longer exists; clear the local session without calling the server.
    await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
  });
}
