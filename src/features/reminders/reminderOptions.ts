/**
 * Reminder offsets, in days before the expiration date.
 * Keep in sync with the `documents.reminder_days` check constraint in
 * supabase/migrations.
 */
export const REMINDER_DAY_OPTIONS = [180, 90, 60, 30, 14, 7, 3, 1, 0] as const;

export type ReminderDay = (typeof REMINDER_DAY_OPTIONS)[number];

export const DEFAULT_REMINDER_DAYS: readonly ReminderDay[] = [90, 30, 7, 1];

export function isReminderDay(value: unknown): value is ReminderDay {
  return typeof value === 'number' && (REMINDER_DAY_OPTIONS as readonly number[]).includes(value);
}

/** Keeps only valid offsets, removes duplicates and sorts from earliest to latest reminder. */
export function normalizeReminderDays(values: unknown): ReminderDay[] {
  if (!Array.isArray(values)) return [];
  const unique = new Set<ReminderDay>();
  for (const value of values) {
    if (isReminderDay(value)) unique.add(value);
  }
  return [...unique].sort((a, b) => b - a);
}

export function toggleReminderDay(current: readonly ReminderDay[], day: ReminderDay): ReminderDay[] {
  return current.includes(day)
    ? current.filter((value) => value !== day)
    : normalizeReminderDays([...current, day]);
}

export function sameReminderDays(a: readonly ReminderDay[], b: readonly ReminderDay[]): boolean {
  const left = normalizeReminderDays(a);
  const right = normalizeReminderDays(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
