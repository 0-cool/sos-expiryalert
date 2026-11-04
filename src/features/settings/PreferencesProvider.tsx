import { getLocales, useLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import i18n from '@/i18n';
import { resolveLanguage, type SupportedLanguage } from '@/i18n/languages';
import { keyValueStore, STORAGE_KEYS } from '@/lib/storage';

import { DEFAULT_PREFERENCES, sanitizePreferences, type Preferences } from './preferences';

interface PreferencesContextValue {
  preferences: Preferences;
  /** True once preferences have been read from storage. */
  isLoaded: boolean;
  /** Language actually in use (resolves "system" against the device). */
  activeLanguage: SupportedLanguage;
  updatePreferences: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);
  const latest = useRef(preferences);
  const deviceLocales = useLocales();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await keyValueStore.getJSON<unknown>(STORAGE_KEYS.preferences);
      if (cancelled) return;
      const sanitized = sanitizePreferences(stored);
      // Switch language before the first real render to avoid a flash of the wrong language.
      const language = resolveLanguage(sanitized.language, getLocales());
      if (i18n.language !== language) await i18n.changeLanguage(language);
      if (cancelled) return;
      latest.current = sanitized;
      setPreferences(sanitized);
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeLanguage = resolveLanguage(preferences.language, deviceLocales.length ? deviceLocales : getLocales());

  useEffect(() => {
    if (i18n.language !== activeLanguage) {
      void i18n.changeLanguage(activeLanguage);
    }
  }, [activeLanguage]);

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    const next = sanitizePreferences({ ...latest.current, ...patch });
    latest.current = next;
    setPreferences(next);
    void keyValueStore.setJSON(STORAGE_KEYS.preferences, next);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, isLoaded, activeLanguage, updatePreferences }),
    [preferences, isLoaded, activeLanguage, updatePreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return context;
}
