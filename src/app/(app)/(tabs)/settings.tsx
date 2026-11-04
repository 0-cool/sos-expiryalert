import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { LargeHeader } from '@/components/ui/LargeHeader';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAuth } from '@/features/auth/AuthProvider';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import type { ThemePreference } from '@/features/settings/preferences';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { toAppError } from '@/lib/errors';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { spacing } = useAppTheme();
  const { preferences, updatePreferences, activeLanguage } = usePreferences();
  const { user, signOut } = useAuth();
  const { permission } = useNotifications();

  const languageValue = t(`languages.${activeLanguage}`);

  const notificationsOn = preferences.remindersEnabled && permission.status === 'granted';
  const version = Constants.expoConfig?.version ?? '1.0.0';

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
    <Screen edges={['top']} testID="settings">
      <LargeHeader title={t('settings.title')} />

      <ListGroup title={t('settings.sectionPreferences')}>
        <ListRow
          testID="settings-language"
          icon="translate"
          label={t('settings.language')}
          detail={preferences.language === 'system' ? t('settings.languageSystem') : undefined}
          value={languageValue}
          onPress={() => router.push('/settings/language')}
        />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <AppText variant="body">{t('settings.theme')}</AppText>
          </View>
          <SegmentedControl<ThemePreference>
            accessibilityLabel={t('settings.theme')}
            value={preferences.theme}
            onChange={(theme) => updatePreferences({ theme })}
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
          />
        </View>
      </ListGroup>

      <ListGroup title={t('settings.sectionNotifications')}>
        <ListRow
          testID="settings-notifications"
          icon="bell-outline"
          label={t('settings.notifications')}
          value={notificationsOn ? t('common.on') : t('common.off')}
          onPress={() => router.push('/settings/notifications')}
        />
      </ListGroup>

      <ListGroup title={t('settings.sectionPrivacy')}>
        <ListRow
          testID="settings-privacy"
          icon="shield-lock-outline"
          label={t('settings.privacy')}
          onPress={() => router.push('/settings/privacy')}
        />
        <ListRow
          testID="settings-account"
          icon="account-circle-outline"
          label={t('settings.account')}
          detail={user?.email ? `${t('settings.signedInAs')} ${user.email}` : undefined}
          onPress={() => router.push('/settings/account')}
        />
        <ListRow testID="settings-logout" icon="logout" label={t('settings.logout')} destructive onPress={confirmLogout} />
      </ListGroup>

      <ListGroup title={t('settings.sectionAbout')}>
        <ListRow icon="information-outline" label={t('settings.version')} value={version} />
      </ListGroup>

      <AppText variant="footnote" tone="tertiary" align="center">
        {`${t('common.appName')} · ${t('common.tagline')}`}
      </AppText>
    </Screen>
  );
}
