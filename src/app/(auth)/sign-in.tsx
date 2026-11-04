import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type TextInputInstance } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { InlineLink } from '@/components/auth/InlineLink';
import { PasswordVisibilityToggle } from '@/components/auth/PasswordVisibilityToggle';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { normalizeEmail, validateEmail, validatePassword, type AuthValidationKey } from '@/features/auth/validation';
import { toAppError, type AppErrorCode } from '@/lib/errors';

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn, configProblem } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: AuthValidationKey; password?: AuthValidationKey }>({});
  const [submitError, setSubmitError] = useState<AppErrorCode | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const errors = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password, 'login') ?? undefined,
    };
    setFieldErrors(errors);
    setSubmitError(null);
    if (errors.email || errors.password) return;

    setLoading(true);
    try {
      await signIn(email, password);
      // On success the root navigator switches to the app automatically.
    } catch (error) {
      const code = toAppError(error).code;
      if (code === 'emailNotConfirmed') {
        router.push({ pathname: '/verify-email', params: { email: normalizeEmail(email), resend: '1' } });
      } else {
        setSubmitError(code);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      withTopInset
      showBrand
      title={t('auth.signInTitle')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <>
          <InlineLink
            testID="go-to-sign-up"
            prompt={t('auth.noAccount')}
            label={t('auth.signUp')}
            onPress={() => router.push('/sign-up')}
          />
          <AppText variant="footnote" tone="tertiary" align="center">
            {t('auth.privacyNote')}
          </AppText>
        </>
      }
    >
      {submitError ? <Banner tone="danger" icon="alert-circle-outline" message={t(`errors.${submitError}`)} /> : null}
      <TextField
        testID="sign-in-email"
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={fieldErrors.email ? t(`validation.${fieldErrors.email}`) : null}
      />
      <TextField
        ref={passwordRef}
        testID="sign-in-password"
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        error={fieldErrors.password ? t(`validation.${fieldErrors.password}`) : null}
        accessory={<PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
      />
      <InlineLink
        testID="go-to-forgot-password"
        label={t('auth.forgotPassword')}
        onPress={() => router.push({ pathname: '/forgot-password', params: { email: email.trim() } })}
      />
      <Button
        testID="sign-in-submit"
        label={t('auth.signIn')}
        onPress={() => void submit()}
        loading={loading}
        disabled={!!configProblem}
      />
    </AuthScaffold>
  );
}
