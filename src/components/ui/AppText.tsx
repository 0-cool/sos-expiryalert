import { Text, type TextProps } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorPalette, TypographyVariant } from '@/theme/tokens';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'onPrimary'
  | 'hero'
  | 'heroSecondary';

const TONE_TO_COLOR: Record<TextTone, keyof ColorPalette> = {
  primary: 'text',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  onPrimary: 'onPrimary',
  hero: 'heroText',
  heroSecondary: 'heroTextSecondary',
};

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
}

/** Typography primitive. Supports Dynamic Type / font scaling with a sensible upper bound. */
export function AppText({ variant = 'body', tone = 'primary', align, style, ...rest }: AppTextProps) {
  const theme = useAppTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        theme.typography[variant],
        { color: theme.colors[TONE_TO_COLOR[tone]] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
