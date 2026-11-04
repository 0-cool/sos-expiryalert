import { DEFAULT_PREFERENCES, sanitizePreferences } from '@/features/settings/preferences';
import { keyValueStore, STORAGE_KEYS } from '@/lib/storage';

describe('sanitizePreferences', () => {
  it('returns defaults for missing or corrupted data', () => {
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(sanitizePreferences('garbage')).toEqual(DEFAULT_PREFERENCES);
    expect(sanitizePreferences({ theme: 'neon', language: 'de', reminderTime: { hour: 25, minute: 0 } })).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it('keeps valid values', () => {
    const custom = {
      language: 'fr',
      theme: 'dark',
      remindersEnabled: false,
      reminderTime: { hour: 18, minute: 30 },
      defaultReminderDays: [7, 180, 7],
      showNotificationDetails: false,
    };
    expect(sanitizePreferences(custom)).toEqual({ ...custom, defaultReminderDays: [180, 7] });
  });

  it('defaults are 90/30/7/1 days at 09:00 with details shown', () => {
    expect(DEFAULT_PREFERENCES.defaultReminderDays).toEqual([90, 30, 7, 1]);
    expect(DEFAULT_PREFERENCES.reminderTime).toEqual({ hour: 9, minute: 0 });
    expect(DEFAULT_PREFERENCES.language).toBe('system');
    expect(DEFAULT_PREFERENCES.theme).toBe('system');
  });
});

describe('persistence', () => {
  it('survives an app restart (round-trip through storage)', async () => {
    const saved = sanitizePreferences({ language: 'pt', theme: 'light', reminderTime: { hour: 7, minute: 15 } });
    await keyValueStore.setJSON(STORAGE_KEYS.preferences, saved);
    const restored = sanitizePreferences(await keyValueStore.getJSON(STORAGE_KEYS.preferences));
    expect(restored).toEqual(saved);
  });

  it('removes documents caches by prefix only', async () => {
    await keyValueStore.set(`${STORAGE_KEYS.documentsCachePrefix}user-1`, '[]');
    await keyValueStore.set(`${STORAGE_KEYS.documentsCachePrefix}user-2`, '[]');
    await keyValueStore.set(STORAGE_KEYS.onboardingComplete, 'true');
    await keyValueStore.removeByPrefix(STORAGE_KEYS.documentsCachePrefix);
    expect(await keyValueStore.get(`${STORAGE_KEYS.documentsCachePrefix}user-1`)).toBeNull();
    expect(await keyValueStore.get(STORAGE_KEYS.onboardingComplete)).toBe('true');
  });
});
