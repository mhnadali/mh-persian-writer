/**
 * ماژول پیشرفته بررسی و ارتقای رسمیت و لحن نوشتار فارسی
 * Advanced Context-Aware Persian Formality & Administrative Writing Engine
 *
 * @module formal-writer
 * @author M.H. Nadali
 */

import { 
  FormalityCheckResult, 
  FormalityIssue, 
  LetterType, 
  FormalLetterParts,
  FormalityLevel,
  FormalityMode,
  FormalityOptions 
} from './types';
import { 
  INFORMAL_TO_FORMAL_MAP, 
  LETTER_TEMPLATES,
  ZWNJ
} from './constants';

const B_PRE = '(?<=^|[\\s،؛.!?؟()«»"\'\\[\\]{}:–—-])';
const B_POST = '(?=[\\s،؛.!?؟()«»"\'\\[\\]{}:–—-]|$)' ;

interface ContextualRule {
  pattern: RegExp;
  replace: (match: string, ...args: any[]) => string;
  suggestionMessage?: (match: string, replacement: string) => string;
  type?: 'informal_word' | 'colloquial_verb' | 'spacing' | 'structure';
  severity?: 'low' | 'medium' | 'high';
  modes?: FormalityMode[];
}

/** الگوهای تحلیل بافتار و ساختار نحوی (n-gram & syntactic patterns) */
const CONTEXTUAL_RULES: ContextualRule[] = [
  // ۱. افعال استمراری محاوره‌ای با «داشتن» (داشتم می‌رفتم -> در حال رفتن بودم)
  {
    pattern: new RegExp(`${B_PRE}(داشتم|داشتی|داشت|داشتیم|داشتید|داشتند)\\s+(می‌|می)(رفتم|رفتی|رفت|رفتیم|رفتید|رفتند)${B_POST}`, 'gu'),
    replace: (_m, aux) => {
      const pastEndingMap: Record<string, string> = {
        'داشتم': 'بودم',
        'داشتی': 'بودید',
        'داشت': 'بود',
        'داشتیم': 'بودیم',
        'داشتید': 'بودید',
        'داشتند': 'بودند'
      };
      const auxEnding = pastEndingMap[aux] || 'بود';
      return `در حال رفتن ${auxEnding}`;
    },
    suggestionMessage: (m, r) => `به جای ساختار عامیانه «${m}» از عبارت رسمی «${r}» استفاده کنید.`,
    type: 'colloquial_verb',
    severity: 'high'
  },
  {
    pattern: new RegExp(`${B_PRE}(داشتم|داشتی|داشت|داشتیم|داشتید|داشتند)\\s+(می‌|می)(گفتم|گفتی|گفت|گفتیم|گفتید|گفتند)${B_POST}`, 'gu'),
    replace: (_m, aux) => {
      const pastEndingMap: Record<string, string> = {
        'داشتم': 'بودم',
        'داشتی': 'بودید',
        'داشت': 'بود',
        'داشتیم': 'بودیم',
        'داشتید': 'بودید',
        'داشتند': 'بودند'
      };
      const auxEnding = pastEndingMap[aux] || 'بود';
      return `در حال گفتن ${auxEnding}`;
    },
    suggestionMessage: (m, r) => `به جای ساختار عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'colloquial_verb',
    severity: 'high'
  },
  {
    pattern: new RegExp(`${B_PRE}(داشتم|داشتی|داشت|داشتیم|داشتید|داشتند)\\s+(می‌|می)(نوشتم|نوشتی|نوشت|نوشتیم|نوشتید|نوشتند)${B_POST}`, 'gu'),
    replace: (_m, aux) => {
      const pastEndingMap: Record<string, string> = {
        'داشتم': 'بودم',
        'داشتی': 'بودید',
        'داشت': 'بود',
        'داشتیم': 'بودیم',
        'داشتید': 'بودید',
        'داشتند': 'بودند'
      };
      const auxEnding = pastEndingMap[aux] || 'بود';
      return `در حال نگارش ${auxEnding}`;
    },
    suggestionMessage: (m, r) => `به جای ساختار عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'colloquial_verb',
    severity: 'high'
  },

  // ۲. تمایز هوشمند کلمه «میان»: فعل محاوره‌ای «دارن میان» در برابر حرف اضافه «میان»
  {
    pattern: new RegExp(`${B_PRE}(دارن|دارند|داره|داشتن|داشتند|کی|وقتی|الان|تازه)\\s+(میان)${B_POST}`, 'gu'),
    replace: (_m, aux) => {
      if (aux === 'داره') return `${aux} می‌آید`;
      if (aux === 'دارن' || aux === 'دارند') return 'می‌آیند';
      return `${aux} می‌آیند`;
    },
    suggestionMessage: (m, r) => `به جای ساختار محاوره‌ای «${m}» از «${r}» استفاده کنید.`,
    type: 'colloquial_verb',
    severity: 'high'
  },

  // ۳. تمایز کلمه «تو» به عنوان حرف اضافه عامیانه در برابر ضمیر
  {
    pattern: new RegExp(`${B_PRE}(توی?)\\s+(ماشین|خانه|خونه|جلسه|اتاق|اداره|سایت|دانشگاه|خیابان|مدرسه|کلاس|بیمارستان|شرکت|دفتر|مسیر|راه|سامانه|سیستم|فایل|پروژه)${B_POST}`, 'gu'),
    replace: (_m, _prep, noun) => {
      const formalNoun = noun === 'خونه' ? 'خانه' : noun;
      return `در ${formalNoun}`;
    },
    suggestionMessage: (m, r) => `به جای حرف اضافه عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },

  // ۴. نشانه مفعولی عامیانه «رو» پس از کلمات
  {
    pattern: new RegExp(`([آ-ی0-9]+)\\s+رو${B_POST}`, 'gu'),
    replace: (match, word) => {
      // استثناهای کلماتی که خودشان با «رو» ترکیب حقیقی دارند
      const excludedWords = ['پیش', 'روبه‌', 'دست‌به', 'سر', 'پیش‌رو', 'رو'];
      if (excludedWords.includes(word)) return match;
      return `${word} را`;
    },
    suggestionMessage: (_m, r) => `به جای نشانه مفعولی عامیانه «رو» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },

  // ۵. اصلاح کلمه محاوره‌ای «خونه» با یا بدون وند
  {
    pattern: new RegExp(`${B_PRE}خونه(?=[‌\\s،؛.!?؟()«»"'\\[\\]{}:–—-]|\$)`, 'gu'),
    replace: () => 'خانه',
    suggestionMessage: (_m, _r) => 'به جای واژه محاوره‌ای «خونه» از «خانه» استفاده کنید.',
    type: 'informal_word',
    severity: 'medium'
  },

  // ۶. ضمایر و نشانه‌های متصل محاوره‌ای با «و» (تونو، مونو، شونو، هامو/امو، هاتو/اتو، هاشو/اشو)
  {
    pattern: new RegExp(`([آ-ی]{2,})‌?تونو${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌تان را`,
    suggestionMessage: (m, r) => `به جای ضمیر متصل عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },
  {
    pattern: new RegExp(`([آ-ی]{2,})‌?مونو${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌مان را`,
    suggestionMessage: (m, r) => `به جای ضمیر متصل عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },
  {
    pattern: new RegExp(`([آ-ی]{2,})‌?شونو${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌شان را`,
    suggestionMessage: (m, r) => `به جای ضمیر متصل عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },
  {
    pattern: new RegExp(`([آ-ی]{2,})‌?(?:هامو|امو)${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌هایم را`,
    suggestionMessage: (m, r) => `به جای ترکیب عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },
  {
    pattern: new RegExp(`([آ-ی]{2,})‌?(?:هاتو|اتو)${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌هایت را`,
    suggestionMessage: (m, r) => `به جای ترکیب عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },
  {
    pattern: new RegExp(`([آ-ی]{2,})‌?(?:هاشو|اشو)${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌هایش را`,
    suggestionMessage: (m, r) => `به جای ترکیب عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },

  // ۷. ضمایر متصل با نیم‌فاصله (‌تون، ‌مون، ‌شون)
  {
    pattern: new RegExp(`([آ-ی]{2,})‌تون${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌تان`,
    suggestionMessage: (m, r) => `به جای ضمیر عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },
  {
    pattern: new RegExp(`([آ-ی]{2,})‌مون${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌مان`,
    suggestionMessage: (m, r) => `به جای ضمیر عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },
  {
    pattern: new RegExp(`([آ-ی]{2,})‌شون${B_POST}`, 'gu'),
    replace: (_m, base) => `${base}‌شان`,
    suggestionMessage: (m, r) => `به جای ضمیر عامیانه «${m}» از «${r}» استفاده کنید.`,
    type: 'informal_word',
    severity: 'medium'
  },

  // ۷. عبارات چندکلمه‌ای پرکاربرد
  {
    pattern: new RegExp(`${B_PRE}حرف\\s+(زدن|زدیم|زدند|بزنیم|بزنید)${B_POST}`, 'gu'),
    replace: (_m, verb) => {
      const verbMap: Record<string, string> = {
        'زدن': 'گفتگو نمودن',
        'زدیم': 'مذاکره نمودیم',
        'زدند': 'مذاکره نمودند',
        'بزنیم': 'گفتگو نماییم',
        'بزنید': 'مذاکره فرمایید'
      };
      return verbMap[verb] || 'گفتگو نمودن';
    },
    suggestionMessage: (m, r) => `به جای «${m}» از عبارت رسمی‌تر «${r}» استفاده فرمایید.`,
    type: 'informal_word',
    severity: 'medium',
    modes: ['administrative', 'academic']
  },
  {
    pattern: new RegExp(`${B_PRE}زنگ\\s+(زدن|زدم|زدیم|زدند|بزنید|بزن)${B_POST}`, 'gu'),
    replace: (_m, verb) => {
      const verbMap: Record<string, string> = {
        'زدن': 'تماس تلفنی حاصل نمودن',
        'زدم': 'تماس حاصل نمودم',
        'زدیم': 'تماس تلفنی برقرار نمودیم',
        'زدند': 'تماس حاصل نمودند',
        'بزنید': 'تماس حاصل فرمایید',
        'بزن': 'تماس حاصل فرمایید'
      };
      return verbMap[verb] || 'تماس حاصل نمودن';
    },
    suggestionMessage: (m, r) => `به جای عبارت محاوره‌ای «${m}» از «${r}» استفاده فرمایید.`,
    type: 'informal_word',
    severity: 'medium',
    modes: ['administrative', 'customer-support']
  }
];

/**
 * بررسی می‌کند که آیا کلمه عامیانه است و معادل رسمی آن را بازمی‌گرداند.
 *
 * @param word واژه مورد بررسی
 * @returns معادل رسمی یا null
 */
export function suggestFormalAlternative(word: string): string | null {
  const normalizedWord = word.trim();
  return INFORMAL_TO_FORMAL_MAP[normalizedWord] || null;
}

/**
 * پویش متن و شناسایی تمامی کلمات و عبارات غیررسمی با در نظر گرفتن بافتار n-gram و ساختار جمله
 *
 * @param text متن ورودی
 * @param options تنظیمات حالت و لحن
 * @returns فهرستی از مشکلات و پیشنهادات اصلاحی
 */
export function detectInformalWords(text: string, options: FormalityOptions = {}): FormalityIssue[] {
  if (!text) return [];
  const { mode = 'administrative' } = options;
  const issues: FormalityIssue[] = [];
  const matchedSpans: Array<{ start: number; end: number }> = [];

  // ۱. بررسی الگوهای بافتاری و چندکلمه‌ای (Contextual & Syntactic Rules)
  for (const rule of CONTEXTUAL_RULES) {
    if (rule.modes && !rule.modes.includes(mode)) {
      continue;
    }

    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const matchedText = match[0];
      const end = start + matchedText.length;

      const overlaps = matchedSpans.some(span =>
        (start >= span.start && start < span.end) || (end > span.start && end <= span.end)
      );

      if (!overlaps) {
        const replacement = rule.replace(matchedText, ...(match.slice(1)));
        if (replacement !== matchedText) {
          matchedSpans.push({ start, end });
          issues.push({
            word: matchedText,
            suggestion: replacement,
            position: start,
            type: rule.type || 'informal_word',
            severity: rule.severity || 'medium'
          });
        }
      }
    }
  }

  // ۲. بررسی واژگانی تک‌کلمه‌ای از واژه‌نامه محاوره به رسمی
  const sortedEntries = Object.entries(INFORMAL_TO_FORMAL_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [informal, formal] of sortedEntries) {
    const escaped = informal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${B_PRE}${escaped}${B_POST}`, 'gu');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + informal.length;

      const overlaps = matchedSpans.some(span => 
        (start >= span.start && start < span.end) || (end > span.start && end <= span.end)
      );

      if (!overlaps) {
        matchedSpans.push({ start, end });
        issues.push({
          word: informal,
          suggestion: formal,
          position: start,
          type: 'informal_word',
          severity: 'medium'
        });
      }
    }
  }

  return issues.sort((a, b) => a.position - b.position);
}

/**
 * محاسبه امتیاز رسمیت متن (بین ۰ تا ۱۰۰)
 *
 * @param text متن ورودی
 * @param options تنظیمات حالت و لحن
 * @returns امتیاز رسمیت
 */
export function calculateFormalityScore(text: string, options: FormalityOptions = {}): number {
  if (!text || text.trim().length === 0) return 100;

  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = Math.max(words.length, 1);
  const issues = detectInformalWords(text, options);

  if (issues.length === 0) {
    let score = 100;
    if (!text.match(/[.!?؟]$/m) && text.length > 20) {
      score -= 5;
    }
    return score;
  }

  let penaltyWeight = 0;
  for (const issue of issues) {
    if (issue.severity === 'high') penaltyWeight += 2;
    else if (issue.severity === 'medium') penaltyWeight += 1.5;
    else penaltyWeight += 1;
  }

  const informalRatio = Math.min(penaltyWeight / totalWords, 1);
  let score = Math.round((1 - informalRatio) * 100);

  if (!text.match(/[.!?؟]$/m) && text.length > 20) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * تحلیل کامل رسمیت متن همراه با پیشنهادات، تصحیحات و امتیاز کیفی
 *
 * @param text متن مورد تحلیل
 * @param options تنظیمات حالت و لحن
 * @returns نتیجه جامع تحلیل رسمیت
 */
export function checkFormality(text: string, options: FormalityOptions = {}): FormalityCheckResult {
  const { checkPunctuation = true } = options;
  const issues = detectInformalWords(text, options);
  const score = calculateFormalityScore(text, options);
  const correctedText = toFormal(text, options);
  
  let level: FormalityLevel = 'informal';
  if (score >= 80) level = 'formal';
  else if (score >= 50) level = 'semi-formal';
  
  const suggestions = issues.map(issue => `به جای «${issue.word}» از «${issue.suggestion}» استفاده کنید.`);
  
  if (checkPunctuation && !text.match(/[.!?؟]$/m) && text.length > 20) {
    suggestions.push('در پایان جملات از علائم نگارشی مناسب مانند نقطه استفاده کنید.');
    issues.push({
      word: '',
      suggestion: '.',
      position: text.length,
      type: 'punctuation',
      severity: 'low'
    });
  }
  
  return {
    level,
    score,
    issues,
    suggestions,
    correctedText
  };
}

/**
 * تبدیل متن عامیانه و محاوره‌ای به نگارش رسمی و پیراسته با در نظر گرفتن بافت متن
 *
 * @param text متن ورودی
 * @param options تنظیمات حالت و لحن
 * @returns متن رسمی‌شده
 */
export function toFormal(text: string, options: FormalityOptions = {}): string {
  if (!text) return '';
  const { mode = 'administrative' } = options;
  let result = text;
  
  // ۱. اعمال قواعد بافتاری و چندکلمه‌ای
  for (const rule of CONTEXTUAL_RULES) {
    if (rule.modes && !rule.modes.includes(mode)) {
      continue;
    }
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    result = result.replace(regex, rule.replace);
  }

  // ۲. اعمال جایگزینی واژه‌های غیررسمی منفرد
  const sortedEntries = Object.entries(INFORMAL_TO_FORMAL_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [informal, formal] of sortedEntries) {
    const escaped = informal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${B_PRE}${escaped}${B_POST}`, 'gu');
    result = result.replace(regex, formal);
  }
  
  // ۳. اصلاح نیم‌فاصله در پیشوندهای فعلی (مانند 'می ' -> 'می‌')
  result = result.replace(/(^|\s)(می|نمی)\s+([آ-ی]+)/gu, `$1$2${ZWNJ}$3`);
  
  return result;
}

/**
 * ایجاد ساختار اسکلت نامه اداری متناسب با نوع نامه
 *
 * @param type نوع نامه اداری
 * @returns بخش‌های الگو نامه
 */
export function getLetterTemplate(type: LetterType): FormalLetterParts {
  const base: FormalLetterParts = {
    greeting: LETTER_TEMPLATES.greetings[0],
    introduction: LETTER_TEMPLATES.introductions[0],
    body: 'متن اصلی نامه...',
    closing: LETTER_TEMPLATES.closings[0],
  };

  switch (type) {
    case 'request':
      base.request = LETTER_TEMPLATES.requests[0];
      break;
    case 'response':
      base.introduction = 'عطف به درخواست مورخ ...';
      break;
    case 'complaint':
      base.introduction = 'بدین‌وسیله به استحضار می‌رساند';
      base.request = 'شایسته است دستور اقدام صادر فرمایید';
      break;
  }

  return base;
}

/**
 * تولید یک نامه کامل رسمی و اداری از بخش‌های ورودی
 *
 * @param type نوع نامه
 * @param parts بخش‌های نامه ارائه شده توسط کاربر
 * @returns متن کامل نامه اداری فرمت‌بندی‌شده
 */
export function generateLetter(type: LetterType, parts: Partial<FormalLetterParts>): string {
  const template = getLetterTemplate(type);
  const finalParts = { ...template, ...parts };
  
  let letter = '';
  
  if (finalParts.date || finalParts.referenceNumber) {
    if (finalParts.date) letter += `تاریخ: ${finalParts.date}\n`;
    if (finalParts.referenceNumber) letter += `شماره: ${finalParts.referenceNumber}\n`;
    letter += '\n';
  }
  
  letter += `${finalParts.greeting}\n\n`;
  letter += `${finalParts.introduction} ${finalParts.body}`;
  
  if (finalParts.request) {
    letter += `\n${finalParts.request}`;
  }
  
  letter += `\n\n${finalParts.closing}`;
  
  if (finalParts.signature) {
    letter += `\n\n${finalParts.signature}`;
  }
  
  return letter;
}

/**
 * ارزیابی و اعتبارسنجی ساختار استاندارد نامه اداری (سرآغاز، متن، فرجام)
 *
 * @param text متن نامه
 * @returns نتیجه اعتبارسنجی ساختار
 */
export function validateLetterStructure(text: string): { isValid: boolean; missing: string[]; suggestions: string[] } {
  const missing: string[] = [];
  const suggestions: string[] = [];
  
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const header = lines.slice(0, 3).join(' ');
  const footer = lines.slice(-3).join(' ');

  let hasGreeting = false;
  for (const greeting of LETTER_TEMPLATES.greetings) {
    if (header.includes(greeting) || header.startsWith('سلام') || header.startsWith('احتراماً') || header.startsWith('محترماً')) {
      hasGreeting = true;
      break;
    }
  }
  
  if (!hasGreeting) {
    missing.push('greeting');
    suggestions.push('نامه باید با یک سرآغاز رسمی مانند "با سلام و احترام" شروع شود.');
  }
  
  let hasClosing = false;
  for (const closing of LETTER_TEMPLATES.closings) {
    if (footer.includes(closing) || footer.includes('تشکر') || footer.includes('سپاسگزار') || footer.includes('سپاس')) {
      hasClosing = true;
      break;
    }
  }
  
  if (!hasClosing) {
    missing.push('closing');
    suggestions.push('نامه باید شامل یک عبارت پایانی رسمی مانند "با تشکر و احترام" باشد.');
  }
  
  const isValid = missing.length === 0;
  
  return { isValid, missing, suggestions };
}
