/* eslint-disable @typescript-eslint/no-require-imports */
// Global Jest setup: replace native-only modules with in-memory fakes.

jest.mock('expo-sqlite/kv-store', () => {
  const store = new Map<string, string>();
  const api = {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    getAllKeys: jest.fn(async () => [...store.keys()]),
    clear: jest.fn(async () => store.clear()),
  };
  return { __esModule: true, default: api };
});

jest.mock('expo-sqlite/localStorage/install', () => ({}));

jest.mock('react-native-purchases', () => {
  const purchases = {
    configure: jest.fn(),
    getOfferings: jest.fn(),
    getCustomerInfo: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  };
  return {
    __esModule: true,
    default: purchases,
    PACKAGE_TYPE: { MONTHLY: 'MONTHLY', SIX_MONTH: 'SIX_MONTH' },
  };
});

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('expo-localization', () => {
  const locales = [{ languageTag: 'en-US', languageCode: 'en', regionCode: 'US', textDirection: 'ltr' }];
  const calendars = [{ calendar: 'gregory', timeZone: 'UTC', uses24hourClock: false, firstWeekday: 1 }];
  return {
    getLocales: () => locales,
    getCalendars: () => calendars,
    useLocales: () => locales,
    useCalendars: () => calendars,
  };
});

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

require('react-native-gesture-handler/jestSetup');
require('react-native-reanimated').setUpTests();
