import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { describeRelative } from '@/features/documents/describe';
import type { DocumentWithStatus } from '@/features/documents/status';
import { useFormatters } from '@/i18n/useFormatters';
import { useAppTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH_TARGET } from '@/theme/tokens';

import { DocumentTypeIcon } from './DocumentTypeIcon';
import { statusColors, StatusBadge } from './StatusBadge';

interface DocumentRowProps {
  document: DocumentWithStatus;
  onPress: (id: string) => void;
  testID?: string;
}

export const DocumentRow = memo(function DocumentRow({ document, onPress, testID }: DocumentRowProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();
  const { formatDate } = useFormatters();

  const typeLabel = t(`documentTypes.${document.documentType}`);
  const dateLabel = formatDate(document.expirationDate, 'medium');
  const relative = describeRelative(document.daysRemaining, t);
  const relativeColor =
    document.status === 'active' ? colors.textSecondary : statusColors(document.status, colors).foreground;

  return (
    <Pressable
      testID={testID}
      onPress={() => onPress(document.id)}
      accessibilityRole="button"
      accessibilityLabel={`${document.documentName}, ${typeLabel}. ${t(`status.${document.status}`)}. ${relative}, ${dateLabel}`}
      android_ripple={{ color: colors.surfacePressed }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfacePressed : colors.surface,
          paddingHorizontal: spacing.lg,
          minHeight: Math.max(72, MIN_TOUCH_TARGET),
        },
      ]}
    >
      <DocumentTypeIcon type={document.documentType} status={document.status} />
      <View style={styles.middle}>
        <AppText variant="headline" numberOfLines={1}>
          {document.documentName}
        </AppText>
        <AppText variant="footnote" tone="secondary" numberOfLines={1}>
          {typeLabel}
        </AppText>
        <AppText variant="caption" tone="tertiary" numberOfLines={1}>
          {dateLabel}
        </AppText>
      </View>
      <View style={styles.right}>
        <StatusBadge status={document.status} size="small" />
        <AppText variant="caption" style={{ color: relativeColor }} numberOfLines={1}>
          {relative}
        </AppText>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: '38%',
  },
});
