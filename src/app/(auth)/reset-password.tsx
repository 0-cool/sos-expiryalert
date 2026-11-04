import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, type TextInputInstance } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { PasswordVisibilityToggle } from '@/components/auth/PasswordVisibilityToggle';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  normalizeCode,
  validateCode,
  validatePassword,
  validatePasswordConfirmation,
  type AuthValidationKey,
} from '@/features/auth/validation';
import { useCooldown } from '@/hooks/useCooldown';
import { toAppError, type AppErrorCode } from '@/lib/errors';

type Field = 'code' | 'password' | 'confirmation';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const { resetPassword, requestPasswordReset } = useAuth();
  const cooldown = useCooldown(60);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmationRef = useRef<TextInputInstance>(null);

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, AuthValidationKey>>>({});
  const [submitError, setSubmitError] = useState<AppErrorCode | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const errors: Partial<Record<Field, AuthValidationKey>> = {
      code: validateCode(code) ?? undefined,
      password: validatePassword(password, 'new') ?? undefined,
      confirmation: validatePasswordConfirmation(password, confirmation) ?? undefined,
    };
    setFieldErrors(errors);
    setSubmitError(null);
    if (errors.code || errors.password || errors.confirmation) return;

    setLoading(true);
    try {
      await resetPassword(email, code, password);
      Alert.alert(t('auth.passwordUpdated'));
      // Signed in with the new password: the root navigator opens the app.
    } catch (error) {
      setSubmitError(toAppError(error).code);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await requestPasswordReset(email);
      setInfo(t('auth.codeSent', { email }));
      cooldown.start();
    } catch (error) {
      setSubmitError(toAppError(error).code);
    }
  };

  const fieldError = (field: Field) => {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  };

  return (
    <AuthScaffold title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle', { email })}>
      {submitError ? <Banner tone="danger" icon="alert-circle-outline" message={t(`errors.${submitError}`)} /> : null}
      {info && !submitError ? <Banner tone="info" icon="email-outline" message={info} /> : null}
      <TextField
        testID="reset-code"
        label={t('auth.code')}
        placeholder={t('auth.codePlaceholder')}
        value={code}
        onChangeText={(value) => setCode(normalizeCode(value))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={10}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={fieldError('code')}
      />
      <TextField
        ref={passwordRef}
        testID="reset-password"
        label={t('auth.newPassword')}
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
        testID="reset-confirmation"
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
      <Button testID="reset-submit" label={t('auth.resetPassword')} onPress={() => void submit()} loading={loading} />
      <Button
        label={cooldown.isCoolingDown ? t('auth.resendIn', { seconds: cooldown.remaining }) : t('auth.resendCode')}
        variant="ghost"
        size="medium"
        onPress={() => void resend()}
        disabled={cooldown.isCoolingDown || !email}
      />
    </AuthScaffold>
  );
}
