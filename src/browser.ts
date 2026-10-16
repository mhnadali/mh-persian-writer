/**
 * mh-persian-writer (Browser & Chrome Extension Entrypoint)
 * Comprehensive Persian Language Toolkit for Web & Chrome Extensions
 *
 * بدون هرگونه وابستگی به فایل‌سیستم یا ماژول‌های اختصاصی Node.js
 *
 * @module browser
 * @author M.H. Nadali
 */

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

// ─── Spell Checker ───────────────────────────────────────────────────
export {
  spellCheck,
  suggestCorrections,
  isWordCorrect,
  calculateSimilarity,
  damerauLevenshteinDistance,
  fixBrokenPlurals,
  fixCommonTypos,
} from './spell-checker';

// ─── Jalali Calendar ─────────────────────────────────────────────────
export {
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliDate,
  formatJalaliDate,
  isJalaliLeapYear,
  JALALI_MONTH_NAMES,
  PERSIAN_WEEKDAYS,
} from './jalali';

// ─── Document Builder ────────────────────────────────────────────────
export {
  generateDocument,
  renderTextDocument,
  renderMarkdownDocument,
  renderHtmlDocument,
  getDefaultDocumentTemplate,
} from './document-builder';

// ─── LLM Hybrid Adapter ──────────────────────────────────────────────
export {
  prepareTextForLLM,
  getSystemPromptForTone,
  postProcessLLMOutput,
  invokeLLMProvider,
  createHybridPipeline,
  rewriteWithLLM,
} from './llm-adapter';

// ─── Colloquial & Administrative Linguistic Engine ───────────────────
export {
  PersianColloquialEngine,
  COMPOUND_WORD_SPLIT_MAP,
} from './colloquial-engine';
export type { FormalityConversionResult } from './colloquial-engine';

// ─── Trie & Fast Lexicon Search ──────────────────────────────────────
export { PersianTrie } from './trie';
export type { TrieNode, TrieSearchResult } from './trie';

// ─── Contextual Homophone Spell Checker ──────────────────────────────
export { checkContextualSpelling } from './contextual-spell';
export type { ContextualSpellIssue } from './contextual-spell';

// ─── Markup & Text Scanner Core (Zero Node Dependencies) ─────────────
export {
  scanText,
  processMarkdown,
  processHtml,
  processJson,
  renderColoredDiff,
  colors as terminalColors,
} from './document-scanner-core';

// ─── Constants ───────────────────────────────────────────────────────
export {
  ZWNJ,
  PERSIAN_DIGITS,
  PERSIAN_ALPHABET,
  ARABIC_TO_PERSIAN_CHAR_MAP,
  INFORMAL_TO_FORMAL_MAP,
  LETTER_TEMPLATES,
  VERB_STEMS,
  BANK_CARD_PREFIXES,
  HOMOPHONES_GROUPS,
  HOMOPHONE_MAP,
  COMMON_TYPOS,
  BROKEN_PLURALS_MAP,
  BASE_PERSIAN_DICTIONARY,
} from './constants';
