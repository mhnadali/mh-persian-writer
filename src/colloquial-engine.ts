/**
 * موتور زبان‌شناختی جامع و پیشرفته تبدیل گفتار و محاوره به زبان رسمی و اداری معیار فارسی
 * Advanced Colloquial-to-Formal & Administrative Persian Linguistic Engine
 *
 * قابلیت‌ها:
 * ۱. صرف قاعده‌مند بن‌های افعال محاوره‌ای به رسمی (مضارع، ماضی، التزامی، امری، استمراری)
 * ۲. تبدیل نظام‌مند فرآیندهای واج‌شناختی (ان -> اون، ام -> اوم) با مهار استثناها
 * ۳. تفکیک و پیوند ضمایر ملکی، نشانه‌های مفعولی و حروف اضافه (رو -> را، واسه -> برای، تو -> در)
 * ۴. تبدیل لحن محاوره‌ای/امری به مکاتبات اداری فاخر و زدودن حشوهای سازمانی
 * ۵. تصحیح خطای کسره اضافه («ه» به جای کسره) و یای میانجی
 *
 * @module colloquial-engine
 * @author M.H. Nadali
 */

import { ZWNJ } from './constants';

export interface FormalityConversionResult {
  convertedText: string;
  replacementsCount: number;
  details: {
    original: string;
    replacement: string;
    category: 'verb' | 'phonology' | 'pronoun' | 'administrative' | 'ezafe';
  }[];
}

const B_PRE = '(?<=^|[\\s،؛.!?؟()«»"\'\\[\\]{}:–—-])';
const B_POST = '(?=[\\s،؛.!?؟()«»"\'\\[\\]{}:–—-]|$)' ;

/**
 * بن‌های افعال پرکاربرد عامیانه به بن و الگوی رسمی
 */
interface VerbRule {
  colloquialStem: string;
  formalPresStem: string;
  formalPastStem?: string;
  hasSpecial3rdSingular?: string; // فرم سوم شخص مفرد مانند «می‌آید»، «می‌رود»
}

const COMMON_COLLOQUIAL_VERB_STEMS: Record<string, VerbRule> = {
  // گفتن
  'می‌گ': { colloquialStem: 'می‌گ', formalPresStem: 'می‌گو' },
  'میگ': { colloquialStem: 'میگ', formalPresStem: 'می‌گو' },
  'نمی‌گ': { colloquialStem: 'نمی‌گ', formalPresStem: 'نمی‌گو' },
  'نمیگ': { colloquialStem: 'نمیگ', formalPresStem: 'نمی‌گو' },
  'بگ': { colloquialStem: 'بگ', formalPresStem: 'بگو' },
  'نگ': { colloquialStem: 'نگ', formalPresStem: 'نگو' },

  // رفتن
  'می‌ر': { colloquialStem: 'می‌ر', formalPresStem: 'می‌رو' },
  'میر': { colloquialStem: 'میر', formalPresStem: 'می‌رو' },
  'نمی‌ر': { colloquialStem: 'نمی‌ر', formalPresStem: 'نمی‌رو' },
  'نمیر': { colloquialStem: 'نمیر', formalPresStem: 'نمی‌رو' },
  'بر': { colloquialStem: 'بر', formalPresStem: 'برو' },
  'نر': { colloquialStem: 'نر', formalPresStem: 'نرو' },

  // دادن
  'می‌د': { colloquialStem: 'می‌د', formalPresStem: 'می‌ده' },
  'مید': { colloquialStem: 'مید', formalPresStem: 'می‌ده' },
  'نمی‌د': { colloquialStem: 'نمی‌د', formalPresStem: 'نمی‌ده' },
  'نمید': { colloquialStem: 'نمید', formalPresStem: 'نمی‌ده' },

  // دیدن
  'می‌بین': { colloquialStem: 'می‌بین', formalPresStem: 'می‌بین' },
  'میبین': { colloquialStem: 'میبین', formalPresStem: 'می‌بین' },
  'نمی‌بین': { colloquialStem: 'نمی‌بین', formalPresStem: 'نمی‌بین' },
  'نمیبین': { colloquialStem: 'نمیبین', formalPresStem: 'نمی‌بین' },

  // دانستن
  'می‌دون': { colloquialStem: 'می‌دون', formalPresStem: 'می‌دان' },
  'میدون': { colloquialStem: 'میدون', formalPresStem: 'می‌دان' },
  'نمی‌دون': { colloquialStem: 'نمی‌دون', formalPresStem: 'نمی‌دان' },
  'نمیدون': { colloquialStem: 'نمیدون', formalPresStem: 'نمی‌دان' },
  'بدون': { colloquialStem: 'بدون', formalPresStem: 'بدان' },
  'ندون': { colloquialStem: 'ندون', formalPresStem: 'ندان' },

  // توانستن
  'می‌تون': { colloquialStem: 'می‌تون', formalPresStem: 'می‌توان' },
  'میتون': { colloquialStem: 'میتون', formalPresStem: 'می‌توان' },
  'نمی‌تون': { colloquialStem: 'نمی‌تون', formalPresStem: 'نمی‌توان' },
  'نمیتون': { colloquialStem: 'نمیتون', formalPresStem: 'نمی‌توان' },
  'بتون': { colloquialStem: 'بتون', formalPresStem: 'بتوان' },
  'نتون': { colloquialStem: 'نتون', formalPresStem: 'نتوان' },

  // آوردن
  'می‌آر': { colloquialStem: 'می‌آر', formalPresStem: 'می‌آور' },
  'میار': { colloquialStem: 'میار', formalPresStem: 'می‌آور' },
  'نمی‌آر': { colloquialStem: 'نمی‌آر', formalPresStem: 'نمی‌آور' },
  'نمیار': { colloquialStem: 'نمیار', formalPresStem: 'نمی‌آور' },
  'بیار': { colloquialStem: 'بیار', formalPresStem: 'بیاور' },

  // شدن
  'می‌ش': { colloquialStem: 'می‌ش', formalPresStem: 'می‌شو' },
  'میش': { colloquialStem: 'میش', formalPresStem: 'می‌شو' },
  'نمی‌ش': { colloquialStem: 'نمی‌ش', formalPresStem: 'نمی‌شو' },
  'نمیش': { colloquialStem: 'نمیش', formalPresStem: 'نمی‌شو' },
  'بش': { colloquialStem: 'بش', formalPresStem: 'بشو' },
  'نش': { colloquialStem: 'نش', formalPresStem: 'نشود' },

  // انداختن
  'می‌نداز': { colloquialStem: 'می‌نداز', formalPresStem: 'می‌انداز' },
  'مینداز': { colloquialStem: 'مینداز', formalPresStem: 'می‌انداز' },
  'نمی‌نداز': { colloquialStem: 'نمی‌نداز', formalPresStem: 'نمی‌انداز' },
  'نمینداز': { colloquialStem: 'نمینداز', formalPresStem: 'نمی‌انداز' },
  'بنداز': { colloquialStem: 'بنداز', formalPresStem: 'بینداز' },

  // گذاشتن
  'می‌ذار': { colloquialStem: 'می‌ذار', formalPresStem: 'می‌گذار' },
  'میذار': { colloquialStem: 'میذار', formalPresStem: 'می‌گذار' },
  'نمی‌ذار': { colloquialStem: 'نمی‌ذار', formalPresStem: 'نمی‌گذار' },
  'نمیذار': { colloquialStem: 'نمیذار', formalPresStem: 'نمی‌گذار' },
  'بذار': { colloquialStem: 'بذار', formalPresStem: 'بگذار' },

  // خواستن
  'می‌خوا': { colloquialStem: 'می‌خوا', formalPresStem: 'می‌خواه' },
  'میخوا': { colloquialStem: 'میخوا', formalPresStem: 'می‌خواه' },
  'نمی‌خوا': { colloquialStem: 'نمی‌خوا', formalPresStem: 'نمی‌خواه' },
  'نمیخوا': { colloquialStem: 'نمیخوا', formalPresStem: 'نمی‌خواه' },
  'بخوا': { colloquialStem: 'بخوا', formalPresStem: 'بخواه' },
  'نخوا': { colloquialStem: 'نخوا', formalPresStem: 'نخواه' },

  // ماندن
  'می‌مون': { colloquialStem: 'می‌مون', formalPresStem: 'می‌مان' },
  'میمون': { colloquialStem: 'میمون', formalPresStem: 'می‌مان' },
  'نمی‌مون': { colloquialStem: 'نمی‌مون', formalPresStem: 'نمی‌مان' },
  'نمیمون': { colloquialStem: 'نمیمون', formalPresStem: 'نمی‌مان' },
  'بمون': { colloquialStem: 'بمون', formalPresStem: 'بمان' },

  // خواندن
  'می‌خون': { colloquialStem: 'می‌خون', formalPresStem: 'می‌خوان' },
  'میخون': { colloquialStem: 'میخون', formalPresStem: 'می‌خوان' },
  'نمی‌خون': { colloquialStem: 'نمی‌خون', formalPresStem: 'نمی‌خوان' },
  'نمیخون': { colloquialStem: 'نمیخون', formalPresStem: 'نمی‌خوان' },
  'بخون': { colloquialStem: 'بخون', formalPresStem: 'بخوان' },

  // نشستن
  'می‌شین': { colloquialStem: 'می‌شین', formalPresStem: 'می‌نشین' },
  'میشین': { colloquialStem: 'میشین', formalPresStem: 'می‌نشین' },
  'بشین': { colloquialStem: 'بشین', formalPresStem: 'بنشین' },

  // خوابیدن
  'می‌خواب': { colloquialStem: 'می‌خواب', formalPresStem: 'می‌خواب' },
  'میخواب': { colloquialStem: 'میخواب', formalPresStem: 'می‌خواب' },
  'می‌خاب': { colloquialStem: 'می‌خاب', formalPresStem: 'می‌خواب' },
  'میخاب': { colloquialStem: 'میخاب', formalPresStem: 'می‌خواب' },
};

/**
 * استثناهای قطعی واژگانی که به «ـون» یا «ـوم» ختم می‌شوند ولی نباید به «ـان» یا «ـام» تغییر یابند.
 */
const PHONOLOGY_EXCEPTIONS = new Set([
  'قانون', 'صابون', 'میمون', 'زیتون', 'کارتون', 'بوقلمون', 'هارمون', 'دکمه', 'پالتو',
  'جیحون', 'سیحون', 'مجنون', 'قارون', 'هامون', 'مدفون', 'کانون', 'شبیخون', 'مکنون',
  'ممنون', 'مفتون', 'مطعون', 'شگون', 'ستون', 'گردون', 'دگرگون', 'واژگون', 'فریدون',
  'افلاطون', 'ناپلئون', 'تلویزیون', 'بتون', 'کامیون', 'میلیون', 'بیلیون', 'تریلیون',
  'قهرمان', 'پهلوان', 'قلیون', 'باطوم', 'باتوم', 'هرمون', 'کودکستان', 'بوستان', 'گلستان'
]);

/**
 * نگاشت مستقیم کلمات با واج‌شناسی محاوره‌ای (ان -> اون، ام -> اوم)
 */
const CANONICAL_PHONOLOGY_MAP: Record<string, string> = {
  'تهرون': 'تهران',
  'خونه': 'خانه',
  'خیابون': 'خیابان',
  'مهمون': 'مهمان',
  'نون': 'نان',
  'زبون': 'زبان',
  'جوون': 'جوان',
  'بارون': 'باران',
  'آسمون': 'آسمان',
  'گرون': 'گران',
  'ارزون': 'ارزان',
  'دندون': 'دندان',
  'چمدون': 'چمدان',
  'گلدون': 'گلدان',
  'داغون': 'داغان',
  'زندون': 'زندان',
  'رمضون': 'رمضان',
  'پنهون': 'پنهان',
  'درمون': 'درمان',
  'پشیمون': 'پشیمان',
  'سامون': 'سامان',
  'فراوون': 'فراوان',
  'دکون': 'دکان',
  'نشون': 'نشان',
  'تکون': 'تکان',
  'امکون': 'امکان',
  'روون': 'روان',
  'آروم': 'آرام',
  'بادوم': 'بادام',
  'پشت‌بوم': 'پشت‌بام',
  'دوماد': 'داماد',
  'کدوم': 'کدام',
  'تموم': 'تمام',
  'حموم': 'حمام',
  'آروم‌آروم': 'آرام‌آرام',
  'آسه': 'آهسته',
  'بفرمون': 'بفرمایید',
  'نمیدونم': 'نمی‌دانم',
  'نمیدونی': 'نمی‌دانی',
  'نمیدونه': 'نمی‌داند',
  'نمیدونیم': 'نمی‌دانیم',
  'نمیدونین': 'نمی‌دانید',
  'نمیدونن': 'نمی‌دانند',
};

/**
 * الگوهای تبدیل لحن محاوره‌ای به نگارش رسمی و مکاتبات اداری
 */
const ADMINISTRATIVE_REGISTER_RULES: { pattern: RegExp; replace: string; originalExample: string }[] = [
  // درخواست‌های امری عامیانه
  {
    pattern: new RegExp(`${B_PRE}(?:بهم|به من)\\s+(?:بگو|بگید)${B_POST}`, 'gu'),
    replace: 'مراتب را به این‌جانب اعلام فرمایید',
    originalExample: 'بهم بگو'
  },
  {
    pattern: new RegExp(`${B_PRE}(?:زودتر|سریعتر)\\s+(?:بفرست|بفرستید|ارسال کنید)${B_POST}`, 'gu'),
    replace: 'خواهشمند است در اسرع وقت ارسال فرمایید',
    originalExample: 'زودتر بفرستید'
  },
  {
    pattern: new RegExp(`${B_PRE}(?:باید|لازمه)\\s+(?:این کار|کار)\\s+(?:انجام بشه|بشه)${B_POST}`, 'gu'),
    replace: 'مقتضی است اقدام لازم در این خصوص مبذول گردد',
    originalExample: 'باید انجام بشه'
  },
  {
    pattern: new RegExp(`${B_PRE}پیگیریش\\s+کن(?:ید)?${B_POST}`, 'gu'),
    replace: 'نسبت به پیگیری موضوع اقدام فرمایید',
    originalExample: 'پیگیریش کن'
  },
  {
    pattern: new RegExp(`${B_PRE}حلش\\s+کن(?:ید)?${B_POST}`, 'gu'),
    replace: 'نسبت به تعیین تکلیف و حل موضوع اقدام فرمایید',
    originalExample: 'حلش کن'
  },
  {
    pattern: new RegExp(`${B_PRE}دستت\\s+درد\\s+نکنه${B_POST}`, 'gu'),
    replace: 'از زحمات جنابعالی کمال تشکر را دارم',
    originalExample: 'دستت درد نکنه'
  },
  {
    pattern: new RegExp(`${B_PRE}(?:خیلی\\s+ممنون|مرسی)${B_POST}`, 'gu'),
    replace: 'با کمال تشکر و احترام',
    originalExample: 'خیلی ممنون'
  },
  {
    pattern: new RegExp(`${B_PRE}سلام\\s+خسته\\s+نباشید${B_POST}`, 'gu'),
    replace: 'با سلام و احترام',
    originalExample: 'سلام خسته نباشید'
  },
  {
    pattern: new RegExp(`${B_PRE}به\\s+امید\\s+دیدار${B_POST}`, 'gu'),
    replace: 'با تجدید احترام',
    originalExample: 'به امید دیدار'
  },
  {
    pattern: new RegExp(`${B_PRE}یادم\\s+رفت${B_POST}`, 'gu'),
    replace: 'از خاطر این‌جانب رفت',
    originalExample: 'یادم رفت'
  },
  {
    pattern: new RegExp(`${B_PRE}فرستادم${B_POST}`, 'gu'),
    replace: 'ارسال گردید',
    originalExample: 'فرستادم'
  },
];

/**
 * تبدیل کلمات چسبیده یا پیوسته پرکاربرد به فرم تفکیک‌شده استاندارد
 */
export const COMPOUND_WORD_SPLIT_MAP: Record<string, string> = {
  'درواقع': 'در واقع',
  'بهعنوان': 'به عنوان',
  'بدینترتیب': 'بدین ترتیب',
  'آندسته': 'آن دسته',
  'ازاینرو': 'از این رو',
  'برایناساس': 'بر این اساس',
  'بهدلیل': 'به دلیل',
  'بهمنظور': 'به منظور',
  'برخلاف': 'بر خلاف',
  'بینالمللی': `بین${ZWNJ}المللی`,
  'فوقالعاده': `فوق${ZWNJ}العاده`,
  'عکسالعمل': `عکس${ZWNJ}العمل`,
  'سوءتفاهم': `سوء${ZWNJ}تفاهم`,
  'پیشنویس': `پیش${ZWNJ}نویس`,
  'آییننامه': `آیین${ZWNJ}نامه`,
  'اساسنامه': `اساسنامه`,
};

/**
 * کلاس اصلی موتور ارتقای لحن و رسمیت
 */
export class PersianColloquialEngine {
  /**
   * تبدیل جامع متن محاوره‌ای به رسمی
   */
  public static convertToFormal(text: string): FormalityConversionResult {
    if (!text || typeof text !== 'string') {
      return { convertedText: text || '', replacementsCount: 0, details: [] };
    }

    let result = text;
    const details: FormalityConversionResult['details'] = [];

    // ۱. تبدیل واژگان و عبارات مکاتبات اداری
    for (const rule of ADMINISTRATIVE_REGISTER_RULES) {
      if (rule.pattern.test(result)) {
        result = result.replace(rule.pattern, () => {
          details.push({
            original: rule.originalExample,
            replacement: rule.replace,
            category: 'administrative',
          });
          return rule.replace;
        });
      }
    }

    // ۲. تبدیل کلمات مرکب چسبیده به حالت تفکیک‌شده
    for (const [glued, separated] of Object.entries(COMPOUND_WORD_SPLIT_MAP)) {
      const reg = new RegExp(`${B_PRE}${glued}${B_POST}`, 'gu');
      if (reg.test(result)) {
        result = result.replace(reg, () => {
          details.push({
            original: glued,
            replacement: separated,
            category: 'administrative',
          });
          return separated;
        });
      }
    }

    // ۳. صرف افعال محاوره‌ای به صیغه‌های رسمی معیار
    result = this.conjugateColloquialVerbs(result, details);

    // ۴. تبدیل قواعد واج‌شناسی (ان -> اون، ام -> اوم)
    result = this.convertPhonology(result, details);

    // ۵. ضمایر متصل، نشانه مفعولی «رو» و حروف اضافه
    result = this.convertPronounsAndPrepositions(result, details);

    // ۶. تصحیح خطای کسره اضافه («ه» به جای کسره)
    result = this.fixEzafeErrors(result, details);

    return {
      convertedText: result,
      replacementsCount: details.length,
      details,
    };
  }

  /**
   * صرف افعال محاوره‌ای
   */
  private static conjugateColloquialVerbs(
    text: string,
    details: FormalityConversionResult['details']
  ): string {
    let output = text;

    // الف) بررسی ریشه‌های جدول صرف
    for (const [stemKey, rule] of Object.entries(COMMON_COLLOQUIAL_VERB_STEMS)) {
      // سوم شخص مفرد محاوره‌ای با «ـه» -> «ـد»
      // مثال: میگه -> می‌گوید، میره -> می‌رود، میدونه -> می‌داند
      const reg3rd = new RegExp(`${B_PRE}${stemKey}ه${B_POST}`, 'gu');
      if (reg3rd.test(output)) {
        const formal3rd = this.getFormal3rdPerson(stemKey, rule.formalPresStem);
        output = output.replace(reg3rd, (match) => {
          details.push({ original: match, replacement: formal3rd, category: 'verb' });
          return formal3rd;
        });
      }

      // دوم شخص جمع محاوره‌ای با «ـین» -> «ـید»
      // مثال: میگین -> می‌گویید، میرین -> می‌روید، میدونین -> می‌دانید
      const reg2ndPlural = new RegExp(`${B_PRE}${stemKey}ین${B_POST}`, 'gu');
      if (reg2ndPlural.test(output)) {
        const formal2ndPlural = this.getFormal2ndPlural(stemKey, rule.formalPresStem);
        output = output.replace(reg2ndPlural, (match) => {
          details.push({ original: match, replacement: formal2ndPlural, category: 'verb' });
          return formal2ndPlural;
        });
      }

      // سوم شخص جمع محاوره‌ای با «ـن» -> «ـند»
      // مثال: میگن -> می‌گویند، میرن -> می‌روند، میدونن -> می‌دانند
      const reg3rdPlural = new RegExp(`${B_PRE}${stemKey}ن${B_POST}`, 'gu');
      if (reg3rdPlural.test(output)) {
        const formal3rdPlural = this.getFormal3rdPlural(stemKey, rule.formalPresStem);
        output = output.replace(reg3rdPlural, (match) => {
          details.push({ original: match, replacement: formal3rdPlural, category: 'verb' });
          return formal3rdPlural;
        });
      }

      // اول شخص مفرد محاوره‌ای
      // مثال: میگم -> می‌گویم، میرم -> می‌روم
      const reg1stSingular = new RegExp(`${B_PRE}${stemKey}م${B_POST}`, 'gu');
      if (reg1stSingular.test(output)) {
        const formal1stSingular = this.getFormal1stSingular(stemKey, rule.formalPresStem);
        output = output.replace(reg1stSingular, (match) => {
          details.push({ original: match, replacement: formal1stSingular, category: 'verb' });
          return formal1stSingular;
        });
      }
    }

    // ب) اصلاح خاص افعال استمراری با «داشتن»
    // مثال: داشتم می‌رفتم -> در حال رفتن بودم
    const progressiveReg = new RegExp(
      `${B_PRE}(داشتم|داشتی|داشت|داشتیم|داشتید|داشتند)\\s+(می‌|می)(رفتم|رفتی|رفت|رفتیم|رفتید|رفتند)${B_POST}`,
      'gu'
    );
    output = output.replace(progressiveReg, (match: string, aux: string) => {
      const pastEndingMap: Record<string, string> = {
        'داشتم': 'بودم',
        'داشتی': 'بودید',
        'داشت': 'بود',
        'داشتیم': 'بودیم',
        'داشتید': 'بودید',
        'داشتند': 'بودند',
      };
      const rep = `در حال رفتن ${pastEndingMap[aux] || 'بود'}`;
      details.push({ original: match, replacement: rep, category: 'verb' });
      return rep;
    });

    // ج) تبدیل فعل عامیانه «میان / میاد / میام»
    const mianReg = new RegExp(
      `${B_PRE}(دارن|دارند|داره|داشتن|داشتند|کی|وقتی|الان|تازه|اونا|آن‌ها)\\s+میان${B_POST}`,
      'gu'
    );
    output = output.replace(mianReg, (_m, aux) => {
      const rep = `${aux} می‌آیند`;
      details.push({ original: `${aux} میان`, replacement: rep, category: 'verb' });
      return rep;
    });

    const miadReg = new RegExp(`${B_PRE}(میاد|نمیاد|بیاد|نیاد)${B_POST}`, 'gu');
    output = output.replace(miadReg, (match) => {
      let rep = 'می‌آید';
      if (match === 'نمیاد') rep = 'نمی‌آید';
      if (match === 'بیاد') rep = 'بیاید';
      if (match === 'نیاد') rep = 'نیاید';
      details.push({ original: match, replacement: rep, category: 'verb' });
      return rep;
    });

    return output;
  }

  private static getFormal3rdPerson(stemKey: string, formalPresStem: string): string {
    const isNegative = stemKey.startsWith('ن');
    const isSubjunctive = stemKey.startsWith('ب');
    if (stemKey.includes('خوا')) return isNegative ? 'نمی‌خواهد' : (isSubjunctive ? 'بخواهد' : 'می‌خواهد');
    if (stemKey.includes('گ')) return isNegative ? 'نمی‌گوید' : (isSubjunctive ? 'بگوید' : 'می‌گوید');
    if (stemKey.includes('ر')) return isNegative ? 'نمی‌رود' : (isSubjunctive ? 'برود' : 'می‌رود');
    if (stemKey.includes('د') && !stemKey.includes('دید') && !stemKey.includes('دون')) {
      return isNegative ? 'نمی‌دهد' : (isSubjunctive ? 'بدهد' : 'می‌دهد');
    }
    if (stemKey.includes('ش') && !stemKey.includes('شناس') && !stemKey.includes('شین')) {
      return isNegative ? 'نمی‌شود' : (isSubjunctive ? 'بشود' : 'می‌شود');
    }
    if (stemKey.includes('آ') || stemKey.includes('ا')) {
      if (isNegative) return 'نمی‌آید';
      if (isSubjunctive) return 'بیاید';
      return 'می‌آید';
    }
    return `${formalPresStem}د`;
  }

  private static getFormal2ndPlural(stemKey: string, formalPresStem: string): string {
    const isNegative = stemKey.startsWith('ن');
    const isSubjunctive = stemKey.startsWith('ب');
    if (stemKey.includes('خوا')) return isNegative ? 'نمی‌خواهید' : (isSubjunctive ? 'بخواهید' : 'می‌خواهید');
    if (stemKey.includes('گ')) return isNegative ? 'نمی‌گویید' : (isSubjunctive ? 'بگویید' : 'می‌گویید');
    if (stemKey.includes('ر')) return isNegative ? 'نمی‌روید' : (isSubjunctive ? 'بروید' : 'می‌روید');
    if (stemKey.includes('د') && !stemKey.includes('دید') && !stemKey.includes('دون')) {
      return isNegative ? 'نمی‌دهید' : (isSubjunctive ? 'بدهید' : 'می‌دهید');
    }
    if (stemKey.includes('ش') && !stemKey.includes('شناس') && !stemKey.includes('شین')) {
      return isNegative ? 'نمی‌شوید' : (isSubjunctive ? 'بشوید' : 'می‌شوید');
    }
    if (stemKey.includes('آ') || stemKey.includes('ا')) {
      if (isNegative) return 'نمی‌آیید';
      if (isSubjunctive) return 'بیایید';
      return 'می‌آیید';
    }
    return `${formalPresStem}ید`;
  }

  private static getFormal3rdPlural(stemKey: string, formalPresStem: string): string {
    const isNegative = stemKey.startsWith('ن');
    const isSubjunctive = stemKey.startsWith('ب');
    if (stemKey.includes('خوا')) return isNegative ? 'نمی‌خواهند' : (isSubjunctive ? 'بخواهند' : 'می‌خواهند');
    if (stemKey.includes('گ')) return isNegative ? 'نمی‌گویند' : (isSubjunctive ? 'بگویند' : 'می‌گویند');
    if (stemKey.includes('ر')) return isNegative ? 'نمی‌روند' : (isSubjunctive ? 'بروند' : 'می‌روند');
    if (stemKey.includes('د') && !stemKey.includes('دید') && !stemKey.includes('دون')) {
      return isNegative ? 'نمی‌دهند' : (isSubjunctive ? 'بدهند' : 'می‌دهند');
    }
    if (stemKey.includes('ش') && !stemKey.includes('شناس') && !stemKey.includes('شین')) {
      return isNegative ? 'نمی‌شوند' : (isSubjunctive ? 'بشوند' : 'می‌شوند');
    }
    if (stemKey.includes('آ') || stemKey.includes('ا')) {
      if (isNegative) return 'نمی‌آیند';
      if (isSubjunctive) return 'بیایند';
      return 'می‌آیند';
    }
    return `${formalPresStem}ند`;
  }

  private static getFormal1stSingular(stemKey: string, formalPresStem: string): string {
    const isNegative = stemKey.startsWith('ن');
    const isSubjunctive = stemKey.startsWith('ب');
    if (stemKey.includes('خوا')) return isNegative ? 'نمی‌خواهم' : (isSubjunctive ? 'بخواهم' : 'می‌خواهم');
    if (stemKey.includes('گ')) return isNegative ? 'نمی‌گویم' : (isSubjunctive ? 'بگویم' : 'می‌گویم');
    if (stemKey.includes('ر')) return isNegative ? 'نمی‌روم' : (isSubjunctive ? 'بروم' : 'می‌روم');
    if (stemKey.includes('د') && !stemKey.includes('دید') && !stemKey.includes('دون')) {
      return isNegative ? 'نمی‌دهم' : (isSubjunctive ? 'بدهم' : 'می‌دهم');
    }
    if (stemKey.includes('ش') && !stemKey.includes('شناس') && !stemKey.includes('شین')) {
      return isNegative ? 'نمی‌شوم' : (isSubjunctive ? 'بشوم' : 'می‌شوم');
    }
    if (stemKey.includes('آ') || stemKey.includes('ا')) {
      if (isNegative) return 'نمی‌آیم';
      if (isSubjunctive) return 'بیایم';
      return 'می‌آیم';
    }
    return `${formalPresStem}م`;
  }

  /**
   * تبدیل قواعد واج‌شناسی محاوره‌ای (ان -> اون، ام -> اوم)
   */
  private static convertPhonology(
    text: string,
    details: FormalityConversionResult['details']
  ): string {
    let output = text;

    // نگاشت کلمات مشخص
    for (const [colloq, formal] of Object.entries(CANONICAL_PHONOLOGY_MAP)) {
      const reg = new RegExp(`${B_PRE}${colloq}${B_POST}`, 'gu');
      if (reg.test(output)) {
        output = output.replace(reg, () => {
          details.push({ original: colloq, replacement: formal, category: 'phonology' });
          return formal;
        });
      }
    }

    // تبدیل کلمات دارای «ـون» به «ـان» به شرطی که در لیست استثناها نباشند
    const generalOonReg = new RegExp(`${B_PRE}([آ-ی]{2,})ون${B_POST}`, 'gu');
    output = output.replace(generalOonReg, (match, prefix) => {
      if (PHONOLOGY_EXCEPTIONS.has(match) || CANONICAL_PHONOLOGY_MAP[match]) {
        return match;
      }
      // کلماتی که با «ون» ساخته شده‌اند
      const formal = `${prefix}ان`;
      details.push({ original: match, replacement: formal, category: 'phonology' });
      return formal;
    });

    return output;
  }

  /**
   * تبدیل ضمایر و حروف اضافه
   */
  private static convertPronounsAndPrepositions(
    text: string,
    details: FormalityConversionResult['details']
  ): string {
    let output = text;

    // نشانه مفعولی عامیانه «رو» -> «را»
    // به جز استثناهای کلماتی مثل «پیش‌رو»، «رو به رو»
    const roReg = new RegExp(`([آ-ی0-9]{2,})\\s+رو${B_POST}`, 'gu');
    output = output.replace(roReg, (match: string, word: string) => {
      const excludedWords = ['پیش', 'روبه‌', 'دست‌به', 'سر', 'پیش‌رو', 'رو', 'به'];
      if (excludedWords.includes(word)) return match;
      const rep = `${word} را`;
      details.push({ original: match, replacement: rep, category: 'pronoun' });
      return rep;
    });

    // ضمایر متصل با «و» مفعولی: تونو -> تان را، مونو -> مان را، شونو -> شان را
    const tonoReg = new RegExp(`([آ-ی]{2,})‌?تونو${B_POST}`, 'gu');
    output = output.replace(tonoReg, (match: string, base: string) => {
      const rep = `${base}${ZWNJ}تان را`;
      details.push({ original: match, replacement: rep, category: 'pronoun' });
      return rep;
    });

    const monoReg = new RegExp(`([آ-ی]{2,})‌?مونو${B_POST}`, 'gu');
    output = output.replace(monoReg, (match: string, base: string) => {
      const rep = `${base}${ZWNJ}مان را`;
      details.push({ original: match, replacement: rep, category: 'pronoun' });
      return rep;
    });

    const shonoReg = new RegExp(`([آ-ی]{2,})‌?شونو${B_POST}`, 'gu');
    output = output.replace(shonoReg, (match: string, base: string) => {
      const rep = `${base}${ZWNJ}شان را`;
      details.push({ original: match, replacement: rep, category: 'pronoun' });
      return rep;
    });

    // حرف اضافه عامیانه «واسه» -> «برای»
    const vaseReg = new RegExp(`${B_PRE}واسه(?:ی)?\\s+`, 'gu');
    output = output.replace(vaseReg, (match: string) => {
      details.push({ original: match.trim(), replacement: 'برای', category: 'pronoun' });
      return 'برای ';
    });

    // حرف اضافه عامیانه «تو / توی» -> «در»
    const toReg = new RegExp(
      `${B_PRE}(توی?)\\s+(خانه|خونه|جلسه|اتاق|اداره|سایت|دانشگاه|خیابان|مدرسه|کلاس|بیمارستان|شرکت|دفتر|مسیر|راه|سامانه|سیستم|فایل|پروژه|ماشین)${B_POST}`,
      'gu'
    );
    output = output.replace(toReg, (match: string, _prep: string, noun: string) => {
      const formalNoun = noun === 'خونه' ? 'خانه' : noun;
      const rep = `در ${formalNoun}`;
      details.push({ original: match, replacement: rep, category: 'pronoun' });
      return rep;
    });

    return output;
  }

  /**
   * تصحیح خطای شایع کسره اضافه («ه» به جای کسره)
   * مثال: کتابه من -> کتابِ من، حاله خوب -> حالِ خوب
   */
  private static fixEzafeErrors(
    text: string,
    details: FormalityConversionResult['details']
  ): string {
    let output = text;

    // تشخیص کلمات اسم/صفت که اشتباهاً با «ه» به عنوان کسره نوشته شده‌اند قبل از ضمیر متصل/منفصل
    // الگو: [کلمه غیرمختوم به های بیان حرکت] + ه + [من|تو|او|ما|شما|آن‌ها|این|آن|خوب|بد|قبل|بعد]
    const ezafeReg = new RegExp(
      `${B_PRE}(کتاب|حال|سایت|روز|دستور|سال|کار|درد|کیف|قلم|میز|شهر|کشور|اتاق|کلاس|فایل|متن|فیلم|لباس|صدای)ه\\s+(من|تو|او|ما|شما|ایشان|آن‌ها|این|آن|خوب|بد|قبل|بعد)${B_POST}`,
      'gu'
    );

    output = output.replace(ezafeReg, (match: string, noun: string, follower: string) => {
      const rep = `${noun}ِ ${follower}`;
      details.push({ original: match, replacement: rep, category: 'ezafe' });
      return rep;
    });

    return output;
  }
}
