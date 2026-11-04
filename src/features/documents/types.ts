import type { ReminderDay } from '@/features/reminders/reminderOptions';
import type { ISODate } from '@/lib/dates';

/**
 * Supported document types. Keep in sync with the `documents.document_type`
 * check constraint in supabase/migrations.
 */
export const DOCUMENT_TYPES = [
  'passport',
  'drivers_license',
  'national_id',
  'visa',
  'residence_permit',
  'vehicle_registration',
  'vehicle_insurance',
  'medical_insurance',
  'professional_certification',
  'other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === 'string' && (DOCUMENT_TYPES as readonly string[]).includes(value);
}

/**
 * A tracked document. By design it contains NO identification numbers, scans or
 * photos — only what is needed to send expiration reminders.
 */
export interface DocumentRecord {
  id: string;
  userId: string;
  documentType: DocumentType;
  /** Friendly name or owner name, e.g. "Juan Rojas". Never a document number. */
  documentName: string;
  expirationDate: ISODate;
  notes: string | null;
  reminderDays: ReminderDay[];
  createdAt: string;
  updatedAt: string;
}

/** Fields the user can create or edit. */
export interface DocumentInput {
  documentType: DocumentType;
  documentName: string;
  expirationDate: ISODate;
  notes: string | null;
  reminderDays: ReminderDay[];
}

export type DocumentStatus = 'active' | 'expiring_soon' | 'expired';

export const DOCUMENT_STATUSES: readonly DocumentStatus[] = ['active', 'expiring_soon', 'expired'];
