/**
 * موتور تقویم و تاریخ هجری خورشیدی (جلالی)
 * Jalali (Solar Hijri) Calendar Engine with zero external dependencies
 *
 * @module jalali
 * @author M.H. Nadali
 */

import { JalaliDateFormat, JalaliDateResult } from './types';
import { toPersianDigits } from './normalizer';

/** نام ماه‌های خورشیدی */
export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

/** نام روزهای هفته (متناظر با getDay() جاوااسکریپت: 0=یکشنبه تا 6=شنبه) */
export const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
] as const;

/**
 * بررسی کبیسه بودن سال خورشیدی (جلالی)
 *
 * @param jy سال خورشیدی
 * @returns true اگر سال کبیسه باشد
 */
export function isJalaliLeapYear(jy: number): boolean {
  // محاسبه کبیسه جلالی با الگوریتم حسابی خیامی ۳۳ ساله
  const rem = jy % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(rem);
}

/**
 * تبدیل تاریخ میلادی به هجری خورشیدی (جلالی)
 *
 * @param gy سال میلادی (مثلاً 2026)
 * @param gm ماه میلادی (1 تا 12)
 * @param gd روز میلادی (1 تا 31)
 * @returns شیء شامل jy (سال)، jm (ماه) و jd (روز)
 */
export function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number
): { jy: number; jm: number; jd: number } {
  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const gy2 = gy - 1600;
  const gm2 = gm - 1;
  const gd2 = gd - 1;

  let g_day_no =
    365 * gy2 +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400);

  for (let i = 0; i < gm2; ++i) {
    g_day_no += g_days_in_month[i];
  }
  if (gm2 > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) {
    g_day_no++;
  }
  g_day_no += gd2;

  let j_day_no = g_day_no - 79;
  const j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;

  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  let jm: number;
  let jd: number;
  if (j_day_no < 186) {
    jm = 1 + Math.floor(j_day_no / 31);
    jd = 1 + (j_day_no % 31);
  } else {
    jm = 7 + Math.floor((j_day_no - 186) / 30);
    jd = 1 + ((j_day_no - 186) % 30);
  }

  return { jy, jm, jd };
}

/**
 * تبدیل تاریخ هجری خورشیدی به میلادی
 *
 * @param jy سال خورشیدی (مثلاً 1405)
 * @param jm ماه خورشیدی (1 تا 12)
 * @param jd روز خورشیدی (1 تا 31)
 * @returns شیء شامل gy (سال)، gm (ماه) و gd (روز)
 */
export function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number
): { gy: number; gm: number; gd: number } {
  const jy2 = jy - 979;
  const jm2 = jm - 1;
  const jd2 = jd - 1;

  let j_day_no =
    365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4);

  for (let i = 0; i < jm2; ++i) {
    j_day_no += i < 6 ? 31 : 30;
  }
  j_day_no += jd2;

  let g_day_no = j_day_no + 79;

  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no = g_day_no % 146097;

  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no = g_day_no % 36524;

    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = false;
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }

  const g_days_in_month = [
    31,
    leap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let gm = 0;
  for (let i = 0; i < 12; ++i) {
    if (g_day_no < g_days_in_month[i]) {
      gm = i + 1;
      break;
    }
    g_day_no -= g_days_in_month[i];
  }
  const gd = g_day_no + 1;

  return { gy, gm, gd };
}


/**
 * دریافت اطلاعات کامل تاریخ جلالی برای یک شیء تاریخ یا زمان حال
 *
 * @param date تاریخ ورودی (پیش‌فرض: زمان کنونی)
 * @returns نتیجه کامل شامل سال، ماه، روز، نام روز و ماه، فرمت اداری و وضعیت کبیسه
 */
export function getJalaliDate(date: Date = new Date()): JalaliDateResult {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const dayOfWeek = date.getDay();

  const monthName = JALALI_MONTH_NAMES[jm - 1];
  const dayName = PERSIAN_WEEKDAYS[dayOfWeek];
  const isLeap = isJalaliLeapYear(jy);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${jy}/${pad(jm)}/${pad(jd)}`;
  const formattedPersianDigits = toPersianDigits(formatted);
  const officialFormat = `${dayName} ${toPersianDigits(jd.toString())} ${monthName}‌ماه سال ${toPersianDigits(jy.toString())}`;

  return {
    year: jy,
    month: jm,
    day: jd,
    monthName,
    dayName,
    isLeap,
    formatted,
    formattedPersianDigits,
    officialFormat,
  };
}

/**
 * قالب‌بندی تاریخ جلالی بر اساس الگوهای متداول
 *
 * @param date تاریخ مورد نظر
 * @param format الگوی فرمت
 * @param persianDigits تبدیل ارقام به فارسی (پیش‌فرض: true)
 * @returns رشته تاریخ قالب‌بندی‌شده
 */
export function formatJalaliDate(
  date: Date = new Date(),
  format: JalaliDateFormat = 'official',
  persianDigits: boolean = true
): string {
  const j = getJalaliDate(date);
  const pad = (n: number) => n.toString().padStart(2, '0');

  let result = '';

  switch (format) {
    case 'YYYY/MM/DD':
      result = `${j.year}/${pad(j.month)}/${pad(j.day)}`;
      break;
    case 'YYYY-MM-DD':
      result = `${j.year}-${pad(j.month)}-${pad(j.day)}`;
      break;
    case 'D MMMM YYYY':
      result = `${j.day} ${j.monthName} ${j.year}`;
      break;
    case 'dddd D MMMM YYYY':
      result = `${j.dayName} ${j.day} ${j.monthName} ${j.year}`;
      break;
    case 'official':
    default:
      return persianDigits ? j.officialFormat : `${j.dayName} ${j.day} ${j.monthName}‌ماه سال ${j.year}`;
  }

  return persianDigits ? toPersianDigits(result) : result;
}
