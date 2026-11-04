import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentStyle={{ justifyContent: 'center' }}>
      <EmptyState
        icon="map-marker-question-outline"
        title={t('notFound.title')}
        body={t('notFound.body')}
        actionLabel={t('notFound.goHome')}
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
