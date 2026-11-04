import type { ReminderTime } from '@/features/settings/preferences';
import { addDays, atLocalTime, parseISODate } from '@/lib/dates';
import { hashString } from '@/lib/hash';

import type { DocumentRecord } from '@/features/documents/types';
import { normalizeReminderDays, type ReminderDay } from '@/features/reminders/reminderOptions';

/** Every notification scheduled by this app has an identifier starting with this prefix. */
export const REMINDER_ID_PREFIX = 'sos-reminder:';

/**
 * iOS keeps at most 64 pending local notifications per app and silently drops
 * the rest. We schedule the soonest ones (with headroom) and top up the window
 * every time the app is opened or data changes.
 */
export const MAX_SCHEDULED_REMINDERS = 60;

export type PlannableDocument = Pick<
  DocumentRecord,
  'id' | 'documentType' | 'documentName' | 'expirationDate' | 'reminderDays'
>;

export interface ReminderContent {
  title: string;
  body: string;
}

export interface PlannedReminder {
  identifier: string;
  documentId: string;
  daysBefore: ReminderDay;
  triggerAt: Date;
  content: ReminderContent;
}

export interface PlanRemindersInput {
  documents: readonly PlannableDocument[];
  now: Date;
  reminderTime: ReminderTime;
  buildContent: (document: PlannableDocument, daysBefore: ReminderDay) => ReminderContent;
  limit?: number;
}

/** The moment a reminder fires: N days before the expiration date at the chosen local time. */
export function reminderTriggerDate(
  expirationDate: string,
  daysBefore: number,
  reminderTime: ReminderTime,
): Date | null {
  const expiration = parseISODate(expirationDate);
  if (!expiration) return null;
  return atLocalTime(addDays(expiration, -daysBefore), reminderTime.hour, reminderTime.minute);
}

/**
 * Deterministic identifier: the same document, offset, instant and text always
 * produce the same id, so re-syncing never creates duplicates, and any change
 * (date, time, language, name) produces a new id that replaces the old one.
 */
export function buildReminderIdentifier(
  documentId: string,
  daysBefore: number,
  triggerAt: Date,
  content: ReminderContent,
): string {
  return `${REMINDER_ID_PREFIX}${documentId}:${daysBefore}:${triggerAt.getTime()}:${hashString(
    `${content.title}\n${content.body}`,
  )}`;
}

export function planReminders({
  documents,
  now,
  reminderTime,
  buildContent,
  limit = MAX_SCHEDULED_REMINDERS,
}: PlanRemindersInput): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  const nowMs = now.getTime();

  for (const document of documents) {
    for (const daysBefore of normalizeReminderDays(document.reminderDays)) {
      const triggerAt = reminderTriggerDate(document.expirationDate, daysBefore, reminderTime);
      // Past reminders (including every reminder of an expired document) are skipped.
      if (!triggerAt || triggerAt.getTime() <= nowMs) continue;
      const content = buildContent(document, daysBefore);
      planned.push({
        identifier: buildReminderIdentifier(document.id, daysBefore, triggerAt, content),
        documentId: document.id,
        daysBefore,
        triggerAt,
        content,
      });
    }
  }

  planned.sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime() || a.identifier.localeCompare(b.identifier));
  return planned.slice(0, Math.max(0, limit));
}

export interface ScheduleDiff {
  toCancel: string[];
  toSchedule: PlannedReminder[];
  unchanged: number;
}

/** Compares what is scheduled on the device with the desired plan. Only our own ids are touched. */
export function diffSchedule(scheduledIdentifiers: readonly string[], plan: readonly PlannedReminder[]): ScheduleDiff {
  const ours = scheduledIdentifiers.filter((id) => id.startsWith(REMINDER_ID_PREFIX));
  const desired = new Set(plan.map((item) => item.identifier));
  const existing = new Set(ours);
  return {
    toCancel: ours.filter((id) => !desired.has(id)),
    toSchedule: plan.filter((item) => !existing.has(item.identifier)),
    unchanged: plan.length - plan.filter((item) => !existing.has(item.identifier)).length,
  };
}
