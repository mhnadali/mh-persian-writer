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
});
