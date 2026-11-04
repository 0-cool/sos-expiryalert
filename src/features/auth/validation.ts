export const PASSWORD_MIN_LENGTH = 8;

// Pragmatic email check: something@something.tld, no spaces. The server does the real validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_PATTERN = /^\d{6,10}$/;

export type AuthValidationKey =
  | 'emailRequired'
  | 'emailInvalid'
  | 'passwordRequired'
  | 'passwordTooShort'
  | 'passwordsDontMatch'
  | 'codeInvalid';

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): AuthValidationKey | null {
  const email = value.trim();
  if (!email) return 'emailRequired';
  return EMAIL_PATTERN.test(email) ? null : 'emailInvalid';
}

export function validatePassword(value: string, mode: 'login' | 'new'): AuthValidationKey | null {
  if (!value) return 'passwordRequired';
  if (mode === 'new' && value.length < PASSWORD_MIN_LENGTH) return 'passwordTooShort';
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): AuthValidationKey | null {
  return password === confirmation ? null : 'passwordsDontMatch';
}

export function normalizeCode(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateCode(value: string): AuthValidationKey | null {
  return CODE_PATTERN.test(normalizeCode(value)) ? null : 'codeInvalid';
}
