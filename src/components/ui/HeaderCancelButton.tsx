import { useTranslation } from 'react-i18next';
import { Platform, Pressable } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Icon } from './Icon';

/** Modal dismiss button following platform conventions: "Cancel" text on iOS, a close icon on Android. */
export function HeaderCancelButton({ onPress, testID }: { onPress: () => void; testID?: string }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('common.cancel')}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4, paddingVertical: 4 })}
    >
      {Platform.OS === 'ios' ? (
        <AppText variant="body" tone="accent">
          {t('common.cancel')}
        </AppText>
      ) : (
        <Icon name="close" size={24} color={colors.text} />
      )}
    </Pressable>
  );
}
