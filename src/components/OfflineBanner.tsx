import { useTranslation } from 'react-i18next';

import { useDocuments } from '@/features/documents/DocumentsProvider';
import { useIsOffline } from '@/lib/network';

import { Banner } from './ui/Banner';

/** Shown when the device is offline or the last refresh failed and cached data is displayed. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const isOffline = useIsOffline();
  const { isShowingCachedData, error, refresh } = useDocuments();

  if (!isOffline && !(isShowingCachedData && error === 'network')) return null;

  return (
    <Banner
      tone="neutral"
      icon="cloud-off-outline"
      message={t('offline.banner')}
      actionLabel={isOffline ? undefined : t('common.retry')}
      onAction={isOffline ? undefined : () => void refresh()}
      testID="offline-banner"
    />
  );
}
