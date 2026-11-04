import {
  buildReminderIdentifier,
  diffSchedule,
  MAX_SCHEDULED_REMINDERS,
  planReminders,
  REMINDER_ID_PREFIX,
  reminderTriggerDate,
  type PlannableDocument,
} from '@/features/notifications/planner';

const nineAm = { hour: 9, minute: 0 };
const buildContent = (document: PlannableDocument, daysBefore: number) => ({
  title: `${document.documentType} ${daysBefore}`,
  body: document.documentName,
});

function doc(id: string, expirationDate: string, reminderDays: PlannableDocument['reminderDays'] = [90, 30, 7, 1]) {
  return { id, documentType: 'passport' as const, documentName: `Doc ${id}`, expirationDate, reminderDays };
}

describe('reminderTriggerDate', () => {
  it('fires N days before at the chosen local time', () => {
    const date = reminderTriggerDate('2030-11-15', 30, nineAm);
    expect(date).toEqual(new Date(2030, 9, 16, 9, 0, 0, 0));
  });

  it('handles leap days', () => {
    expect(reminderTriggerDate('2028-03-01', 1, nineAm)).toEqual(new Date(2028, 1, 29, 9, 0));
    expect(reminderTriggerDate('2027-03-01', 1, nineAm)).toEqual(new Date(2027, 1, 28, 9, 0));
    expect(reminderTriggerDate('2028-02-29', 0, { hour: 18, minute: 30 })).toEqual(new Date(2028, 1, 29, 18, 30));
  });

  it('returns null for invalid dates', () => {
    expect(reminderTriggerDate('2027-02-29', 1, nineAm)).toBeNull();
  });
});

describe('planReminders', () => {
  const now = new Date(2026, 10, 4, 10, 0); // 2026-11-04 10:00 local

  it('schedules only future reminders, soonest first', () => {
    const plan = planReminders({
      documents: [doc('a', '2026-12-01'), doc('b', '2030-11-15')],
      now,
      reminderTime: nineAm,
      buildContent,
    });
    // a: 90 and 30 days before are in the past (Sept 2 / Nov 1); 7 and 1 remain.
    expect(plan.map((item) => [item.documentId, item.daysBefore])).toEqual([
      ['a', 7],
      ['a', 1],
      ['b', 90],
      ['b', 30],
      ['b', 7],
      ['b', 1],
    ]);
  });

  it('skips a reminder whose time already passed today', () => {
    // 1 day before 2026-11-05 is today at 09:00, which is before "now" (10:00).
    const plan = planReminders({ documents: [doc('a', '2026-11-05', [1, 0])], now, reminderTime: nineAm, buildContent });
    expect(plan.map((item) => item.daysBefore)).toEqual([0]);
  });

  it('never schedules anything for expired documents', () => {
    const plan = planReminders({ documents: [doc('old', '2020-01-01')], now, reminderTime: nineAm, buildContent });
    expect(plan).toEqual([]);
  });

  it('deduplicates offsets and ignores invalid ones', () => {
    const plan = planReminders({
      documents: [{ ...doc('a', '2030-01-01'), reminderDays: [7, 7, 7] }],
      now,
      reminderTime: nineAm,
      buildContent,
    });
    expect(plan).toHaveLength(1);
  });

  it('caps the plan below the iOS limit of 64 pending notifications', () => {
    const many = Array.from({ length: 40 }, (_, index) => doc(`d${index}`, `2031-01-${String((index % 28) + 1).padStart(2, '0')}`));
    const plan = planReminders({ documents: many, now, reminderTime: nineAm, buildContent });
    expect(plan).toHaveLength(MAX_SCHEDULED_REMINDERS);
    expect(MAX_SCHEDULED_REMINDERS).toBeLessThan(64);
    const times = plan.map((item) => item.triggerAt.getTime());
    expect([...times].sort((x, y) => x - y)).toEqual(times);
  });

  it('produces stable identifiers that change when content or time changes', () => {
    const first = planReminders({ documents: [doc('a', '2030-01-01', [7])], now, reminderTime: nineAm, buildContent });
    const again = planReminders({ documents: [doc('a', '2030-01-01', [7])], now, reminderTime: nineAm, buildContent });
    const renamed = planReminders({
      documents: [{ ...doc('a', '2030-01-01', [7]), documentName: 'Renamed' }],
      now,
      reminderTime: nineAm,
      buildContent,
    });
    const otherTime = planReminders({
      documents: [doc('a', '2030-01-01', [7])],
      now,
      reminderTime: { hour: 20, minute: 0 },
      buildContent,
    });
    expect(first[0]?.identifier).toBe(again[0]?.identifier);
    expect(first[0]?.identifier.startsWith(REMINDER_ID_PREFIX)).toBe(true);
    expect(renamed[0]?.identifier).not.toBe(first[0]?.identifier);
    expect(otherTime[0]?.identifier).not.toBe(first[0]?.identifier);
  });
});

describe('diffSchedule', () => {
  const content = { title: 't', body: 'b' };
  const keep = {
    identifier: buildReminderIdentifier('a', 7, new Date(2030, 0, 1, 9), content),
    documentId: 'a',
    daysBefore: 7 as const,
    triggerAt: new Date(2030, 0, 1, 9),
    content,
  };
  const add = { ...keep, identifier: buildReminderIdentifier('b', 1, new Date(2030, 0, 2, 9), content), documentId: 'b' };

  it('cancels stale reminders, schedules missing ones and leaves foreign notifications alone', () => {
    const stale = `${REMINDER_ID_PREFIX}deleted-doc:7:123:abc`;
    const diff = diffSchedule([keep.identifier, stale, 'some-other-app-notification'], [keep, add]);
    expect(diff.toCancel).toEqual([stale]);
    expect(diff.toSchedule.map((item) => item.identifier)).toEqual([add.identifier]);
    expect(diff.unchanged).toBe(1);
  });

  it('is a no-op when already in sync (no duplicates)', () => {
    const diff = diffSchedule([keep.identifier, add.identifier], [keep, add]);
    expect(diff.toCancel).toEqual([]);
    expect(diff.toSchedule).toEqual([]);
  });
});
