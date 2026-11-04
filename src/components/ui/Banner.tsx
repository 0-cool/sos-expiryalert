import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type BannerTone = 'info' | 'warning' | 'danger' | 'neutral';

interface BannerProps {
  tone?: BannerTone;
  icon: IconName;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function Banner({ tone = 'info', icon, title, message, actionLabel, onAction, testID }: BannerProps) {
  const { colors, radii, spacing } = useAppTheme();
  const palette: Record<BannerTone, { background: string; foreground: string }> = {
    info: { background: colors.accentSoft, foreground: colors.accent },
    warning: { background: colors.warningSoft, foreground: colors.warning },
    danger: { background: colors.dangerSoft, foreground: colors.danger },
    neutral: { background: colors.surfaceMuted, foreground: colors.textSecondary },
  };
  const { background, foreground } = palette[tone];

  return (
    <Animated.View
      testID={testID}
      entering={FadeInUp.duration(220)}
      exiting={FadeOut.duration(150)}
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: background, borderRadius: radii.md, padding: spacing.md }]}
    >
      <Icon name={icon} size={22} color={foreground} />
      <View style={styles.text}>
        {title ? <AppText variant="bodyStrong">{title}</AppText> : null}
        <AppText variant="footnote" tone={title ? 'secondary' : 'primary'}>
          {message}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <AppText variant="subhead" style={{ color: foreground, fontWeight: '700' }}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  action: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
