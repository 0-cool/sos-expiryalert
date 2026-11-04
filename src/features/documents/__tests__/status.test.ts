import {
  EXPIRING_SOON_THRESHOLD_DAYS,
  getDaysRemaining,
  getDocumentStatus,
  getStatusForDaysRemaining,
} from '@/features/documents/status';

const today = { year: 2026, month: 11, day: 4 };

describe('getDaysRemaining', () => {
  it('counts whole calendar days', () => {
    expect(getDaysRemaining('2026-11-04', today)).toBe(0);
    expect(getDaysRemaining('2026-11-05', today)).toBe(1);
    expect(getDaysRemaining('2026-11-03', today)).toBe(-1);
    expect(getDaysRemaining('2027-11-04', today)).toBe(365);
  });

  it('accounts for leap years', () => {
    expect(getDaysRemaining('2028-11-04', today)).toBe(365 + 366);
    expect(getDaysRemaining('2028-03-01', { year: 2028, month: 2, day: 28 })).toBe(2);
  });

  it('returns NaN for invalid dates', () => {
    expect(getDaysRemaining('2027-02-29', today)).toBeNaN();
  });
});

describe('status', () => {
  it.each([
    [400, 'active'],
    [EXPIRING_SOON_THRESHOLD_DAYS + 1, 'active'],
    [EXPIRING_SOON_THRESHOLD_DAYS, 'expiring_soon'],
    [1, 'expiring_soon'],
    [0, 'expiring_soon'],
    [-1, 'expired'],
    [-500, 'expired'],
    [Number.NaN, 'expired'],
  ])('%p days remaining is %s', (days, expected) => {
    expect(getStatusForDaysRemaining(days)).toBe(expected);
  });

  it('a document is still valid on its expiration day', () => {
    expect(getDocumentStatus('2026-11-04', today)).toBe('expiring_soon');
    expect(getDocumentStatus('2026-11-03', today)).toBe('expired');
  });
});
