import { Platform, type TextStyle } from 'react-native';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfacePressed: string;
  border: string;
  separator: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Deep navy brand color — primary buttons, hero cards. */
  primary: string;
  onPrimary: string;
  primarySoft: string;
  /** Blue accent — links, selection, focus. */
  accent: string;
  onAccent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  heroBackground: string;
  heroText: string;
  heroTextSecondary: string;
  overlay: string;
  skeleton: string;
}

export const lightColors: ColorPalette = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F5',
  surfacePressed: '#E6EAF0',
  border: '#E1E6ED',
  separator: '#E8ECF1',
  text: '#0B1B33',
  textSecondary: '#4E5A6B',
  textTertiary: '#646F80',
  primary: '#0B2447',
  onPrimary: '#FFFFFF',
  primarySoft: '#E6ECF5',
  accent: '#2563EB',
  onAccent: '#FFFFFF',
  accentSoft: '#E8F0FE',
  success: '#157F3D',
  successSoft: '#E7F6EC',
  warning: '#B45309',
  warningSoft: '#FEF3E2',
  danger: '#C62828',
  dangerSoft: '#FDECEC',
  heroBackground: '#0B2447',
  heroText: '#FFFFFF',
  heroTextSecondary: '#C3CEE0',
  overlay: 'rgba(11, 27, 51, 0.45)',
  skeleton: '#E6EAF0',
};

export const darkColors: ColorPalette = {
  background: '#0A1020',
  surface: '#111A2C',
  surfaceMuted: '#18233A',
  surfacePressed: '#1E2A44',
  border: '#24324B',
  separator: '#1E2A40',
  text: '#F1F4F9',
  textSecondary: '#A9B4C6',
  textTertiary: '#7F8BA0',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  primarySoft: '#16233D',
  accent: '#7AA7FF',
  onAccent: '#0A1020',
  accentSoft: '#16233D',
  success: '#4ADE80',
  successSoft: '#0F2A1C',
  warning: '#FBBF24',
  warningSoft: '#2E2210',
  danger: '#F87171',
  dangerSoft: '#321618',
  heroBackground: '#13284A',
  heroText: '#FFFFFF',
  heroTextSecondary: '#AFC0DA',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#1A2538',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/** Minimum comfortable touch target (Apple HIG: 44pt, Material: 48dp). */
export const MIN_TOUCH_TARGET = Platform.select({ ios: 44, default: 48 });

export type TypographyVariant =
  | 'largeTitle'
  | 'title'
  | 'title2'
  | 'headline'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption'
  | 'overline';

export const typography: Record<TypographyVariant, TextStyle> = {
  largeTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: Platform.OS === 'ios' ? 0.3 : 0 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  title2: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  subhead: { fontSize: 14, lineHeight: 19, fontWeight: '500' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
};

export interface AppTheme {
  dark: boolean;
  colors: ColorPalette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
}

export function buildTheme(dark: boolean): AppTheme {
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    spacing,
    radii,
    typography,
  };
}

export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0B1B33',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  default: {
    elevation: 1,
  },
});
