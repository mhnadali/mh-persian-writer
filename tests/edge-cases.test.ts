import { describe, it, expect } from 'vitest';
import {
  normalize,
  fixHalfSpace,
  toPersianDigits,
} from '../src/normalizer';
import {
  tokenizeWords,
  tokenizeSentences,
} from '../src/tokenizer';
import {
  checkFormality,
  toFormal,
  detectInformalWords,
} from '../src/formal-writer';
import {
  toWords,
  toOrdinal,
} from '../src/numbers';
import {
  validateNationalId,
  validatePhoneNumber,
  validatePostalCode,
} from '../src/validators';
import {
  isVerb,
  removePrefix,
  stem,
} from '../src/stemmer';
import {
  countPersianChars,
  isPersian,
  detectLanguage,
} from '../src/analyzer';
import {
  isWordCorrect,
  fixCommonTypos,
  fixBrokenPlurals,
  spellCheck,
} from '../src/spell-checker';
import {
  renderHtmlDocument,
  generateDocument,
} from '../src/document-builder';

describe('Exhaustive Edge Cases & Hardening Suite', () => {
  describe('Stemmer & Verb Boundary Fixes', () => {
    it('does not classify common nouns starting with "ب" as verbs', () => {
      expect(isVerb('باران')).toBe(false);
      expect(isVerb('بهار')).toBe(false);
      expect(isVerb('بزرگ')).toBe(false);
      expect(isVerb('بچه')).toBe(false);
      expect(isVerb('بیمارستان')).toBe(false);
    });

    it('correctly classifies actual imperative and present verbs starting with "ب"', () => {
      expect(isVerb('بنویس')).toBe(true);
      expect(isVerb('بخوان')).toBe(true);
      expect(isVerb('بگو')).toBe(true);
      expect(isVerb('بخور')).toBe(true);
      expect(isVerb('بخورید')).toBe(true);
    });

    it('does not strip prefix "بر" or "در" from non-prefixed words without ZWNJ', () => {
      expect(removePrefix('برادر').prefix).toBe('');
      expect(removePrefix('برادر').base).toBe('برادر');
      expect(removePrefix('درخت').prefix).toBe('');
      expect(removePrefix('بیابان').prefix).toBe('');
    });

    it('correctly strips affixes when separated by ZWNJ', () => {
      expect(removePrefix('بی\u200Cدلیل').prefix).toBe('بی');
      expect(removePrefix('بی\u200Cدلیل').base).toBe('دلیل');
      expect(removePrefix('هم\u200Cزمان').prefix).toBe('هم');
    });
  });

  describe('Tokenizer Edge Cases', () => {
    it('does not classify ellipsis (...) as a number token', () => {
      const res = tokenizeWords('سلام... حال شما چطوره؟', {
        keepNumbers: true,
        keepPunctuation: false,
      });
      expect(res.tokens).not.toContain('...');
      expect(res.tokens).not.toContain('.');
      expect(res.tokens).toContain('سلام');
      expect(res.tokens).toContain('شما');
    });

    it('correctly handles Persian decimal numbers in sentences without false splitting', () => {
      const text = 'مقدار عدد پی در ریاضی ۳.۱۴ است. این یک اصل پذیرفته‌شده است.';
      const sentences = tokenizeSentences(text);
      expect(sentences.length).toBe(2);
      expect(sentences[0]).toContain('۳.۱۴');
    });

    it('tokenizes Persian numbers with separators accurately', () => {
      const res = tokenizeWords('مبلغ ۱۲٬۵۰۰ تومان پرداخت شد.', {
        keepNumbers: true,
        keepPunctuation: false,
      });
      expect(res.tokens).toContain('۱۲٬۵۰۰');
      expect(res.tokens).toContain('مبلغ');
    });
  });

  describe('Formal Writer & Quotes Boundary Handling', () => {
    it('detects informal words inside Persian quotation marks «» and brackets', () => {
      const text = 'ایشان گفتند «یه ذره» صبر کنید.';
      const issues = detectInformalWords(text);
      expect(issues.some(i => i.word === 'یه ذره')).toBe(true);
    });

    it('replaces multi-word informal expressions accurately without sub-word collisions', () => {
      const text = 'دستت درد نکنه، تحویل بده.';
      const formal = toFormal(text);
      expect(formal).toContain('از زحمات جنابعالی کمال تشکر را دارم');
      expect(formal).toContain('تحویل فرمایید');
    });

    it('handles ZWNJ informal words like این‌جوری', () => {
      const formal = toFormal('این‌جوری کار پیش نمیره.');
      expect(formal).toContain('این‌گونه');
      expect(formal).toContain('پیش نمی‌رود');
    });
  });

  describe('Spell Checker Boundary & Precision', () => {
    it('replaces common typos enclosed in Persian quotes «»', () => {
      const fixed = fixCommonTypos('«مسعول» جدید و «اطاق» کنفرانس');
      expect(fixed).toBe('«مسئول» جدید و «اتاق» کنفرانس');
    });

    it('replaces broken plurals enclosed in quotes «»', () => {
      const fixed = fixBrokenPlurals('مطالعه «کتب» در «مدارس» ضروری است.');
      expect(fixed).toBe('مطالعه «کتاب‌ها» در «مدرسه‌ها» ضروری است.');
    });

    it('does not let nouns starting with "ب" bypass spell check via isVerb', () => {
      // "باران" is a valid word from base dictionary
      expect(isWordCorrect('باران')).toBe(true);
      // A misspelled nonsense word starting with "ب" must NOT be treated as a verb
      expect(isWordCorrect('بزرگکگ')).toBe(false);
    });
  });

  describe('Document Builder CSS and HTML Integrity', () => {
    it('generates HTML with valid CSS syntax and uncorrupted measurements/colors', () => {
      const html = renderHtmlDocument({
        subject: 'درخواست مرخصی',
        body: 'به مدت ۲ روز کاری',
        letterNumber: '1405/101',
      }, { persianDigits: true });

      // CSS must retain ASCII pixel values and colors
      expect(html).toContain('font-size: 20px;');
      expect(html).toContain('padding: 30px;');
      expect(html).toContain('#0f172a');
      expect(html).toContain('width: 120px;');
      // Must NOT contain corrupted CSS like ۲۰px or #۰f172a
      expect(html).not.toContain('font-size: ۲۰px;');
      expect(html).not.toContain('width: ۱۲۰px;');
      expect(html).not.toContain('#۰f');

      // But Persian body and metadata must have Persian digits
      expect(html).toContain('۲ روز کاری');
      expect(html).toContain('۱۴۰۵/۱۰۱');
    });
  });

  describe('Validators Hardening', () => {
    it('accepts valid National ID with hyphens and spaces', () => {
      // 0010000000 is an invalid checksum, but 0084575948 or known valid ID:
      // Let's test with a mathematically valid national ID:
      // Example valid Iranian National ID: 0010377481 -> sum modulo 11 check
      // 0*10 + 0*9 + 1*8 + 0*7 + 3*6 + 7*5 + 7*4 + 4*3 + 8*2 = 8 + 18 + 35 + 28 + 12 + 16 = 117
      // 117 % 11 = 7. check = 11 - 7 = 4. Wait: check digit is 1?
      // Let's use 0084575948:
      // 0*10 + 0*9 + 8*8 + 4*7 + 5*6 + 7*5 + 5*4 + 9*3 + 4*2 = 64 + 28 + 30 + 35 + 20 + 27 + 8 = 212
      // 212 % 11 = 3 -> 11 - 3 = 8! Check digit = 8! Exactly matches!
      const res = validateNationalId('008-457594-8');
      expect(res.isValid).toBe(true);

      const resWithSpaces = validateNationalId('008 457594 8');
      expect(resWithSpaces.isValid).toBe(true);
    });

    it('rejects repeating digits in National ID', () => {
      expect(validateNationalId('1111111111').isValid).toBe(false);
      expect(validateNationalId('0000000000').isValid).toBe(false);
    });

    it('identifies mobile operators accurately in metadata', () => {
      const mci = validatePhoneNumber('09123456789');
      expect(mci.isValid).toBe(true);
      expect(mci.metadata?.operator).toBe('همراه اول');

      const irancell = validatePhoneNumber('+989351234567');
      expect(irancell.isValid).toBe(true);
      expect(irancell.metadata?.operator).toBe('ایرانسل');

      const rightel = validatePhoneNumber('09211234567');
      expect(rightel.isValid).toBe(true);
      expect(rightel.metadata?.operator).toBe('رایتل');
    });

    it('strictly validates postal code based on Iran Postal rules', () => {
      // Digits 0 or 2 in first 5 digits are invalid
      expect(validatePostalCode('1234567890').isValid).toBe(false);
      expect(validatePostalCode('0134567890').isValid).toBe(false);
      // All 4 first digits identical is invalid
      expect(validatePostalCode('1111567890').isValid).toBe(false);
      // Valid postal code: 1983963111
      expect(validatePostalCode('1983963111').isValid).toBe(true);
    });
  });

  describe('Number to Words with Decimals', () => {
    it('converts floating-point numbers to accurate Persian words', () => {
      expect(toWords(12.5)).toBe('دوازده و پنج دهم');
      expect(toWords(0.75)).toBe('صفر و هفتاد و پنج صدم');
      expect(toWords(3.14)).toBe('سه و چهارده صدم');
      expect(toWords(100.005)).toBe('صد و پنج هزارم');
    });

    it('converts negative numbers cleanly', () => {
      expect(toWords(-1250)).toBe('منفی یک هزار و دویست و پنجاه');
    });
  });

  describe('Analyzer Character Coverage', () => {
    it('recognizes Hamza variants, Persian digits, and ZWNJ as Persian characters', () => {
      const text = 'مسئول پروژهٔ شماره ۱۲۳';
      expect(countPersianChars(text)).toBe(text.replace(/\s/g, '').length);
      expect(isPersian(text)).toBe(true);
    });

    it('correctly detects English vs Persian languages', () => {
      expect(detectLanguage('این یک متن کاملاً فارسی است.')).toBe('persian');
      expect(detectLanguage('This is an English sentence.')).toBe('english');
      expect(detectLanguage('هذا نص باللغة العربية مع الحركات')).toBe('arabic');
    });
  });

  describe('Normalizer Ezafe and Prefix Handling', () => {
    it('normalizes silent Heh ezafe and "بی" prefix', () => {
      const normalized = fixHalfSpace('بی شک به خانه ی زیبای من بیا');
      expect(normalized).toContain('بی\u200Cشک');
      expect(normalized).toContain('خانه\u200Cی');
    });
  });
});
