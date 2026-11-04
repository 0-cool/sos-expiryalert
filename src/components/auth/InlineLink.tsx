import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { MIN_TOUCH_TARGET } from '@/theme/tokens';

interface InlineLinkProps {
  prompt?: string;
  label: string;
  onPress: () => void;
  testID?: string;
}

/** "Don't have an account? Sign up" style row with a comfortable touch target. */
export function InlineLink({ prompt, label, onPress, testID }: InlineLinkProps) {
  return (
    <View style={styles.row}>
      {prompt ? (
        <AppText variant="callout" tone="secondary">
          {prompt}
        </AppText>
      ) : null}
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={label}
        hitSlop={8}
        style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
      >
        <AppText variant="callout" tone="accent" style={styles.label}>
          {label}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  link: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
  },
});
