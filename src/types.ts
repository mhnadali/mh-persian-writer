/**
 * تعریف تایپ‌ها و اینترفیس‌های پروژه
 * Type definitions and interfaces for mh-persian-writer
 *
 * @module types
 */

// ─── Normalizer Types ────────────────────────────────────────────────

/** تنظیمات نرمال‌سازی */
export interface NormalizerOptions {
  /** تبدیل کاراکترهای عربی به فارسی */
  persianCharacters?: boolean;
  /** تبدیل ارقام به فارسی */
  persianDigits?: boolean;
  /** اصلاح فاصله‌گذاری و نیم‌فاصله */
  fixSpacing?: boolean;
  /** حذف اعراب */
  removeDiacritics?: boolean;
  /** اصلاح علائم نگارشی */
  fixPunctuation?: boolean;
  /** حذف نویسه‌های نامرئی اضافی */
  removeExtraWhitespace?: boolean;
  /** تبدیل «ي» عربی به «ی» فارسی */
  fixArabicYa?: boolean;
  /** تبدیل «ك» عربی به «ک» فارسی */
  fixArabicKaf?: boolean;
}

// ─── Tokenizer Types ─────────────────────────────────────────────────

/** نتیجه توکن‌بندی */
export interface TokenizeResult {
  /** توکن‌ها */
  tokens: string[];
  /** تعداد توکن‌ها */
  count: number;
}

/** تنظیمات توکنایزر */
export interface TokenizerOptions {
  /** حفظ علائم نگارشی به عنوان توکن جداگانه */
  keepPunctuation?: boolean;
  /** حفظ اعداد */
  keepNumbers?: boolean;
  /** نرمال‌سازی قبل از توکن‌بندی */
  normalize?: boolean;
}

// ─── Formal Writing Types ────────────────────────────────────────────

/** سطح رسمیت نوشتار */
export type FormalityLevel = 'formal' | 'semi-formal' | 'informal';

/** نتیجه بررسی رسمیت */
export interface FormalityCheckResult {
  /** سطح رسمیت */
  level: FormalityLevel;
  /** امتیاز رسمیت (۰ تا ۱۰۰) */
  score: number;
  /** مشکلات یافت‌شده */
  issues: FormalityIssue[];
  /** پیشنهادات اصلاحی */
  suggestions: string[];
  /** متن اصلاح‌شده */
  correctedText: string;
}

/** مشکل رسمیت */
export interface FormalityIssue {
  /** واژه یا عبارت مشکل‌دار */
  word: string;
  /** معادل رسمی پیشنهادی */
  suggestion: string;
  /** موقعیت شروع در متن */
  position: number;
  /** نوع مشکل */
  type: 'informal_word' | 'colloquial_verb' | 'spacing' | 'punctuation' | 'structure';
  /** شدت مشکل */
  severity: 'low' | 'medium' | 'high';
}

/** بخش‌های نامه اداری */
export interface FormalLetterParts {
  /** سرآغاز */
  greeting: string;
  /** مقدمه */
  introduction: string;
  /** متن اصلی */
  body: string;
  /** درخواست */
  request?: string;
  /** نتیجه‌گیری و تشکر */
  closing: string;
  /** نام و امضا */
  signature?: string;
  /** تاریخ */
  date?: string;
  /** شماره نامه */
  referenceNumber?: string;
}

/** نوع نامه اداری */
export type LetterType =
  | 'request'       // درخواست
  | 'response'      // پاسخ
  | 'notification'  // اطلاع‌رسانی
  | 'complaint'     // شکایت
  | 'invitation'    // دعوت‌نامه
  | 'confirmation'  // تأیید
  | 'follow-up';    // پیگیری

// ─── Number Types ────────────────────────────────────────────────────

/** نوع رقم */
export type DigitType = 'persian' | 'arabic' | 'english';

/** تنظیمات تبدیل عدد */
export interface NumberConvertOptions {
  /** جداکننده هزارگان */
  thousandsSeparator?: string;
  /** جداکننده اعشار */
  decimalSeparator?: string;
  /** واحد پولی */
  currency?: string;
}

// ─── Validator Types ─────────────────────────────────────────────────

/** نتیجه اعتبارسنجی */
export interface ValidationResult {
  /** آیا معتبر است */
  isValid: boolean;
  /** پیام خطا (در صورت نامعتبر بودن) */
  errorMessage?: string;
  /** اطلاعات تکمیلی */
  metadata?: Record<string, string | number | boolean>;
}

// ─── Stemmer Types ───────────────────────────────────────────────────

/** نتیجه ریشه‌یابی */
export interface StemResult {
  /** واژه اصلی */
  word: string;
  /** ریشه */
  stem: string;
  /** پیشوند جدا شده */
  prefix?: string;
  /** پسوند جدا شده */
  suffix?: string;
}

// ─── Analyzer Types ──────────────────────────────────────────────────

/** نتیجه تحلیل متن */
export interface TextAnalysis {
  /** تعداد کلمات */
  wordCount: number;
  /** تعداد جملات */
  sentenceCount: number;
  /** تعداد پاراگراف‌ها */
  paragraphCount: number;
  /** تعداد کاراکترها (بدون فاصله) */
  charCount: number;
  /** تعداد کاراکترها (با فاصله) */
  charCountWithSpaces: number;
  /** میانگین طول جمله (تعداد کلمات) */
  avgSentenceLength: number;
  /** میانگین طول کلمه (تعداد کاراکتر) */
  avgWordLength: number;
  /** تعداد نیم‌فاصله‌ها */
  zwnjCount: number;
  /** درصد کاراکترهای فارسی */
  persianCharRatio: number;
  /** زمان تخمینی مطالعه (ثانیه) */
  estimatedReadingTime: number;
  /** تنوع واژگانی (type-token ratio) */
  lexicalDiversity: number;
  /** شاخص خوانایی */
  readabilityScore: number;
}

/** آمار فراوانی واژگان */
export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}
