import { normalizeReminderDays } from '@/features/reminders/reminderOptions';
import { isValidISODate } from '@/lib/dates';
import type { DocumentInsert, DocumentRow, DocumentUpdate } from '@/lib/supabase/database.types';

import { isDocumentType, type DocumentInput, type DocumentRecord } from './types';

/** Converts a database row into the app's domain model, tolerating unknown values. */
export function rowToDocument(row: DocumentRow): DocumentRecord | null {
  if (!isValidISODate(row.expiration_date)) return null;
  return {
    id: row.id,
    userId: row.user_id,
    // Unknown types (e.g. added by a newer app version) are shown as "Other".
    documentType: isDocumentType(row.document_type) ? row.document_type : 'other',
    documentName: row.document_name,
    expirationDate: row.expiration_date,
    notes: row.notes,
    reminderDays: normalizeReminderDays(row.reminder_days),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function inputToInsert(input: DocumentInput, userId: string): DocumentInsert {
  return {
    user_id: userId,
    document_type: input.documentType,
    document_name: input.documentName,
    expiration_date: input.expirationDate,
    notes: input.notes,
    reminder_days: input.reminderDays,
  };
}

export function inputToUpdate(input: Partial<DocumentInput>): DocumentUpdate {
  const update: DocumentUpdate = {};
  if (input.documentType !== undefined) update.document_type = input.documentType;
  if (input.documentName !== undefined) update.document_name = input.documentName;
  if (input.expirationDate !== undefined) update.expiration_date = input.expirationDate;
  if (input.notes !== undefined) update.notes = input.notes;
  if (input.reminderDays !== undefined) update.reminder_days = normalizeReminderDays(input.reminderDays);
  return update;
}
