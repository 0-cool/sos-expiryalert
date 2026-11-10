import Storage from 'expo-sqlite/kv-store';

/**
 * Thin async key-value wrapper around expo-sqlite's kv-store.
 * Centralised so the rest of the app (and the tests) depend on one small API.
 * All methods swallow storage failures: losing a cached value must never crash the app.
 */
export const keyValueStore = {
  async get(key: string): Promise<string | null> {
    try {
      return await Storage.getItem(key);
    } catch (error) {
      console.warn(`[storage] Failed to read "${key}"`, error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await Storage.setItem(key, value);
    } catch (error) {
      console.warn(`[storage] Failed to write "${key}"`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await Storage.removeItem(key);
    } catch (error) {
      console.warn(`[storage] Failed to remove "${key}"`, error);
    }
  },

  async removeByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await Storage.getAllKeys();
      await Promise.all(
        keys.filter((key) => key.startsWith(prefix)).map((key) => Storage.removeItem(key)),
      );
    } catch (error) {
      console.warn(`[storage] Failed to clear "${prefix}*"`, error);
    }
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await keyValueStore.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    await keyValueStore.set(key, JSON.stringify(value));
  },
};

export const STORAGE_KEYS = {
  preferences: 'sos.preferences.v1',
  onboardingComplete: 'sos.onboarding-complete.v1',
  documentsCachePrefix: 'sos.documents-cache.v1.',
  subscriptionProPrefix: 'sos.subscription-pro.v1.',
} as const;
