import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/AuthProvider';

import { Banner } from './ui/Banner';

/** Explains missing/invalid Supabase configuration instead of letting requests fail mysteriously. */
export function ConfigNotice() {
  const { t } = useTranslation();
  const { configProblem } = useAuth();
  if (!configProblem) return null;

  const message =
    configProblem === 'secret-key'
      ? t('config.secretKey')
      : configProblem === 'invalid-url'
        ? t('config.invalidUrl')
        : t('config.missing');

  return <Banner tone="danger" icon="database-lock-outline" title={t('config.title')} message={message} testID="config-notice" />;
}
