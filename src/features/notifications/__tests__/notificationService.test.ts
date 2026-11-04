import * as Notifications from 'expo-notifications';

import {
  cancelAllReminders,
  getDocumentIdFromResponse,
  requestPermission,
  syncScheduledReminders,
} from '@/features/notifications/notificationService';
import { buildReminderIdentifier, REMINDER_ID_PREFIX, type PlannedReminder } from '@/features/notifications/planner';

jest.mock('expo-notifications', () => {
  const scheduled: { identifier: string }[] = [];
  return {
    __scheduled: scheduled,
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(async () => null),
    getAllScheduledNotificationsAsync: jest.fn(async () => [...scheduled]),
    cancelScheduledNotificationAsync: jest.fn(async (identifier: string) => {
      const index = scheduled.findIndex((item) => item.identifier === identifier);
      if (index >= 0) scheduled.splice(index, 1);
    }),
    scheduleNotificationAsync: jest.fn(async (request: { identifier: string }) => {
      scheduled.push({ identifier: request.identifier });
      return request.identifier;
    }),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    AndroidImportance: { HIGH: 4 },
    AndroidNotificationVisibility: { PRIVATE: 0 },
    IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  };
});

const mocked = Notifications as unknown as {
  __scheduled: { identifier: string }[];
  scheduleNotificationAsync: jest.Mock;
  cancelScheduledNotificationAsync: jest.Mock;
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
};

function reminder(documentId: string, daysBefore: 7 | 1, triggerAt: Date): PlannedReminder {
  const content = { title: `T ${documentId}`, body: `B ${documentId}` };
  return {
    identifier: buildReminderIdentifier(documentId, daysBefore, triggerAt, content),
    documentId,
    daysBefore,
    triggerAt,
    content,
  };
}

beforeEach(() => {
  mocked.__scheduled.splice(0);
  jest.clearAllMocks();
});

describe('syncScheduledReminders', () => {
  const a = reminder('a', 7, new Date(2030, 0, 1, 9));
  const b = reminder('b', 1, new Date(2030, 0, 2, 9));

  it('schedules a DATE trigger on the reminders channel with the document id in data', async () => {
    await syncScheduledReminders([a]);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: a.identifier,
      content: { title: a.content.title, body: a.content.body, data: { kind: 'expiry-reminder', documentId: 'a' }, sound: 'default' },
      trigger: { type: 'date', date: a.triggerAt, channelId: 'expiry-reminders' },
    });
  });

  it('is idempotent: syncing twice never duplicates notifications', async () => {
    await syncScheduledReminders([a, b]);
    const second = await syncScheduledReminders([a, b]);
    expect(second).toEqual({ scheduled: 0, cancelled: 0, total: 2 });
    expect(mocked.__scheduled).toHaveLength(2);
  });

  it('cancels reminders of deleted documents and reschedules changed dates', async () => {
    await syncScheduledReminders([a, b]);
    const moved = reminder('a', 7, new Date(2031, 0, 1, 9));
    const result = await syncScheduledReminders([moved]);
    expect(result).toEqual({ scheduled: 1, cancelled: 2, total: 1 });
    expect(mocked.__scheduled.map((item) => item.identifier)).toEqual([moved.identifier]);
  });

  it('does not touch notifications it did not create', async () => {
    mocked.__scheduled.push({ identifier: 'other-feature' });
    await syncScheduledReminders([]);
    await cancelAllReminders();
    expect(mocked.__scheduled).toEqual([{ identifier: 'other-feature' }]);
  });
});

describe('requestPermission', () => {
  it('does not prompt again when the user already denied and the OS will not ask', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false, status: 'denied', canAskAgain: false });
    await expect(requestPermission()).resolves.toEqual({ status: 'denied', canAskAgain: false });
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prompts when undetermined', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false, status: 'undetermined', canAskAgain: true });
    mocked.requestPermissionsAsync.mockResolvedValue({ granted: true, status: 'granted', canAskAgain: true });
    await expect(requestPermission()).resolves.toEqual({ status: 'granted', canAskAgain: true });
  });

  it('treats iOS provisional authorization as granted', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false, status: 'undetermined', canAskAgain: true, ios: { status: 3 } });
    await expect(requestPermission()).resolves.toEqual({ status: 'granted', canAskAgain: true });
  });

  it('never throws when the native module fails', async () => {
    mocked.getPermissionsAsync.mockRejectedValue(new Error('native failure'));
    await expect(requestPermission()).resolves.toEqual({ status: 'undetermined', canAskAgain: false });
  });
});

describe('getDocumentIdFromResponse', () => {
  const response = (data: unknown) =>
    ({ notification: { request: { content: { data } } } }) as unknown as Notifications.NotificationResponse;

  it('extracts the document id from reminder notifications', () => {
    expect(getDocumentIdFromResponse(response({ kind: 'expiry-reminder', documentId: 'abc' }))).toBe('abc');
  });

  it('ignores other notifications', () => {
    expect(getDocumentIdFromResponse(response({ kind: 'test' }))).toBeNull();
    expect(getDocumentIdFromResponse(null)).toBeNull();
  });

  it('uses the shared prefix', () => {
    expect(REMINDER_ID_PREFIX).toBe('sos-reminder:');
  });
});
