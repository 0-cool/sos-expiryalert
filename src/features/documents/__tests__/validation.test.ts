import {
  containsSensitiveNumber,
  DOCUMENT_NAME_MAX_LENGTH,
  DOCUMENT_NOTES_MAX_LENGTH,
  validateDocumentForm,
  type DocumentFormValues,
} from '@/features/documents/validation';

const valid: DocumentFormValues = {
  documentType: 'passport',
  documentName: '  Juan   Rojas ',
  expirationDate: '2030-11-15',
  notes: '  Renew at the consulate  ',
  reminderDays: [1, 90, 30, 7, 30],
};

describe('validateDocumentForm', () => {
  it('normalises a valid form into an input', () => {
    const result = validateDocumentForm(valid);
    expect(result.valid).toBe(true);
    expect(result.input).toEqual({
      documentType: 'passport',
      documentName: 'Juan Rojas',
      expirationDate: '2030-11-15',
      notes: 'Renew at the consulate',
      reminderDays: [90, 30, 7, 1],
    });
  });

  it('stores empty notes as null', () => {
    const result = validateDocumentForm({ ...valid, notes: '   ' });
    expect(result.input?.notes).toBeNull();
  });

  it('requires type, name and date', () => {
    const result = validateDocumentForm({
      documentType: null,
      documentName: '   ',
      expirationDate: null,
      notes: '',
      reminderDays: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      documentType: 'typeRequired',
      documentName: 'nameRequired',
      expirationDate: 'dateRequired',
    });
  });

  it('enforces length limits', () => {
    const result = validateDocumentForm({
      ...valid,
      documentName: 'x'.repeat(DOCUMENT_NAME_MAX_LENGTH + 1),
      notes: 'y'.repeat(DOCUMENT_NOTES_MAX_LENGTH + 1),
    });
    expect(result.errors.documentName).toBe('nameTooLong');
    expect(result.errors.notes).toBe('notesTooLong');
  });

  it('rejects impossible dates', () => {
    expect(validateDocumentForm({ ...valid, expirationDate: '2027-02-29' }).errors.expirationDate).toBe('dateInvalid');
  });

  it('accepts past dates (the document is simply expired)', () => {
    expect(validateDocumentForm({ ...valid, expirationDate: '2001-01-01' }).valid).toBe(true);
  });

  it('allows a document without reminders', () => {
    expect(validateDocumentForm({ ...valid, reminderDays: [] }).input?.reminderDays).toEqual([]);
  });
});

describe('containsSensitiveNumber (privacy guard)', () => {
  it.each([
    'Passport 123456789',
    'AB1234567',
    'ID: X12345678',
    'SSN 123-45-6789',
    '001-1234567-8',
    'card 4111 1111 1111 1111',
  ])('flags %p', (text) => {
    expect(containsSensitiveNumber(text)).toBe(true);
  });

  it.each([
    'Juan Rojas',
    'Renew before 2030-11-15',
    'Renew on 15/11/2030 at 9:30',
    'Family car',
    'Room 12, building 4',
    '',
  ])('does not flag %p', (text) => {
    expect(containsSensitiveNumber(text)).toBe(false);
  });
});
