import { describe, it, expect } from 'vitest';
import {
  checkFormality,
  toFormal,
  detectInformalWords,
  calculateFormalityScore,
  suggestFormalAlternative,
  generateLetter,
  validateLetterStructure
} from '../src/formal-writer';

describe('Phase 2: Context-Aware Persian Formality Engine', () => {
  describe('Contextual Collision Resolution for «میان»', () => {
    it('preserves the formal preposition «میان» without false positive', () => {
      const formalText = 'همگام‌سازی میان دستگاه‌های مختلف و ارتباط میان اعضای تیم.';
      const result = checkFormality(formalText);
      expect(result.correctedText).toContain('میان دستگاه‌های مختلف');
      expect(result.correctedText).not.toContain('می‌آیند');
      expect(result.issues.filter(i => i.word === 'میان').length).toBe(0);
    });

    it('preserves «در میان» and «از میان»', () => {
      const text = 'در میان پژوهشگران و از میان نامزدهای برتر انتخاب شد.';
      const formal = toFormal(text);
      expect(formal).toContain('در میان');
      expect(formal).toContain('از میان');
    });

    it('correctly formalizes the colloquial verb «دارن میان» to «می‌آیند»', () => {
      const text = 'همکاران دارن میان اینجا.';
      const formal = toFormal(text);
      expect(formal).toContain('می‌آیند');
      expect(formal).not.toContain('دارن میان');
    });
  });

  describe('Contextual Preposition vs Pronoun «تو / توی»', () => {
    it('converts colloquial preposition «تو» before nouns to «در»', () => {
      const text = 'من تو جلسه و تو ماشین بودم.';
      const formal = toFormal(text);
      expect(formal).toContain('در جلسه');
      expect(formal).toContain('در ماشین');
      expect(formal).not.toContain('تو جلسه');
    });

    it('converts «توی» to «در»', () => {
      const text = 'مدارک توی شرکت و پرونده توی سایت است.';
      const formal = toFormal(text);
      expect(formal).toContain('در شرکت');
      expect(formal).toContain('در سایت');
    });
  });

  describe('Progressive Continuous Past Verbs with «داشتن»', () => {
    it('transforms «داشتم می‌رفتم» to «در حال رفتن بودم»', () => {
      const text = 'داشتم می‌رفتم که تلفن زنگ زد.';
      const formal = toFormal(text);
      expect(formal).toContain('در حال رفتن بودم');
    });

    it('transforms «داشت می‌گفت» to «در حال گفتن بود»', () => {
      const text = 'مدیر داشت می‌گفت که گزارش را آماده کنید.';
      const formal = toFormal(text);
      expect(formal).toContain('در حال گفتن بود');
    });

    it('transforms «داشتیم می‌نوشتیم» to «در حال نگارش بودیم»', () => {
      const text = 'ما داشتیم می‌نوشتیم.';
      const formal = toFormal(text);
      expect(formal).toContain('در حال نگارش بودیم');
    });
  });

  describe('Colloquial Object Marker «رو» Replacement', () => {
    it('converts «کتاب رو» to «کتاب را»', () => {
      const text = 'کتاب رو باز کنید و نامه رو بخونید.';
      const formal = toFormal(text);
      expect(formal).toContain('کتاب را');
      expect(formal).toContain('نامه را');
    });

    it('converts «این رو» and «گزارش رو»', () => {
      const text = 'لطفاً این رو بررسی و گزارش رو ارسال فرمایید.';
      const formal = toFormal(text);
      expect(formal).toContain('این را بررسی');
      expect(formal).toContain('گزارش را ارسال');
    });
  });

  describe('Colloquial Attached Clitics with «و»', () => {
    it('converts «کارتونو» to «کارتان را»', () => {
      const text = 'لطفاً کارتونو به موقع تحویل بده.';
      const formal = toFormal(text);
      expect(formal).toMatch(/کار[\u200C]?تان را/);
    });

    it('converts «خونه‌مون» to «خانه‌مان»', () => {
      const text = 'جلسه در خونه‌مون تشکیل شد.';
      const formal = toFormal(text);
      expect(formal).toContain('خانه‌مان');
    });

    it('converts «حرفاشو» to «حرف‌هایش را»', () => {
      const text = 'حرفاشو شنیدم.';
      const formal = toFormal(text);
      expect(formal).toContain('حرف‌هایش را');
    });
  });

  describe('Multi-tier Formality Modes', () => {
    it('handles administrative mode with business phrases', () => {
      const text = 'زنگ زدم و با مدیر حرف زدیم.';
      const formal = toFormal(text, { mode: 'administrative' });
      expect(formal).toContain('تماس حاصل نمودم');
      expect(formal).toContain('مذاکره نمودیم');
    });

    it('preserves clean colloquial words in colloquial-cleanup mode without excessive changes', () => {
      const text = 'میخوام نامه‌تون رو بفرستم.';
      const formal = toFormal(text, { mode: 'colloquial-cleanup' });
      expect(formal).toContain('می‌خواهم');
      expect(formal).toContain('نامه‌تان را');
    });
  });

  describe('Letter Template & Administrative Structure Validation', () => {
    it('validates administrative structure completeness', () => {
      const validLetter = 'با سلام و احترام\n\nمتن نامه اداری جهت اقدام لازم.\n\nبا تشکر و احترام';
      const check = validateLetterStructure(validLetter);
      expect(check.isValid).toBe(true);
      expect(check.missing.length).toBe(0);
    });

    it('flags missing greeting and closing', () => {
      const incomplete = 'فقط متن خالی نامه بدون سلام و پایان.';
      const check = validateLetterStructure(incomplete);
      expect(check.isValid).toBe(false);
      expect(check.missing).toContain('greeting');
      expect(check.missing).toContain('closing');
    });
  });
});
