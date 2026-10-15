/**
 * مثال‌های کاربردی mh-persian-writer
 * Usage examples for mh-persian-writer
 */

import {
  normalize,
  fixArabicCharacters,
  fixHalfSpace,
  toPersianDigits,
  toEnglishDigits,
  tokenizeWords,
  tokenizeSentences,
  countWords,
  extractWords,
  checkFormality,
  toFormal,
  generateLetter,
  toWords,
  toOrdinal,
  toCurrency,
  addThousandsSeparator,
  validateNationalId,
  validateBankCard,
  validateIban,
  validatePhoneNumber,
  formatPhoneNumber,
  getBankName,
  stem,
  findRoot,
  isVerb,
  getVerbStem,
  analyzeText,
  getWordFrequency,
  isPersian,
  detectLanguage,
  getSummaryStats,
  spellCheck,
  fixCommonTypos,
  fixBrokenPlurals,
  getJalaliDate,
  formatJalaliDate,
  generateDocument,
  prepareTextForLLM,
} from '../src/index';


// ═══════════════════════════════════════════════════════════════════════
// 🔤 نرمال‌ساز (Normalizer)
// ═══════════════════════════════════════════════════════════════════════

console.log('═══ نرمال‌ساز ═══');

// نرمال‌سازی کامل
const rawText = 'ميخوام يك چيز بگم,  اين خيلي مهم هست.';
console.log('Original:', rawText);
console.log('Normalized:', normalize(rawText));

// اصلاح کاراکترهای عربی
console.log('Fix Arabic:', fixArabicCharacters('ملك ياسين'));

// اصلاح نیم‌فاصله
console.log('Fix ZWNJ:', fixHalfSpace('میروم به خانه هایشان'));

// تبدیل ارقام
console.log('Persian Digits:', toPersianDigits('Phone: 09121234567'));
console.log('English Digits:', toEnglishDigits('تلفن: ۰۹۱۲۱۲۳۴۵۶۷'));

// ═══════════════════════════════════════════════════════════════════════
// ✂️ توکنایزر (Tokenizer)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ توکنایزر ═══');

const sampleText = 'سلام! من یک متن نمونه هستم. آیا این درست است؟';

console.log('Words:', tokenizeWords(sampleText));
console.log('Sentences:', tokenizeSentences(sampleText));
console.log('Word count:', countWords(sampleText));
console.log('Only words:', extractWords(sampleText));

// ═══════════════════════════════════════════════════════════════════════
// 📝 نوشتار اداری (Formal Writer)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ نوشتار اداری ═══');

const informalText = 'میخوام یه درخواست بدم واسه ارتقا';
const formalCheck = checkFormality(informalText);
console.log('Formality level:', formalCheck.level);
console.log('Score:', formalCheck.score);
console.log('Issues:', formalCheck.issues.length);
console.log('Corrected:', formalCheck.correctedText);

// تبدیل به رسمی
console.log('Formal:', toFormal(informalText));

// تولید نامه اداری
const letter = generateLetter('request', {
  body: 'درخواست مرخصی استحقاقی به مدت سه روز',
  signature: 'محمدحسین نادعلی',
  date: '۱۴۰۵/۰۷/۱۳',
  referenceNumber: '۱۴۰۵/۱۲۳۴',
});
console.log('Letter:\n', letter);

// ═══════════════════════════════════════════════════════════════════════
// 🔢 اعداد (Numbers)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ اعداد ═══');

console.log('42:', toWords(42));
console.log('1,234,567:', toWords(1_234_567));
console.log('-500:', toWords(-500));
console.log('0:', toWords(0));

console.log('Ordinal 1:', toOrdinal(1));
console.log('Ordinal 3:', toOrdinal(3));
console.log('Ordinal 21:', toOrdinal(21));

console.log('Currency:', toCurrency(1_500_000));
console.log('Currency $:', toCurrency(99.99, 'دلار'));
console.log('Separator:', addThousandsSeparator(1234567));

// ═══════════════════════════════════════════════════════════════════════
// ✅ اعتبارسنجی (Validators)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ اعتبارسنجی ═══');

console.log('National ID:', validateNationalId('0012345678'));
console.log('Bank Card:', validateBankCard('6037991234567890'));
console.log('Bank Name:', getBankName('6037991234567890'));
console.log('IBAN:', validateIban('IR062960000000100324200001'));
console.log('Phone:', validatePhoneNumber('09121234567'));
console.log('Format Phone:', formatPhoneNumber('09121234567', 'international'));

// ═══════════════════════════════════════════════════════════════════════
// 🌿 ریشه‌یابی (Stemmer)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ ریشه‌یابی ═══');

console.log('stem کتاب‌ها:', stem('کتاب‌ها'));
console.log('stem می‌نویسم:', stem('می‌نویسم'));
console.log('root دانشگاه‌های:', findRoot('دانشگاه‌های'));
console.log('isVerb می‌روند:', isVerb('می‌روند'));
console.log('verb stem رفت:', getVerbStem('رفت'));

// ═══════════════════════════════════════════════════════════════════════
// 📊 تحلیل‌گر (Analyzer)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ تحلیل‌گر ═══');

const analysisText = `
زبان فارسی یکی از کهن‌ترین زبان‌های جهان است.
این زبان دارای ساختاری غنی و پیچیده می‌باشد.
بسیاری از شاعران بزرگ جهان به زبان فارسی شعر سروده‌اند.
`;

const analysis = analyzeText(analysisText);
console.log('Analysis:', analysis);

console.log('Word Frequency:', getWordFrequency(analysisText, 5));
console.log('Is Persian:', isPersian(analysisText));
console.log('Language:', detectLanguage(analysisText));
console.log('Summary:', getSummaryStats(analysisText));

// ═══════════════════════════════════════════════════════════════════════
// 🔍 غلط‌یاب املایی (Spell Checker)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ غلط‌یاب املایی ═══');

const typoText = 'لطفا گذارش را برای مسعول اداره ارسال نمایید.';
const spellResult = spellCheck(typoText);
console.log('Original with typos:', typoText);
console.log('Spell check valid:', spellResult.isValid);
console.log('Detected issues:', spellResult.issues.map(i => `${i.word} -> ${i.suggestions.join('/')}`));
console.log('Corrected text:', spellResult.correctedText);

console.log('Fix Broken Plurals:', fixBrokenPlurals('کتب و مدارس و مساجد'));

// ═══════════════════════════════════════════════════════════════════════
// 📅 تقویم جلالی (Jalali Calendar)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ تقویم جلالی ═══');

const today = getJalaliDate();
console.log('Official Today:', today.officialFormat);
console.log('Standard Slash:', today.formattedPersianDigits);
console.log('Is Leap Year:', today.isLeap);
console.log('Format D MMMM YYYY:', formatJalaliDate(new Date(), 'D MMMM YYYY'));

// ═══════════════════════════════════════════════════════════════════════
// 📄 سندساز اداری (Document Builder)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ سندساز اداری ═══');

const textDoc = generateDocument('leave_request', {
  senderName: 'محمدحسین نادعلی',
  body: 'درخواست استفاده از مرخصی استحقاقی به مدت دو روز کاری',
}, { format: 'text' });
console.log('Plain Text Document:\n', textDoc);

// ═══════════════════════════════════════════════════════════════════════
// 🤖 آداپتور هوش مصنوعی (LLM Hybrid Adapter)
// ═══════════════════════════════════════════════════════════════════════

console.log('\n═══ آداپتور هوش مصنوعی ═══');

const llmInput = prepareTextForLLM('سلام، میخوام یه گزارش واسه ارتقا بنویسم براتون', {
  targetTone: 'administrative',
});
console.log('Cleaned Text:', llmInput.cleanText);
console.log('Prepared User Prompt:\n', llmInput.userPrompt);

