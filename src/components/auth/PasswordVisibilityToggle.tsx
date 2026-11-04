import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { useAppTheme } from '@/theme/ThemeProvider';

export function PasswordVisibilityToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
      hitSlop={10}
      style={{ padding: 4 }}
    >
      <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
    </Pressable>
  );
}
