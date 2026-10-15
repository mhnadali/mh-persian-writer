/**
 * آداپتور و پایپ‌لاین هیبریدی اتصال به مدل‌های بزرگ زبانی (LLMs)
 * LLM Hybrid Adapter & Prompt Engineering Pipeline for Persian NLP
 *
 * @module llm-adapter
 * @author M.H. Nadali
 */

import {
  LLMTargetTone,
  PreparedLLMInput,
  HybridPipelineOptions,
} from './types';
import { normalize, fixHalfSpace, toPersianDigits } from './normalizer';
import { fixCommonTypos, fixBrokenPlurals } from './spell-checker';
import { detectInformalWords } from './formal-writer';
import { countWords } from './tokenizer';

/**
 * تولید پرامپت سیستمی متناسب با لحن هدف
 */
export function getSystemPromptForTone(tone: LLMTargetTone = 'administrative'): string {
  const baseRules = `شما یک ویراستار ارشد، زبان‌شناس برجسته و کارشناس ارشد مکاتبات رسمی زبان فارسی هستید.
وظیفه شما بازنویسی، پالایش و ارتقای ساختار متون فارسی با رعایت دقیق دستور خط فرهنگستان زبان و ادب فارسی است.
قوانین الزامی:
۱. از به کار بردن هرگونه واژه یا عبارت عامیانه، شکسته و بازاری اکیداً خودداری فرمایید.
۲. نیم‌فاصله‌ها (ZWNJ) را در پیشوندها (مانند می‌/نمی) و پسوندها (ها/تر/ترین/ضمایر متصل) به دقت رعایت کنید.
۳. در نامه‌نگاری، لحن احترام‌آمیز، سلسله‌مراتب سازمانی و ساختار رسمی اداری ایران را حفظ نمایید.
۴. پیام اصلی و محتوای متن ورودی را حفظ نموده و صرفاً لحن، نحو و غنای واژگانی را ارتقا دهید.
۵. خروجی شما باید صرفاً متن بازنویسی‌شده نهایی باشد بدون توضیحات اضافه، نقل‌قول یا مقدمه‌چینی.`;

  switch (tone) {
    case 'academic':
      return `${baseRules}\nسیاق متن: علمی و دانشگاهی، با استدلال دقیق، ساختار بی‌طرفانه و اصطلاحات تخصصی استاندارد.`;
    case 'literary':
      return `${baseRules}\nسیاق متن: فاخر و ادیبانه، با بهره‌گیری از واژگان اصیل و استوار پارسی و بلاغت زبانی.`;
    case 'formal':
      return `${baseRules}\nسیاق متن: رسمی و عمومی، مناسب مقالات، بیانیه‌ها و گزارش‌های عمومی.`;
    case 'administrative':
    default:
      return `${baseRules}\nسیاق متن: اداری و سازمانی، با عبارات استاندارد مکاتبات دولتی و شرکتی ایران (مانند: احتراما به استحضار می‌رساند، مستدعی است دستور اقدام صادر فرمایید).`;
  }
}

/**
 * آماده‌سازی، پیش‌پالایش و بسته‌بندی متن برای ارسال به مدل‌های زبانی بزرگ
 *
 * @param rawText متن ورودی اولیه
 * @param options تنظیمات پایپ‌لاین
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

  // ۱. نرمال‌سازی سریع نویسه‌ها و فواصل در فاز لوکال
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

  // ۳. شناسایی کلمات غیررسمی برای ارائه بازخورد در پرامپت
  const issues = detectInformalWords(clean);
  const wordCount = countWords(clean);

  // ۴. ساخت پرامپت‌ها
  const systemPrompt = getSystemPromptForTone(targetTone);

  let userPrompt = `متن زیر را به لحن «${targetTone === 'administrative' ? 'اداری و سازمانی فاخر' : targetTone}» بازنویسی و ویرایش فرمایید:\n\n"""\n${clean}\n"""`;
  if (issues.length > 0) {
    const informalList = issues.map(i => i.word).slice(0, 5).join('، ');
    userPrompt += `\n\nنکته: در متن فوق واژگان عامیانه نظیر (${informalList}) وجود دارند که باید به معادل‌های رسمی تبدیل شوند.`;
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
 * رفع اشکالات احتمالی که ممکن است هوش مصنوعی در نیم‌فاصله یا علائم ایجاد کرده باشد.
 *
 * @param llmResponse خروجی متنی مدل هوش مصنوعی
 * @param options تنظیمات اختیاری
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

  // اصلاح نیم‌فاصله و فاصله‌گذاری‌ها
  result = fixHalfSpace(result);

  // تبدیل ارقام در صورت نیاز
  if (persianDigits) {
    result = toPersianDigits(result);
  }

  return result;
}

/**
 * ایجاد یک پایپ‌لاین هیبریدی کامل خودکار با دریافت تابع فراخوانی مدل زبانی
 *
 * @param llmInvoker تابعی که یک پرامپت و سیستم پرامپت می‌گیرد و خروجی رشته‌ای مدل را بازمی‌گرداند
 * @param options تنظیمات پیش‌فرض پایپ‌لاین
 * @returns تابع پردازشگر کامل
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
    // مرحله اول: پیش‌پردازش محلی فوق‌سریع
    const prepared = prepareTextForLLM(inputText, options);

    // مرحله دوم: استنتاج توسط مدل زبانی
    const rawLlmOutput = await llmInvoker(prepared.userPrompt, prepared.systemPrompt);

    // مرحله سوم: پس‌پردازش و یکدست‌سازی ساختار
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
