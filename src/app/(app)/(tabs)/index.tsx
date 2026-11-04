import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DocumentRow } from '@/components/documents/DocumentRow';
import { StatusBreakdown } from '@/components/documents/StatusBreakdown';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { LargeHeader } from '@/components/ui/LargeHeader';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorView, LoadingView } from '@/components/ui/StateViews';
import { useDocuments } from '@/features/documents/DocumentsProvider';
import { upcomingDocuments } from '@/features/documents/selectors';
import type { DocumentStatus } from '@/features/documents/types';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useAppTheme } from '@/theme/ThemeProvider';

const UPCOMING_LIMIT = 5;

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, radii } = useAppTheme();
  const { formatInstantDate } = useFormatters();
  const { items, stats, status, error, refresh, isRefreshing } = useDocuments();
  const { permission, requestPermission } = useNotifications();
  const { preferences, updatePreferences } = usePreferences();

  const upcoming = useMemo(() => upcomingDocuments(items, UPCOMING_LIMIT), [items]);
  const openDocument = (id: string) => router.push({ pathname: '/documents/[id]', params: { id } });
  const addDocument = () => router.push('/documents/new');
  const openList = (filter: DocumentStatus | 'all' = 'all') =>
    router.navigate({ pathname: '/documents', params: { status: filter, ts: String(Date.now()) } });

  const remindersOff = !preferences.remindersEnabled || permission.status !== 'granted';
  const enableReminders = async () => {
    if (!preferences.remindersEnabled) updatePreferences({ remindersEnabled: true });
    if (permission.status === 'granted') return;
    const result = await requestPermission();
    if (result.status !== 'granted' && !result.canAskAgain) void Linking.openSettings();
  };

  const header = (
    <LargeHeader
      title={t('dashboard.title')}
      subtitle={formatInstantDate(new Date(), 'weekday')}
      right={
        <IconButton
          testID="dashboard-add"
          icon="plus"
          variant="filled"
          accessibilityLabel={t('dashboard.addDocument')}
          onPress={addDocument}
        />
      }
    />
  );

  if (status === 'loading' || status === 'idle') {
    return (
      <Screen edges={['top']} scroll={false}>
        {header}
        <LoadingView />
      </Screen>
    );
  }

  if (status === 'error' && items.length === 0) {
    return (
      <Screen edges={['top']} scroll={false}>
        {header}
        <ErrorView code={error ?? 'generic'} onRetry={() => void refresh()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} refreshing={isRefreshing} onRefresh={() => void refresh()} testID="dashboard">
      {header}
      <OfflineBanner />
      {remindersOff && stats.total > 0 ? (
        <Banner
          tone="warning"
          icon="bell-off-outline"
          title={t('dashboard.remindersOffTitle')}
          message={t('dashboard.remindersOffBody')}
          actionLabel={t('dashboard.remindersOffAction')}
          onAction={() => void enableReminders()}
          testID="reminders-off-banner"
        />
      ) : null}

      {stats.total === 0 ? (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon="file-document-multiple-outline"
            title={t('dashboard.emptyTitle')}
            body={t('dashboard.emptyBody')}
            actionLabel={t('dashboard.emptyAction')}
            actionIcon="plus"
            onAction={addDocument}
          />
        </Card>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(350)}>
            <Card tone="hero" testID="dashboard-summary">
              <View style={styles.heroTop}>
                <View>
                  <AppText variant="subhead" tone="heroSecondary">
                    {t('dashboard.totalDocuments')}
                  </AppText>
                  <AppText variant="largeTitle" tone="hero" style={styles.total}>
                    {stats.total}
                  </AppText>
                </View>
                <View style={[styles.heroIcon, { borderRadius: radii.lg }]}>
                  <Icon
                    name={stats.expiring_soon + stats.expired > 0 ? 'calendar-alert' : 'check-decagram'}
                    size={26}
                    color={colors.heroText}
                  />
                </View>
              </View>
              <StatusBreakdown stats={stats} onSelectStatus={(selected) => openList(selected)} />
            </Card>
          </Animated.View>

          <Button testID="dashboard-add-button" label={t('dashboard.addDocument')} icon="plus" onPress={addDocument} />

          {stats.expired > 0 ? (
            <Card tone="danger" onPress={() => openList('expired')} accessibilityLabel={t('dashboard.expiredAlert', { count: stats.expired })}>
              <View style={styles.alertRow}>
                <View style={styles.alertText}>
                  <AppText variant="headline" tone="danger">
                    {t('dashboard.expiredAlert', { count: stats.expired })}
                  </AppText>
                  <AppText variant="footnote" tone="secondary">
                    {t('dashboard.expiredAlertBody')}
                  </AppText>
                </View>
                <AppText variant="subhead" tone="danger" style={styles.alertAction}>
                  {t('dashboard.review')}
                </AppText>
              </View>
            </Card>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title={t('dashboard.upcoming')} actionLabel={t('common.seeAll')} onAction={() => openList('all')} />
            {upcoming.length === 0 ? (
              <Card tone="success">
                <AppText variant="callout" tone="success">
                  {t('dashboard.nothingUpcoming')}
                </AppText>
              </Card>
            ) : (
              <Card padded={false} style={[styles.listCard, { borderColor: colors.border }]}>
                {upcoming.map((document, index) => (
                  <View key={document.id}>
                    {index > 0 ? <View style={[styles.separator, { backgroundColor: colors.separator }]} /> : null}
                    <DocumentRow document={document} onPress={openDocument} testID={`upcoming-${document.id}`} />
                  </View>
                ))}
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    marginTop: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  total: {
    fontSize: 44,
    lineHeight: 50,
  },
  heroIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertText: {
    flex: 1,
    gap: 4,
  },
  alertAction: {
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  listCard: {
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
});
