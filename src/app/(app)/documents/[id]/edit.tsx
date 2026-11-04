import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DocumentForm } from '@/components/documents/DocumentForm';
import { HeaderCancelButton } from '@/components/ui/HeaderCancelButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useDocuments } from '@/features/documents/DocumentsProvider';
import type { DocumentFormValues } from '@/features/documents/validation';
import { usePreferences } from '@/features/settings/PreferencesProvider';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useFormatters } from '@/i18n/useFormatters';
import { useIsOffline } from '@/lib/network';

export default function EditDocumentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDocument, updateDocument } = useDocuments();
  const { preferences } = usePreferences();
  const { formatTime } = useFormatters();
  const isOffline = useIsOffline();
  const [dirty, setDirty] = useState(false);
  const disableGuard = useUnsavedChangesGuard(dirty);

  const document = typeof id === 'string' ? getDocument(id) : undefined;
  const [initialValues] = useState<DocumentFormValues | null>(() =>
    document
      ? {
          documentType: document.documentType,
          documentName: document.documentName,
          expirationDate: document.expirationDate,
          notes: document.notes ?? '',
          reminderDays: [...document.reminderDays],
        }
      : null,
  );

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!document || !initialValues) {
    return (
      <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
        <EmptyState
          icon="file-question-outline"
          title={t('documentDetails.notFoundTitle')}
          body={t('errors.notFound')}
          actionLabel={t('common.close')}
          onAction={close}
        />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderCancelButton onPress={close} testID="edit-document-cancel" />,
        }}
      />
      <DocumentForm
        initialValues={initialValues}
        submitLabel={t('documentForm.saveChanges')}
        reminderTimeLabel={formatTime(preferences.reminderTime.hour, preferences.reminderTime.minute)}
        isOffline={isOffline}
        onDirtyChange={setDirty}
        onSubmit={async (input) => {
          await updateDocument(document.id, input);
          setDirty(false);
          disableGuard();
          close();
        }}
      />
    </>
  );
}
