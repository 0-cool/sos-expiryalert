import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { DOCUMENT_TYPE_ICONS } from '@/features/documents/documentTypeMeta';
import { DOCUMENT_TYPES, type DocumentType } from '@/features/documents/types';

interface DocumentTypePickerProps {
  value: DocumentType | null;
  onChange: (type: DocumentType) => void;
}

/** One-tap type selection — every option is visible, no extra screen. */
export function DocumentTypePicker({ value, onChange }: DocumentTypePickerProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={t('documentForm.typeLabel')}>
      {DOCUMENT_TYPES.map((type) => (
        <Chip
          key={type}
          testID={`type-${type}`}
          role="radio"
          label={t(`documentTypes.${type}`)}
          icon={DOCUMENT_TYPE_ICONS[type]}
          selected={value === type}
          onPress={() => onChange(type)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
