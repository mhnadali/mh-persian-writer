/**
 * Persian number utilities
 * Utilities for converting and formatting numbers in Persian language.
 *
 * @module numbers
 */

import { PERSIAN_ONES, PERSIAN_TENS, PERSIAN_HUNDREDS, PERSIAN_SCALES, PERSIAN_DIGITS, ENGLISH_DIGITS, ARABIC_DIGITS } from './constants';

/**
 * Converts a 3-digit chunk into Persian words properly joined by ' و '.
 */
function getChunkWords(num: number): string {
  const parts: string[] = [];
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundred > 0) {
    parts.push(PERSIAN_HUNDREDS[hundred]);
  }

  if (remainder >= 10 && remainder < 20) {
    parts.push(PERSIAN_ONES[remainder]);
  } else {
    const ten = Math.floor(remainder / 10);
    const one = remainder % 10;
    if (ten > 0) {
      parts.push(PERSIAN_TENS[ten]);
    }
    if (one > 0) {
      parts.push(PERSIAN_ONES[one]);
    }
  }

  return parts.join(' و ');
}

/**
 * Converts a number to Persian words.
 * Handles negative numbers, zero, and large numbers up to trillions.
 * 
 * @param {number} num - The number to convert
 * @returns {string} The Persian word representation of the number
 */
export function toWords(num: number): string {
  if (num === 0) return 'صفر';
  if (!Number.isFinite(num)) return num.toString();

  const isNegative = num < 0;
  let absoluteNum = Math.abs(num);
  const chunks: string[] = [];
  let scaleIndex = 0;

  while (absoluteNum > 0 && scaleIndex < PERSIAN_SCALES.length) {
    const chunk = absoluteNum % 1000;
    if (chunk > 0) {
      const chunkStr = getChunkWords(chunk);
      if (scaleIndex > 0) {
        chunks.push(chunkStr + ' ' + PERSIAN_SCALES[scaleIndex]);
      } else {
        chunks.push(chunkStr);
      }
    }
    absoluteNum = Math.floor(absoluteNum / 1000);
    scaleIndex++;
  }

  const result = chunks.reverse().join(' و ');
  return isNegative ? 'منفی ' + result : result;
}


/**
 * Converts English and Arabic digits in a string to Persian digits.
 * 
 * @param {string} text - The input text
 * @returns {string} The text with Persian digits
 */
export function toPersianDigits(text: string): string {
  if (!text) return text;
  return text.replace(/[0-9٠-٩]/g, (char) => {
    const enIndex = ENGLISH_DIGITS.indexOf(char as any);
    if (enIndex !== -1) return PERSIAN_DIGITS[enIndex];
    const arIndex = ARABIC_DIGITS.indexOf(char as any);
    if (arIndex !== -1) return PERSIAN_DIGITS[arIndex];
    return char;
  });
}

/**
 * Converts Persian and Arabic digits in a string to English digits.
 * 
 * @param {string} text - The input text
 * @returns {string} The text with English digits
 */
export function toEnglishDigits(text: string): string {
  if (!text) return text;
  return text.replace(/[۰-۹٠-٩]/g, (char) => {
    const faIndex = PERSIAN_DIGITS.indexOf(char as any);
    if (faIndex !== -1) return ENGLISH_DIGITS[faIndex];
    const arIndex = ARABIC_DIGITS.indexOf(char as any);
    if (arIndex !== -1) return ENGLISH_DIGITS[arIndex];
    return char;
  });
}

/**
 * Converts Persian and English digits in a string to Arabic digits.
 * 
 * @param {string} text - The input text
 * @returns {string} The text with Arabic digits
 */
export function toArabicDigits(text: string): string {
  if (!text) return text;
  return text.replace(/[0-9۰-۹]/g, (char) => {
    const enIndex = ENGLISH_DIGITS.indexOf(char as any);
    if (enIndex !== -1) return ARABIC_DIGITS[enIndex];
    const faIndex = PERSIAN_DIGITS.indexOf(char as any);
    if (faIndex !== -1) return ARABIC_DIGITS[faIndex];
    return char;
  });
}

/**
 * Adds thousands separators to a number or numeric string.
 * 
 * @param {number | string} num - The number to format
 * @param {string} [separator='٬'] - The separator character to use
 * @param {boolean} [persianDigits=false] - Whether to convert digits to Persian
 * @returns {string} The formatted string
 */
export function addThousandsSeparator(num: number | string, separator: string = '٬', persianDigits: boolean = false): string {
  const strNum = typeof num === 'number' ? num.toString() : num;
  const parts = strNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  const result = parts.join('.');
  return persianDigits ? toPersianDigits(result) : result;
}


/**
 * Removes all thousands separators from a string.
 * 
 * @param {string} text - The formatted numeric string
 * @returns {string} The raw numeric string
 */
export function removeThousandsSeparator(text: string): string {
  if (!text) return text;
  return text.replace(/[٬,،]/g, '');
}

/**
 * Formats a number as a Persian currency string.
 * 
 * @param {number} amount - The currency amount
 * @param {string} [currency='ریال'] - The currency symbol/name
 * @returns {string} The formatted currency string
 */
export function toCurrency(amount: number, currency: string = 'ریال'): string {
  const formatted = addThousandsSeparator(amount.toString());
  const persianFormatted = toPersianDigits(formatted);
  return `${persianFormatted} ${currency}`;
}

/**
 * Converts a number to its Persian ordinal word (e.g. 1 -> اول, 2 -> دوم).
 * 
 * @param {number} num - The number to convert
 * @returns {string} The Persian ordinal word
 */
export function toOrdinal(num: number): string {
  if (num === 1) return 'اول';
  if (num === 10) return 'دهم';
  if (num === 20) return 'بیستم';
  if (num === 30) return 'سی‌ام';
  
  const word = toWords(num);
  if (word.endsWith('سه')) {
    return word.slice(0, -2) + 'سوم';
  }
  if (num === 3) return 'سوم';

  if (word.endsWith('ی')) {
    return word + '‌ام';
  }

  return word + 'م';
}
