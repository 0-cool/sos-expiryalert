import { isRunningInExpoGo } from 'expo';
import { getLocales } from 'expo-localization';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { getDaysRemaining } from '@/features/documents/status';
import type { DocumentInput } from '@/features/documents/types';
import {
  containsSensitiveNumber,
  DOCUMENT_NAME_MAX_LENGTH,
  DOCUMENT_NOTES_MAX_LENGTH,
  validateDocumentForm,
  type DocumentFormErrors,
  type DocumentFormValues,
} from '@/features/documents/validation';
import { scanDocumentLocally, type DocumentScanFailure } from '@/features/documents/scanDocument';
import { parseVoiceDocumentRequest } from '@/features/documents/voiceCommandParser';
import { DEFAULT_FORMATTING_LOCALE, isSupportedLanguage } from '@/i18n/languages';
import { AppError, toAppError, type AppErrorCode } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';

import { DateField } from './DateField';
import { DocumentTypePicker } from './DocumentTypePicker';
import { ReminderDaysPicker } from './ReminderDaysPicker';

type VoiceInputFailure =
  | 'voiceDevelopmentBuildRequired'
  | 'voicePermissionDenied'
  | 'voiceUnavailableOffline'
  | 'voiceNoSpeech'
  | 'voiceNoDetails'
  | 'voiceRecognitionFailed';

type SpeechRecognitionModule = typeof import('expo-speech-recognition')['ExpoSpeechRecognitionModule'];
type SpeechSubscription = { remove: () => void };

export interface DocumentFormProps {
  initialValues: DocumentFormValues;
  submitLabel: string;
  /** Formatted reminder time, e.g. "9:00 AM". */
  reminderTimeLabel: string;
  isOffline?: boolean;
  enableScan?: boolean;
  onSubmit: (input: DocumentInput) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

function sameValues(a: DocumentFormValues, b: DocumentFormValues): boolean {
  return (
    a.documentType === b.documentType &&
    a.documentName === b.documentName &&
    a.expirationDate === b.expirationDate &&
    a.notes === b.notes &&
    a.reminderDays.length === b.reminderDays.length &&
    a.reminderDays.every((day) => b.reminderDays.includes(day))
  );
}

export function DocumentForm({
  initialValues,
  submitLabel,
  reminderTimeLabel,
  isOffline = false,
  enableScan = false,
  onSubmit,
  onDirtyChange,
}: DocumentFormProps) {
  const { t, i18n } = useTranslation();
  const { colors, spacing } = useAppTheme();
  const [values, setValues] = useState<DocumentFormValues>(initialValues);
  const [errors, setErrors] = useState<DocumentFormErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<AppErrorCode | null>(null);
  const [scanFailure, setScanFailure] = useState<DocumentScanFailure | null>(null);
  const [scanReview, setScanReview] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [voiceFailure, setVoiceFailure] = useState<VoiceInputFailure | null>(null);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const speechModuleRef = useRef<SpeechRecognitionModule | null>(null);
  const speechSubscriptionsRef = useRef<SpeechSubscription[] | null>(null);
  const voiceTranscriptRef = useRef('');
  const voiceAppliedRef = useRef(false);
  const mountedRef = useRef(false);

  const update = <K extends keyof DocumentFormValues>(key: K, value: DocumentFormValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    onDirtyChange?.(!sameValues(next, initialValues));
    if (showErrors) setErrors(validateDocumentForm(next).errors);
    setSubmitError(null);
  };

  const handleScan = async () => {
    setScanFailure(null);
    setVoiceFailure(null);
    setScanReview(false);
    if (isRunningInExpoGo()) {
      setScanFailure('developmentBuildRequired');
      return;
    }

    setScanning(true);
    try {
      const result = await scanDocumentLocally();
      if (result.status === 'cancelled') return;
      if (result.status === 'failure') {
        setScanFailure(result.reason);
        return;
      }

      const next = {
        ...values,
        documentType: result.fields.documentType ?? values.documentType,
        documentName: result.fields.documentName ?? values.documentName,
        expirationDate: result.fields.expirationDate ?? values.expirationDate,
      };
      setValues(next);
      onDirtyChange?.(!sameValues(next, initialValues));
      if (showErrors) setErrors(validateDocumentForm(next).errors);
      setSubmitError(null);
      setScanReview(true);
    } catch {
      setScanFailure('cameraFailed');
    } finally {
      setScanning(false);
    }
  };

  const cleanupSpeechListeners = () => {
    speechSubscriptionsRef.current?.forEach((subscription) => subscription.remove());
    speechSubscriptionsRef.current = null;
    speechModuleRef.current = null;
  };

  const applyVoiceRequest = (transcript: string) => {
    const fields = parseVoiceDocumentRequest(transcript);
    if (!fields.documentType && !fields.documentName && !fields.expirationDate) {
      setVoiceFailure('voiceNoDetails');
      return;
    }

    const next = {
      ...values,
      documentType: fields.documentType ?? values.documentType,
      documentName: fields.documentName ?? values.documentName,
      expirationDate: fields.expirationDate ?? values.expirationDate,
    };
    setValues(next);
    onDirtyChange?.(!sameValues(next, initialValues));
    if (showErrors) setErrors(validateDocumentForm(next).errors);
    setSubmitError(null);
    setVoiceFailure(null);
    setScanReview(true);
  };

  const handleVoiceInput = async () => {
    if (voiceListening) {
      speechModuleRef.current?.stop();
      return;
    }
    setVoiceFailure(null);
    setScanFailure(null);
    setScanReview(false);
    if (isRunningInExpoGo()) {
      setVoiceFailure('voiceDevelopmentBuildRequired');
      return;
    }

    setVoiceStarting(true);
    voiceTranscriptRef.current = '';
    voiceAppliedRef.current = false;
    try {
      const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
      if (!mountedRef.current) return;
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable() || !ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) {
        setVoiceFailure('voiceUnavailableOffline');
        return;
      }

      const language = isSupportedLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';
      let speechLocale = DEFAULT_FORMATTING_LOCALE[language];
      if (Platform.OS === 'android') {
        if (Number(Platform.Version) < 33) {
          setVoiceFailure('voiceUnavailableOffline');
          return;
        }
        const { installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
        if (!mountedRef.current) return;
        if (!installedLocales.some((locale) => locale.split('-')[0]?.toLowerCase() === language)) {
          setVoiceFailure('voiceUnavailableOffline');
          return;
        }
      } else if (Platform.OS === 'ios') {
        const systemLocale = getLocales()[0];
        if (!systemLocale || systemLocale.languageCode?.toLowerCase() !== language) {
          setVoiceFailure('voiceUnavailableOffline');
          return;
        }
        const { locales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
        if (!mountedRef.current) return;
        if (!locales.some((locale) => locale.toLowerCase() === systemLocale.languageTag.toLowerCase())) {
          setVoiceFailure('voiceUnavailableOffline');
          return;
        }
        speechLocale = systemLocale.languageTag;
      }

      const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!mountedRef.current) return;
      if (!permissions.granted) {
        setVoiceFailure('voicePermissionDenied');
        return;
      }

      const module = ExpoSpeechRecognitionModule;
      speechModuleRef.current = module;
      speechSubscriptionsRef.current = [
        module.addListener('start', () => {
          setVoiceStarting(false);
          setVoiceListening(true);
        }),
        module.addListener('result', (event) => {
          const transcript = event.results[0]?.transcript.trim() ?? '';
          if (!transcript) return;
          voiceTranscriptRef.current = transcript;
          if (event.isFinal) {
            voiceAppliedRef.current = true;
            applyVoiceRequest(transcript);
          }
        }),
        module.addListener('end', () => {
          setVoiceStarting(false);
          setVoiceListening(false);
          if (voiceTranscriptRef.current && !voiceAppliedRef.current) {
            voiceAppliedRef.current = true;
            applyVoiceRequest(voiceTranscriptRef.current);
          } else if (!voiceTranscriptRef.current) {
            setVoiceFailure('voiceNoSpeech');
          }
          cleanupSpeechListeners();
        }),
        module.addListener('error', (event) => {
          setVoiceStarting(false);
          setVoiceListening(false);
          setVoiceFailure(
            event.error === 'not-allowed'
              ? 'voicePermissionDenied'
              : event.error === 'no-speech' || event.error === 'speech-timeout'
                ? 'voiceNoSpeech'
                : event.error === 'language-not-supported' || event.error === 'service-not-allowed' || event.error === 'network'
                  ? 'voiceUnavailableOffline'
                  : 'voiceRecognitionFailed',
          );
          cleanupSpeechListeners();
        }),
        module.addListener('nomatch', () => setVoiceFailure('voiceNoDetails')),
      ];
      module.start({
        lang: speechLocale,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: true,
        addsPunctuation: true,
        iosTaskHint: 'dictation',
      });
    } catch {
      if (mountedRef.current) {
        setVoiceFailure('voiceRecognitionFailed');
        setVoiceStarting(false);
        setVoiceListening(false);
      }
      cleanupSpeechListeners();
    } finally {
      if (mountedRef.current && !speechModuleRef.current) setVoiceStarting(false);
    }
  };

  useEffect(
    () => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        speechModuleRef.current?.abort();
        speechSubscriptionsRef.current?.forEach((subscription) => subscription.remove());
        speechSubscriptionsRef.current = null;
        speechModuleRef.current = null;
      };
    },
    [],
  );

  const nameWarning = useMemo(
    () => (containsSensitiveNumber(values.documentName) ? t('validation.sensitiveNumber') : null),
    [values.documentName, t],
  );
  const notesWarning = useMemo(
    () => (containsSensitiveNumber(values.notes) ? t('validation.sensitiveNumber') : null),
    [values.notes, t],
  );
  const dateWarning =
    values.expirationDate && getDaysRemaining(values.expirationDate) < 0 ? t('validation.pastDate') : null;

  const errorText = (field: keyof DocumentFormErrors) => {
    const key = showErrors ? errors[field] : undefined;
    if (!key) return null;
    if (key === 'nameTooLong') return t('validation.nameTooLong', { max: DOCUMENT_NAME_MAX_LENGTH });
    if (key === 'notesTooLong') return t('validation.notesTooLong', { max: DOCUMENT_NOTES_MAX_LENGTH });
    return t(`validation.${key}`);
  };

  const handleSubmit = async () => {
    const result = validateDocumentForm(values);
    setErrors(result.errors);
    setShowErrors(true);
    if (!result.valid) {
      haptics.warning();
      return;
    }
    if (isOffline) {
      setSubmitError('network');
      haptics.warning();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(result.input);
      haptics.success();
    } catch (error) {
      setSubmitError(error instanceof AppError ? error.code : toAppError(error).code);
      haptics.warning();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      keyboardAware
      testID="document-form"
      footer={
        <Button
          testID="document-form-submit"
          label={submitting ? t('common.saving') : submitLabel}
          onPress={() => void handleSubmit()}
          loading={submitting}
          icon="check"
        />
      }
    >
      {enableScan ? (
        <View style={styles.scanSection}>
          <Button
            testID="document-form-scan"
            label={scanning ? t('documentForm.scanProcessing') : t('documentForm.scanDocument')}
            variant="secondary"
            icon="camera-outline"
            loading={scanning}
            disabled={scanning || voiceStarting || voiceListening}
            onPress={() => void handleScan()}
          />
          <Button
            testID="document-form-voice"
            label={voiceListening ? t('documentForm.voiceStop') : t('documentForm.voiceInput')}
            variant="secondary"
            icon={voiceListening ? 'stop-circle-outline' : 'microphone-outline'}
            loading={voiceStarting}
            disabled={scanning || voiceStarting}
            onPress={() => void handleVoiceInput()}
          />
          <AppText variant="footnote" tone="tertiary">
            {t('documentForm.voiceExample')}
          </AppText>
          <AppText variant="footnote" tone="tertiary">
            {t('documentForm.scanPrivacy')}
          </AppText>
          <AppText variant="footnote" tone="tertiary">
            {t('documentForm.voicePrivacy')}
          </AppText>
          {scanFailure ? (
            <Banner tone="warning" icon="alert-circle-outline" message={t(`documentForm.${scanFailure}`)} />
          ) : null}
          {voiceFailure ? (
            <Banner tone="warning" icon="alert-circle-outline" message={t(`documentForm.${voiceFailure}`)} />
          ) : null}
          {scanReview ? (
            <Banner tone="info" icon="check-circle-outline" message={t('documentForm.scanReview')} />
          ) : null}
        </View>
      ) : null}

      {submitError ? (
        <Banner
          tone="danger"
          icon={submitError === 'network' ? 'cloud-off-outline' : 'alert-circle-outline'}
          message={submitError === 'network' ? t('offline.cannotSave') : t(`errors.${submitError}`)}
        />
      ) : null}

      <View style={styles.section}>
        <AppText variant="subhead" tone="secondary">
          {t('documentForm.typeLabel')}
        </AppText>
        <DocumentTypePicker value={values.documentType} onChange={(type) => update('documentType', type)} />
        {errorText('documentType') ? (
          <AppText variant="footnote" tone="danger" accessibilityLiveRegion="polite">
            {errorText('documentType')}
          </AppText>
        ) : null}
      </View>

      <TextField
        testID="document-name-input"
        label={t('documentForm.nameLabel')}
        placeholder={t('documentForm.namePlaceholder')}
        value={values.documentName}
        onChangeText={(text) => update('documentName', text)}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="next"
        maxLength={DOCUMENT_NAME_MAX_LENGTH + 20}
        error={errorText('documentName')}
        warning={nameWarning}
        helper={t('documentForm.nameHelper')}
      />

      <DateField
        testID="document-date-field"
        label={t('documentForm.dateLabel')}
        placeholder={t('documentForm.datePlaceholder')}
        value={values.expirationDate}
        onChange={(date) => update('expirationDate', date)}
        error={errorText('expirationDate')}
        warning={dateWarning}
      />

      <View style={styles.section}>
        <AppText variant="subhead" tone="secondary">
          {t('documentForm.remindersLabel')}
        </AppText>
        <ReminderDaysPicker value={values.reminderDays} onChange={(days) => update('reminderDays', days)} />
        <AppText variant="footnote" tone="tertiary">
          {values.reminderDays.length
            ? t('documentForm.remindersHelper', { time: reminderTimeLabel })
            : t('documentForm.remindersNone')}
        </AppText>
      </View>

      <TextField
        testID="document-notes-input"
        label={t('documentForm.notesLabel')}
        optionalLabel={t('common.optional')}
        placeholder={t('documentForm.notesPlaceholder')}
        value={values.notes}
        onChangeText={(text) => update('notes', text)}
        multiline
        maxLength={DOCUMENT_NOTES_MAX_LENGTH}
        maxLengthCounter={DOCUMENT_NOTES_MAX_LENGTH}
        error={errorText('notes')}
        warning={notesWarning}
      />

      <Card tone="muted" style={styles.privacy}>
        <Icon name="shield-lock-outline" size={22} color={colors.accent} />
        <AppText variant="footnote" tone="secondary" style={{ flex: 1, marginLeft: spacing.md }}>
          {t('documentForm.privacyNote')}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scanSection: {
    gap: 8,
  },
  section: {
    gap: 10,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
