import { describe, it, expect } from 'vitest';
import {
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliDate,
  formatJalaliDate,
  isJalaliLeapYear,
  JALALI_MONTH_NAMES,
} from '../src/jalali';

describe('Phase 3: Jalali Calendar Engine', () => {
  describe('Gregorian <-> Jalali Conversion', () => {
    it('converts Nowruz (spring equinox) accurately', () => {
      // 2026-03-21 -> 1405-01-01
      const res = gregorianToJalali(2026, 3, 21);
      expect(res.jy).toBe(1405);
      expect(res.jm).toBe(1);
      expect(res.jd).toBe(1);

      // Inverse
      const inv = jalaliToGregorian(1405, 1, 1);
      expect(inv.gy).toBe(2026);
      expect(inv.gm).toBe(3);
      expect(inv.gd).toBe(21);
    });

    it('converts autumn date accurately', () => {
      // 2026-10-15 -> 1405-07-23
      const res = gregorianToJalali(2026, 10, 15);
      expect(res.jy).toBe(1405);
      expect(res.jm).toBe(7);
      expect(res.jd).toBe(23);

      const inv = jalaliToGregorian(1405, 7, 23);
      expect(inv.gy).toBe(2026);
      expect(inv.gm).toBe(10);
      expect(inv.gd).toBe(15);
    });
  });

  describe('Leap Year Detection', () => {
    it('identifies leap years in 33-year cycle', () => {
      // 1403 is a leap year (366 days)
      expect(isJalaliLeapYear(1403)).toBe(true);
      // 1404 and 1405 are normal years
      expect(isJalaliLeapYear(1404)).toBe(false);
      expect(isJalaliLeapYear(1405)).toBe(false);
    });
  });

  describe('Date Extraction & Formatting', () => {
    it('returns rich date object', () => {
      const fixedDate = new Date(2026, 2, 21); // March 21, 2026
      const j = getJalaliDate(fixedDate);

      expect(j.year).toBe(1405);
      expect(j.month).toBe(1);
      expect(j.day).toBe(1);
      expect(j.monthName).toBe('فروردین');
      expect(j.formatted).toBe('1405/01/01');
      expect(j.formattedPersianDigits).toBe('۱۴۰۵/۰۱/۰۱');
      expect(j.officialFormat).toContain('فروردین');
      expect(j.officialFormat).toContain('۱۴۰۵');
    });

    it('formats dates in various modes', () => {
      const fixedDate = new Date(2026, 9, 15); // Oct 15, 2026
      const standardSlash = formatJalaliDate(fixedDate, 'YYYY/MM/DD', false);
      expect(standardSlash).toBe('1405/07/23');

      const persianSlash = formatJalaliDate(fixedDate, 'YYYY/MM/DD', true);
      expect(persianSlash).toBe('۱۴۰۵/۰۷/۲۳');

      const dMonthYear = formatJalaliDate(fixedDate, 'D MMMM YYYY', false);
      expect(dMonthYear).toBe('23 مهر 1405');

      const official = formatJalaliDate(fixedDate, 'official', true);
      expect(official).toContain('مهر');
      expect(official).toContain('۱۴۰۵');

    });

    it('has all 12 month names defined', () => {
      expect(JALALI_MONTH_NAMES.length).toBe(12);
      expect(JALALI_MONTH_NAMES[0]).toBe('فروردین');
      expect(JALALI_MONTH_NAMES[11]).toBe('اسفند');
    });
  });
});
