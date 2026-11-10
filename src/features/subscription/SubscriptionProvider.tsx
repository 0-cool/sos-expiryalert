import { PACKAGE_TYPE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { keyValueStore, STORAGE_KEYS } from '@/lib/storage';

import * as purchasesService from './purchasesService';

type SubscriptionPackages = {
  monthly: PurchasesPackage | null;
  sixMonth: PurchasesPackage | null;
};

interface SubscriptionContextValue {
  plan: 'free' | 'pro';
  isPro: boolean;
  expiresAt: string | null;
  willRenew: boolean;
  packages: SubscriptionPackages | null;
  loading: boolean;
  error: Error | null;
  purchase: (pkg: PurchasesPackage) => Promise<void>;
  restore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface SubscriptionState {
  owner: string | null;
  isPro: boolean;
  expiresAt: string | null;
  willRenew: boolean;
  packages: SubscriptionPackages | null;
  loading: boolean;
  error: Error | null;
  hasCustomerInfo: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function initialState(owner: string | null): SubscriptionState {
  return {
    owner,
    isPro: false,
    expiresAt: null,
    willRenew: false,
    packages: null,
    loading: owner !== null,
    error: null,
    hasCustomerInfo: false,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function isUserCancellation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return (
    ('userCancelled' in error && error.userCancelled === true) ||
    ('code' in error && error.code === 'PURCHASE_CANCELLED_ERROR')
  );
}

function packagesFromOfferings(offerings: Awaited<ReturnType<typeof purchasesService.getOfferings>>): SubscriptionPackages | null {
  const availablePackages = offerings?.current?.availablePackages;
  if (!availablePackages) return null;

  return {
    monthly: availablePackages.find((pkg) => pkg.packageType === PACKAGE_TYPE.MONTHLY) ?? null,
    sixMonth: availablePackages.find((pkg) => pkg.packageType === PACKAGE_TYPE.SIX_MONTH) ?? null,
  };
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useAuth();
  const userId = isSignedIn ? (user?.id ?? null) : null;
  const [state, setState] = useState<SubscriptionState>(() => initialState(userId));

  if (state.owner !== userId) {
    setState(initialState(userId));
  }

  const applyCustomerInfo = useCallback(
    (ownerId: string, customerInfo: CustomerInfo) => {
      const entitlement = customerInfo.entitlements.active.pro;
      setState((current) =>
        current.owner === ownerId
          ? {
              ...current,
              isPro: entitlement?.isActive ?? false,
              expiresAt: entitlement?.expirationDate ?? null,
              willRenew: entitlement?.willRenew ?? false,
              hasCustomerInfo: true,
              error: null,
            }
          : current,
      );
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    setState((current) =>
      current.owner === userId ? { ...current, loading: true, error: null } : current,
    );

    if (!purchasesService.configure()) {
      setState((current) =>
        current.owner === userId
          ? { ...current, isPro: false, expiresAt: null, willRenew: false, packages: null, loading: false }
          : current,
      );
      return;
    }

    try {
      await purchasesService.logIn(userId);
      const [customerInfo, offerings] = await Promise.all([
        purchasesService.getCustomerInfo(),
        purchasesService.getOfferings(),
      ]);
      if (customerInfo) applyCustomerInfo(userId, customerInfo);
      setState((current) =>
        current.owner === userId
          ? { ...current, packages: packagesFromOfferings(offerings), loading: false, error: null }
          : current,
      );
    } catch (error) {
      setState((current) =>
        current.owner === userId ? { ...current, loading: false, error: toError(error) } : current,
      );
      throw error;
    }
  }, [applyCustomerInfo, userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    const cacheKey = `${STORAGE_KEYS.subscriptionProPrefix}${userId}`;
    void keyValueStore.get(cacheKey).then((cached) => {
      if (!active) return;
      setState((current) =>
        current.owner === userId && !current.hasCustomerInfo
          ? { ...current, isPro: cached === 'true' }
          : current,
      );
    });

    const listener = (customerInfo: CustomerInfo) => applyCustomerInfo(userId, customerInfo);
    purchasesService.addCustomerInfoUpdateListener(listener);
    void refresh().catch(() => undefined);

    return () => {
      active = false;
      purchasesService.removeCustomerInfoUpdateListener(listener);
    };
  }, [applyCustomerInfo, refresh, userId]);

  useEffect(() => {
    if (!state.owner || !state.hasCustomerInfo) return;
    void keyValueStore.set(`${STORAGE_KEYS.subscriptionProPrefix}${state.owner}`, String(state.isPro));
  }, [state.owner, state.isPro, state.hasCustomerInfo]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (!userId) return;
      setState((current) => (current.owner === userId ? { ...current, loading: true, error: null } : current));
      try {
        applyCustomerInfo(userId, await purchasesService.purchase(pkg));
      } catch (error) {
        if (!isUserCancellation(error)) {
          setState((current) =>
            current.owner === userId ? { ...current, error: toError(error) } : current,
          );
          throw error;
        }
      } finally {
        setState((current) => (current.owner === userId ? { ...current, loading: false } : current));
      }
    },
    [applyCustomerInfo, userId],
  );

  const restore = useCallback(async () => {
    if (!userId) return;
    setState((current) => (current.owner === userId ? { ...current, loading: true, error: null } : current));
    try {
      applyCustomerInfo(userId, await purchasesService.restore());
    } catch (error) {
      setState((current) =>
        current.owner === userId ? { ...current, error: toError(error) } : current,
      );
      throw error;
    } finally {
      setState((current) => (current.owner === userId ? { ...current, loading: false } : current));
    }
  }, [applyCustomerInfo, userId]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      plan: state.isPro ? 'pro' : 'free',
      isPro: state.isPro,
      expiresAt: state.expiresAt,
      willRenew: state.willRenew,
      packages: state.packages,
      loading: state.loading,
      error: state.error,
      purchase,
      restore,
      refresh,
    }),
    [state, purchase, restore, refresh],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used inside <SubscriptionProvider>');
  return context;
}
