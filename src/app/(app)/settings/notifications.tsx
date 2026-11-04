import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';

import { ReminderDaysPicker } from '@/components/documents/ReminderDaysPicker';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Screen } from '@/components/ui/Screen';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { atLocalTime } from '@/lib/dates';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { spacing, colors } = theme;
  const { preferences, updatePreferences } = usePreferences();
  const { permission, requestPermission, scheduledCount, sendTestNotification } = useNotifications();
  const { formatTime, locale } = useFormatters();
  const [testSent, setTestSent] = useState(false);

  const { hour, minute } = preferences.reminderTime;
  const timeValue = atLocalTime({ year: 2000, month: 1, day: 1 }, hour, minute);
  const granted = permission.status === 'granted';

  const permissionLabel =
    permission.status === 'granted'
      ? t('notificationSettings.permissionGranted')
      : permission.status === 'denied'
        ? t('notificationSettings.permissionDenied')
        : t('notificationSettings.permissionUndetermined');

  const allow = async () => {
    const result = await requestPermission();
    if (result.status !== 'granted' && !result.canAskAgain) void Linking.openSettings();
  };

  const setTime = (date: Date) => updatePreferences({ reminderTime: { hour: date.getHours(), minute: date.getMinutes() } });

  const openAndroidTimePicker = () =>
    DateTimePickerAndroid.open({
      value: timeValue,
      mode: 'time',
      onValueChange: (_event, date) => setTime(date),
    });

  const sendTest = async () => {
    try {
      await sendTestNotification();
      setTestSent(true);
    } catch {
      Alert.alert(t('errors.title'), t('errors.generic'));
    }
  };

  return (
    <Screen>
      <ListGroup title={t('notificationSettings.permissionTitle')}>
        <ListRow
          testID="notification-permission"
          icon={granted ? 'bell-check-outline' : 'bell-off-outline'}
          label={t('notificationSettings.permissionTitle')}
          value={permissionLabel}
        />
      </ListGroup>

      {!granted ? (
        <View style={{ gap: spacing.md }}>
          {permission.status === 'denied' ? (
            <Banner tone="warning" icon="bell-off-outline" message={t('notificationSettings.permissionDeniedHelp')} />
          ) : null}
          <Button
            testID="notification-allow"
            label={permission.canAskAgain ? t('notificationSettings.allow') : t('common.openSettings')}
            icon="bell-outline"
            onPress={() => void allow()}
          />
        </View>
      ) : null}

      <ListGroup footer={t('notificationSettings.remindersEnabledHelp')}>
        <ListRow
          testID="notification-enabled"
          label={t('notificationSettings.remindersEnabled')}
          icon="bell-ring-outline"
          switchValue={preferences.remindersEnabled}
          onSwitchChange={(value) => updatePreferences({ remindersEnabled: value })}
        />
        {Platform.OS === 'ios' ? (
          <ListRow
            label={t('notificationSettings.reminderTime')}
            icon="clock-outline"
            accessory={
              <DateTimePicker
                value={timeValue}
                mode="time"
                display="compact"
                locale={locale}
                themeVariant={theme.dark ? 'dark' : 'light'}
                accentColor={colors.accent}
                onValueChange={(_event, date) => setTime(date)}
              />
            }
          />
        ) : (
          <ListRow
            testID="notification-time"
            label={t('notificationSettings.reminderTime')}
            icon="clock-outline"
            value={formatTime(hour, minute)}
            onPress={openAndroidTimePicker}
          />
        )}
      </ListGroup>

      <ListGroup footer={t('notificationSettings.showDetailsHelp')}>
        <ListRow
          testID="notification-details"
          label={t('notificationSettings.showDetails')}
          icon="eye-outline"
          switchValue={preferences.showNotificationDetails}
          onSwitchChange={(value) => updatePreferences({ showNotificationDetails: value })}
        />
      </ListGroup>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="headline">{t('notificationSettings.defaultReminders')}</AppText>
        <ReminderDaysPicker
          value={preferences.defaultReminderDays}
          onChange={(days) => updatePreferences({ defaultReminderDays: days })}
        />
        <AppText variant="footnote" tone="tertiary">
          {t('notificationSettings.defaultRemindersHelp')}
        </AppText>
      </Card>

      <View style={styles.footer}>
        <AppText variant="footnote" tone="secondary" align="center">
          {t('notificationSettings.scheduledCount', { count: scheduledCount })}
        </AppText>
        {Platform.OS === 'android' ? (
          <AppText variant="footnote" tone="tertiary" align="center">
            {t('notificationSettings.androidTimingNote')}
          </AppText>
        ) : null}
        {testSent ? <Banner tone="info" icon="check-circle" message={t('notificationSettings.testScheduled')} /> : null}
        <Button
          testID="notification-test"
          label={t('notificationSettings.test')}
          icon="send-outline"
          variant="secondary"
          size="medium"
          disabled={!granted}
          onPress={() => void sendTest()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 12,
  },
});
