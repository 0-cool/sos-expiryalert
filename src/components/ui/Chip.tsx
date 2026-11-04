import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  count?: number;
  /** "checkbox" for multi-select groups, "radio" for single choice. */
  role?: 'checkbox' | 'radio' | 'button';
  testID?: string;
}

export function Chip({ label, selected, onPress, icon, count, role = 'button', testID }: ChipProps) {
  const { colors, radii, spacing } = useAppTheme();
  const foreground = selected ? colors.onPrimary : colors.text;

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      accessibilityRole={role}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      accessibilityState={role === 'button' ? { selected } : { checked: selected }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          borderRadius: radii.pill,
          paddingHorizontal: spacing.md + 2,
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {icon ? <Icon name={icon} size={18} color={selected ? colors.onPrimary : colors.textSecondary} /> : null}
        <AppText variant="subhead" style={{ color: foreground }} numberOfLines={1}>
          {label}
        </AppText>
        {count !== undefined ? (
          <View
            style={[
              styles.count,
              { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : colors.surfaceMuted, borderRadius: radii.pill },
            ]}
          >
            <AppText variant="caption" style={{ color: foreground }}>
              {count}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignItems: 'center',
  },
});
