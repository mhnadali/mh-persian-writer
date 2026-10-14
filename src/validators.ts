/**
 * Iranian data validators
 * Validators for Iranian specific data formats (National ID, Bank Card, IBAN, Phone Number, Postal Code).
 *
 * @module validators
 */

import { ValidationResult } from './types';
import { BANK_CARD_PREFIXES } from './constants';
import { toEnglishDigits } from './numbers';

/**
 * Validates a 10-digit Iranian National ID (کد ملی).
 *
 * @param {string} code - The National ID to validate
 * @returns {ValidationResult} The validation result
 */
export function validateNationalId(code: string): ValidationResult {
  const normalized = toEnglishDigits(code);
  
  if (!/^\d{10}$/.test(normalized)) {
    return { isValid: false, errorMessage: 'کد ملی باید دقیقاً ۱۰ رقم باشد.' };
  }

  // All digits shouldn't be the same
  if (/^(\d)\1{9}$/.test(normalized)) {
    return { isValid: false, errorMessage: 'کد ملی نامعتبر است.' };
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(normalized.charAt(i), 10) * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = parseInt(normalized.charAt(9), 10);

  const isValid = (remainder < 2 && checkDigit === remainder) || 
                  (remainder >= 2 && checkDigit === 11 - remainder);

  if (isValid) {
    return { isValid: true, metadata: {} };
  }
  
  return { isValid: false, errorMessage: 'کد ملی نامعتبر است (خطای رقم کنترلی).' };
}

/**
 * Validates a 16-digit Iranian bank card using the Luhn algorithm.
 *
 * @param {string} cardNumber - The bank card number to validate
 * @returns {ValidationResult} The validation result
 */
export function validateBankCard(cardNumber: string): ValidationResult {
  const normalized = toEnglishDigits(cardNumber).replace(/-/g, '').replace(/\s/g, '');

  if (!/^\d{16}$/.test(normalized)) {
    return { isValid: false, errorMessage: 'شماره کارت باید ۱۶ رقم باشد.' };
  }

  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let digit = parseInt(normalized.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  const isValid = sum % 10 === 0;
  
  if (isValid) {
    const bankName = getBankName(normalized);
    return { 
      isValid: true, 
      metadata: bankName ? { bank: bankName } : {} 
    };
  }

  return { isValid: false, errorMessage: 'شماره کارت نامعتبر است.' };
}

/**
 * Validates an Iranian IBAN/Sheba (شبا).
 *
 * @param {string} iban - The IBAN to validate
 * @returns {ValidationResult} The validation result
 */
export function validateIban(iban: string): ValidationResult {
  let normalized = toEnglishDigits(iban).toUpperCase().replace(/\s/g, '');

  if (!normalized.startsWith('IR')) {
    normalized = 'IR' + normalized;
  }

  if (normalized.length !== 26) {
    return { isValid: false, errorMessage: 'شماره شبا باید شامل ۲۴ رقم (یا ۲۶ کاراکتر با IR) باشد.' };
  }

  // IR is I=18, R=27
  // Move first 4 characters to the end
  const rearranged = normalized.substring(4) + '1827' + normalized.substring(2, 4);
  
  // Calculate modulo 97
  let remainder = 0;
  for (let i = 0; i < rearranged.length; i++) {
    remainder = (remainder * 10 + parseInt(rearranged.charAt(i), 10)) % 97;
  }

  if (remainder === 1) {
    return { isValid: true };
  }

  return { isValid: false, errorMessage: 'شماره شبا نامعتبر است.' };
}

/**
 * Validates an Iranian phone number (mobile or landline).
 *
 * @param {string} phone - The phone number to validate
 * @returns {ValidationResult} The validation result
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const normalized = toEnglishDigits(phone).replace(/\s/g, '').replace(/-/g, '');

  // Mobile check
  const mobileRegex = /^(?:\+98|0098|0)?(9\d{9})$/;
  const mobileMatch = normalized.match(mobileRegex);
  
  if (mobileMatch) {
    return { isValid: true, metadata: { type: 'mobile' } };
  }

  // Landline check (requires province code if with zero, e.g., 021...)
  const landlineRegex = /^(?:\+98|0098|0)?([1-8]\d{9})$/;
  const landlineMatch = normalized.match(landlineRegex);

  if (landlineMatch) {
    return { isValid: true, metadata: { type: 'landline' } };
  }

  return { isValid: false, errorMessage: 'شماره تلفن نامعتبر است.' };
}

/**
 * Validates a 10-digit Iranian postal code.
 *
 * @param {string} code - The postal code to validate
 * @returns {ValidationResult} The validation result
 */
export function validatePostalCode(code: string): ValidationResult {
  const normalized = toEnglishDigits(code).replace(/\s/g, '').replace(/-/g, '');

  // Iranian postal codes cannot contain 0 or 2 in the first 5 digits
  // and must be exactly 10 digits
  if (!/^\d{10}$/.test(normalized)) {
     return { isValid: false, errorMessage: 'کد پستی باید دقیقاً ۱۰ رقم باشد.' };
  }
  
  // Basic validation for postal code:
  // Cannot start with 0 or 2
  if (/^[02]/.test(normalized)) {
      return { isValid: false, errorMessage: 'کد پستی نمی‌تواند با ۰ یا ۲ شروع شود.' };
  }

  return { isValid: true };
}

/**
 * Formats an Iranian phone number.
 *
 * @param {string} phone - The phone number to format
 * @param {'national' | 'international'} [format='national'] - The desired format
 * @returns {string} The formatted phone number
 */
export function formatPhoneNumber(phone: string, format: 'national' | 'international' = 'national'): string {
  const normalized = toEnglishDigits(phone).replace(/\s/g, '').replace(/-/g, '').replace(/^\+98|^0098|^0/, '');

  if (normalized.length !== 10) {
    return phone; // Unable to format properly, return original
  }

  if (format === 'international') {
    return `+98${normalized}`;
  }
  
  return `0${normalized}`;
}

/**
 * Returns the bank name for a given Iranian bank card number.
 *
 * @param {string} cardNumber - The bank card number
 * @returns {string | null} The bank name, or null if unknown
 */
export function getBankName(cardNumber: string): string | null {
  const normalized = toEnglishDigits(cardNumber).replace(/-/g, '').replace(/\s/g, '');
  
  if (normalized.length < 6) return null;
  
  const prefix = normalized.substring(0, 6);
  return BANK_CARD_PREFIXES[prefix] || null;
}
