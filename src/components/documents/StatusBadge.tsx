import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { DocumentStatus } from '@/features/documents/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorPalette } from '@/theme/tokens';

export function statusColors(status: DocumentStatus, colors: ColorPalette) {
  switch (status) {
    case 'expired':
      return { foreground: colors.danger, background: colors.dangerSoft };
    case 'expiring_soon':
      return { foreground: colors.warning, background: colors.warningSoft };
    default:
      return { foreground: colors.success, background: colors.successSoft };
  }
}

export function StatusBadge({ status, size = 'regular' }: { status: DocumentStatus; size?: 'regular' | 'small' }) {
  const { t } = useTranslation();
  const { colors, radii } = useAppTheme();
  const { foreground, background } = statusColors(status, colors);

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t(`status.${status}`)}
      style={[
        styles.badge,
        {
          backgroundColor: background,
          borderRadius: radii.pill,
          paddingHorizontal: size === 'small' ? 8 : 10,
          paddingVertical: size === 'small' ? 2 : 4,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: foreground }]} />
      <AppText variant="caption" style={{ color: foreground, fontWeight: '700' }} numberOfLines={1}>
        {t(`status.${status}`)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
