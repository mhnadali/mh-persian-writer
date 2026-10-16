import { describe, it, expect } from 'vitest';
import { PersianTrie } from '../src/trie';
import { PersianColloquialEngine } from '../src/colloquial-engine';
import { checkContextualSpelling } from '../src/contextual-spell';
import { toFormal, checkFormality } from '../src/formal-writer';
import { spellCheck, suggestCorrections } from '../src/spell-checker';

describe('Advanced Linguistic Architecture (Phases 1-4)', () => {
  describe('Phase 1: PersianTrie Data Structure & Fuzzy Lookup', () => {
    it('accurately stores and retrieves words in O(L)', () => {
      const trie = new PersianTrie();
      trie.insert('دانشگاه');
      trie.insert('دانشجویان');
      trie.insert('دانشکده');

      expect(trie.has('دانشگاه')).toBe(true);
      expect(trie.has('دانشجویان')).toBe(true);
      expect(trie.has('دانشکده')).toBe(true);
      expect(trie.has('دانش')).toBe(false);
      expect(trie.size).toBe(3);
    });

    it('performs prefix matching', () => {
      const trie = new PersianTrie();
      trie.insert('آموزش');
      trie.insert('آموزشگاه');
      trie.insert('آموزگار');
      trie.insert('آزمایش');

      const matches = trie.findWordsWithPrefix('آموز');
      expect(matches).toContain('آموزش');
      expect(matches).toContain('آموزشگاه');
      expect(matches).toContain('آموزگار');
      expect(matches).not.toContain('آزمایش');
    });

    it('performs high-speed fuzzy Damerau-Levenshtein search with homophones', () => {
      const trie = new PersianTrie();
      trie.insert('مسئولیت');
      trie.insert('گزارش');
      trie.insert('قورباغه');

      // غلط با تعویض حرف هم‌آوا: گذارش -> گزارش
      const fuzzyMatches = trie.searchFuzzy('گذارش', 1.5, true);
      expect(fuzzyMatches.length).toBeGreaterThan(0);
      expect(fuzzyMatches[0].word).toBe('گزارش');
    });
  });

  describe('Phase 2: Morphological Colloquial Verb Conjugation & Phonology', () => {
    it('conjugates colloquial verbs systematically across tenses', () => {
      const text = 'شما چی می‌دونین و اونا کی میان؟';
      const result = PersianColloquialEngine.convertToFormal(text);
      expect(result.convertedText).toContain('می‌دانید');
      expect(result.convertedText).toContain('می‌آیند');
    });

    it('transforms spoken phonology (ـون به ـان و ـوم به ـام) without corrupting exceptions', () => {
      const text = 'توی تهرون زیر بارون رفتم ولی قانون عوض نمیشه.';
      const result = PersianColloquialEngine.convertToFormal(text);
      expect(result.convertedText).toContain('تهران');
      expect(result.convertedText).toContain('باران');
      expect(result.convertedText).toContain('قانون'); // استثنا باید حفظ شود
      expect(result.convertedText).toContain('نمی‌شود');
    });

    it('upgrades administrative phrases to corporate standards', () => {
      const text = 'لطفاً زودتر بفرست و بهم بگو.';
      const formal = toFormal(text);
      expect(formal).toContain('خواهشمند است در اسرع وقت ارسال فرمایید');
      expect(formal).toContain('مراتب را به این‌جانب اعلام فرمایید');
    });

    it('splits glued compound words', () => {
      const text = 'درواقع بهعنوان یک استاندارد بینالمللی تصویب شد.';
      const formal = toFormal(text);
      expect(formal).toContain('در واقع');
      expect(formal).toContain('به عنوان');
      expect(formal).toMatch(/بین[\u200C]?المللی/);
    });

    it('corrects false ezafe errors («ه» به جای کسره)', () => {
      const text = 'کتابه من و حاله خوب را دیدم.';
      const result = PersianColloquialEngine.convertToFormal(text);
      expect(result.convertedText).toContain('کتابِ من');
      expect(result.convertedText).toContain('حالِ خوب');
    });
  });

  describe('Phase 3 & 4: Contextual Spelling & Homophone Disambiguation', () => {
    it('distinguishes between «حیاط» and «حیات» based on collocations', () => {
      const wrongText1 = 'در حیاط وحش آفریقا حیوانات زیادی زندگی می‌کنند.';
      const issues1 = checkContextualSpelling(wrongText1);
      expect(issues1.length).toBeGreaterThan(0);
      expect(issues1[0].suggestedWord).toBe('حیات');

      const wrongText2 = 'بچه‌ها در حیات مدرسه بازی می‌کردند.';
      const issues2 = checkContextualSpelling(wrongText2);
      expect(issues2.length).toBeGreaterThan(0);
      expect(issues2[0].suggestedWord).toBe('حیاط');
    });

    it('distinguishes between «صلاح» and «سلاح» based on context', () => {
      const wrongText = 'حمل هرگونه صلاح سرد و گرم ممنوع است.';
      const issues = checkContextualSpelling(wrongText);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].suggestedWord).toBe('سلاح');
    });

    it('distinguishes between «اساس» and «اثاث»', () => {
      const wrongText = 'برای اساس کشی منزل با باربری تماس گرفتیم.';
      const issues = checkContextualSpelling(wrongText);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].suggestedWord).toBe('اثاث');
    });

    it('integrates seamlessly into the main spellCheck function', () => {
      const text = 'در حیاط وحش آفریقا باید به فکر گزارش مالی بود.';
      const result = spellCheck(text);
      expect(result.correctedText).toContain('حیات وحش');
    });

    it('suggests corrections using the high-speed Trie', () => {
      const suggestions = suggestCorrections('مسعولیت');
      expect(suggestions).toContain('مسئولیت');
    });
  });
});
