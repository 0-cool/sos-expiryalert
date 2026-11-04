import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { keyValueStore, STORAGE_KEYS } from '@/lib/storage';

interface OnboardingContextValue {
  isLoaded: boolean;
  isComplete: boolean;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void keyValueStore.get(STORAGE_KEYS.onboardingComplete).then((value) => {
      if (cancelled) return;
      setIsComplete(value === 'true');
      setIsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await keyValueStore.set(STORAGE_KEYS.onboardingComplete, 'true');
    setIsComplete(true);
  }, []);

  const value = useMemo(
    () => ({ isLoaded, isComplete, completeOnboarding }),
    [isLoaded, isComplete, completeOnboarding],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return context;
}
