/**
 * Calendar-date utilities.
 *
 * Expiration dates are *calendar dates* (no time, no time zone), stored as
 * ISO strings `YYYY-MM-DD` — the same format PostgreSQL uses for `date`.
 *
 * All day arithmetic is done on "day numbers" computed with Date.UTC, so it is
 * immune to daylight-saving changes and the device time zone. Only when we need
 * a real instant (e.g. to fire a notification at 09:00 local time) do we build a
 * local `Date` from the calendar components.
 */

export type ISODate = string;

export interface CalendarDate {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
}

const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Supported range for expiration dates (mirrors the database constraint). */
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2200;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

export function isValidCalendarDate(date: CalendarDate): boolean {
  const { year, month, day } = date;
  if (![year, month, day].every(Number.isInteger)) return false;
  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

/** Parses `YYYY-MM-DD`. Returns null for malformed or impossible dates (e.g. 2023-02-29). */
export function parseISODate(value: string | null | undefined): CalendarDate | null {
  if (!value) return null;
  const match = ISO_DATE_PATTERN.exec(value.trim());
  if (!match) return null;
  const date: CalendarDate = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  return isValidCalendarDate(date) ? date : null;
}

export function isValidISODate(value: string | null | undefined): value is ISODate {
  return parseISODate(value) !== null;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

export function toISODate(date: CalendarDate): ISODate {
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}

/** Number of whole days since 1970-01-01 for a calendar date (time-zone independent). */
export function toDayNumber(date: CalendarDate): number {
  return Math.round(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY);
}

export function fromDayNumber(dayNumber: number): CalendarDate {
  const utc = new Date(dayNumber * MS_PER_DAY);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Days from `from` to `to` (positive when `to` is later). */
export function differenceInDays(from: CalendarDate, to: CalendarDate): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** The calendar date of an instant in the device's local time zone. */
export function toLocalCalendarDate(instant: Date): CalendarDate {
  return {
    year: instant.getFullYear(),
    month: instant.getMonth() + 1,
    day: instant.getDate(),
  };
}

export function localToday(now: Date = new Date()): CalendarDate {
  return toLocalCalendarDate(now);
}

/**
 * Builds a local instant for a calendar date at the given wall-clock time.
 * Using local components (not UTC offsets) keeps the time correct across
 * daylight-saving transitions.
 */
export function atLocalTime(date: CalendarDate, hour = 0, minute = 0): Date {
  const instant = new Date(date.year, date.month - 1, date.day, hour, minute, 0, 0);
  // Years 0–99 are mapped to 1900–1999 by the Date constructor; our range never hits that,
  // but guard anyway so the function is total.
  if (date.year < 100) instant.setFullYear(date.year);
  return instant;
}

export function compareISODates(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Converts a picker `Date` (local) to an ISO calendar date. */
export function dateToISODate(instant: Date): ISODate {
  return toISODate(toLocalCalendarDate(instant));
}

/** Converts an ISO calendar date to a local `Date` at noon (safe for pickers and formatting). */
export function isoDateToLocalNoon(value: ISODate): Date | null {
  const date = parseISODate(value);
  return date ? atLocalTime(date, 12, 0) : null;
}
