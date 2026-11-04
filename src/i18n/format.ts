import { atLocalTime, isoDateToLocalNoon, type ISODate } from '@/lib/dates';

export type DateStyle = 'long' | 'medium' | 'weekday';

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  medium: { year: 'numeric', month: 'short', day: 'numeric' },
  weekday: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
};

export interface Formatters {
  locale: string;
  /** Formats a calendar date (`YYYY-MM-DD`) without any time-zone shift. */
  formatDate: (value: ISODate, style?: DateStyle) => string;
  /** Formats a wall-clock time such as 09:00 respecting the 12/24-hour preference. */
  formatTime: (hour: number, minute: number) => string;
  /** Formats an instant (e.g. `updated_at`) as a date in the local time zone. */
  formatInstantDate: (instant: Date, style?: DateStyle) => string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function safeFormat(locale: string, options: Intl.DateTimeFormatOptions, date: Date): string | null {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat(undefined, options).format(date);
    } catch {
      return null;
    }
  }
}

export function createFormatters(locale: string, uses24HourClock?: boolean): Formatters {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  if (typeof uses24HourClock === 'boolean') timeOptions.hour12 = !uses24HourClock;

  return {
    locale,
    formatDate(value, style = 'long') {
      const date = isoDateToLocalNoon(value);
      if (!date) return value;
      return safeFormat(locale, DATE_OPTIONS[style], date) ?? value;
    },
    formatTime(hour, minute) {
      const date = atLocalTime({ year: 2000, month: 1, day: 1 }, hour, minute);
      return safeFormat(locale, timeOptions, date) ?? `${pad(hour)}:${pad(minute)}`;
    },
    formatInstantDate(instant, style = 'medium') {
      return safeFormat(locale, DATE_OPTIONS[style], instant) ?? instant.toISOString().slice(0, 10);
    },
  };
}
