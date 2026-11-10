import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { getDocumentIdFromResponse } from '@/features/notifications/notificationService';
import { SubscriptionProvider } from '@/features/subscription/SubscriptionProvider';
import { useAppTheme } from '@/theme/ThemeProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Opens the related document when the user taps a reminder notification. */
function useOpenDocumentFromNotification() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    const key = `${response.notification.request.identifier}:${response.notification.date}`;
    if (handled.current === key) return;
    handled.current = key;
    const documentId = getDocumentIdFromResponse(response);
    if (documentId) router.push({ pathname: '/documents/[id]', params: { id: documentId } });
    void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
  }, [response, router]);
}

export default function AppLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  useOpenDocumentFromNotification();

  return (
    <SubscriptionProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.text },
          headerBackTitle: t('common.back'),
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('tabs.dashboard') }} />
        <Stack.Screen name="documents/new" options={{ presentation: 'modal', title: t('documentForm.addTitle') }} />
        <Stack.Screen name="documents/[id]/index" options={{ title: t('documentDetails.title') }} />
        <Stack.Screen name="documents/[id]/edit" options={{ presentation: 'modal', title: t('documentForm.editTitle') }} />
        <Stack.Screen name="documents/[id]/reminders" options={{ title: t('reminders.title') }} />
        <Stack.Screen name="settings/language" options={{ title: t('settings.language') }} />
        <Stack.Screen name="settings/notifications" options={{ title: t('notificationSettings.title') }} />
        <Stack.Screen name="settings/privacy" options={{ title: t('privacy.title') }} />
        <Stack.Screen name="settings/account" options={{ title: t('account.title') }} />
      </Stack>
    </SubscriptionProvider>
  );
}
