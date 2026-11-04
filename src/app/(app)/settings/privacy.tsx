import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { useAppTheme } from '@/theme/ThemeProvider';

function Bullet({ icon, color, text }: { icon: IconName; color: string; text: string }) {
  return (
    <View style={styles.bullet}>
      <Icon name={icon} size={20} color={color} />
      <AppText variant="callout" tone="secondary" style={styles.bulletText}>
        {text}
      </AppText>
    </View>
  );
}

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useAppTheme();

  return (
    <Screen testID="privacy">
      <Card tone="hero" style={{ gap: spacing.sm }}>
        <Icon name="shield-lock-outline" size={36} color={colors.heroText} />
        <AppText variant="title2" tone="hero" accessibilityRole="header">
          {t('privacy.headline')}
        </AppText>
        <AppText variant="callout" tone="heroSecondary">
          {t('privacy.intro')}
        </AppText>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="headline" accessibilityRole="header">
          {t('privacy.storeTitle')}
        </AppText>
        <Bullet icon="email-outline" color={colors.accent} text={t('privacy.storeItems.account')} />
        <Bullet icon="file-document-outline" color={colors.accent} text={t('privacy.storeItems.document')} />
        <Bullet icon="bell-outline" color={colors.accent} text={t('privacy.storeItems.reminders')} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="headline" accessibilityRole="header">
          {t('privacy.neverTitle')}
        </AppText>
        <Bullet icon="close-circle" color={colors.danger} text={t('privacy.neverItems.numbers')} />
        <Bullet icon="close-circle" color={colors.danger} text={t('privacy.neverItems.images')} />
        <Bullet icon="close-circle" color={colors.danger} text={t('privacy.neverItems.payment')} />
        <AppText variant="footnote" tone="warning">
          {t('privacy.notesWarning')}
        </AppText>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <AppText variant="headline" accessibilityRole="header">
          {t('privacy.whereTitle')}
        </AppText>
        <AppText variant="callout" tone="secondary">
          {t('privacy.whereBody')}
        </AppText>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <AppText variant="headline" accessibilityRole="header">
          {t('privacy.deleteTitle')}
        </AppText>
        <AppText variant="callout" tone="secondary">
          {t('privacy.deleteBody')}
        </AppText>
        <Button
          label={t('account.title')}
          variant="secondary"
          size="medium"
          icon="account-circle-outline"
          onPress={() => router.push('/settings/account')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    flex: 1,
  },
});
