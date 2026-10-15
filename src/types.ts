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

