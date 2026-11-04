import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH_TARGET } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'destructiveGhost';
export type ButtonSize = 'large' | 'medium' | 'small';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const HEIGHTS: Record<ButtonSize, number> = { large: 54, medium: 48, small: 40 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  accessibilityHint,
  testID,
  style,
}: ButtonProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  const palette: Record<ButtonVariant, { background: string; foreground: string; border?: string }> = {
    primary: { background: colors.primary, foreground: colors.onPrimary },
    secondary: { background: colors.surface, foreground: colors.text, border: colors.border },
    ghost: { background: 'transparent', foreground: colors.accent },
    destructive: { background: colors.danger, foreground: theme.dark ? colors.background : '#FFFFFF' },
    destructiveGhost: { background: 'transparent', foreground: colors.danger },
  };
  const { background, foreground, border } = palette[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      android_ripple={variant === 'ghost' || variant === 'destructiveGhost' ? { color: colors.surfacePressed } : undefined}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: Math.max(HEIGHTS[size], size === 'small' ? 0 : MIN_TOUCH_TARGET),
          paddingHorizontal: size === 'small' ? theme.spacing.md : theme.spacing.xl,
          borderRadius: size === 'small' ? theme.radii.md : theme.radii.lg,
          backgroundColor: background,
          borderColor: border ?? 'transparent',
          borderWidth: border ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={size === 'small' ? 18 : 20} color={foreground} /> : null}
          <AppText
            variant={size === 'small' ? 'subhead' : 'bodyStrong'}
            style={{ color: foreground }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
