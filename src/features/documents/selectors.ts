import { compareISODates, type CalendarDate } from '@/lib/dates';

import { withStatus, type DocumentWithStatus } from './status';
import type { DocumentRecord, DocumentStatus } from './types';

export type StatusFilter = 'all' | DocumentStatus;
export type SortOrder = 'soonest' | 'latest';

export const STATUS_FILTERS: readonly StatusFilter[] = ['all', 'active', 'expiring_soon', 'expired'];

export function isStatusFilter(value: unknown): value is StatusFilter {
  return typeof value === 'string' && (STATUS_FILTERS as readonly string[]).includes(value);
}

export interface DocumentStats {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
}

export function computeStats(documents: readonly DocumentWithStatus[]): DocumentStats {
  const stats: DocumentStats = { total: documents.length, active: 0, expiring_soon: 0, expired: 0 };
  for (const document of documents) stats[document.status] += 1;
  return stats;
}

export function decorateDocuments(documents: readonly DocumentRecord[], today: CalendarDate): DocumentWithStatus[] {
  return documents.map((document) => withStatus(document, today));
}

/** Lower-cases and strips accents so "pasaporte" matches "Pasaporte" and "jose" matches "José". */
export function normalizeForSearch(value: string): string {
  let result = value;
  try {
    result = result.normalize('NFD').replace(/[̀-ͯ]/g, '');
  } catch {
    // String.prototype.normalize unavailable: fall back to a plain case-insensitive match.
  }
  return result.toLowerCase().trim();
}

export interface ListQuery {
  search: string;
  status: StatusFilter;
  sort: SortOrder;
  /** Translated label for each document type, so users can search by type name in their language. */
  typeLabel: (document: DocumentWithStatus) => string;
}

export function queryDocuments(documents: readonly DocumentWithStatus[], query: ListQuery): DocumentWithStatus[] {
  const needle = normalizeForSearch(query.search);
  const filtered = documents.filter((document) => {
    if (query.status !== 'all' && document.status !== query.status) return false;
    if (!needle) return true;
    const haystack = normalizeForSearch(
      `${document.documentName} ${query.typeLabel(document)} ${document.notes ?? ''}`,
    );
    return haystack.includes(needle);
  });

  const direction = query.sort === 'soonest' ? 1 : -1;
  return filtered.sort(
    (a, b) =>
      direction * compareISODates(a.expirationDate, b.expirationDate) ||
      a.documentName.localeCompare(b.documentName),
  );
}

/** Documents that have not expired yet, soonest first. */
export function upcomingDocuments(documents: readonly DocumentWithStatus[], limit: number): DocumentWithStatus[] {
  return documents
    .filter((document) => document.status !== 'expired')
    .sort((a, b) => compareISODates(a.expirationDate, b.expirationDate))
    .slice(0, limit);
}
