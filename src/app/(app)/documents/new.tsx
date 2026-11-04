import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DocumentForm } from '@/components/documents/DocumentForm';
import { HeaderCancelButton } from '@/components/ui/HeaderCancelButton';
import { useDocuments } from '@/features/documents/DocumentsProvider';
import type { DocumentFormValues } from '@/features/documents/validation';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useFormatters } from '@/i18n/useFormatters';
import { useIsOffline } from '@/lib/network';

export default function NewDocumentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createDocument } = useDocuments();
  const { preferences } = usePreferences();
  const { formatTime } = useFormatters();
  const isOffline = useIsOffline();
  const [dirty, setDirty] = useState(false);
  const disableGuard = useUnsavedChangesGuard(dirty);

  const [initialValues] = useState<DocumentFormValues>(() => ({
    documentType: null,
    documentName: '',
    expirationDate: null,
    notes: '',
    reminderDays: [...preferences.defaultReminderDays],
  }));

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderCancelButton onPress={close} testID="new-document-cancel" />,
        }}
      />
      <DocumentForm
        initialValues={initialValues}
        submitLabel={t('documentForm.save')}
        reminderTimeLabel={formatTime(preferences.reminderTime.hour, preferences.reminderTime.minute)}
        isOffline={isOffline}
        enableScan
        onDirtyChange={setDirty}
        onSubmit={async (input) => {
          await createDocument(input);
          setDirty(false);
          disableGuard();
          close();
        }}
      />
    </>
  );
}
