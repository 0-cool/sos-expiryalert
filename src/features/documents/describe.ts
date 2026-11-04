import type { TFunction } from 'i18next';

/** "12 days left", "Expires today", "Expired 3 days ago"… */
export function describeDaysRemaining(daysRemaining: number, t: TFunction): string {
  if (daysRemaining === 0) return t('time.expiresToday');
  if (daysRemaining === 1) return t('time.expiresTomorrow');
  if (daysRemaining === -1) return t('time.expiredYesterday');
  if (daysRemaining < 0) return t('time.expiredDaysAgo', { count: Math.abs(daysRemaining) });
  return t('time.daysLeft', { count: daysRemaining });
}

/**
 * Compact relative label for list rows: exact days up to two months, then months,
 * then years. Expired and near-term values reuse `describeDaysRemaining`.
 */
export function describeRelative(daysRemaining: number, t: TFunction): string {
  if (daysRemaining <= 1) return describeDaysRemaining(daysRemaining, t);
  if (daysRemaining <= 60) return t('time.inDays', { count: daysRemaining });
  if (daysRemaining < 730) return t('time.inMonths', { count: Math.floor(daysRemaining / 30.4375) });
  return t('time.inYears', { count: Math.floor(daysRemaining / 365.25) });
}
