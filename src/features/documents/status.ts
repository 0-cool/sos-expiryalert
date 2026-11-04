import { differenceInDays, localToday, parseISODate, type CalendarDate, type ISODate } from '@/lib/dates';

import type { DocumentRecord, DocumentStatus } from './types';

/** A document is "expiring soon" when it expires within this many days (inclusive). */
export const EXPIRING_SOON_THRESHOLD_DAYS = 30;

/**
 * Whole days from `today` until the expiration date.
 * 0 = expires today (still valid today), negative = already expired.
 */
export function getDaysRemaining(expirationDate: ISODate, today: CalendarDate = localToday()): number {
  const expiration = parseISODate(expirationDate);
  if (!expiration) return Number.NaN;
  return differenceInDays(today, expiration);
}

export function getStatusForDaysRemaining(daysRemaining: number): DocumentStatus {
  if (Number.isNaN(daysRemaining) || daysRemaining < 0) return 'expired';
  if (daysRemaining <= EXPIRING_SOON_THRESHOLD_DAYS) return 'expiring_soon';
  return 'active';
}

export function getDocumentStatus(expirationDate: ISODate, today: CalendarDate = localToday()): DocumentStatus {
  return getStatusForDaysRemaining(getDaysRemaining(expirationDate, today));
}

export interface DocumentWithStatus extends DocumentRecord {
  daysRemaining: number;
  status: DocumentStatus;
}

export function withStatus(document: DocumentRecord, today: CalendarDate = localToday()): DocumentWithStatus {
  const daysRemaining = getDaysRemaining(document.expirationDate, today);
  return { ...document, daysRemaining, status: getStatusForDaysRemaining(daysRemaining) };
}
