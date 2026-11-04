import { Pressable } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH_TARGET } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'filled' | 'tonal' | 'plain';
  size?: number;
  disabled?: boolean;
  testID?: string;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'tonal',
  size = MIN_TOUCH_TARGET,
  disabled,
  testID,
}: IconButtonProps) {
  const { colors } = useAppTheme();
  const background =
    variant === 'filled' ? colors.primary : variant === 'tonal' ? colors.accentSoft : 'transparent';
  const foreground = variant === 'filled' ? colors.onPrimary : colors.accent;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
      })}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={foreground} />
    </Pressable>
  );
}
