import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { env, type SupabaseConfigProblem } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

import * as authService from './authService';

interface AuthContextValue {
  /** False until the persisted session has been read on launch. */
  isReady: boolean;
  session: Session | null;
  user: User | null;
  /**
   * True when the user can use the app. Stays false while a password-recovery
   * flow is finishing, even though Supabase already created a session.
   */
  isSignedIn: boolean;
  configProblem: SupabaseConfigProblem | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<authService.SignUpResult>;
  verifySignUpCode: (email: string, code: string) => Promise<void>;
  resendSignUpCode: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(!supabase);
  const [session, setSession] = useState<Session | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!supabase) return undefined;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted.current) setSession(data.session);
      })
      .catch(() => {
        if (mounted.current) setSession(null);
      })
      .finally(() => {
        if (mounted.current) setIsReady(true);
      });

    // Keep this callback synchronous: awaiting other Supabase calls inside it can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted.current) setSession(nextSession);
    });

    return () => {
      mounted.current = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    setIsRecovering(true);
    try {
      await authService.resetPasswordWithCode(email, code, newPassword);
    } catch (error) {
      // If the code was valid but the password update failed, don't leave a half-finished session.
      await authService.signOut().catch(() => undefined);
      throw error;
    } finally {
      if (mounted.current) setIsRecovering(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      user: session?.user ?? null,
      isSignedIn: !!session && !isRecovering,
      configProblem: env.supabaseProblem,
      signIn: authService.signInWithPassword,
      signUp: authService.signUpWithPassword,
      verifySignUpCode: authService.verifySignUpCode,
      resendSignUpCode: authService.resendSignUpCode,
      requestPasswordReset: authService.requestPasswordReset,
      resetPassword,
      signOut: authService.signOut,
      deleteAccount: authService.deleteCurrentAccount,
    }),
    [isReady, session, isRecovering, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
