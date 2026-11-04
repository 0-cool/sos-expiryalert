import {
  addDays,
  atLocalTime,
  dateToISODate,
  daysInMonth,
  differenceInDays,
  isLeapYear,
  isoDateToLocalNoon,
  isValidISODate,
  parseISODate,
  toISODate,
} from '@/lib/dates';

describe('leap years', () => {
  it.each([
    [2024, true],
    [2028, true],
    [2000, true],
    [1900, false],
    [2100, false],
    [2023, false],
  ])('isLeapYear(%i) is %s', (year, expected) => {
    expect(isLeapYear(year)).toBe(expected);
  });

  it('knows February length', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2025, 4)).toBe(30);
    expect(daysInMonth(2025, 12)).toBe(31);
  });
});

describe('parseISODate', () => {
  it('parses valid dates including leap days', () => {
    expect(parseISODate('2030-11-15')).toEqual({ year: 2030, month: 11, day: 15 });
    expect(parseISODate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it.each(['2023-02-29', '2025-04-31', '2025-13-01', '2025-00-10', '2030-1-5', 'not a date', '', '1899-12-31'])(
    'rejects %p',
    (value) => {
      expect(parseISODate(value)).toBeNull();
      expect(isValidISODate(value)).toBe(false);
    },
  );

  it('round-trips with toISODate', () => {
    expect(toISODate({ year: 2031, month: 1, day: 9 })).toBe('2031-01-09');
  });
});

describe('day arithmetic', () => {
  it('crosses a leap day', () => {
    expect(addDays({ year: 2028, month: 3, day: 1 }, -1)).toEqual({ year: 2028, month: 2, day: 29 });
    expect(addDays({ year: 2027, month: 3, day: 1 }, -1)).toEqual({ year: 2027, month: 2, day: 28 });
    expect(addDays({ year: 2028, month: 2, day: 28 }, 1)).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it('crosses year boundaries', () => {
    expect(addDays({ year: 2030, month: 1, day: 15 }, -30)).toEqual({ year: 2029, month: 12, day: 16 });
    expect(addDays({ year: 2025, month: 12, day: 31 }, 1)).toEqual({ year: 2026, month: 1, day: 1 });
  });

  it('counts days across a leap year', () => {
    expect(differenceInDays({ year: 2024, month: 1, day: 1 }, { year: 2025, month: 1, day: 1 })).toBe(366);
    expect(differenceInDays({ year: 2025, month: 1, day: 1 }, { year: 2026, month: 1, day: 1 })).toBe(365);
  });
});

// Jest runs in America/New_York (see jest.global-setup.js), which observes daylight-saving time.
describe('local time helpers', () => {
  it('runs the suite in a daylight-saving time zone', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/New_York');
  });

  it('keeps 09:00 local time across a daylight-saving change', () => {
    // 2026-03-08 is the US spring-forward day.
    const before = atLocalTime({ year: 2026, month: 3, day: 7 }, 9, 0);
    const after = atLocalTime({ year: 2026, month: 3, day: 8 }, 9, 0);
    expect(before.getHours()).toBe(9);
    expect(after.getHours()).toBe(9);
    // Only 23 real hours elapse between the two reminders.
    expect((after.getTime() - before.getTime()) / 3_600_000).toBe(23);
  });

  it('converts picker dates to calendar dates without time-zone shifts', () => {
    // Late evening / early morning local times would land on another day if converted through UTC.
    expect(dateToISODate(new Date(2030, 10, 15, 23, 59))).toBe('2030-11-15');
    expect(dateToISODate(new Date(2030, 10, 15, 0, 1))).toBe('2030-11-15');
    expect(new Date(2030, 10, 15, 23, 59).toISOString().slice(0, 10)).toBe('2030-11-16');
  });

  it('falls back across the autumn DST change without skipping a day', () => {
    // 2026-11-01 is the US fall-back day (25-hour day).
    const before = atLocalTime({ year: 2026, month: 10, day: 31 }, 9, 0);
    const after = atLocalTime({ year: 2026, month: 11, day: 1 }, 9, 0);
    expect((after.getTime() - before.getTime()) / 3_600_000).toBe(25);
    expect(dateToISODate(after)).toBe('2026-11-01');
  });

  it('isoDateToLocalNoon returns the same calendar day', () => {
    const date = isoDateToLocalNoon('2030-11-15');
    expect(date?.getFullYear()).toBe(2030);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(15);
    expect(date?.getHours()).toBe(12);
    expect(isoDateToLocalNoon('nope')).toBeNull();
  });
});
