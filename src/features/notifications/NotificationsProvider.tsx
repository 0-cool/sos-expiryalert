import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { useDocuments } from '@/features/documents/DocumentsProvider';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { createCoalescingRunner } from '@/lib/coalesce';

import {
  cancelAllReminders,
  configureNotificationHandler,
  countScheduledReminders,
  ensureReminderChannel,
  getPermission,
  requestPermission as requestSystemPermission,
  scheduleTestNotification,
  syncScheduledReminders,
  type PermissionSnapshot,
} from './notificationService';
import { planReminders } from './planner';
import { buildReminderContent } from './reminderContent';

interface NotificationsContextValue {
  permission: PermissionSnapshot;
  /** Number of reminders currently scheduled on this device. */
  scheduledCount: number;
  requestPermission: () => Promise<PermissionSnapshot>;
  refreshPermission: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  /** Re-plans and re-schedules all reminders now. */
  syncNow: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

configureNotificationHandler();

type Runner = ReturnType<typeof createCoalescingRunner>;

function samePermission(a: PermissionSnapshot, b: PermissionSnapshot): boolean {
  return a.status === b.status && a.canAskAgain === b.canAskAgain;
}

/**
 * Keeps local notifications in sync with the user's documents and preferences.
 * Reminders are local (no push server): they are planned on the device and
 * re-synced whenever data, settings or language change and when the app opens.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { isReady: authReady, isSignedIn } = useAuth();
  const { documents, status: documentsStatus } = useDocuments();
  const { preferences } = usePreferences();
  const { formatDate } = useFormatters();

  const [permission, setPermission] = useState<PermissionSnapshot>({ status: 'undetermined', canAskAgain: true });
  const [scheduledCount, setScheduledCount] = useState(0);

  // Latest inputs for the sync task (read when it runs, so coalesced runs use fresh state).
  const inputs = useRef({ authReady, isSignedIn, documents, documentsStatus, preferences, permission, t, formatDate });
  useEffect(() => {
    inputs.current = { authReady, isSignedIn, documents, documentsStatus, preferences, permission, t, formatDate };
  });

  const runner = useRef<Runner | null>(null);
  useEffect(() => {
    runner.current = createCoalescingRunner(async () => {
      const state = inputs.current;
      if (!state.authReady) return;

      if (!state.isSignedIn || !state.preferences.remindersEnabled) {
        await cancelAllReminders();
      } else if (state.permission.status === 'granted' && state.documentsStatus === 'ready') {
        const plan = planReminders({
          documents: state.documents,
          now: new Date(),
          reminderTime: state.preferences.reminderTime,
          buildContent: (document, daysBefore) =>
            buildReminderContent(document, daysBefore, {
              t: state.t,
              formatDate: (value) => state.formatDate(value, 'long'),
              showDetails: state.preferences.showNotificationDetails,
            }),
        });
        await syncScheduledReminders(plan);
      }
      setScheduledCount(await countScheduledReminders());
    });
    return () => {
      runner.current = null;
    };
  }, []);

  const syncNow = useCallback(() => runner.current?.run() ?? Promise.resolve(), []);

  const applyPermission = useCallback((next: PermissionSnapshot) => {
    setPermission((current) => (samePermission(current, next) ? current : next));
  }, []);

  const refreshPermission = useCallback(async () => {
    applyPermission(await getPermission());
  }, [applyPermission]);

  // Android channel name follows the app language.
  useEffect(() => {
    ensureReminderChannel(t('notifications.channelName'), t('notifications.channelDescription')).catch(
      () => undefined,
    );
  }, [t, i18n.language]);

  // Initial permission read, and re-check (plus re-sync) when returning to the app.
  useEffect(() => {
    let active = true;
    getPermission()
      .then((next) => {
        if (active) applyPermission(next);
      })
      .catch(() => undefined);
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState !== 'active') return;
      getPermission()
        .then((next) => {
          if (active) applyPermission(next);
        })
        .catch(() => undefined);
      void syncNow();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [applyPermission, syncNow]);

  // Re-sync whenever anything that affects the schedule changes.
  useEffect(() => {
    void syncNow();
  }, [
    syncNow,
    authReady,
    isSignedIn,
    documents,
    documentsStatus,
    preferences.remindersEnabled,
    preferences.reminderTime,
    preferences.showNotificationDetails,
    permission.status,
    i18n.language,
    formatDate,
  ]);

  const requestPermission = useCallback(async () => {
    await ensureReminderChannel(t('notifications.channelName'), t('notifications.channelDescription')).catch(
      () => undefined,
    );
    const next = await requestSystemPermission();
    applyPermission(next);
    return next;
  }, [t, applyPermission]);

  const sendTestNotification = useCallback(async () => {
    await ensureReminderChannel(t('notifications.channelName'), t('notifications.channelDescription')).catch(
      () => undefined,
    );
    await scheduleTestNotification(t('notifications.testTitle'), t('notifications.testBody'));
  }, [t]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ permission, scheduledCount, requestPermission, refreshPermission, sendTestNotification, syncNow }),
    [permission, scheduledCount, requestPermission, refreshPermission, sendTestNotification, syncNow],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return context;
}
