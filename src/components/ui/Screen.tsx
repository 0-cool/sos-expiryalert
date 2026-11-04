import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/ThemeProvider';

interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (default) or a fixed layout. */
  scroll?: boolean;
  /** Safe-area edges to pad. Screens under a native header usually only need the bottom edge. */
  edges?: Edge[];
  /** Avoid the keyboard (forms). */
  keyboardAware?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  /** Content pinned under the scroll view (e.g. a Save button). */
  footer?: ReactNode;
  testID?: string;
}

export function Screen({
  children,
  scroll = true,
  edges = ['bottom'],
  keyboardAware = false,
  refreshing,
  onRefresh,
  contentStyle,
  footer,
  testID,
}: ScreenProps) {
  const { colors, spacing } = useAppTheme();
  const padding = { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg };

  const body = scroll ? (
    <ScrollView
      testID={testID}
      style={styles.flex}
      contentContainerStyle={[padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
            colors={[colors.accent]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View testID={testID} style={[styles.flex, padding, contentStyle]}>
      {children}
    </View>
  );

  const content = (
    <>
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              borderTopColor: colors.separator,
              backgroundColor: colors.background,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      {keyboardAware ? (
        // "padding" works on both platforms with Android edge-to-edge (the window is not resized).
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
