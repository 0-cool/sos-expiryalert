import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: IconName;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const { colors, spacing } = useAppTheme();
  return (
    <Animated.View entering={FadeIn.duration(250)} style={[styles.container, { padding: spacing.xxl }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}>
        <Icon name={icon} size={40} color={colors.accent} />
      </View>
      <AppText variant="title2" align="center" accessibilityRole="header">
        {title}
      </AppText>
      {body ? (
        <AppText variant="callout" tone="secondary" align="center" style={styles.body}>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} icon={actionIcon} style={styles.action} />
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <Button label={secondaryActionLabel} onPress={onSecondaryAction} variant="ghost" size="medium" />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  body: {
    maxWidth: 340,
  },
  action: {
    marginTop: 8,
    alignSelf: 'stretch',
  },
});
