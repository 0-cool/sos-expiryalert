import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Screen } from '@/components/ui/Screen';
import { useDocuments } from '@/features/documents/DocumentsProvider';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { reminderTriggerDate } from '@/features/notifications/planner';
import {
  REMINDER_DAY_OPTIONS,
  sameReminderDays,
  toggleReminderDay,
  type ReminderDay,
} from '@/features/reminders/reminderOptions';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { useNow } from '@/hooks/useNow';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useFormatters } from '@/i18n/useFormatters';
import { dateToISODate } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useIsOffline } from '@/lib/network';

export default function DocumentRemindersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDocument, updateDocument } = useDocuments();
  const { preferences } = usePreferences();
  const { permission } = useNotifications();
  const { formatDate, formatTime } = useFormatters();
  const isOffline = useIsOffline();
  const now = useNow();

  const document = typeof id === 'string' ? getDocument(id) : undefined;
  const [selected, setSelected] = useState<ReminderDay[]>(() => document?.reminderDays ?? []);
  const [saving, setSaving] = useState(false);
  const dirty = !!document && !sameReminderDays(selected, document.reminderDays);
  const disableGuard = useUnsavedChangesGuard(dirty && !saving);

  if (!document) {
    return (
      <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
        <EmptyState
          icon="file-question-outline"
          title={t('documentDetails.notFoundTitle')}
          body={t('errors.notFound')}
          actionLabel={t('common.back')}
          onAction={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </Screen>
    );
  }

  const time = formatTime(preferences.reminderTime.hour, preferences.reminderTime.minute);

  const save = async () => {
    if (isOffline) {
      Alert.alert(t('errors.title'), t('offline.cannotSave'));
      return;
    }
    setSaving(true);
    try {
      await updateDocument(document.id, { reminderDays: selected });
      haptics.success();
      disableGuard();
      if (router.canGoBack()) router.back();
    } catch (cause) {
      Alert.alert(t('errors.title'), t(`errors.${toAppError(cause).code}`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          testID="reminders-save"
          label={saving ? t('common.saving') : t('common.save')}
          icon="check"
          loading={saving}
          disabled={!dirty}
          onPress={() => void save()}
        />
      }
    >
      <AppText variant="callout" tone="secondary">
        {t('reminders.subtitle', { name: document.documentName })}
      </AppText>

      {!preferences.remindersEnabled || permission.status !== 'granted' ? (
        <Banner
          tone="warning"
          icon="bell-off-outline"
          message={t('documentDetails.notificationsDisabled')}
          actionLabel={t('common.openSettings')}
          onAction={() => router.push('/settings/notifications')}
        />
      ) : null}

      <ListGroup>
        {REMINDER_DAY_OPTIONS.map((days) => {
          const trigger = reminderTriggerDate(document.expirationDate, days, preferences.reminderTime);
          const passed = !trigger || trigger.getTime() <= now;
          return (
            <ListRow
              key={days}
              testID={`reminder-option-${days}`}
              label={t('reminders.option', { count: days })}
              detail={
                passed || !trigger
                  ? t('reminders.passed')
                  : t('reminders.scheduledFor', { date: formatDate(dateToISODate(trigger), 'weekday'), time })
              }
              switchValue={selected.includes(days)}
              onSwitchChange={() => setSelected((current) => toggleReminderDay(current, days))}
            />
          );
        })}
      </ListGroup>

      <Button
        testID="reminders-reset"
        label={t('reminders.resetDefaults')}
        variant="ghost"
        size="medium"
        onPress={() => setSelected([...preferences.defaultReminderDays])}
      />
    </Screen>
  );
}
