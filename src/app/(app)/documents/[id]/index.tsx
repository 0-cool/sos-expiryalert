import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DocumentTypeIcon } from '@/components/documents/DocumentTypeIcon';
import { statusColors, StatusBadge } from '@/components/documents/StatusBadge';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { LoadingView } from '@/components/ui/StateViews';
import { describeDaysRemaining } from '@/features/documents/describe';
import { useDocuments } from '@/features/documents/DocumentsProvider';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { reminderTriggerDate } from '@/features/notifications/planner';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { useNow } from '@/hooks/useNow';
import { useFormatters } from '@/i18n/useFormatters';
import { dateToISODate } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function DocumentDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useAppTheme();
  const { formatDate, formatTime, formatInstantDate } = useFormatters();
  const { getDocument, deleteDocument, status } = useDocuments();
  const { permission } = useNotifications();
  const { preferences } = usePreferences();
  const [deleting, setDeleting] = useState(false);

  const document = typeof id === 'string' ? getDocument(id) : undefined;

  const now = useNow();
  const reminders = useMemo(() => {
    if (!document) return [];
    return document.reminderDays.map((days) => {
      const trigger = reminderTriggerDate(document.expirationDate, days, preferences.reminderTime);
      return { days, trigger, passed: !trigger || trigger.getTime() <= now };
    });
  }, [document, preferences.reminderTime, now]);

  if (!document) {
    if (status === 'loading' || status === 'idle') return <LoadingView />;
    return (
      <Screen scroll={false} contentStyle={styles.center}>
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

  const palette = statusColors(document.status, colors);
  const reminderTimeLabel = formatTime(preferences.reminderTime.hour, preferences.reminderTime.minute);
  const notificationsBlocked = !preferences.remindersEnabled || permission.status !== 'granted';

  const confirmDelete = () => {
    Alert.alert(t('documents.deleteTitle'), t('documents.deleteMessage', { name: document.documentName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setDeleting(true);
          deleteDocument(document.id)
            .then(() => {
              haptics.success();
              if (router.canGoBack()) router.back();
              else router.replace('/');
            })
            .catch((cause: unknown) => {
              setDeleting(false);
              Alert.alert(t('errors.title'), t(`errors.${toAppError(cause).code}`));
            });
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              testID="document-edit"
              onPress={() => router.push({ pathname: '/documents/[id]/edit', params: { id: document.id } })}
              accessibilityRole="button"
              hitSlop={10}
            >
              <AppText variant="bodyStrong" tone="accent">
                {t('common.edit')}
              </AppText>
            </Pressable>
          ),
        }}
      />
      <Screen testID="document-details">
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card>
            <View style={styles.heroRow}>
              <DocumentTypeIcon type={document.documentType} status={document.status} size={56} />
              <View style={styles.heroText}>
                <AppText variant="title2" numberOfLines={3}>
                  {document.documentName}
                </AppText>
                <AppText variant="callout" tone="secondary">
                  {t(`documentTypes.${document.documentType}`)}
                </AppText>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.separator, marginVertical: spacing.lg }]} />
            <View style={styles.countdownRow}>
              <View style={styles.countdownText}>
                <AppText variant="title" style={{ color: palette.foreground }}>
                  {describeDaysRemaining(document.daysRemaining, t)}
                </AppText>
                <AppText variant="callout" tone="secondary">
                  {document.daysRemaining < 0
                    ? t('documentDetails.expiredOn', { date: formatDate(document.expirationDate, 'long') })
                    : t('documentDetails.expiresOn', { date: formatDate(document.expirationDate, 'long') })}
                </AppText>
              </View>
              <StatusBadge status={document.status} />
            </View>
          </Card>
        </Animated.View>

        <Card>
          <View style={styles.sectionHeader}>
            <AppText variant="headline">{t('documentDetails.remindersTitle')}</AppText>
            <Icon name="bell-ring-outline" size={20} color={colors.accent} />
          </View>
          {notificationsBlocked && reminders.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Banner tone="warning" icon="bell-off-outline" message={t('documentDetails.notificationsDisabled')} />
            </View>
          ) : null}
          {reminders.length === 0 ? (
            <AppText variant="callout" tone="secondary" style={{ marginTop: spacing.sm }}>
              {t('documentDetails.remindersEmpty')}
            </AppText>
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              {reminders.map(({ days, trigger, passed }) => (
                <View key={days} style={[styles.reminderRow, { borderBottomColor: colors.separator }]}>
                  <Icon
                    name={passed ? 'check-circle' : 'clock-outline'}
                    size={20}
                    color={passed ? colors.textTertiary : colors.accent}
                  />
                  <View style={styles.reminderText}>
                    <AppText variant="body" tone={passed ? 'tertiary' : 'primary'}>
                      {t('reminders.option', { count: days })}
                    </AppText>
                    <AppText variant="footnote" tone="tertiary">
                      {passed || !trigger
                        ? t('documentDetails.reminderPassed')
                        : t('reminders.scheduledFor', {
                            date: formatDate(dateToISODate(trigger), 'weekday'),
                            time: reminderTimeLabel,
                          })}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          )}
          <Button
            testID="document-configure-reminders"
            label={t('documentDetails.configureReminders')}
            icon="tune-variant"
            variant="secondary"
            size="medium"
            onPress={() => router.push({ pathname: '/documents/[id]/reminders', params: { id: document.id } })}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        {document.notes ? (
          <Card>
            <View style={styles.sectionHeader}>
              <AppText variant="headline">{t('documentDetails.notesTitle')}</AppText>
              <Icon name="note-text-outline" size={20} color={colors.accent} />
            </View>
            <AppText variant="body" tone="secondary" style={{ marginTop: spacing.sm }} selectable>
              {document.notes}
            </AppText>
          </Card>
        ) : null}

        <AppText variant="footnote" tone="tertiary" align="center">
          {t('documentDetails.lastUpdated', { date: formatInstantDate(new Date(document.updatedAt), 'medium') })}
        </AppText>

        <Button
          testID="document-delete"
          label={t('documentDetails.deleteDocument')}
          icon="trash-can-outline"
          variant="destructiveGhost"
          size="medium"
          loading={deleting}
          onPress={confirmDelete}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countdownText: {
    flex: 1,
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reminderText: {
    flex: 1,
    gap: 2,
  },
});
