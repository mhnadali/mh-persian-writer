import { describe, it, expect } from 'vitest';
import {
  normalize,
  fixArabicCharacters,
  fixHalfSpace,
  fixPunctuation,
  removeDiacritics,
  toPersianDigits,
  toEnglishDigits,
} from '../src/normalizer';
import {
  tokenizeWords,
  tokenizeSentences,
  countWords,
  extractWords,
} from '../src/tokenizer';
import {
  checkFormality,
  toFormal,
  generateLetter,
  suggestFormalAlternative,
} from '../src/formal-writer';
import {
  toWords,
  toOrdinal,
  toCurrency,
  addThousandsSeparator,
} from '../src/numbers';
import {
  validateNationalId,
  validateBankCard,
  validateIban,
  validatePhoneNumber,
  getBankName,
} from '../src/validators';
import {
  stem,
  findRoot,
  isVerb,
} from '../src/stemmer';
import {
  analyzeText,
  isPersian,
  detectLanguage,
} from '../src/analyzer';

describe('mh-persian-writer Full Suite', () => {
  describe('Normalizer Module', () => {
    it('converts Arabic letters to Persian', () => {
      expect(fixArabicCharacters('كتاب علي')).toBe('کتاب علی');
    });

    it('handles ZWNJ correctly', () => {
      const fixed = fixHalfSpace('می روم به خانه ها');
      expect(fixed).toContain('\u200C');
      expect(fixed).toBe('می\u200Cروم به خانه\u200Cها');
    });

    it('removes Arabic diacritics', () => {
      expect(removeDiacritics('سَلامٌ عَلَیکُم')).toBe('سلام علیکم');
    });

    it('converts digits between Persian and English', () => {
      expect(toPersianDigits('12345')).toBe('۱۲۳۴۵');
      expect(toEnglishDigits('۱۲۳۴۵')).toBe('12345');
    });

    it('full normalization pipeline', () => {
      const res = normalize('ميخوام برم,  خيلي خوبه!');
      expect(res).toBe('میخوام برم، خیلی خوبه!');
    });
  });

  describe('Tokenizer Module', () => {
    it('tokenizes words while preserving ZWNJ compounds', () => {
      const text = 'من می‌روم به دانشگاه.';
      const res = tokenizeWords(text);
      expect(res.tokens).toContain('می‌روم');
      expect(res.tokens).toContain('دانشگاه');
    });

    it('tokenizes sentences correctly', () => {
      const text = 'جمله اول است! آیا جمله دوم است؟ این هم جمله سوم.';
      const s = tokenizeSentences(text);
      expect(s.length).toBe(3);
    });

    it('counts words accurately', () => {
      expect(countWords('یک دو سه چهار')).toBe(4);
    });
  });

  describe('Formal Writer Module', () => {
    it('detects informal words and suggests formal versions', () => {
      expect(suggestFormalAlternative('میخوام')).toBe('می‌خواهم');
      expect(suggestFormalAlternative('واسه')).toBe('برای');
    });

    it('scores formality and checks levels', () => {
      const informalCheck = checkFormality('میخوام یه چیزی بگم واست');
      expect(informalCheck.level).toBe('informal');
      expect(informalCheck.issues.length).toBeGreaterThan(0);
    });

    it('generates administrative letters', () => {
      const letter = generateLetter('request', {
        body: 'درخواست موافقت با مأموریت اداری',
        signature: 'محمدحسین نادعلی',
      });
      expect(letter).toContain('با سلام و احترام');
      expect(letter).toContain('درخواست موافقت با مأموریت اداری');
      expect(letter).toContain('محمدحسین نادعلی');
    });
  });

  describe('Numbers Module', () => {
    it('converts numbers to Persian words', () => {
      expect(toWords(0)).toBe('صفر');
      expect(toWords(15)).toBe('پانزده');
      expect(toWords(123)).toBe('صد و بیست و سه');
      expect(toWords(1000500)).toBe('یک میلیون و پانصد');
    });

    it('formats ordinals and currency', () => {
      expect(toOrdinal(1)).toBe('اول');
      expect(toOrdinal(3)).toBe('سوم');
      expect(toCurrency(1000000)).toContain('۱٬۰۰۰٬۰۰۰');
      expect(addThousandsSeparator(1234567, '٬', true)).toBe('۱٬۲۳۴٬۵۶۷');
    });
  });

  describe('Validators Module', () => {
    it('validates National ID checksum', () => {
      expect(validateNationalId('1111111111').isValid).toBe(false); // identical digits invalid
    });

    it('validates bank cards and detects bank name', () => {
      expect(getBankName('6037991234567890')).toBe('بانک ملی');
      expect(getBankName('6104330000000000')).toBe('بانک ملت');
    });

    it('validates phone numbers', () => {
      expect(validatePhoneNumber('09121234567').isValid).toBe(true);
      expect(validatePhoneNumber('09999999999999').isValid).toBe(false);
    });

    it('validates IBAN', () => {
      expect(validateIban('IR000000000000000000000000').isValid).toBe(false);
    });
  });

  describe('Stemmer & Analyzer Modules', () => {
    it('stems prefixes and suffixes', () => {
      const s = stem('کتاب‌ها');
      expect(s.stem).toBe('کتاب');
      expect(s.suffix).toBe('ها');
    });

    it('analyzes text readability and stats', () => {
      const text = 'فارسی زبانی بسیار کهن و شیرین است. ما به زبان خود افتخار می‌کنیم.';
      const res = analyzeText(text);
      expect(res.wordCount).toBeGreaterThan(5);
      expect(res.persianCharRatio).toBeGreaterThan(0.8);
      expect(isPersian(text)).toBe(true);
      expect(detectLanguage(text)).toBe('persian');
    });
  });
});
