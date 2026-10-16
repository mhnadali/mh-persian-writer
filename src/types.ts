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

/** حالت‌های تنظیم لحن و رسمیت متن */
export type FormalityMode =
  | 'administrative'    // نامه‌ها و مکاتبات رسمی اداری و سازمانی (پیش‌فرض)
  | 'academic'          // مقالات علمی، پژوهشی و نگارش دانشگاهی
  | 'customer-support'  // مکاتبات محترمانه خدمات مشتریان و ایمیل‌های کاری
  | 'colloquial-cleanup'; // پالایش صرف متون محاوره‌ای و شکسته به فارسی معیار روان

/** تنظیمات ماژول رسمی‌سازی */
export interface FormalityOptions {
  /** حالت لحن نگارش */
  mode?: FormalityMode;
  /** بررسی علائم نگارشی پایان جمله */
  checkPunctuation?: boolean;
}

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

// ─── Spell Checker Types ─────────────────────────────────────────────

/** تنظیمات غلط‌یاب املایی */
export interface SpellCheckerOptions {
  /** حداکثر فاصله ویرایشی مجاز (پیش‌فرض: ۲) */
  maxDistance?: number;
  /** حداکثر تعداد پیشنهادات اصلاحی (پیش‌فرض: ۳) */
  maxSuggestions?: number;
  /** واژه‌نامه سفارشی تکمیلی */
  customDictionary?: string[];
  /** در نظر گرفتن خطاهای حروف هم‌آوا (س/ص/ث، ز/ض/ظ/ذ و...) */
  useHomophones?: boolean;
}

/** خطای املایی شناسایی‌شده */
export interface SpellIssue {
  /** واژه نادرست */
  word: string;
  /** موقعیت کاراکتری در متن */
  position: number;
  /** پیشنهادات تصحیح به ترتیب شباهت */
  suggestions: string[];
  /** میزان شباهت (۰ تا ۱) */
  similarity?: number;
  /** نوع احتمالی خطا (هم‌آوا، جابجایی حروف، کیبورد) */
  errorType?: 'homophone' | 'transposition' | 'keyboard' | 'general';
}

/** نتیجه بررسی املایی متن */
export interface SpellCheckResult {
  /** آیا متن بدون خطای املایی است؟ */
  isValid: boolean;
  /** خطاهای شناسایی‌شده */
  issues: SpellIssue[];
  /** متن تصحیح‌شده بر اساس بهترین پیشنهادها */
  correctedText: string;
  /** تعداد واژه‌های بررسی‌شده */
  wordCount: number;
}

// ─── Jalali Calendar Types ───────────────────────────────────────────

/** فرمت‌های قابل پشتیبانی برای تاریخ جلالی */
export type JalaliDateFormat =
  | 'YYYY/MM/DD'
  | 'YYYY-MM-DD'
  | 'D MMMM YYYY'
  | 'dddd D MMMM YYYY'
  | 'official';

/** نتیجه تبدیل یا استخراج تاریخ جلالی */
export interface JalaliDateResult {
  /** سال خورشیدی (مثلاً ۱۴۰۵) */
  year: number;
  /** ماه خورشیدی (۱ تا ۱۲) */
  month: number;
  /** روز خورشیدی (۱ تا ۳۱) */
  day: number;
  /** نام ماه (فروردین، اردیبهشت، ...) */
  monthName: string;
  /** نام روز هفته (شنبه، یکشنبه، ...) */
  dayName: string;
  /** آیا سال کبیسه خورشیدی است؟ */
  isLeap: boolean;
  /** تاریخ فرمت‌شده استاندارد با ارقام انگلیسی */
  formatted: string;
  /** تاریخ فرمت‌شده با ارقام فارسی */
  formattedPersianDigits: string;
  /** فرمت اداری رسمی کامل (مانند: چهارشنبه ۲۳ مهرماه ۱۴۰۵) */
  officialFormat: string;
}

// ─── Document Builder Types ──────────────────────────────────────────

/** انواع اسناد و نامه‌های اداری استاندارد */
export type DocumentType =
  | 'leave_request'
  | 'job_promotion'
  | 'resignation'
  | 'meeting_minutes'
  | 'recommendation_letter'
  | 'warning_letter'
  | 'employment_certificate'
  | 'nda_summary'
  | 'custom';

/** فرمت‌های خروجی سند اداری */
export type DocumentFormat = 'text' | 'markdown' | 'html';

/** داده‌های ورودی برای تولید اسناد اداری */
export interface DocumentData {
  /** عنوان سند */
  title?: string;
  /** شماره نامه / شماره ثبت */
  letterNumber?: string;
  /** تاریخ نامه (در صورت خالی بودن، تاریخ روز جلالی درج می‌شود) */
  date?: string;
  /** وضعیت پیوست (دارد/ندارد/تعداد برگ) */
  attachment?: string;
  /** نام یا عنوان فرستنده */
  senderName?: string;
  /** سمت فرستنده */
  senderTitle?: string;
  /** نام یا عنوان گیرنده */
  recipientName?: string;
  /** سمت گیرنده */
  recipientTitle?: string;
  /** نام سازمان، شرکت یا اداره */
  organization?: string;
  /** موضوع نامه / سند */
  subject: string;
  /** متن اصلی نامه */
  body: string;
  /** بندها، تصمیمات یا مصوبات (اختیاری) */
  clauses?: string[];
  /** فهرست حاضرین در جلسه (مخصوص صورتجلسه) */
  attendees?: string[];
  /** متن امضا و تشکر پایانی */
  signatureText?: string;
  /** رونوشت‌ها (ارسال رونوشت به بخش‌های دیگر) */
  copiesTo?: string[];
}

/** تنظیمات تولید سند اداری */
export interface DocumentOptions {
  /** فرمت خروجی (پیش‌فرض: text) */
  format?: DocumentFormat;
  /** تبدیل اعداد به ارقام فارسی */
  persianDigits?: boolean;
  /** درج خودکار تاریخ امروز جلالی در صورت عدم تعیین */
  autoDate?: boolean;
  /** نام سربرگ سازمانی (اختیاری) */
  headerTitle?: string;
}

// ─── LLM Hybrid Adapter Types ────────────────────────────────────────

/** لحن و سیاق هدف برای بازنویسی با مدل‌های زبانی */
export type LLMTargetTone =
  | 'administrative'  // حقوقی، رسمی و سازمانی
  | 'academic'        // علمی، دانشگاهی و پژوهشی
  | 'formal'          // رسمی عمومی و خبری
  | 'literary'        // فاخر و ادیبانه
  | 'summary'         // خلاصه و تیتروار (Bullet points)
  | 'persuasive'      // متقاعدکننده و حماسی (مارکتینگ و انگیزشی)
  | 'friendly';       // دوستانه و صمیمی (محترمانه)

/** ارائه‌دهندگان پشتیبانی‌شده مدل‌های زبانی */
export type LLMProviderType = 'gemini' | 'openai' | 'ollama' | 'custom';

/** پیکربندی اتصال به مدل‌های زبانی */
export interface LLMProviderConfig {
  /** نوع ارائه‌دهنده: gemini | openai | ollama | custom */
  type: LLMProviderType;
  /** کلید احراز هویت API */
  apiKey?: string;
  /** آدرس اختصاصی اندپوینت (به خصوص برای Ollama یا پروکسی‌ها) */
  endpoint?: string;
  /** نام مدل (مانند gemini-2.0-flash, gpt-4o-mini, qwen2.5:7b, llama3.1) */
  model?: string;
  /** دمای تولید پاسخ (۰.۰ تا ۱.۰) */
  temperature?: number;
  /** حداکثر توکن‌های خروجی */
  maxTokens?: number;
  /** مهلت زمانی درخواست به میلی‌ثانیه (پیش‌فرض: ۳۰۰۰۰) */
  timeoutMs?: number;
}

/** بسته داده آماده برای ارسال به مدل‌های زبان بزرگ (LLMs) */
export interface PreparedLLMInput {
  /** متن پالایش‌شده و تمیز اولیه */
  cleanText: string;
  /** پرامپت سیستمی آماده برای مدل زبانی */
  systemPrompt: string;
  /** پرامپت کاربر آماده برای تزریق به مدل */
  userPrompt: string;
  /** تنظیمات و اطلاعات آماری متن */
  metadata: {
    originalWordCount: number;
    detectedIssuesCount: number;
    targetTone: LLMTargetTone;
  };
}

/** تنظیمات پایپ‌لاین هیبریدی پردازش زبان طبیعی */
export interface HybridPipelineOptions {
  /** لحن هدف */
  targetTone?: LLMTargetTone;
  /** اصلاح غلط‌های املایی در فاز اول */
  fixTypos?: boolean;
  /** تبدیل ارقام به فارسی */
  persianDigits?: boolean;
  /** اضافه کردن دستورالعمل‌های فرهنگستان زبان و ادب فارسی */
  enforceFarhangestanRules?: boolean;
  /** پیکربندی اتصال به سرویس هوش مصنوعی */
  provider?: LLMProviderConfig;
}

/** گزینه‌های بازنویسی هوشمند هوش مصنوعی */
export interface AIRewriteOptions extends HybridPipelineOptions {}

// ─── Document Scanner & CLI 2.0 Types ────────────────────────────────

/** نوع مشکل یافت‌شده در اسکن سند */
export type ScanIssueType = 'spelling' | 'spacing' | 'punctuation' | 'informal';

/** جزئیات یک مشکل یافت‌شده در اسناد */
export interface ScanIssue {
  /** نوع مشکل */
  type: ScanIssueType;
  /** شماره خط در فایل (۱-مبنا) */
  line: number;
  /** شماره ستون در خط (۱-مبنا) */
  column: number;
  /** واژه یا بخش دارای اشکال */
  matched: string;
  /** پیشنهاد اصلاحی */
  suggestion: string;
  /** پیام توضیحی */
  message: string;
}

/** نتیجه اسکن متن یا فایل */
export interface ScanResult {
  /** مسیر فایل اسکن‌شده (در صورت وجود) */
  filePath?: string;
  /** آیا متن بدون اشکال است */
  isValid: boolean;
  /** فهرست مشکلات یافت‌شده */
  issues: ScanIssue[];
  /** متن اصلاح‌شده */
  fixedText: string;
  /** آیا تغییری در متن اصلی ایجاد شده است */
  hasChanges: boolean;
}

/** گزینه‌های پردازش فایل */
export interface FileProcessOptions {
  /** حالت پردازش: 'normalize' (پیش‌فرض) | 'formal' | 'spell' | 'all' */
  mode?: 'normalize' | 'formal' | 'spell' | 'all';
  /** لحن رسمی‌سازی در صورت انتخاب formal یا all */
  formalityMode?: FormalityMode;
  /** بازنویسی مستقیم روی فایل در صورت وجود تغییرات */
  write?: boolean;
  /** تولید دیف رنگی */
  diff?: boolean;
  /** واژه‌نامه اختصاصی برای غلط‌یاب */
  customDictionary?: string[];
  /** بررسی سخت‌گیرانه برای CI/CD */
  strict?: boolean;
}

/** خلاصه اسکن دسته‌جمعی */
export interface ScanSummary {
  /** کل فایل‌های بررسی‌شده */
  totalFiles: number;
  /** فایل‌های دارای اشکال */
  filesWithIssues: number;
  /** تعداد کل مشکلات */
  totalIssues: number;
  /** زمان اجرای اسکن (میلی‌ثانیه) */
  durationMs: number;
  /** نتایج فایل‌ها */
  results: ScanResult[];
}



