import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { normalizeEmail, validateEmail, type AuthValidationKey } from '@/features/auth/validation';
import { toAppError, type AppErrorCode } from '@/lib/errors';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { requestPasswordReset, configProblem } = useAuth();

  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [emailError, setEmailError] = useState<AuthValidationKey | null>(null);
  const [submitError, setSubmitError] = useState<AppErrorCode | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const validation = validateEmail(email);
    setEmailError(validation);
    setSubmitError(null);
    if (validation) return;
    setLoading(true);
    try {
      await requestPasswordReset(email);
      router.push({ pathname: '/reset-password', params: { email: normalizeEmail(email) } });
    } catch (error) {
      setSubmitError(toAppError(error).code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      {submitError ? <Banner tone="danger" icon="alert-circle-outline" message={t(`errors.${submitError}`)} /> : null}
      <TextField
        testID="forgot-email"
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => void submit()}
        error={emailError ? t(`validation.${emailError}`) : null}
      />
      <Button
        testID="forgot-submit"
        label={t('auth.sendCode')}
        onPress={() => void submit()}
        loading={loading}
        disabled={!!configProblem}
      />
    </AuthScaffold>
  );
}
