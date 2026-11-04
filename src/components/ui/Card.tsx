import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { cardShadow } from '@/theme/tokens';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  padded?: boolean;
  tone?: 'default' | 'muted' | 'hero' | 'danger' | 'warning' | 'success' | 'accent';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  padded = true,
  tone = 'default',
  style,
  testID,
}: CardProps) {
  const { colors, radii, spacing, dark } = useAppTheme();
  const backgrounds: Record<NonNullable<CardProps['tone']>, string> = {
    default: colors.surface,
    muted: colors.surfaceMuted,
    hero: colors.heroBackground,
    danger: colors.dangerSoft,
    warning: colors.warningSoft,
    success: colors.successSoft,
    accent: colors.accentSoft,
  };

  const baseStyle: ViewStyle = {
    backgroundColor: backgrounds[tone],
    borderRadius: radii.lg,
    padding: padded ? spacing.lg : 0,
    borderWidth: tone === 'default' && dark ? 1 : 0,
    borderColor: colors.border,
    ...(tone === 'default' && !dark ? cardShadow : null),
  };

  if (!onPress) {
    return (
      <View testID={testID} style={[baseStyle, style]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.85 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}
