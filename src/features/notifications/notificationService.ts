import * as Notifications from 'expo-notifications';
import {
  AndroidImportance,
  AndroidNotificationVisibility,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { diffSchedule, REMINDER_ID_PREFIX, type PlannedReminder } from './planner';

export const REMINDER_CHANNEL_ID = 'expiry-reminders';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface PermissionSnapshot {
  status: NotificationPermission;
  canAskAgain: boolean;
}

export interface NotificationData extends Record<string, unknown> {
  kind: 'expiry-reminder' | 'test';
  documentId?: string;
}

let handlerConfigured = false;

/** Shows reminders as banners even when the app is in the foreground. */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android requires a channel before notifications (and before the Android 13+ permission prompt). */
export async function ensureReminderChannel(name: string, description: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name,
    description,
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#2563EB',
    lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
  });
}

function toSnapshot(response: Notifications.NotificationPermissionsStatus): PermissionSnapshot {
  const iosStatus = response.ios?.status;
  const granted =
    response.granted ||
    iosStatus === IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === IosAuthorizationStatus.EPHEMERAL;
  if (granted) return { status: 'granted', canAskAgain: response.canAskAgain };
  if (response.status === 'denied') return { status: 'denied', canAskAgain: response.canAskAgain };
  return { status: 'undetermined', canAskAgain: response.canAskAgain };
}

export async function getPermission(): Promise<PermissionSnapshot> {
  try {
    return toSnapshot(await Notifications.getPermissionsAsync());
  } catch {
    return { status: 'undetermined', canAskAgain: false };
  }
}

export async function requestPermission(): Promise<PermissionSnapshot> {
  try {
    const current = await Notifications.getPermissionsAsync();
    const snapshot = toSnapshot(current);
    if (snapshot.status === 'granted' || !current.canAskAgain) return snapshot;
    return toSnapshot(
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      }),
    );
  } catch {
    return { status: 'undetermined', canAskAgain: false };
  }
}

export interface SyncResult {
  scheduled: number;
  cancelled: number;
  total: number;
}

/**
 * Makes the device's pending notifications match the plan:
 * cancels ours that are no longer wanted and schedules the missing ones.
 * Identifiers are deterministic, so running this repeatedly never duplicates anything.
 */
export async function syncScheduledReminders(plan: readonly PlannedReminder[]): Promise<SyncResult> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const { toCancel, toSchedule } = diffSchedule(
    scheduled.map((request) => request.identifier),
    plan,
  );

  await Promise.all(toCancel.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier)));

  for (const reminder of toSchedule) {
    const data: NotificationData = { kind: 'expiry-reminder', documentId: reminder.documentId };
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.identifier,
      content: {
        title: reminder.content.title,
        body: reminder.content.body,
        data,
        sound: 'default',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: reminder.triggerAt,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  }

  return { scheduled: toSchedule.length, cancelled: toCancel.length, total: plan.length };
}

/** Cancels every reminder created by this app (used on logout, account deletion or when reminders are off). */
export async function cancelAllReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(REMINDER_ID_PREFIX))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

export async function countScheduledReminders(): Promise<number> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.filter((request) => request.identifier.startsWith(REMINDER_ID_PREFIX)).length;
  } catch {
    return 0;
  }
}

export async function scheduleTestNotification(title: string, body: string): Promise<void> {
  const data: NotificationData = { kind: 'test' };
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: 'default' },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

export function getDocumentIdFromResponse(response: Notifications.NotificationResponse | null | undefined): string | null {
  const data = response?.notification.request.content.data as Partial<NotificationData> | undefined;
  return data?.kind === 'expiry-reminder' && typeof data.documentId === 'string' ? data.documentId : null;
}
