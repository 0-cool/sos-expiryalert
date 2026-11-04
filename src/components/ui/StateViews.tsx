import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { AppErrorCode } from '@/lib/errors';
import { useAppTheme } from '@/theme/ThemeProvider';

import { EmptyState } from './EmptyState';

export function LoadingView({ label }: { label?: string }) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label ?? t('common.loading')}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

export function ErrorView({ code, onRetry }: { code: AppErrorCode; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <EmptyState
        icon={code === 'network' ? 'cloud-off-outline' : 'alert-circle-outline'}
        title={t('errors.title')}
        body={t(`errors.${code}`)}
        actionLabel={onRetry ? t('common.retry') : undefined}
        onAction={onRetry}
        actionIcon="refresh"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
});
