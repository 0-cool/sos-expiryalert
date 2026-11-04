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
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  type AuthValidationKey,
} from '@/features/auth/validation';
import { toAppError, type AppErrorCode } from '@/lib/errors';

type Field = 'email' | 'password' | 'confirmation';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signUp, configProblem } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmationRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, AuthValidationKey>>>({});
  const [submitError, setSubmitError] = useState<AppErrorCode | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const errors: Partial<Record<Field, AuthValidationKey>> = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password, 'new') ?? undefined,
      confirmation: validatePasswordConfirmation(password, confirmation) ?? undefined,
    };
    setFieldErrors(errors);
    setSubmitError(null);
    if (errors.email || errors.password || errors.confirmation) return;

    setLoading(true);
    try {
      const result = await signUp(email, password);
      if (result.needsEmailVerification) {
        router.push({ pathname: '/verify-email', params: { email: normalizeEmail(email) } });
      }
      // Otherwise a session exists and the root navigator opens the app.
    } catch (error) {
      setSubmitError(toAppError(error).code);
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: Field) => {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  };

  return (
    <AuthScaffold
      title={t('auth.signUpTitle')}
      subtitle={t('auth.signUpSubtitle')}
      footer={
        <>
          <InlineLink
            testID="go-to-sign-in"
            prompt={t('auth.haveAccount')}
            label={t('auth.signIn')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
          />
          <AppText variant="footnote" tone="tertiary" align="center">
            {t('auth.privacyNote')}
          </AppText>
        </>
      }
    >
      {submitError ? <Banner tone="danger" icon="alert-circle-outline" message={t(`errors.${submitError}`)} /> : null}
      <TextField
        testID="sign-up-email"
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
        error={fieldError('email')}
      />
      <TextField
        ref={passwordRef}
        testID="sign-up-password"
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmationRef.current?.focus()}
        error={fieldError('password')}
        accessory={<PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
      />
      <TextField
        ref={confirmationRef}
        testID="sign-up-confirmation"
        label={t('auth.confirmPassword')}
        value={confirmation}
        onChangeText={setConfirmation}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        error={fieldError('confirmation')}
      />
      <Button
        testID="sign-up-submit"
        label={t('auth.signUp')}
        onPress={() => void submit()}
        loading={loading}
        disabled={!!configProblem}
      />
    </AuthScaffold>
  );
}
