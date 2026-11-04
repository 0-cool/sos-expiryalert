// Initialise translations before anything renders.
import i18n from '@/i18n';

import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Appearance, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { DocumentsProvider } from '@/features/documents/DocumentsProvider';
import { NotificationsProvider } from '@/features/notifications/NotificationsProvider';
import { OnboardingProvider, useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { PreferencesProvider, usePreferences } from '@/features/settings/PreferencesProvider';
import { darkColors, lightColors } from '@/theme/tokens';
import { AppThemeProvider } from '@/theme/ThemeProvider';

// Keep the native splash screen up until preferences, onboarding state and the session are loaded.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 250, fade: true });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <PreferencesProvider>
        <ThemedProviders />
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}

function ThemedProviders() {
  const { preferences } = usePreferences();
  return (
    <AppThemeProvider preference={preferences.theme}>
      <OnboardingProvider>
        <AuthProvider>
          <DocumentsProvider>
            <NotificationsProvider>
              <RootNavigator />
            </NotificationsProvider>
          </DocumentsProvider>
        </AuthProvider>
      </OnboardingProvider>
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const { isLoaded: preferencesLoaded } = usePreferences();
  const { isLoaded: onboardingLoaded, isComplete: onboarded } = useOnboarding();
  const { isReady: authReady, isSignedIn } = useAuth();
  const ready = preferencesLoaded && onboardingLoaded && authReady;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  // Explicit redirect targets: whenever a guard closes, send the user to the right place.
  const home = onboarded ? (isSignedIn ? '/' : '/sign-in') : '/onboarding';

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={!onboarded} redirectTo={home}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !isSignedIn} redirectTo={home}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && isSignedIn} redirectTo={home}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

/**
 * Last-resort error screen. It renders outside the app providers, so it only
 * relies on the i18n instance and static colors.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hide();
    console.error('[SOS ExpiryAlert] Unhandled error', error);
  }, [error]);

  const colors = Appearance.getColorScheme() === 'dark' ? darkColors : lightColors;
  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.errorTitle, { color: colors.text }]} accessibilityRole="header">
        {i18n.t('errors.title')}
      </Text>
      <Text style={[styles.errorBody, { color: colors.textSecondary }]}>{i18n.t('errors.generic')}</Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.errorButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={[styles.errorButtonLabel, { color: colors.onPrimary }]}>{i18n.t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
