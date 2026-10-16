import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  prepareTextForLLM,
  getSystemPromptForTone,
  postProcessLLMOutput,
  createHybridPipeline,
  invokeLLMProvider,
  rewriteWithLLM,
} from '../src/llm-adapter';

describe('Phase 5: LLM Hybrid Adapter & AI Rewriter', () => {
  describe('System Prompt Generation for All 7 Tones', () => {
    it('creates appropriate prompt for administrative tone', () => {
      const prompt = getSystemPromptForTone('administrative');
      expect(prompt).toContain('فرهنگستان');
      expect(prompt).toContain('اداری و سازمانی');
      expect(prompt).toContain('نیم‌فاصله‌ها');
    });

    it('creates appropriate prompt for academic tone', () => {
      const prompt = getSystemPromptForTone('academic');
      expect(prompt).toContain('علمی، آکادمیک و دانشگاهی');
    });

    it('creates appropriate prompt for summary tone', () => {
      const prompt = getSystemPromptForTone('summary');
      expect(prompt).toContain('خلاصه و تیتروار');
    });

    it('creates appropriate prompt for persuasive tone', () => {
      const prompt = getSystemPromptForTone('persuasive');
      expect(prompt).toContain('متقاعدکننده، انگیزشی و حماسی');
    });

    it('creates appropriate prompt for friendly tone', () => {
      const prompt = getSystemPromptForTone('friendly');
      expect(prompt).toContain('دوستانه، محترمانه و صمیمی');
    });

    it('creates appropriate prompt for literary tone', () => {
      const prompt = getSystemPromptForTone('literary');
      expect(prompt).toContain('فاخر و ادیبانه');
    });

    it('creates appropriate prompt for formal tone', () => {
      const prompt = getSystemPromptForTone('formal');
      expect(prompt).toContain('رسمی و عمومی');
    });
  });

  describe('Pre-Processing for LLM', () => {
    it('sanitizes input and generates contextual prompt with tone label', () => {
      const raw = 'من ميخوام يه گذارش واسه ارتقا بفرستم به مديران.';
      const prepared = prepareTextForLLM(raw, {
        targetTone: 'persuasive',
        fixTypos: true,
        persianDigits: true,
      });

      // Typos like گذارش should be fixed locally in phase 1
      expect(prepared.cleanText).toContain('گزارش');
      // Prompts are ready
      expect(prepared.systemPrompt).toBeDefined();
      expect(prepared.userPrompt).toContain('گزارش');
      expect(prepared.userPrompt).toContain('متقاعدکننده و حماسی');
      expect(prepared.metadata.targetTone).toBe('persuasive');
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

  describe('Provider Invocations with Global Fetch Mock', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('invokes Google Gemini API with proper payload structure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'پاسخ ویراستاری‌شده از جمینای' }],
              },
            },
          ],
        }),
      });

      const res = await invokeLLMProvider('متن کاربر', 'پرامپت سیستم', {
        type: 'gemini',
        apiKey: 'test-api-key',
        model: 'gemini-1.5-flash',
      });

      expect(res).toBe('پاسخ ویراستاری‌شده از جمینای');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-1.5-flash:generateContent?key=test-api-key'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('invokes OpenAI API with authorization headers and messages format', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: 'پاسخ رسمی از اوپن‌ای‌آی' },
            },
          ],
        }),
      });

      const res = await invokeLLMProvider('متن کاربر', 'پرامپت سیستم', {
        type: 'openai',
        apiKey: 'sk-test1234',
        model: 'gpt-4o-mini',
      });

      expect(res).toBe('پاسخ رسمی از اوپن‌ای‌آی');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test1234',
          }),
        })
      );
    });

    it('invokes Ollama local server with non-streaming payload', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'پاسخ محلی از اولاما qwen2.5' },
        }),
      });

      const res = await invokeLLMProvider('متن کاربر', 'پرامپت سیستم', {
        type: 'ollama',
        model: 'qwen2.5:7b',
      });

      expect(res).toBe('پاسخ محلی از اولاما qwen2.5');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          body: expect.stringContaining('"model":"qwen2.5:7b"'),
        })
      );
    });

    it('throws informative error when Gemini API key is missing', async () => {
      await expect(
        invokeLLMProvider('متن', 'سیستم', { type: 'gemini' })
      ).rejects.toThrow('کلید API برای Google Gemini الزامی است');
    });

    it('executes rewriteWithLLM pipeline with custom provider mock', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'احتراماً موافقت با مرخصی در تاریخ 1405 اعلام می‌شود.' }],
              },
            },
          ],
        }),
      });

      const result = await rewriteWithLLM('میخوام برم مرخصی', {
        targetTone: 'administrative',
        provider: {
          type: 'gemini',
          apiKey: 'test-key',
        },
      });

      expect(result.originalText).toBe('میخوام برم مرخصی');
      expect(result.finalText).toContain('احتراماً');
      expect(result.finalText).toContain('۱۴۰۵'); // Persian digits applied in post-processing
      expect(result.metadata.targetTone).toBe('administrative');
    });
  });
});
