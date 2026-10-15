import { describe, it, expect } from 'vitest';
import {
  prepareTextForLLM,
  getSystemPromptForTone,
  postProcessLLMOutput,
  createHybridPipeline,
} from '../src/llm-adapter';

describe('Phase 4: LLM Hybrid Adapter & Pipeline', () => {
  describe('System Prompt Generation', () => {
    it('creates appropriate prompt for administrative tone', () => {
      const prompt = getSystemPromptForTone('administrative');
      expect(prompt).toContain('فرهنگستان');
      expect(prompt).toContain('اداری و سازمانی');
      expect(prompt).toContain('نیم‌فاصله‌ها');
    });

    it('creates appropriate prompt for academic tone', () => {
      const prompt = getSystemPromptForTone('academic');
      expect(prompt).toContain('علمی و دانشگاهی');
    });
  });

  describe('Pre-Processing for LLM', () => {
    it('sanitizes input and generates contextual prompt', () => {
      const raw = 'من ميخوام يه گذارش واسه ارتقا بفرستم به مديران.';
      const prepared = prepareTextForLLM(raw, {
        targetTone: 'administrative',
        fixTypos: true,
        persianDigits: true,
      });

      // Typos like گذارش should be fixed locally in phase 1
      expect(prepared.cleanText).toContain('گزارش');
      // Prompts are ready
      expect(prepared.systemPrompt).toBeDefined();
      expect(prepared.userPrompt).toContain('گزارش');
      expect(prepared.metadata.targetTone).toBe('administrative');
    });
  });

  describe('Post-Processing LLM Output', () => {
    it('cleans code fences, normalizes ZWNJ and Persian digits', () => {
      const rawLLM = '```markdown\nاحتراماً بدین‌وسیله به استحضار می‌رساند که پروژه در تاریخ 2026 نهایی گردید.\n```';
      const processed = postProcessLLMOutput(rawLLM, { persianDigits: true });

      expect(processed).not.toContain('```');
      expect(processed).toContain('می‌رساند');
      expect(processed).toContain('۲۰۲۶');
    });
  });

  describe('End-to-End Hybrid Pipeline', () => {
    it('executes pre-processing, mock LLM, and post-processing seamlessly', async () => {
      // Mock LLM invoker function
      const mockLLM = async (userPrompt: string, systemPrompt: string) => {
        expect(systemPrompt).toBeDefined();
        expect(userPrompt).toContain('مرخصی');
        // Simulated refined Persian text from LLM

        return 'احتراماً بدین‌وسیله موافقت خود را با درخواست مرخصی جنابعالی اعلام می‌دارم.';
      };

      const pipeline = createHybridPipeline(mockLLM, {
        targetTone: 'administrative',
        persianDigits: true,
      });

      const res = await pipeline('میخوام برم مرخصی لطفا قبول کنید');

      expect(res.originalText).toBe('میخوام برم مرخصی لطفا قبول کنید');
      expect(res.finalText).toContain('احتراماً');
      expect(res.finalText).toContain('مرخصی');
      expect(res.metadata.originalWordCount).toBeGreaterThan(0);
    });
  });
});
