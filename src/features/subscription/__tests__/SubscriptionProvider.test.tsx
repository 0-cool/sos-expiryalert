import { act, renderHook, waitFor } from '@testing-library/react-native';
import Purchases, {
  PACKAGE_TYPE,
  type CustomerInfo,
  type MakePurchaseResult,
  type PurchasesPackage,
  type PurchasesOfferings,
} from 'react-native-purchases';

import { SubscriptionProvider, useSubscription } from '@/features/subscription/SubscriptionProvider';
import { getManagementUrl } from '@/features/subscription/purchasesService';
import { keyValueStore, STORAGE_KEYS } from '@/lib/storage';

jest.mock('@/lib/env', () => ({
  revenueCatAndroidKey: 'rc_public_android_test_key',
  revenueCatIosKey: 'rc_public_ios_test_key',
}));

jest.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ isSignedIn: true, user: { id: 'supabase-user-uuid' } }),
}));

const mockedPurchases = jest.mocked(Purchases);
const ownerCacheKey = `${STORAGE_KEYS.subscriptionProPrefix}supabase-user-uuid`;

const activeCustomerInfo = {
  entitlements: {
    active: {
      pro: {
        isActive: true,
        expirationDate: '2027-01-01T00:00:00Z',
        willRenew: true,
      },
    },
  },
  managementURL: 'https://apps.apple.com/account/subscriptions',
} as unknown as CustomerInfo;

const monthlyPackage = { packageType: PACKAGE_TYPE.MONTHLY } as PurchasesPackage;
const sixMonthPackage = { packageType: PACKAGE_TYPE.SIX_MONTH } as PurchasesPackage;
const offerings = {
  current: { availablePackages: [monthlyPackage, sixMonthPackage] },
} as PurchasesOfferings;

async function renderSubscription() {
  return renderHook(() => useSubscription(), {
    wrapper: ({ children }) => <SubscriptionProvider>{children}</SubscriptionProvider>,
  });
}

beforeEach(async () => {
  mockedPurchases.getCustomerInfo.mockReset().mockResolvedValue(activeCustomerInfo);
  mockedPurchases.getOfferings.mockReset().mockResolvedValue(offerings);
  mockedPurchases.purchasePackage
    .mockReset()
    .mockResolvedValue({ customerInfo: activeCustomerInfo } as unknown as MakePurchaseResult);
  mockedPurchases.restorePurchases.mockReset().mockResolvedValue(activeCustomerInfo);
  mockedPurchases.addCustomerInfoUpdateListener.mockReset();
  mockedPurchases.removeCustomerInfoUpdateListener.mockReset();
  await keyValueStore.remove(ownerCacheKey);
});

describe('SubscriptionProvider', () => {
  it('loads the pro entitlement and monthly/six-month packages and persists the status', async () => {
    const { result, unmount } = await renderSubscription();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({
      plan: 'pro',
      isPro: true,
      expiresAt: '2027-01-01T00:00:00Z',
      willRenew: true,
      packages: { monthly: monthlyPackage, sixMonth: sixMonthPackage },
      error: null,
    });
    await waitFor(async () => expect(await keyValueStore.get(ownerCacheKey)).toBe('true'));
    expect(mockedPurchases.logIn).toHaveBeenCalledWith('supabase-user-uuid');
    expect(mockedPurchases.addCustomerInfoUpdateListener).toHaveBeenCalledTimes(1);

    await unmount();
    expect(mockedPurchases.removeCustomerInfoUpdateListener).toHaveBeenCalledTimes(1);
  });

  it('does not expose user cancellation as an error', async () => {
    mockedPurchases.purchasePackage.mockRejectedValue({ userCancelled: true });
    const { result } = await renderSubscription();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.purchase(monthlyPackage);
    });

    expect(result.current.isPro).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('keeps the cached plan when RevenueCat cannot refresh offline', async () => {
    await keyValueStore.set(ownerCacheKey, 'true');
    mockedPurchases.getCustomerInfo.mockRejectedValue(new Error('Network unavailable'));
    mockedPurchases.getOfferings.mockRejectedValue(new Error('Network unavailable'));

    const { result } = await renderSubscription();
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));

    expect(result.current.plan).toBe('pro');
    expect(result.current.isPro).toBe(true);
  });

  it('restores purchases and applies the returned customer info', async () => {
    const { result } = await renderSubscription();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.restore();
    });

    expect(mockedPurchases.restorePurchases).toHaveBeenCalledTimes(1);
    expect(result.current.isPro).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('returns the store subscription management URL', async () => {
    await expect(getManagementUrl()).resolves.toBe('https://apps.apple.com/account/subscriptions');
  });
});
