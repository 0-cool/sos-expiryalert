import { normalizeReminderDays, type ReminderDay } from '@/features/reminders/reminderOptions';
import { isValidISODate, type ISODate } from '@/lib/dates';

import type { DocumentInput, DocumentType } from './types';

export const DOCUMENT_NAME_MAX_LENGTH = 80;
export const DOCUMENT_NOTES_MAX_LENGTH = 500;

export interface DocumentFormValues {
  documentType: DocumentType | null;
  documentName: string;
  expirationDate: ISODate | null;
  notes: string;
  reminderDays: ReminderDay[];
}

export type DocumentFormField = 'documentType' | 'documentName' | 'expirationDate' | 'notes';

export type DocumentValidationKey =
  | 'typeRequired'
  | 'nameRequired'
  | 'nameTooLong'
  | 'dateRequired'
  | 'dateInvalid'
  | 'notesTooLong';

export type DocumentFormErrors = Partial<Record<DocumentFormField, DocumentValidationKey>>;

export type DocumentValidationResult =
  | { valid: true; input: DocumentInput; errors: DocumentFormErrors }
  | { valid: false; input: null; errors: DocumentFormErrors };

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function validateDocumentForm(values: DocumentFormValues): DocumentValidationResult {
  const errors: DocumentFormErrors = {};
  const documentName = collapseWhitespace(values.documentName);
  const notes = values.notes.trim();

  if (!values.documentType) errors.documentType = 'typeRequired';

  if (!documentName) errors.documentName = 'nameRequired';
  else if (documentName.length > DOCUMENT_NAME_MAX_LENGTH) errors.documentName = 'nameTooLong';

  if (!values.expirationDate) errors.expirationDate = 'dateRequired';
  else if (!isValidISODate(values.expirationDate)) errors.expirationDate = 'dateInvalid';

  if (notes.length > DOCUMENT_NOTES_MAX_LENGTH) errors.notes = 'notesTooLong';

  if (Object.keys(errors).length > 0 || !values.documentType || !values.expirationDate) {
    return { valid: false, input: null, errors };
  }

  return {
    valid: true,
    errors,
    input: {
      documentType: values.documentType,
      documentName,
      expirationDate: values.expirationDate,
      notes: notes.length > 0 ? notes : null,
      reminderDays: normalizeReminderDays(values.reminderDays),
    },
  };
}

// Dates such as 2030-11-15, 15/11/2030 or 15.11.30 should not be mistaken for ID numbers
// (but "123-45-6789"-style numbers must still be caught).
const DATE_LIKE = /\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.](?:\d{4}|\d{2}))\b/g;
// Join digit groups separated by spaces, dots, dashes or slashes ("123-45-6789" -> "123456789").
const DIGIT_SEPARATORS = /(\d)[\s.\-/]+(?=\d)/g;
// Long digit runs, or letter prefixes followed by digits (typical passport / ID formats such as "AB1234567").
const ID_LIKE = /\d{6,}|\b[A-Za-z]{1,3}\d{5,}\b/;

/**
 * Privacy guard: returns true when free text looks like it contains an
 * identification number. The UI shows a gentle warning; it never blocks saving.
 */
export function containsSensitiveNumber(text: string): boolean {
  if (!text) return false;
  const withoutDates = text.replace(DATE_LIKE, ' ');
  const joined = withoutDates.replace(DIGIT_SEPARATORS, '$1');
  return ID_LIKE.test(joined);
}
