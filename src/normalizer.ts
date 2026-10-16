import { NormalizerOptions } from './types';
import {
  ARABIC_TO_PERSIAN_CHAR_MAP,
  DIACRITICS_PATTERN,
  PERSIAN_PUNCTUATION,
  PERSIAN_DIGITS,
  ENGLISH_DIGITS,
  ARABIC_DIGITS,
  ZWNJ
} from './constants';

/**
 * Replaces Arabic characters with their Persian equivalents based on ARABIC_TO_PERSIAN_CHAR_MAP.
 * 
 * @param text The input string
 * @returns The text with Arabic characters converted to Persian
 */
export function fixArabicCharacters(text: string): string {
  if (!text) return '';
  let result = text;
  for (const [ar, fa] of Object.entries(ARABIC_TO_PERSIAN_CHAR_MAP)) {
    const regex = new RegExp(ar, 'g');
    result = result.replace(regex, fa);
  }
  return result;
}

/**
 * Strips Arabic diacritics (Aeraab) from the text using DIACRITICS_PATTERN.
 * 
 * @param text The input string
 * @returns The text without diacritics
 */
export function removeDiacritics(text: string): string {
  if (!text) return '';
  return text.replace(DIACRITICS_PATTERN, '');
}

/**
 * Converts English and Arabic punctuation to Persian equivalents.
 * Also adds proper spacing around punctuation (no space before, one space after).
 * 
 * @param text The input string
 * @returns The text with corrected Persian punctuation and spacing
 */
export function fixPunctuation(text: string): string {
  if (!text) return '';
  let result = text;
  
  // Replace punctuation based on the map
  for (const [en, fa] of Object.entries(PERSIAN_PUNCTUATION)) {
    // Escape the character if it's a regex special char
    const escapedEn = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedEn, 'g');
    result = result.replace(regex, fa);
  }
  
  // Fix spacing around punctuation: no space before, one space after
  result = result.replace(/\s+([،؛؟٪!])/g, '$1');
  result = result.replace(/([،؛؟٪!])([^\s،؛؟٪!])/g, '$1 $2');
  
  return result;
}

/**
 * Removes extra whitespace, trims, and cleans zero-width characters (except ZWNJ).
 * 
 * @param text The input string
 * @returns The cleaned text
 */
export function removeExtraWhitespace(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u200D/g, '') // Remove ZWJ
    .replace(/[\u200B\u200E\u200F\uFEFF]/g, '') // Remove LRM, RLM, BOM, zero-width space
    .replace(/[ \t]+/g, ' ') // Collapse multiple spaces and tabs
    .replace(/\n\s*\n/g, '\n\n') // Collapse multiple empty lines
    .trim();
}

/**
 * Converts all English and Arabic digits to Persian digits.
 * 
 * @param text The input string
 * @returns The text with Persian digits
 */
export function toPersianDigits(text: string): string {
  if (!text) return '';
  return text.replace(/[0-9٠-٩]/g, char => {
    const enIndex = (ENGLISH_DIGITS as readonly string[]).indexOf(char);
    if (enIndex !== -1) return PERSIAN_DIGITS[enIndex];
    
    const arIndex = (ARABIC_DIGITS as readonly string[]).indexOf(char);
    if (arIndex !== -1) return PERSIAN_DIGITS[arIndex];
    
    return char;
  });
}

/**
 * Converts all Persian and Arabic digits to English digits.
 * 
 * @param text The input string
 * @returns The text with English digits
 */
export function toEnglishDigits(text: string): string {
  if (!text) return '';
  return text.replace(/[۰-۹٠-٩]/g, char => {
    const faIndex = (PERSIAN_DIGITS as readonly string[]).indexOf(char);
    if (faIndex !== -1) return ENGLISH_DIGITS[faIndex];
    
    const arIndex = (ARABIC_DIGITS as readonly string[]).indexOf(char);
    if (arIndex !== -1) return ENGLISH_DIGITS[arIndex];
    
    return char;
  });
}

/**
 * Fixes half-space (ZWNJ) insertion and cleanup according to Persian typography rules.
 * 
 * @param text The input string
 * @returns The text with properly formatted half-spaces
 */
export function fixHalfSpace(text: string): string {
  if (!text) return '';
  let result = text;

  // Add ZWNJ after prefixes (می, نمی, بی)
  result = result.replace(/(^|\s)(می|نمی|بی)\s+([^ \n\r\t]+)/gu, `$1$2${ZWNJ}$3`);

  // Add ZWNJ before suffixes (ها, های, هایی, تر, ترین, تری)
  result = result.replace(/([^ \n\r\t\u200C]+)\s+(ها|های|هایی|تر|ترین|تری)(?=[ \t\n\r،؛!؟.]|$)/gu, `$1${ZWNJ}$2`);

  // Standard Academy Ezafe normalization for words ending with silent Heh (ه ی -> ه‌ی)
  result = result.replace(/([^ \n\r\t\u200C]+ه)\s+ی(?=[ \t\n\r،؛!؟.]|$)/gu, `$1${ZWNJ}ی`);

  // Convert space + suffix to ZWNJ + suffix for verbal/pronominal endings
  result = result.replace(/([^ \n\r\t\u200C]+)\s+(ام|ات|اش|اید|اند)(?=[ \t\n\r،؛!؟.]|$)/gu, `$1${ZWNJ}$2`);

  // Remove duplicate ZWNJs
  const zwnjRegex = new RegExp(`${ZWNJ}{2,}`, 'g');
  result = result.replace(zwnjRegex, ZWNJ);

  // Remove ZWNJ at the beginning or end of words
  result = result.replace(new RegExp(`(^|\\s)${ZWNJ}`, 'g'), '$1');
  result = result.replace(new RegExp(`${ZWNJ}(\\s|$)`, 'g'), '$1');

  return result;
}

/**
 * General fix spacing. Fixes ZWNJ/half-space issues and removes extra whitespaces.
 * 
 * @param text The input string
 * @returns The text with fixed spacing
 */
export function fixSpacing(text: string): string {
  if (!text) return '';
  let result = text;
  result = fixHalfSpace(result);
  result = removeExtraWhitespace(result);
  return result;
}

/**
 * Main normalization entry point. Applies all selected normalizations.
 * 
 * @param text The input text to normalize
 * @param options Normalizer options to specify which normalizations to apply
 * @returns The normalized text
 */
export function normalize(text: string, options: NormalizerOptions = {}): string {
  if (!text) return '';
  
  let result = text;

  const {
    persianCharacters = true,
    persianDigits = true,
    fixSpacing: doFixSpacing = true,
    removeDiacritics: doRemoveDiacritics = true,
    fixPunctuation: doFixPunctuation = true,
    removeExtraWhitespace: doRemoveExtraWhitespace = true,
    fixArabicYa = true,
    fixArabicKaf = true,
  } = options;

  if (persianCharacters || fixArabicYa || fixArabicKaf) {
    // For simplicity, fixArabicCharacters covers Ya, Kaf, and other characters.
    result = fixArabicCharacters(result);
  }

  if (persianDigits) {
    result = toPersianDigits(result);
  }

  if (doRemoveDiacritics) {
    result = removeDiacritics(result);
  }

  if (doFixPunctuation) {
    result = fixPunctuation(result);
  }

  if (doFixSpacing) {
    result = fixSpacing(result);
  }

  if (doRemoveExtraWhitespace) {
    result = removeExtraWhitespace(result);
  }

  return result;
}
