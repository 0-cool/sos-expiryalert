import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH_TARGET } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ListGroupProps {
  title?: string;
  footer?: string;
  children: ReactNode;
}

/** Grouped list section (iOS "inset grouped" style, also clean on Android). */
export function ListGroup({ title, footer, children }: ListGroupProps) {
  const { colors, radii, spacing, dark } = useAppTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.group}>
      {title ? (
        <AppText variant="overline" tone="tertiary" style={{ paddingHorizontal: spacing.lg }} accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderColor: colors.border,
            borderWidth: dark ? 1 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {index > 0 ? (
              <View style={[styles.separator, { backgroundColor: colors.separator, marginLeft: spacing.lg }]} />
            ) : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText variant="footnote" tone="tertiary" style={{ paddingHorizontal: spacing.lg }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

interface ListRowProps {
  label: string;
  icon?: IconName;
  value?: string;
  detail?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Renders a native switch instead of a chevron. */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  accessory?: ReactNode;
  disabled?: boolean;
  showChevron?: boolean;
  testID?: string;
}

export function ListRow({
  label,
  icon,
  value,
  detail,
  onPress,
  destructive = false,
  switchValue,
  onSwitchChange,
  accessory,
  disabled = false,
  showChevron,
  testID,
}: ListRowProps) {
  const { colors, spacing } = useAppTheme();
  const hasSwitch = typeof switchValue === 'boolean' && !!onSwitchChange;
  const chevron = showChevron ?? (!!onPress && !hasSwitch);
  const labelColor = destructive ? colors.danger : colors.text;

  const content = (
    <View style={[styles.row, { paddingHorizontal: spacing.lg, minHeight: Math.max(52, MIN_TOUCH_TARGET) }]}>
      {icon ? (
        <View style={[styles.iconBox, { backgroundColor: destructive ? colors.dangerSoft : colors.accentSoft }]}>
          <Icon name={icon} size={18} color={destructive ? colors.danger : colors.accent} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <AppText variant="body" style={{ color: labelColor }} numberOfLines={2}>
          {label}
        </AppText>
        {detail ? (
          <AppText variant="footnote" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="callout" tone="secondary" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {accessory}
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={(next) => {
            haptics.selection();
            onSwitchChange?.(next);
          }}
          disabled={disabled}
          trackColor={{ true: colors.accent, false: colors.surfaceMuted }}
          accessibilityLabel={label}
        />
      ) : null}
      {chevron ? <Icon name="chevron-right" size={22} color={colors.textTertiary} /> : null}
    </View>
  );

  if (!onPress || hasSwitch) {
    return (
      <View testID={testID} style={disabled ? styles.disabled : null}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={detail}
      android_ripple={{ color: colors.surfacePressed }}
      style={({ pressed }) => [
        { backgroundColor: pressed ? colors.surfacePressed : 'transparent' },
        disabled ? styles.disabled : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  card: {
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  value: {
    maxWidth: '45%',
  },
  disabled: {
    opacity: 0.5,
  },
});
