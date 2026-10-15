import { describe, it, expect } from 'vitest';
import {
  damerauLevenshteinDistance,
  calculateSimilarity,
  isWordCorrect,
  suggestCorrections,
  spellCheck,
  fixBrokenPlurals,
  fixCommonTypos,
} from '../src/spell-checker';
import { stem } from '../src/stemmer';

describe('Phase 2: Persian Spell Checker & Lexicon Engine', () => {
  describe('Damerau-Levenshtein & Homophone Matrix', () => {
    it('calculates standard distance', () => {
      expect(damerauLevenshteinDistance('کتاب', 'کتاب')).toBe(0);
      expect(damerauLevenshteinDistance('کتاب', 'کتام')).toBe(1);
    });

    it('penalizes homophone letter substitutions less', () => {
      // س and ص are homophones -> distance should be 0.5 with homophones enabled
      const homophoneDist = damerauLevenshteinDistance('سحیح', 'صحیح', true);
      const regularDist = damerauLevenshteinDistance('سحیح', 'صحیح', false);
      expect(homophoneDist).toBeLessThan(regularDist);
      expect(homophoneDist).toBe(0.5);
    });

    it('calculates similarity ratio between 0 and 1', () => {
      expect(calculateSimilarity('سلام', 'سلام')).toBe(1);
      expect(calculateSimilarity('سلام', 'کلام')).toBeGreaterThan(0.7);
      expect(calculateSimilarity('آب', 'دیوار')).toBeLessThan(0.3);
    });
  });

  describe('Word Validity & Suggestions', () => {
    it('validates words in base dictionary', () => {
      expect(isWordCorrect('دانشگاه')).toBe(true);
      expect(isWordCorrect('بیمارستان')).toBe(true);
      expect(isWordCorrect('دانشگاه‌ها')).toBe(true);
    });

    it('identifies known typos as invalid', () => {
      expect(isWordCorrect('مسعول')).toBe(false);
      expect(isWordCorrect('گذارش')).toBe(false);
    });

    it('suggests correct words for typos', () => {
      const suggestions = suggestCorrections('گذارش');
      expect(suggestions).toContain('گزارش');

      const typosSuggestions = suggestCorrections('مسعول');
      expect(typosSuggestions).toContain('مسئول');
    });
  });

  describe('Full Text Spell Checking & Auto-Correction', () => {
    it('detects typos and produces corrected text', () => {
      const text = 'لطفاً گذارش مربوط به انظباط پرسنل را برای مسعول اداره ارسال نمایید.';
      const res = spellCheck(text);

      expect(res.isValid).toBe(false);
      expect(res.issues.length).toBeGreaterThanOrEqual(2);
      expect(res.correctedText).toContain('گزارش');
      expect(res.correctedText).toContain('مسئول');
      expect(res.correctedText).toContain('انضباط');
    });

    it('returns valid for clean text', () => {
      const clean = 'مدیر محترم دانشگاه گزارش کار را تحویل داد.';
      const res = spellCheck(clean);
      expect(res.isValid).toBe(true);
      expect(res.issues.length).toBe(0);
    });
  });

  describe('Broken Plurals & Advanced Stemmer', () => {
    it('converts broken plurals to standard forms', () => {
      const text = 'اساتید و علما در مدارس و مساجد حضور یافتند.';
      const converted = fixBrokenPlurals(text);
      expect(converted).toContain('استادان');
      expect(converted).toContain('دانشمندان');
      expect(converted).toContain('مدرسه‌ها');
      expect(converted).toContain('مسجدها');
    });

    it('stems broken plurals to their proper root', () => {
      const stemResult = stem('کتب');
      expect(stemResult.stem).toBe('کتاب');
    });
  });

  describe('Direct Typo Fixer', () => {
    it('fixes common typos directly', () => {
      const typoText = 'من راجب این موضوع خاهش کردم که بلیط را آماده کنید.';
      const fixed = fixCommonTypos(typoText);
      expect(fixed).toContain('راجع به');
      expect(fixed).toContain('خواهش');
      expect(fixed).toContain('بلیت');
    });
  });

  describe('Zero False-Positive & Tech Term Hardening', () => {
    it('does not produce false positives on technical and standard modern Persian text', () => {
      const complexText = 'امکانات امنیتی مرورگر گوگل کروم، شامل شناسایی و هشدار درباره تهدیدهایی مانند فیشینگ، بدافزار و کلاهبرداری، مدیریت مجوزهای وبسایتها و بررسی وضعیت امنیتی است. کاربران میتوانند بوکمارکها، رمزهای عبور، تاریخچه و تنظیمات خود را از طریق حساب Google میان دستگاههای مختلف همگامسازی کنند.';
      const result = spellCheck(complexText);
      expect(result.issues).toEqual([]);
      expect(result.isValid).toBe(true);
    });

    it('accurately identifies homophone errors without hallucinated replacements', () => {
      const text = 'مسعول پروژه گذارش را به صورت حاظر تحویل داد.';
      const result = spellCheck(text);
      expect(result.issues.length).toBe(3);
      expect(result.issues[0].suggestions).toContain('مسئول');
      expect(result.issues[1].suggestions).toContain('گزارش');
      expect(result.issues[2].suggestions).toContain('حاضر');
    });
  });

  describe('Phase 1 Hardening: Multi-Affix Morphology & ISIRI 9147 Keyboard Matrix', () => {
    it('accurately verifies multi-affix stacked words and pronominal clitics', () => {
      expect(isWordCorrect('سازمان‌هایمان')).toBe(true);
      expect(isWordCorrect('پیگیری‌هایتان')).toBe(true);
      expect(isWordCorrect('کتاب‌هایشان')).toBe(true);
      expect(isWordCorrect('دیدمشان')).toBe(true);
      expect(isWordCorrect('خواندیمش')).toBe(true);
    });

    it('recognizes compound words written without half-space or space', () => {
      expect(isWordCorrect('کلاهبرداریها')).toBe(true);
      expect(isWordCorrect('وبسایتها')).toBe(true);
      expect(isWordCorrect('همگامسازی')).toBe(true);
      expect(isWordCorrect('بدافزارها')).toBe(true);
    });

    it('penalizes physically adjacent keys on Persian Standard Keyboard (ISIRI 9147) less', () => {
      // س and ی are neighbors on Row 2 -> cost 0.6
      // س and م are distant -> cost 1.0
      const neighborDist = damerauLevenshteinDistance('سیب', 'ییب', false);
      const distantDist = damerauLevenshteinDistance('سیب', 'میب', false);
      expect(neighborDist).toBe(0.6);
      expect(distantDist).toBe(1.0);
      expect(neighborDist).toBeLessThan(distantDist);
    });
  });
});


