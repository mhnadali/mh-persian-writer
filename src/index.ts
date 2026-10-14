/**
 * mh-persian-writer
 * A comprehensive Persian (Farsi) language toolkit
 *
 * ابزار جامع پردازش و نوشتار زبان فارسی
 *
 * @packageDocumentation
 * @module mh-persian-writer
 * @author M.H. Nadali
 * @license MIT
 */

// ─── Types ───────────────────────────────────────────────────────────
export type {
  NormalizerOptions,
  TokenizeResult,
  TokenizerOptions,
  FormalityLevel,
  FormalityCheckResult,
  FormalityIssue,
  FormalLetterParts,
  LetterType,
  DigitType,
  NumberConvertOptions,
  ValidationResult,
  StemResult,
  TextAnalysis,
  WordFrequency,
} from './types';

// ─── Normalizer ──────────────────────────────────────────────────────
export {
  normalize,
  fixArabicCharacters,
  fixSpacing,
  removeDiacritics,
  fixPunctuation,
  removeExtraWhitespace,
  toPersianDigits,
  toEnglishDigits,
  fixHalfSpace,
} from './normalizer';

// ─── Tokenizer ───────────────────────────────────────────────────────
export {
  tokenizeWords,
  tokenizeSentences,
  countWords,
  countSentences,
  extractWords,
} from './tokenizer';

// ─── Formal Writer ───────────────────────────────────────────────────
export {
  checkFormality,
  toFormal,
  generateLetter,
  getLetterTemplate,
  detectInformalWords,
  suggestFormalAlternative,
  calculateFormalityScore,
  validateLetterStructure,
} from './formal-writer';

// ─── Numbers ─────────────────────────────────────────────────────────
export {
  toWords,
  toCurrency,
  toOrdinal,
  addThousandsSeparator,
  removeThousandsSeparator,
} from './numbers';

// Re-export digit converters with namespaced aliases to avoid conflicts
export {
  toPersianDigits as convertToPersianDigits,
  toEnglishDigits as convertToEnglishDigits,
  toArabicDigits,
} from './numbers';

// ─── Validators ──────────────────────────────────────────────────────
export {
  validateNationalId,
  validateBankCard,
  validateIban,
  validatePhoneNumber,
  validatePostalCode,
  formatPhoneNumber,
  getBankName,
} from './validators';

// ─── Stemmer ─────────────────────────────────────────────────────────
export {
  stem,
  stemBatch,
  findRoot,
  isVerb,
  getVerbStem,
  removeSuffix,
  removePrefix,
} from './stemmer';

// ─── Analyzer ────────────────────────────────────────────────────────
export {
  analyzeText,
  getWordFrequency,
  isPersian,
  countPersianChars,
  detectLanguage,
  getSummaryStats,
} from './analyzer';

// ─── Constants (for advanced users) ──────────────────────────────────
export {
  ZWNJ,
  PERSIAN_DIGITS,
  PERSIAN_ALPHABET,
  ARABIC_TO_PERSIAN_CHAR_MAP,
  INFORMAL_TO_FORMAL_MAP,
  LETTER_TEMPLATES,
  VERB_STEMS,
  BANK_CARD_PREFIXES,
} from './constants';
