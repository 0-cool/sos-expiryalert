import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import type { DocumentWithStatus } from '@/features/documents/status';
import { useAppTheme } from '@/theme/ThemeProvider';

import { DocumentRow } from './DocumentRow';

interface SwipeableDocumentRowProps {
  document: DocumentWithStatus;
  onPress: (id: string) => void;
  onDelete: (document: DocumentWithStatus) => void;
}

/** Swipe left to reveal a Delete action (deletion itself is confirmed by the caller). */
export function SwipeableDocumentRow({ document, onPress, onDelete }: SwipeableDocumentRowProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const swipeable = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          onPress={() => {
            swipeable.current?.close();
            onDelete(document);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${t('common.delete')} ${document.documentName}`}
          style={({ pressed }) => [styles.action, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}
        >
          <Icon name="trash-can-outline" size={22} color="#FFFFFF" />
          <AppText variant="caption" style={styles.actionLabel}>
            {t('common.delete')}
          </AppText>
        </Pressable>
      )}
    >
      <DocumentRow document={document} onPress={onPress} testID={`document-row-${document.id}`} />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
