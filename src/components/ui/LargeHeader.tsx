import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';

interface LargeHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

/** Large title used at the top of tab screens (mirrors the iOS large-title pattern). */
export function LargeHeader({ title, subtitle, right }: LargeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        {subtitle ? (
          <AppText variant="overline" tone="tertiary">
            {subtitle}
          </AppText>
        ) : null}
        <AppText variant="largeTitle" accessibilityRole="header" numberOfLines={2}>
          {title}
        </AppText>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  right: {
    paddingBottom: 2,
  },
});
