import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, type Theme } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import type { ThemePreference } from '@/features/settings/preferences';

import { buildTheme, type AppTheme } from './tokens';

const ThemeContext = createContext<AppTheme>(buildTheme(false));

function toNavigationTheme(theme: AppTheme): Theme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.dark,
    colors: {
      ...base.colors,
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}

interface AppThemeProviderProps {
  preference: ThemePreference;
  children: ReactNode;
}

/**
 * Applies the user's theme preference app-wide. `Appearance.setColorScheme`
 * also switches native UI (date pickers, alerts, keyboard) to the same scheme.
 */
export function AppThemeProvider({ preference, children }: AppThemeProviderProps) {
  useEffect(() => {
    try {
      Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
    } catch {
      // Older native runtimes may not support overriding; fall back to the system scheme.
    }
  }, [preference]);

  const systemScheme = useColorScheme();
  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';
  const theme = useMemo(() => buildTheme(isDark), [isDark]);
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
  }, [theme.colors.background]);

  return (
    <ThemeContext.Provider value={theme}>
      <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}
