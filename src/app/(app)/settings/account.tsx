import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { toAppError } from '@/lib/errors';
import { useIsOffline } from '@/lib/network';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { spacing } = useAppTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const isOffline = useIsOffline();
  const [deleting, setDeleting] = useState(false);
  const email = user?.email ?? '';

  const performDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // Session is gone: the app returns to the login screen and local reminders/caches are cleared.
      Alert.alert(t('account.deleted'));
    } catch (cause) {
      setDeleting(false);
      Alert.alert(t('errors.title'), t(`errors.${toAppError(cause).code}`));
    }
  };

  const confirmDelete = () => {
    if (isOffline) {
      Alert.alert(t('errors.title'), t('errors.network'));
      return;
    }
    Alert.alert(t('account.deleteTitle'), t('account.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('account.deleteConfirmTitle'), t('account.deleteConfirmMessage', { email }), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('account.deleteConfirmAction'), style: 'destructive', onPress: () => void performDelete() },
          ]),
      },
    ]);
  };

  const confirmLogout = () => {
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: () => {
          signOut().catch((cause: unknown) => Alert.alert(t('errors.title'), t(`errors.${toAppError(cause).code}`)));
        },
      },
    ]);
  };

  return (
    <Screen testID="account">
      <ListGroup>
        <ListRow icon="email-outline" label={t('account.email')} value={email} />
      </ListGroup>

      <Button testID="account-logout" label={t('settings.logout')} icon="logout" variant="secondary" onPress={confirmLogout} />

      <Card tone="danger" style={{ gap: spacing.md }}>
        <AppText variant="headline" tone="danger">
          {t('account.deleteAccount')}
        </AppText>
        <AppText variant="callout" tone="secondary">
          {t('account.deleteHelp')}
        </AppText>
        <Button
          testID="account-delete"
          label={t('account.deleteAccount')}
          icon="delete-forever-outline"
          variant="destructive"
          loading={deleting}
          onPress={confirmDelete}
        />
      </Card>
    </Screen>
  );
}
