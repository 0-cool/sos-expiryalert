import type { TFunction } from 'i18next';

import type { ReminderDay } from '@/features/reminders/reminderOptions';

import type { PlannableDocument, ReminderContent } from './planner';

interface ContentOptions {
  t: TFunction;
  formatDate: (isoDate: string) => string;
  /** When false, the lock-screen text never includes the document name or type. */
  showDetails: boolean;
}

export function buildReminderContent(
  document: PlannableDocument,
  daysBefore: ReminderDay,
  { t, formatDate, showDetails }: ContentOptions,
): ReminderContent {
  if (!showDetails) {
    return {
      title: t('notifications.privateTitle'),
      body: t('notifications.privateBody', { count: daysBefore }),
    };
  }

  const type = t(`documentTypes.${document.documentType}`);
  const name = document.documentName;
  const date = formatDate(document.expirationDate);

  if (daysBefore === 0) {
    return { title: t('notifications.titleToday', { type }), body: t('notifications.bodyToday', { name }) };
  }
  if (daysBefore === 1) {
    return { title: t('notifications.titleSoon', { type }), body: t('notifications.bodyTomorrow', { name, date }) };
  }
  return {
    title: t('notifications.titleSoon', { type }),
    body: t('notifications.bodyDays', { name, date, count: daysBefore }),
  };
}
