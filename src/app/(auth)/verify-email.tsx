import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { InlineLink } from '@/components/auth/InlineLink';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { normalizeCode, validateCode, type AuthValidationKey } from '@/features/auth/validation';
import { useCooldown } from '@/hooks/useCooldown';
import { toAppError, type AppErrorCode } from '@/lib/errors';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; resend?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const { verifySignUpCode, resendSignUpCode } = useAuth();
  const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<AuthValidationKey | null>(null);
  const [submitError, setSubmitError] = useState<AppErrorCode | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const autoResent = useRef(false);

  const resend = async () => {
    if (!email || cooldown.isCoolingDown) return;
    setResending(true);
    setSubmitError(null);
    try {
      await resendSignUpCode(email);
      setInfo(t('auth.codeSent', { email }));
      cooldown.start();
    } catch (error) {
      setSubmitError(toAppError(error).code);
    } finally {
      setResending(false);
    }
  };

  // Coming from "Log in" with an unconfirmed email: send a fresh code automatically.
  useEffect(() => {
    if (params.resend === '1' && email && !autoResent.current) {
      autoResent.current = true;
      void resend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.resend, email]);

  const submit = async () => {
    const validation = validateCode(code);
    setCodeError(validation);
    setSubmitError(null);
    if (validation) return;
    setLoading(true);
    try {
      await verifySignUpCode(email, code);
      // A session now exists; the root navigator opens the app.
    } catch (error) {
      setSubmitError(toAppError(error).code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title={t('auth.verifyTitle')}
      subtitle={t('auth.verifySubtitle', { email })}
      footer={
        <InlineLink
          testID="verify-back-to-sign-in"
          label={t('auth.backToSignIn')}
          onPress={() => router.dismissTo('/sign-in')}
        />
      }
    >
      {submitError ? <Banner tone="danger" icon="alert-circle-outline" message={t(`errors.${submitError}`)} /> : null}
      {info && !submitError ? <Banner tone="info" icon="email-outline" message={info} /> : null}
      <TextField
        testID="verify-code"
        label={t('auth.code')}
        placeholder={t('auth.codePlaceholder')}
        value={code}
        onChangeText={(value) => setCode(normalizeCode(value))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={10}
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        error={codeError ? t(`validation.${codeError}`) : null}
      />
      <Button testID="verify-submit" label={t('auth.verify')} onPress={() => void submit()} loading={loading} />
      <Button
        testID="verify-resend"
        label={cooldown.isCoolingDown ? t('auth.resendIn', { seconds: cooldown.remaining }) : t('auth.resendCode')}
        variant="ghost"
        size="medium"
        onPress={() => void resend()}
        loading={resending}
        disabled={cooldown.isCoolingDown || !email}
      />
      <AppText variant="footnote" tone="tertiary" align="center">
        {t('auth.verifyLinkHint')}
      </AppText>
    </AuthScaffold>
  );
}
