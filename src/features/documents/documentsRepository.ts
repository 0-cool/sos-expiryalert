import { AppError, toAppError } from '@/lib/errors';
import { requireSupabase } from '@/lib/supabase/client';

import { inputToInsert, inputToUpdate, rowToDocument } from './mappers';
import type { DocumentInput, DocumentRecord } from './types';

const COLUMNS =
  'id, user_id, document_type, document_name, expiration_date, notes, reminder_days, created_at, updated_at';

/**
 * Data access for the `documents` table. Row Level Security guarantees each
 * query only ever touches the signed-in user's rows.
 */
export const documentsRepository = {
  async list(): Promise<DocumentRecord[]> {
    try {
      const { data, error } = await requireSupabase()
        .from('documents')
        .select(COLUMNS)
        .order('expiration_date', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToDocument).filter((doc): doc is DocumentRecord => doc !== null);
    } catch (error) {
      throw toAppError(error);
    }
  },

  async create(input: DocumentInput, userId: string): Promise<DocumentRecord> {
    try {
      const { data, error } = await requireSupabase()
        .from('documents')
        .insert(inputToInsert(input, userId))
        .select(COLUMNS)
        .single();
      if (error) throw error;
      const document = rowToDocument(data);
      if (!document) throw new AppError('generic');
      return document;
    } catch (error) {
      throw toAppError(error);
    }
  },

  async update(id: string, input: Partial<DocumentInput>): Promise<DocumentRecord> {
    try {
      const { data, error } = await requireSupabase()
        .from('documents')
        .update(inputToUpdate(input))
        .eq('id', id)
        .select(COLUMNS)
        .single();
      if (error) throw error;
      const document = rowToDocument(data);
      if (!document) throw new AppError('generic');
      return document;
    } catch (error) {
      throw toAppError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { error } = await requireSupabase().from('documents').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      throw toAppError(error);
    }
  },
};
