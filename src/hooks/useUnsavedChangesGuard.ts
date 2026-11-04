import { usePreventRemove } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

/**
 * Asks for confirmation before leaving a screen with unsaved changes
 * (back button, swipe-to-dismiss, header Cancel). Returns a function that
 * disables the guard, to call right before navigating away after a save.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean): () => void {
  const { t } = useTranslation();
  return usePreventRemove(hasUnsavedChanges, ({ repeat }) => {
    Alert.alert(t('documentForm.discardTitle'), t('documentForm.discardMessage'), [
      { text: t('documentForm.keepEditing'), style: 'cancel' },
      { text: t('documentForm.discard'), style: 'destructive', onPress: () => repeat() },
    ]);
  });
}
