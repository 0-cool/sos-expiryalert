import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import type { DocumentStats } from '@/features/documents/selectors';
import type { DocumentStatus } from '@/features/documents/types';
import { useAppTheme } from '@/theme/ThemeProvider';

const ORDER: readonly DocumentStatus[] = ['active', 'expiring_soon', 'expired'];

function Segment({ value, color }: { value: number; color: string }) {
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = withTiming(value, { duration: 600 });
  }, [grow, value]);
  const animatedStyle = useAnimatedStyle(() => ({ flexGrow: grow.value }));
  return <Animated.View style={[styles.segment, { backgroundColor: color }, animatedStyle]} />;
}

interface StatusBreakdownProps {
  stats: DocumentStats;
  onSelectStatus?: (status: DocumentStatus) => void;
}

/** Animated stacked bar + legend showing how documents split across statuses. Lives on the hero card. */
export function StatusBreakdown({ stats, onSelectStatus }: StatusBreakdownProps) {
  const { t } = useTranslation();
  const { colors, dark } = useAppTheme();

  // Brighter variants of the status colors for contrast on the navy hero card.
  const colorFor: Record<DocumentStatus, string> = {
    active: dark ? colors.success : '#4ADE80',
    expiring_soon: dark ? colors.warning : '#FBBF24',
    expired: dark ? colors.danger : '#F87171',
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.bar, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
        accessibilityRole="image"
        accessibilityLabel={`${t('dashboard.breakdownLabel')}: ${ORDER.map((status) => `${t(`status.${status}`)} ${stats[status]}`).join(', ')}`}
      >
        {ORDER.map((status) => (
          <Segment key={status} value={stats[status]} color={colorFor[status]} />
        ))}
      </View>
      <View style={styles.legend}>
        {ORDER.map((status) => (
          <Pressable
            key={status}
            onPress={onSelectStatus ? () => onSelectStatus(status) : undefined}
            disabled={!onSelectStatus}
            accessibilityRole="button"
            accessibilityLabel={`${t(`status.${status}`)}: ${stats[status]}`}
            hitSlop={6}
            style={({ pressed }) => [styles.legendItem, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.legendHeader}>
              <View style={[styles.dot, { backgroundColor: colorFor[status] }]} />
              <AppText variant="caption" tone="heroSecondary" numberOfLines={1}>
                {t(`status.${status}`)}
              </AppText>
            </View>
            <AppText variant="title2" tone="hero">
              {stats[status]}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
  },
  segment: {
    height: '100%',
    flexBasis: 0,
    flexGrow: 0,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  legendItem: {
    flex: 1,
    gap: 2,
    minHeight: 44,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
