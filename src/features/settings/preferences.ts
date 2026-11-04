import {
  DEFAULT_REMINDER_DAYS,
  normalizeReminderDays,
  type ReminderDay,
} from '@/features/reminders/reminderOptions';
import { isSupportedLanguage, type LanguagePreference } from '@/i18n/languages';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ReminderTime {
  hour: number;
  minute: number;
}

/** Device-level preferences (persisted locally, not in the cloud). */
export interface Preferences {
  language: LanguagePreference;
  theme: ThemePreference;
  remindersEnabled: boolean;
  reminderTime: ReminderTime;
  defaultReminderDays: ReminderDay[];
  /** When false, notifications don't reveal the document name or type on the lock screen. */
  showNotificationDetails: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  language: 'system',
  theme: 'system',
  remindersEnabled: true,
  reminderTime: { hour: 9, minute: 0 },
  defaultReminderDays: [...DEFAULT_REMINDER_DAYS],
  showNotificationDetails: true,
};

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function sanitizeReminderTime(value: unknown): ReminderTime {
  if (value && typeof value === 'object') {
    const { hour, minute } = value as Partial<ReminderTime>;
    if (
      Number.isInteger(hour) &&
      Number.isInteger(minute) &&
      (hour as number) >= 0 &&
      (hour as number) <= 23 &&
      (minute as number) >= 0 &&
      (minute as number) <= 59
    ) {
      return { hour: hour as number, minute: minute as number };
    }
  }
  return { ...DEFAULT_PREFERENCES.reminderTime };
}

/** Accepts anything read from storage and returns a complete, valid Preferences object. */
export function sanitizePreferences(raw: unknown): Preferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFERENCES, defaultReminderDays: [...DEFAULT_PREFERENCES.defaultReminderDays] };
  }
  const value = raw as Partial<Record<keyof Preferences, unknown>>;

  const language =
    value.language === 'system' || isSupportedLanguage(value.language) ? value.language : DEFAULT_PREFERENCES.language;
  const defaultReminderDays = Array.isArray(value.defaultReminderDays)
    ? normalizeReminderDays(value.defaultReminderDays)
    : [...DEFAULT_PREFERENCES.defaultReminderDays];

  return {
    language,
    theme: isThemePreference(value.theme) ? value.theme : DEFAULT_PREFERENCES.theme,
    remindersEnabled:
      typeof value.remindersEnabled === 'boolean' ? value.remindersEnabled : DEFAULT_PREFERENCES.remindersEnabled,
    reminderTime: sanitizeReminderTime(value.reminderTime),
    defaultReminderDays,
    showNotificationDetails:
      typeof value.showNotificationDetails === 'boolean'
        ? value.showNotificationDetails
        : DEFAULT_PREFERENCES.showNotificationDetails,
  };
}
