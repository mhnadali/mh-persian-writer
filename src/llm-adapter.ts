/**
 * آداپتور و پایپ‌لاین هیبریدی اتصال به مدل‌های بزرگ زبانی (LLMs)
 * LLM Hybrid Adapter & Prompt Engineering Pipeline for Persian NLP
 *
 * پشتیبانی از:
 * - Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
 * - OpenAI & Compatible Endpoints (GPT-4o-mini, DeepSeek, Groq)
 * - Local Ollama (Qwen2.5, Llama3.1, Dorna, Maral - 100% Offline & Private)
 *
 * @module llm-adapter
 * @author M.H. Nadali
 */

import {
  LLMTargetTone,
  LLMProviderConfig,
  PreparedLLMInput,
  HybridPipelineOptions,
  AIRewriteOptions,
} from './types';
import { normalize, fixHalfSpace, toPersianDigits } from './normalizer';
import { fixCommonTypos, fixBrokenPlurals } from './spell-checker';
import { detectInformalWords } from './formal-writer';
import { countWords } from './tokenizer';

/**
 * تولید پرامپت سیستمی متناسب با لحن و سیاق هدف
 *
 * @param tone - لحن هدف مورد نظر
 * @returns پرامپت سیستمی دقیق و مهندسی‌شده برای مدل‌های زبانی
 */
export function getSystemPromptForTone(tone: LLMTargetTone = 'administrative'): string {
  const baseRules = `شما یک ویراستار ارشد، زبان‌شناس برجسته و کارشناس ارشد مکاتبات رسمی زبان فارسی هستید.
وظیفه شما بازنویسی، پالایش و ارتقای ساختار متون فارسی با رعایت دقیق دستور خط فرهنگستان زبان و ادب فارسی است.
قوانین الزامی:
۱. از به کار بردن هرگونه واژه یا عبارت عامیانه، شکسته و بازاری اکیداً خودداری فرمایید.
۲. نیم‌فاصله‌ها (ZWNJ) را در پیشوندها (مانند می‌/نمی) و پسوندها (ها/تر/ترین/ضمایر متصل) به دقت رعایت کنید.
۳. اصالت محتوا، حقایق و پیام اصلی متن ورودی را حفظ نموده و لحن، ساختار و غنای واژگانی را بازآفرینی کنید.
۴. خروجی شما باید صرفاً متن بازنویسی‌شده نهایی باشد بدون توضیحات اضافه، نقل‌قول، کاراکترهای اضافه یا مقدمه‌چینی.`;

  switch (tone) {
    case 'academic':
      return `${baseRules}\nسیاق متن: علمی، آکادمیک و دانشگاهی؛ با استدلال منطقی، ساختار بی‌طرفانه، پیوستگی معنایی و بهره‌گیری از اصطلاحات تخصصی استاندارد فارسی.`;

    case 'literary':
      return `${baseRules}\nسیاق متن: فاخر و ادیبانه؛ با بهره‌گیری از گنجینه واژگان اصیل و استوار پارسی، آرایه‌های بیانی متین و شیوایی کلام.`;

    case 'formal':
      return `${baseRules}\nسیاق متن: رسمی و عمومی؛ مناسب بیانیه‌ها، یادداشت‌های سازمانی، مقالات مطبوعاتی و گزارش‌های رسمی عمومی.`;

    case 'summary':
      return `${baseRules}\nسیاق متن: خلاصه و تیتروار؛ استخراج نکات کلیدی، تصمیمات مهم و یافته‌های اصلی در قالب فهرست‌های مرتب، کوتاه، دقیق و منسجم.`;

    case 'persuasive':
      return `${baseRules}\nسیاق متن: متقاعدکننده، انگیزشی و حماسی؛ زبانی قوی، شیوا و رسا مناسب معرفی محصولات، ارائه‌های کسب‌وکار (Pitch Deck) و بازاریابی محتوایی تأثیرگذار.`;

    case 'friendly':
      return `${baseRules}\nسیاق متن: دوستانه، محترمانه و صمیمی؛ مناسب پیام‌های تیمی درون‌سازمانی، شبکه‌های اجتماعی، وبلاگ و پاسخگویی گرم به مخاطبان در عین پاکیزگی نگارش.`;

    case 'administrative':
    default:
      return `${baseRules}\nسیاق متن: اداری و سازمانی فاخر؛ با رعایت اصطلاحات و تعابیر استاندارد مکاتبات شرکتی و دولتی ایران (مانند: احتراما به استحضار می‌رساند، مستدعی است دستور اقدام مقتضی صادر فرمایید).`;
  }
}

/**
 * آماده‌سازی، پیش‌پالایش محلی و بسته‌بندی متن برای ارسال به مدل‌های زبانی
 *
 * @param rawText - متن ورودی اولیه
 * @param options - تنظیمات پایپ‌لاین
 * @returns بسته آماده ارسال شامل متن تمیزشده، پرامپت‌ها و متادیتا
 */
export function prepareTextForLLM(
  rawText: string,
  options: HybridPipelineOptions = {}
): PreparedLLMInput {
  const {
    targetTone = 'administrative',
    fixTypos = true,
    persianDigits = true,
  } = options;

  let clean = rawText || '';

  // ۱. نرمال‌سازی سریع نویسه‌ها و فواصل در فاز محلی (بدون مصرف توکن)
  clean = normalize(clean, {
    persianCharacters: true,
    persianDigits,
    fixSpacing: true,
    removeDiacritics: true,
    fixPunctuation: true,
    removeExtraWhitespace: true,
  });

  // ۲. اصلاح مستقیم غلط‌های املایی مشهور
  if (fixTypos) {
    clean = fixCommonTypos(clean);
    clean = fixBrokenPlurals(clean);
  }

  // ۳. شناسایی کلمات غیررسمی برای ارائه راهنمایی در پرامپت
  const issues = detectInformalWords(clean);
  const wordCount = countWords(clean);

  // ۴. ساخت پرامپت‌ها
  const systemPrompt = getSystemPromptForTone(targetTone);

  let toneLabel = 'اداری و سازمانی فاخر';
  if (targetTone === 'academic') toneLabel = 'علمی و پژوهشی';
  if (targetTone === 'literary') toneLabel = 'فاخر و ادیبانه';
  if (targetTone === 'formal') toneLabel = 'رسمی و عمومی';
  if (targetTone === 'summary') toneLabel = 'خلاصه و تیتروار';
  if (targetTone === 'persuasive') toneLabel = 'متقاعدکننده و حماسی';
  if (targetTone === 'friendly') toneLabel = 'دوستانه و صمیمی';

  let userPrompt = `متن زیر را به لحن «${toneLabel}» بازنویسی و ویراستاری فرمایید:\n\n"""\n${clean}\n"""`;
  if (issues.length > 0) {
    const informalList = issues.map(i => i.word).slice(0, 5).join('، ');
    userPrompt += `\n\nنکته کمکی: در متن فوق واژگان غیررسمی نظیر (${informalList}) وجود دارند که باید به معادل‌های مناسب تبدیل شوند.`;
  }

  return {
    cleanText: clean,
    systemPrompt,
    userPrompt,
    metadata: {
      originalWordCount: wordCount,
      detectedIssuesCount: issues.length,
      targetTone,
    },
  };
}

/**
 * پس‌پردازش و پالایش نهایی پاسخ دریافتی از مدل‌های زبانی
 *
 * @param llmResponse - خروجی متنی مدل هوش مصنوعی
 * @param options - تنظیمات پس‌پردازش
 * @returns متن نهایی پیراسته و بی‌نقص
 */
export function postProcessLLMOutput(
  llmResponse: string,
  options: { persianDigits?: boolean } = {}
): string {
  if (!llmResponse) return '';

  const { persianDigits = true } = options;

  let result = llmResponse.trim();

  // حذف محصورکننده‌های احتمالی مانند ``` یا """
  result = result.replace(/^```[a-zA-Z]*\n?([\s\S]*?)```$/m, '$1').trim();
  result = result.replace(/^"""([\s\S]*?)"""$/m, '$1').trim();

  // اصلاح نیم‌فاصله‌ها و فاصله‌گذاری‌ها
  result = fixHalfSpace(result);

  // تبدیل ارقام در صورت نیاز
  if (persianDigits) {
    result = toPersianDigits(result);
  }

  return result;
}

/**
 * فراخوانی مستقیم و استاندارد ارائه‌دهندگان مدل‌های زبانی (Gemini, OpenAI, Ollama) با fetch نیتیو
 *
 * @param userPrompt - پرامپت کاربر
 * @param systemPrompt - پرامپت سیستمی
 * @param config - تنظیمات ارائه‌دهنده هوش مصنوعی
 * @returns پاسخ متنی دریافتی از مدل هوش مصنوعی
 */
export async function invokeLLMProvider(
  userPrompt: string,
  systemPrompt: string,
  config: LLMProviderConfig
): Promise<string> {
  const { type, apiKey, endpoint, model, temperature = 0.3, maxTokens = 2048, timeoutMs = 30000 } = config;
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    switch (type) {
      // ۱. ارائه‌دهنده Google Gemini API
      case 'gemini': {
        if (!apiKey) {
          throw new Error('خطا: کلید API برای Google Gemini الزامی است (GEMINI_API_KEY).');
        }
        const geminiModel = model || 'gemini-1.5-flash';
        const url = endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`خطای ارتباط با Gemini API (وضعیت: ${response.status}): ${errorText}`);
        }

        const data: any = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('پاسخی از مدل Gemini دریافت نشد.');
        }
        return text;
      }

      // ۲. ارائه‌دهنده OpenAI و سرویس‌های سازگار (Groq, DeepSeek, Claude proxy)
      case 'openai': {
        if (!apiKey) {
          throw new Error('خطا: کلید API برای OpenAI الزامی است (OPENAI_API_KEY).');
        }
        const url = endpoint || 'https://api.openai.com/v1/chat/completions';
        const openaiModel = model || 'gpt-4o-mini';

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          signal,
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`خطای ارتباط با OpenAI API (وضعیت: ${response.status}): ${errorText}`);
        }

        const data: any = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) {
          throw new Error('پاسخی از مدل OpenAI دریافت نشد.');
        }
        return text;
      }

      // ۳. ارائه‌دهنده مدل‌های محلی Ollama (آفلاین ۱۰۰٪ و محرمانه)
      case 'ollama': {
        const url = endpoint || 'http://localhost:11434/api/chat';
        const ollamaModel = model || 'qwen2.5:7b';

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            model: ollamaModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            stream: false,
            options: {
              temperature,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`خطای Ollama (وضعیت: ${response.status}): ${errorText}`);
        }

        const data: any = await response.json();
        const text = data?.message?.content;
        if (!text) {
          throw new Error(`پاسخی از مدل ${ollamaModel} در Ollama دریافت نشد.`);
        }
        return text;
      }

      // ۴. ارائه‌دهنده سفارشی
      case 'custom': {
        if (!endpoint) {
          throw new Error('خطا: آدرس endpoint برای ارائه‌دهنده سفارشی الزامی است.');
        }
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          signal,
          body: JSON.stringify({
            systemPrompt,
            userPrompt,
            model,
          }),
        });

        if (!response.ok) {
          throw new Error(`خطا در ارائه‌دهنده سفارشی (وضعیت: ${response.status})`);
        }

        const data: any = await response.json();
        return data.text || data.content || data.result || JSON.stringify(data);
      }

      default:
        throw new Error(`ارائه‌دهنده هوش مصنوعی ناشناخته: ${type}`);
    }
  } catch (err: any) {
    if (err.name === 'TimeoutError' || (err.message && err.message.toLowerCase().includes('timeout'))) {
      throw new Error(`خطای مهلت زمانی: ارتباط با سرویس هوش مصنوعی پس از ${Math.round(timeoutMs / 1000)} ثانیه قطع شد.`);
    }
    if (err.message && err.message.includes('ECONNREFUSED')) {
      throw new Error('ارتباط با سرور محلی Ollama برقرار نشد. لطفاً اطمینان حاصل کنید Ollama با دستور `ollama serve` در حال اجرا است.');
    }
    throw err;
  }
}

/**
 * ایجاد پایپ‌لاین هیبریدی سفارشی با تابع فراخوانی دلخواه
 */
export function createHybridPipeline(
  llmInvoker: (userPrompt: string, systemPrompt: string) => Promise<string>,
  options: HybridPipelineOptions = {}
) {
  return async function processText(inputText: string): Promise<{
    originalText: string;
    preProcessedText: string;
    finalText: string;
    metadata: PreparedLLMInput['metadata'];
  }> {
    const prepared = prepareTextForLLM(inputText, options);
    const rawLlmOutput = await llmInvoker(prepared.userPrompt, prepared.systemPrompt);
    const finalText = postProcessLLMOutput(rawLlmOutput, {
      persianDigits: options.persianDigits ?? true,
    });

    return {
      originalText: inputText,
      preProcessedText: prepared.cleanText,
      finalText,
      metadata: prepared.metadata,
    };
  };
}

/**
 * بازنویسی و ارتقای هوشمند متن فارسی با استفاده از مدل‌های زبانی بزرگ (Google Gemini, OpenAI, Ollama)
 *
 * @param text - متن ورودی برای بازنویسی
 * @param options - تنظیمات لحن و ارائه‌دهنده
 * @returns نتیجه کامل بازنویسی شامل متن اولیه، متن پیش‌پردازش‌شده، متن نهایی و متادیتا
 */
export async function rewriteWithLLM(
  text: string,
  options: AIRewriteOptions = {}
): Promise<{
  originalText: string;
  preProcessedText: string;
  finalText: string;
  metadata: PreparedLLMInput['metadata'];
}> {
  // تشخیص ارائه‌دهنده هوش مصنوعی از تنظیمات یا متغیرهای محیطی
  let providerConfig: LLMProviderConfig = options.provider || {
    type: 'ollama',
    model: 'qwen2.5:7b',
  };

  if (!options.provider) {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.GEMINI_API_KEY) {
        providerConfig = {
          type: 'gemini',
          apiKey: process.env.GEMINI_API_KEY,
          model: 'gemini-1.5-flash',
        };
      } else if (process.env.OPENAI_API_KEY) {
        providerConfig = {
          type: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4o-mini',
        };
      }
    }
  }

  const pipeline = createHybridPipeline(
    async (userPrompt, systemPrompt) => {
      return await invokeLLMProvider(userPrompt, systemPrompt, providerConfig);
    },
    options
  );

  return await pipeline(text);
}
