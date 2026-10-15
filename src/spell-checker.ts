/**
 * ماژول غلط‌یاب و تصحیح املایی پیشرفته زبان فارسی
 * Advanced Persian Spell Checker & Lexicon Engine
 *
 * @module spell-checker
 * @author M.H. Nadali
 */

import { SpellCheckerOptions, SpellCheckResult, SpellIssue } from './types';
import {
  COMMON_TYPOS,
  HOMOPHONE_MAP,
  BROKEN_PLURALS_MAP,
  BASE_PERSIAN_DICTIONARY,
  ZWNJ,
} from './constants';
import { tokenizeWords } from './tokenizer';
import { isVerb } from './stemmer';

/** مجموعه کلمات پایه برای جستجوی فوق‌سریع O(1) */
const baseDictionarySet = new Set<string>(BASE_PERSIAN_DICTIONARY);

/** پسوندهای اشتقاقی و صرفی زبان فارسی */
const VALID_SUFFIXES = [
  'ها', 'های', 'هایی', 'هایمان', 'هایتان', 'هایشان', 'هایم', 'هایت', 'هایش',
  'ان', 'گان', 'یان',
  'تر', 'ترین', 'تری',
  'ام', 'ات', 'اش', 'مان', 'تان', 'شان',
  'ای', 'ایم', 'اید', 'اند',
  'ی', 'یی', 'ین', 'ینه',
  'چه', 'ک', 'کده', 'گاه', 'ستان', 'زار', 'بار', 'وار',
  'مند', 'ناک', 'گار', 'گر', 'گری', 'بان', 'دان',
  'یت', 'یات',
  'سازی', 'ساز', 'سازان',
  'سنجی', 'سنج',
  'یابی', 'یاب',
  'رسانی', 'رسان',
  'شناسی', 'شناس', 'شناسان',
  'پذیری', 'پذیر',
  'کننده', 'کنندگان',
  'افزار', 'افزارها',
  'نامه', 'نامه‌ها',
];

/** پیشوندهای اشتقاقی و صرفی زبان فارسی */
const VALID_PREFIXES = [
  'می', 'نمی', 'بی', 'با', 'نا', 'هم', 'پیش', 'پس', 'باز', 'غیر', 'ضد', 'تک', 'چند', 'ابر', 'فوق'
];

/**
 * بررسی می‌کند که آیا دو حرف، هم‌آوا هستند یا خیر.
 */
function areHomophones(char1: string, char2: string): boolean {
  if (char1 === char2) return true;
  const list = HOMOPHONE_MAP[char1];
  return list ? list.includes(char2) : false;
}

/**
 * محاسبه فاصله ویرایشی دامرو-لون‌اشتاین (Damerau-Levenshtein Distance)
 * با در نظر گرفتن جابجایی حروف مجاور و کاهش جریمه خطای حروف هم‌آوا
 *
 * @param s1 واژه اول
 * @param s2 واژه دوم
 * @param useHomophones آیا حروف هم‌آوا جریمه کمتری داشته باشند؟
 * @returns فاصله ویرایشی وزن‌دار
 */
export function damerauLevenshteinDistance(
  s1: string,
  s2: string,
  useHomophones: boolean = true
): number {
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // ماتریس فاصله
  const d: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    d[i] = [];
    d[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    const c1 = s1[i - 1];
    for (let j = 1; j <= len2; j++) {
      const c2 = s2[j - 1];

      let cost = 1;
      if (c1 === c2) {
        cost = 0;
      } else if (useHomophones && areHomophones(c1, c2)) {
        cost = 0.5; // خطای هم‌آوا نیمی از خطای ویرایشی عادی جریمه دارد
      }

      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // Deletion
        d[i][j - 1] + 1,       // Insertion
        d[i - 1][j - 1] + cost // Substitution
      );

      // Transposition (جابجایی دو حرف مجاور)
      if (
        i > 1 &&
        j > 1 &&
        s1[i - 1] === s2[j - 2] &&
        s1[i - 2] === s2[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[len1][len2];
}

/**
 * محاسبه میزان شباهت بین دو واژه (عددی بین ۰ تا ۱)
 *
 * @param s1 واژه اول
 * @param s2 واژه دوم
 * @returns شباهت نرمال‌شده بین ۰ (بدون شباهت) تا ۱ (یکسان)
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;

  const dist = damerauLevenshteinDistance(s1, s2, true);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * بررسی ساختار مورفولوژیک و پسوندها و پیشوندهای کلمه
 */
function checkMorphology(word: string, dict: Set<string>): boolean {
  // ۱. بررسی تفکیک پسوندها
  for (const suffix of VALID_SUFFIXES) {
    if (word.endsWith(ZWNJ + suffix) && word.length >= suffix.length + 2) {
      const base = word.slice(0, -(suffix.length + 1));
      if (dict.has(base) || isVerb(base) || checkMorphology(base, dict)) return true;
    } else if (word.endsWith(suffix) && word.length >= suffix.length + 2) {
      const base = word.slice(0, -suffix.length);
      if (dict.has(base) || isVerb(base) || checkMorphology(base, dict)) return true;
    }
  }

  // ۲. بررسی تفکیک پیشوندها
  for (const prefix of VALID_PREFIXES) {
    if (word.startsWith(prefix + ZWNJ) && word.length >= prefix.length + 2) {
      const base = word.slice(prefix.length + 1);
      if (dict.has(base) || isVerb(base) || checkMorphology(base, dict)) return true;
    } else if (word.startsWith(prefix) && word.length >= prefix.length + 2) {
      const base = word.slice(prefix.length);
      if (dict.has(base) || isVerb(base) || checkMorphology(base, dict)) return true;
    }
  }

  return false;
}

/**
 * بررسی واژه‌های مرکب متصل (مانند وبسایت، همگامسازی، شخصیسازی، بدافزار)
 */
function checkCompoundWords(word: string, dict: Set<string>): boolean {
  if (word.length < 5) return false;

  for (let i = 2; i <= word.length - 2; i++) {
    const part1 = word.slice(0, i);
    const part2 = word.slice(i);

    if (
      (dict.has(part1) || checkMorphology(part1, dict)) &&
      (dict.has(part2) || checkMorphology(part2, dict))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * بررسی صحت املایی یک کلمه در فرهنگ لغات پایه، واژه‌های مرکب و صرف مورفولوژیک
 *
 * @param word واژه مورد بررسی
 * @param customDictionary واژه‌نامه سفارشی تکمیلی اختیاری
 * @returns true اگر واژه صحیح باشد
 */
export function isWordCorrect(
  word: string,
  customDictionary?: string[]
): boolean {
  const cleaned = word.trim().replace(new RegExp(`^${ZWNJ}|${ZWNJ}$`, 'g'), '');
  if (!cleaned || cleaned.length <= 1) return true;

  // ۱. عبور کلمات لاتین و انگلیسی، اعداد و علائم خاص (Google, Chrome, Lens, PDF, Gemini)
  if (/^[a-zA-Z0-9_\-\.]+$/.test(cleaned)) {
    return true;
  }

  // ۲. بررسی در واژه‌نامه سفارشی
  if (customDictionary && customDictionary.includes(cleaned)) {
    return true;
  }

  // ۳. بررسی خطاهای املایی شناخته‌شده (Known Typos)
  if (COMMON_TYPOS[cleaned]) {
    return false;
  }

  // ۴. بررسی مستقیم در واژه‌نامه پایه
  if (baseDictionarySet.has(cleaned)) {
    return true;
  }

  // ۵. بررسی افعال معتبر
  if (isVerb(cleaned)) {
    return true;
  }

  // ۶. تحلیل ساختاری و صرف پسوندها و پیشوندها
  if (checkMorphology(cleaned, baseDictionarySet)) {
    return true;
  }

  // ۷. بررسی واژه‌های مرکب به‌هم‌پیوسته
  if (checkCompoundWords(cleaned, baseDictionarySet)) {
    return true;
  }

  return false;
}

/**
 * تولید کاندیداهای تصحیح با تعویض حروف هم‌آوا (Homophone Permutations)
 */
function generateHomophoneCandidates(word: string, dict: Set<string>): string[] {
  const results = new Set<string>();
  const letters = word.split('');

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    const homophones = HOMOPHONE_MAP[char];
    if (homophones && homophones.length > 0) {
      for (const h of homophones) {
        const candidate = word.slice(0, i) + h + word.slice(i + 1);
        if (dict.has(candidate)) {
          results.add(candidate);
        }
      }
    }
  }

  return Array.from(results);
}

/**
 * ارائه پیشنهادات اصلاحی هوشمند برای یک کلمه مشکوک یا نادرست
 *
 * @param word واژه نادرست
 * @param options تنظیمات غلط‌یاب املایی
 * @returns آرایه‌ای از واژه‌های پیشنهادی به ترتیب بیشترین شباهت
 */
export function suggestCorrections(
  word: string,
  options: SpellCheckerOptions = {}
): string[] {
  const {
    maxDistance = 2,
    maxSuggestions = 3,
    customDictionary = [],
    useHomophones = true,
  } = options;

  const target = word.trim();
  if (!target || target.length <= 1) return [];

  // ۱. بررسی در جدول خطاهای شناخته‌شده (Exact match for known typos)
  if (COMMON_TYPOS[target]) {
    return [COMMON_TYPOS[target]];
  }

  const combinedDictSet = new Set<string>([
    ...BASE_PERSIAN_DICTIONARY,
    ...customDictionary,
  ]);

  // ۲. تولید پیشنهادات فوق‌دقیق بر پایه حروف هم‌آوا (ص/س، ض/ز/ظ/ذ، ت/ط، ق/غ، ع/ء)
  const homophoneCandidates = generateHomophoneCandidates(target, combinedDictSet);
  if (homophoneCandidates.length > 0) {
    return homophoneCandidates.slice(0, maxSuggestions);
  }

  // ۳. جستجوی فاصله ویرایشی کنترل‌شده (فقط با حداقل شباهت ۸۲٪ جهت جلوگیری از پیشنهادات نامربوط)
  interface Candidate {
    word: string;
    distance: number;
    similarity: number;
  }

  const candidates: Candidate[] = [];

  for (const dictWord of combinedDictSet) {
    // تفاوت طول حداکثر ۱ کاراکتر
    if (Math.abs(dictWord.length - target.length) > 1) {
      continue;
    }

    const distLimit = Math.min(maxDistance, 1.5);
    const dist = damerauLevenshteinDistance(target, dictWord, useHomophones);
    if (dist <= distLimit) {
      const sim = calculateSimilarity(target, dictWord);
      // فیلتر سخت‌گیرانه برای عدم تولید هذیان و پیشنهادات تصادفی
      if (sim >= 0.82) {
        candidates.push({ word: dictWord, distance: dist, similarity: sim });
      }
    }
  }

  // مرتب‌سازی بر اساس فاصله کمتر و سپس شباهت بیشتر
  candidates.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return b.similarity - a.similarity;
  });

  return candidates.slice(0, maxSuggestions).map(c => c.word);
}

/**
 * تبدیل جمع‌های مکسر متن به جمع استاندارد فارسی با پسوند «ها» یا «ان»
 *
 * @param text متن ورودی
 * @returns متن با جمع‌های مکسر اصلاح‌شده
 */
export function fixBrokenPlurals(text: string): string {
  if (!text) return '';
  let result = text;

  const sorted = Object.entries(BROKEN_PLURALS_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [broken, standard] of sorted) {
    const escaped = broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=^|[\\s،؛.!?؟()«»"'\\[\\]{}:–—-])${escaped}(?=[\\s،؛.!?؟()«»"'\\[\\]{}:–—-]|$)`, 'gu');
    result = result.replace(regex, standard);
  }

  return result;
}

/**
 * اصلاح مستقیم غلط‌های املایی مشهور در متن
 *
 * @param text متن ورودی
 * @returns متن با غلط‌های املایی تصحیح‌شده
 */
export function fixCommonTypos(text: string): string {
  if (!text) return '';
  let result = text;

  const sorted = Object.entries(COMMON_TYPOS).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [typo, correct] of sorted) {
    const escaped = typo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=^|[\\s،؛.!?؟()«»"'\\[\\]{}:–—-])${escaped}(?=[\\s،؛.!?؟()«»"'\\[\\]{}:–—-]|$)`, 'gu');
    result = result.replace(regex, correct);
  }

  return result;
}

/**
 * بررسی کامل متن، استخراج خطاهای املایی و ارائه متن تصحیح‌شده
 *
 * @param text متن ورودی جهت بررسی
 * @param options تنظیمات غلط‌یاب
 * @returns نتیجه کامل غلط‌یابی املایی شامل لیست خطاها، پیشنهادات و متن اصلاح‌شده
 */
export function spellCheck(
  text: string,
  options: SpellCheckerOptions = {}
): SpellCheckResult {
  if (!text) {
    return {
      isValid: true,
      issues: [],
      correctedText: '',
      wordCount: 0,
    };
  }

  const { maxDistance = 2, maxSuggestions = 3, customDictionary = [] } = options;
  const tokenResult = tokenizeWords(text, { keepPunctuation: false, keepNumbers: false });
  const words = tokenResult.tokens;
  const issues: SpellIssue[] = [];

  let corrected = text;

  // ابتدا تصحیح مستقیم خطاهای مشهور
  corrected = fixCommonTypos(corrected);

  for (const word of words) {
    // از کلمات تک‌حرفی، عددی یا لاتین صرف‌نظر می‌کنیم
    if (word.length <= 1 || /^[a-zA-Z0-9_\-\.]+$/.test(word)) continue;

    // اگر واژه صحیح یا دارای صرف مجاز است ادامه بده
    if (isWordCorrect(word, customDictionary)) continue;

    const suggestions = suggestCorrections(word, {
      maxDistance,
      maxSuggestions,
      customDictionary,
      useHomophones: options.useHomophones ?? true,
    });

    // فقط در صورتی خطا تلقی می‌شود که پیشنهاد با اطمینان بالا وجود داشته باشد
    if (suggestions.length > 0) {
      const bestSuggestion = suggestions[0];
      const sim = calculateSimilarity(word, bestSuggestion);

      // تشخیص نوع خطا
      let errorType: SpellIssue['errorType'] = 'general';
      if (COMMON_TYPOS[word] || generateHomophoneCandidates(word, baseDictionarySet).length > 0) {
        errorType = 'homophone';
      } else if (
        word.length === bestSuggestion.length &&
        damerauLevenshteinDistance(word, bestSuggestion, false) === 1
      ) {
        errorType = 'transposition';
      }

      issues.push({
        word,
        position: text.indexOf(word),
        suggestions,
        similarity: Math.round(sim * 100) / 100,
        errorType,
      });

      // جایگزینی کلمه در متن فقط در صورت اطمینان کافی
      if (errorType === 'homophone' || COMMON_TYPOS[word] || sim >= 0.85) {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`(?<=^|[\\s،؛.!?؟()«»"'\\[\\]{}:–—-])${escapedWord}(?=[\\s،؛.!?؟()«»"'\\[\\]{}:–—-]|$)`, 'gu');
        corrected = corrected.replace(wordRegex, bestSuggestion);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    correctedText: corrected,
    wordCount: words.length,
  };
}
