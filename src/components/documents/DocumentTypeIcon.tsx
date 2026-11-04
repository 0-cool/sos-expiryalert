import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { DOCUMENT_TYPE_ICONS } from '@/features/documents/documentTypeMeta';
import type { DocumentStatus, DocumentType } from '@/features/documents/types';
import { useAppTheme } from '@/theme/ThemeProvider';

import { statusColors } from './StatusBadge';

interface DocumentTypeIconProps {
  type: DocumentType;
  status?: DocumentStatus;
  size?: number;
}

/** Document-type glyph on a soft background tinted by status, for quick scanning. */
export function DocumentTypeIcon({ type, status, size = 44 }: DocumentTypeIconProps) {
  const { colors } = useAppTheme();
  const palette = status ? statusColors(status, colors) : { foreground: colors.accent, background: colors.accentSoft };

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: palette.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={DOCUMENT_TYPE_ICONS[type]} size={Math.round(size * 0.52)} color={palette.foreground} />
    </View>
  );
}
