import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ConfigNotice } from '@/components/ConfigNotice';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { useAppTheme } from '@/theme/ThemeProvider';

interface AuthScaffoldProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Screens without a native header need the top safe area. */
  withTopInset?: boolean;
  showBrand?: boolean;
}

export function AuthScaffold({
  title,
  subtitle,
  children,
  footer,
  withTopInset = false,
  showBrand = false,
}: AuthScaffoldProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();

  return (
    <Screen
      keyboardAware
      edges={withTopInset ? ['top', 'bottom'] : ['bottom']}
      contentStyle={{ paddingTop: withTopInset ? spacing.xxxl : spacing.lg, gap: spacing.xl }}
    >
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        {showBrand ? (
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <Icon name="bell-ring" size={28} color={colors.onPrimary} />
            </View>
            <AppText variant="headline">{t('common.appName')}</AppText>
          </View>
        ) : null}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="callout" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </Animated.View>
      <ConfigNotice />
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 16,
  },
  footer: {
    gap: 8,
    alignItems: 'center',
  },
});
