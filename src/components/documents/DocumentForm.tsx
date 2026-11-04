import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

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
import { AppError, toAppError, type AppErrorCode } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';

import { DateField } from './DateField';
import { DocumentTypePicker } from './DocumentTypePicker';
import { ReminderDaysPicker } from './ReminderDaysPicker';

export interface DocumentFormProps {
  initialValues: DocumentFormValues;
  submitLabel: string;
  /** Formatted reminder time, e.g. "9:00 AM". */
  reminderTimeLabel: string;
  isOffline?: boolean;
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
  onSubmit,
  onDirtyChange,
}: DocumentFormProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();
  const [values, setValues] = useState<DocumentFormValues>(initialValues);
  const [errors, setErrors] = useState<DocumentFormErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<AppErrorCode | null>(null);

  const update = <K extends keyof DocumentFormValues>(key: K, value: DocumentFormValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    onDirtyChange?.(!sameValues(next, initialValues));
    if (showErrors) setErrors(validateDocumentForm(next).errors);
    setSubmitError(null);
  };

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
  section: {
    gap: 10,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
