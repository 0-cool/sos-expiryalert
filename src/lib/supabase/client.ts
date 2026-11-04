// Installs a SQLite-backed `localStorage` on globalThis so Supabase can persist the session.
import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';

import { env } from '@/lib/env';

import type { Database } from './database.types';

export type AppSupabaseClient = SupabaseClient<Database>;

/**
 * The Supabase client, or `null` when the app has not been configured yet
 * (missing EXPO_PUBLIC_SUPABASE_* variables). Screens handle the null case by
 * showing a configuration notice instead of crashing.
 *
 * Only the publishable/anon key is ever used here. Row Level Security on the
 * database guarantees that each user can only reach their own rows.
 */
export const supabase: AppSupabaseClient | null = env.isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl, env.supabaseKey, {
      auth: {
        storage: globalThis.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Native apps have no URL to read a session from.
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Supabase recommends running the token refresh loop only while the app is in
 * the foreground on mobile.
 */
function handleAppStateChange(state: AppStateStatus) {
  if (!supabase) return;
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
}

if (supabase) {
  AppState.addEventListener('change', handleAppStateChange);
}

export function requireSupabase(): AppSupabaseClient {
  if (!supabase) {
    throw new AppConfigurationError();
  }
  return supabase;
}

export class AppConfigurationError extends Error {
  constructor() {
    super('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
    this.name = 'AppConfigurationError';
  }
}
