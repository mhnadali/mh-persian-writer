/**
 * موتور غلط‌یابی بافتاری و تمایز کلمات هم‌آوا در زبان فارسی
 * Context-Aware Persian Spelling & Homophone Disambiguation Engine
 *
 * قابلیت‌ها:
 * ۱. شناسایی غلط‌های بافتاری در کلماتی که به خودی خود در لغت‌نامه وجود دارند اما در بافتار جمله غلط هستند.
 * ۲. تشخیص جفت‌های هم‌آوای چالش‌برانگیز (حیات/حیاط، صلاح/سلاح، اساس/اثاث، خواست/خاست و...)
 * ۳. تحلیل هم‌نشینی کلمات (Collocation Bigrams/Trigrams)
 *
 * @module contextual-spell
 * @author M.H. Nadali
 */

import { tokenizeWords } from './tokenizer';

export interface ContextualSpellIssue {
  originalWord: string;
  suggestedWord: string;
  contextPhrase: string;
  position: number;
  explanation: string;
}

interface CollocationRule {
  targetWords: string[]; // کلماتی که ممکن است به اشتباه به جای هم به کار روند
  triggers: {
    correctWord: string;
    collocates: string[]; // کلمات هم‌نشین قبل یا بعد
    explanation: string;
  }[];
}

const COLLOCATION_RULES: CollocationRule[] = [
  // ۱. حیات (زندگی و زیست) در برابر حیاط (محوطه و صحن)
  {
    targetWords: ['حیات', 'حیاط'],
    triggers: [
      {
        correctWord: 'حیاط',
        collocates: ['خلوت', 'خانه', 'خونه', 'مدرسه', 'پشتی', 'بزرگ', 'کوچک', 'صحن', 'باغچه', 'کف', 'دیوار'],
        explanation: 'برای محوطه باز ساختمان، نگارش صحیح «حیاط» (با ط) است.',
      },
      {
        correctWord: 'حیات',
        collocates: ['وحش', 'طیبه', 'انسان', 'طول', 'آب', 'قید', 'ابدی', 'ممات', 'محیط', 'زیست'],
        explanation: 'به معنای زیستن و زندگی، نگارش صحیح «حیات» (با ت) است.',
      },
    ],
  },

  // ۲. صلاح (مصلحت و درستی) در برابر سلاح (ابزار جنگ)
  {
    targetWords: ['صلاح', 'سلاح'],
    triggers: [
      {
        correctWord: 'سلاح',
        collocates: ['سرد', 'گرم', 'حمل', 'انبار', 'جنگی', 'کشتار', 'میکروبی', 'شیمیایی', 'هسته‌ای', 'مسلح', 'تجهیزات'],
        explanation: 'به معنای ابزار نبرد و جنگ‌افزار، نگارش صحیح «سلاح» (با س) است.',
      },
      {
        correctWord: 'صلاح',
        collocates: ['دید', 'مملکت', 'خیر', 'مصلحت', 'مشورت', 'جامعه', 'کار', 'امر', 'صلاح‌دید'],
        explanation: 'به معنای درستی، شایستگی و مصلحت، نگارش صحیح «صلاح» (با ص) است.',
      },
    ],
  },

  // ۳. اساس (پایه، بنیان) در برابر اثاث (لوازم و اسباب منزل)
  {
    targetWords: ['اساس', 'اثاث'],
    triggers: [
      {
        correctWord: 'اثاث',
        collocates: ['کشی', 'منزل', 'خانه', 'لوازم', 'اثاثیه', 'اسباب', 'باربری', 'کامیون', 'بسته‌بندی'],
        explanation: 'به معنای لوازم و اثاثیه منزل، نگارش صحیح «اثاث» (با ث) است.',
      },
      {
        correctWord: 'اساس',
        collocates: ['بر', 'قانون', 'بنیان', 'پایه', 'اصول', 'مبنا', 'منطق', 'تئوری', 'نظریه', 'اساسنامه'],
        explanation: 'به معنای پایه، مبنا و بنیاد، نگارش صحیح «اساس» (با س) است.',
      },
    ],
  },

  // ۴. صواب (درست، بجا) در برابر ثواب (پاداش اخروی)
  {
    targetWords: ['صواب', 'ثواب'],
    triggers: [
      {
        correctWord: 'ثواب',
        collocates: ['اجر', 'اخروی', 'آخرت', 'خداوند', 'الهی', 'نیکوکاری', 'صدقه', 'زیارت', 'نماز'],
        explanation: 'به معنای پاداش کار نیک نزد خداوند، نگارش صحیح «ثواب» (با ث) است.',
      },
      {
        correctWord: 'صواب',
        collocates: ['کار', 'ناصواب', 'رای', 'رأی', 'دیدگاه', 'عقل', 'حکمت', 'خطا'],
        explanation: 'به معنای درست و مقابل خطا، نگارش صحیح «صواب» (با ص) است.',
      },
    ],
  },

  // ۵. خواست (میل و اراده) در برابر خاست (برخاستن و بلند شدن)
  {
    targetWords: ['خواست', 'خاست'],
    triggers: [
      {
        correctWord: 'خواست',
        collocates: ['خدا', 'اراده', 'میل', 'خواسته', 'مطالبه', 'مردم', 'قلبی', 'خودش', 'خود'],
        explanation: 'به معنای اراده و تمایل، نگارش صحیح «خواست» (با و معدوله) است.',
      },
      {
        correctWord: 'خاست',
        collocates: ['بر', 'بلند', 'پا', 'جا', 'برخاست', 'خاستگاه', 'فغان', 'آواز'],
        explanation: 'از مصدر خاستن به معنای برخاستن و بلند شدن، نگارش صحیح «خاست» است.',
      },
    ],
  },

  // ۶. قالب (شکل، چهارچوب) در برابر غالب (اکثر، چیره)
  {
    targetWords: ['قالب', 'غالب'],
    triggers: [
      {
        correctWord: 'غالب',
        collocates: ['موارد', 'اوقات', 'اکثر', 'چیره', 'پیروز', 'مردم', 'مواقع', 'جامعه'],
        explanation: 'به معنای چیره یا اکثریت موارد، نگارش صحیح «غالب» (با غ) است.',
      },
      {
        correctWord: 'قالب',
        collocates: ['سایت', 'کیک', 'چهارچوب', 'ریخته‌گری', 'محتوا', 'فرمت', 'شکل', 'ظرف'],
        explanation: 'به معنای کالبد، شکل یا ساختار، نگارش صحیح «قالب» (با ق) است.',
      },
    ],
  },

  // ۷. خوار (ذلیل، پست، خوراکی) در برابر خار (تیغ گل)
  {
    targetWords: ['خوار', 'خار'],
    triggers: [
      {
        correctWord: 'خار',
        collocates: ['گل', 'مغیلان', 'بیابان', 'تیغ', 'چشم', 'پای', 'خارپشت', 'بوته'],
        explanation: 'به معنای تیغ گیاهان، نگارش صحیح «خار» است.',
      },
      {
        correctWord: 'خوار',
        collocates: ['ذلیل', 'بار', 'خواروبار', 'شمردن', 'حقیر', 'پست', 'خواربار'],
        explanation: 'به معنای زبون، خفیف یا خوراکی (خواربار)، نگارش صحیح «خوار» (با واو) است.',
      },
    ],
  },
];

/**
 * بررسی خطاهای بافتاری کلمات هم‌آوا در یک جمله یا بند متن
 */
export function checkContextualSpelling(text: string): ContextualSpellIssue[] {
  if (!text || text.length < 3) return [];

  const issues: ContextualSpellIssue[] = [];
  const tokenResult = tokenizeWords(text, { keepPunctuation: false, keepNumbers: false });
  const words = tokenResult.tokens;

  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];

    for (const rule of COLLOCATION_RULES) {
      if (rule.targetWords.includes(currentWord)) {
        // بازه هم‌نشینی: ۲ کلمه قبل و ۲ کلمه بعد
        const windowWords = [
          words[i - 2] || '',
          words[i - 1] || '',
          words[i + 1] || '',
          words[i + 2] || '',
        ].filter(Boolean);

        for (const trigger of rule.triggers) {
          if (trigger.correctWord === currentWord) continue;

          // بررسی حضور یکی از کلمات هم‌نشین
          const hasCollocate = trigger.collocates.some(c =>
            windowWords.some(w => w === c || w.includes(c))
          );

          if (hasCollocate) {
            const pos = text.indexOf(currentWord);
            issues.push({
              originalWord: currentWord,
              suggestedWord: trigger.correctWord,
              contextPhrase: windowWords.join(' '),
              position: pos !== -1 ? pos : 0,
              explanation: trigger.explanation,
            });
            break;
          }
        }
      }
    }
  }

  return issues;
}
