<div dir="rtl" align="right">

# 🖊️ mh-persian-writer

**ابزار جامع و حرفه‌ای پردازش و نوشتار زبان فارسی**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)](#)

</div>

---

<div dir="rtl" align="right">

## 📖 درباره پروژه

**mh-persian-writer** یک کتابخانه جامع TypeScript/JavaScript برای پردازش حرفه‌ای زبان فارسی است که با الهام از بهترین‌های اکوسیستم فارسی ([Hazm](https://github.com/roshan-research/hazm)، [ParsBERT](https://github.com/hooshvare/parsbert)، [Hezar](https://github.com/hezarai/hezar)، [DadmaTools](https://github.com/dadmatech/DadmaTools) و [Persian-Tools](https://github.com/persian-tools/persian-tools)) ساخته شده است.

### ✨ ویژگی‌های کلیدی

| ماژول | قابلیت‌ها |
|---|---|
| 🔤 **نرمال‌ساز** | اصلاح کاراکتر عربی←فارسی، نیم‌فاصله، اعراب، فاصله‌گذاری |
| ✂️ **توکنایزر** | تفکیک کلمات و جملات، شمارش واژگان |
| 📝 **نوشتار اداری** | بررسی رسمیت، تبدیل محاوره←رسمی، قالب نامه اداری |
| 🔢 **اعداد** | تبدیل عدد به حروف، ارقام فارسی/عربی/انگلیسی، واحد پول |
| ✅ **اعتبارسنجی** | کد ملی، کارت بانکی، شبا، شماره تلفن، کد پستی |
| 🌿 **ریشه‌یابی** | استخراج ریشه واژگان، تشخیص فعل، بن مضارع/ماضی |
| 📊 **تحلیل‌گر** | آمار متن، فراوانی واژگان، شاخص خوانایی، تشخیص زبان |

</div>

---

## 🚀 Installation

```bash
npm install mh-persian-writer
```

```bash
yarn add mh-persian-writer
```

```bash
pnpm add mh-persian-writer
```

---

## 📘 Usage

### Quick Start

```typescript
import {
  normalize,
  checkFormality,
  toWords,
  validateNationalId,
  analyzeText,
} from 'mh-persian-writer';

// نرمال‌سازی متن
const normalized = normalize('ميخوام يك چيزي بگم');
// → 'می‌خوام یک چیزی بگم'

// بررسی رسمیت نوشتار
const result = checkFormality('میخوام یه چیزی بگم');
console.log(result.score);       // 35
console.log(result.level);       // 'informal'
console.log(result.correctedText); // 'می‌خواهم موردی عرض کنم'

// تبدیل عدد به حروف
console.log(toWords(1_234_567));
// → 'یک میلیون و دویست و سی و چهار هزار و پانصد و شصت و هفت'

// اعتبارسنجی کد ملی
const idResult = validateNationalId('0012345678');
console.log(idResult.isValid); // true or false

// تحلیل متن
const analysis = analyzeText('سلام. من یک متن فارسی هستم.');
console.log(analysis.wordCount);        // 6
console.log(analysis.persianCharRatio); // ~0.95
```

### Tree-Shakeable Imports

```typescript
// فقط ماژول موردنیاز را ایمپورت کنید
import { normalize, fixHalfSpace } from 'mh-persian-writer/normalizer';
import { validateBankCard } from 'mh-persian-writer/validators';
import { toFormal, generateLetter } from 'mh-persian-writer/formal-writer';
```

---

<div dir="rtl" align="right">

## 📝 راهنمای ماژول‌ها

### 🔤 نرمال‌ساز (Normalizer)

</div>

```typescript
import { normalize, fixArabicCharacters, fixHalfSpace, toPersianDigits } from 'mh-persian-writer';

// نرمال‌سازی کامل
normalize('ميخوام يك چيزي بگم', {
  persianCharacters: true,
  persianDigits: true,
  fixSpacing: true,
  removeDiacritics: true,
  fixPunctuation: true,
});

// تبدیل کاراکترهای عربی به فارسی
fixArabicCharacters('ملك ياسين');     // → 'ملک یاسین'

// اصلاح نیم‌فاصله
fixHalfSpace('میروم به خانه هایشان'); // → 'می‌روم به خانه‌هایشان'

// تبدیل ارقام
toPersianDigits('Room 404');           // → 'Room ۴۰۴'
```

<div dir="rtl" align="right">

### 📝 نوشتار اداری (Formal Writer)

</div>

```typescript
import { checkFormality, toFormal, generateLetter } from 'mh-persian-writer';

// بررسی سطح رسمیت
const check = checkFormality('میخوام یه درخواست بدم');
// check.level → 'informal'
// check.score → ~25
// check.issues → [{word: 'میخوام', suggestion: 'می‌خواهم', ...}]

// تبدیل خودکار به نوشتار رسمی
toFormal('اون کارو میخوام زود انجام بدم');
// → 'آن اقدام را می‌خواهم سریعاً انجام دهم'

// تولید نامه اداری
const letter = generateLetter('request', {
  body: 'درخواست ارتقاء سمت',
  signature: 'محمدحسین نادعلی',
  date: '۱۴۰۵/۰۷/۱۳',
});
```

<div dir="rtl" align="right">

### 🔢 اعداد (Numbers)

</div>

```typescript
import { toWords, toOrdinal, toCurrency, addThousandsSeparator } from 'mh-persian-writer';

toWords(42);              // → 'چهل و دو'
toWords(-1500);           // → 'منفی یک هزار و پانصد'
toOrdinal(3);             // → 'سوم'
toCurrency(1_500_000);    // → '۱٬۵۰۰٬۰۰۰ ریال'
addThousandsSeparator(1234567); // → '۱٬۲۳۴٬۵۶۷'
```

<div dir="rtl" align="right">

### ✅ اعتبارسنجی (Validators)

</div>

```typescript
import {
  validateNationalId,
  validateBankCard,
  validateIban,
  validatePhoneNumber,
  formatPhoneNumber,
  getBankName,
} from 'mh-persian-writer';

validateNationalId('0012345678');
// → { isValid: true/false, metadata: { ... } }

validateBankCard('6037991234567890');
// → { isValid: true, metadata: { bank: 'بانک ملی' } }

validateIban('IR062960000000100324200001');
// → { isValid: true/false }

validatePhoneNumber('09121234567');
// → { isValid: true, metadata: { operator: 'ایرانسل' } }

getBankName('6037991234567890'); // → 'بانک ملی'

formatPhoneNumber('09121234567', 'international');
// → '+989121234567'
```

<div dir="rtl" align="right">

### 🌿 ریشه‌یابی (Stemmer)

</div>

```typescript
import { stem, findRoot, isVerb, getVerbStem } from 'mh-persian-writer';

stem('کتاب‌ها');
// → { word: 'کتاب‌ها', stem: 'کتاب', suffix: 'ها' }

stem('می‌نویسم');
// → { word: 'می‌نویسم', stem: 'نویس', prefix: 'می', suffix: 'م' }

findRoot('دانشگاه‌های');    // → 'دانشگاه'
isVerb('می‌روند');           // → true
getVerbStem('رفت');         // → { past: 'رفت', present: 'رو' }
```

<div dir="rtl" align="right">

### 📊 تحلیل‌گر متن (Analyzer)

</div>

```typescript
import { analyzeText, getWordFrequency, isPersian, detectLanguage } from 'mh-persian-writer';

const stats = analyzeText('این یک متن نمونه است. این متن برای تست نوشته شده.');
// stats.wordCount → 10
// stats.sentenceCount → 2
// stats.readabilityScore → 85
// stats.estimatedReadingTime → 3 (seconds)

getWordFrequency('سلام سلام دنیا', 2);
// → [{ word: 'سلام', count: 2, percentage: 66.7 }, ...]

isPersian('سلام دنیا');    // → true
detectLanguage('Hello!');  // → 'english'
```

---

<div dir="rtl" align="right">

## 🏗️ ساختار پروژه

</div>

```
mh-persian-writer/
├── src/
│   ├── index.ts          # Main exports
│   ├── types.ts          # Type definitions
│   ├── constants.ts      # Constants & data
│   ├── normalizer.ts     # Text normalization
│   ├── tokenizer.ts      # Tokenization
│   ├── formal-writer.ts  # Formal writing checker
│   ├── numbers.ts        # Number utilities
│   ├── validators.ts     # Data validators
│   ├── stemmer.ts        # Word stemming
│   └── analyzer.ts       # Text analysis
├── tests/                # Test suite
├── examples/             # Usage examples
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint

# Type check
npm run typecheck
```

---

## 🤝 Contributing

<div dir="rtl" align="right">

از مشارکت شما استقبال می‌کنیم! لطفاً:

1. پروژه را Fork کنید
2. یک Branch جدید بسازید (`git checkout -b feat/amazing-feature`)
3. تغییرات خود را Commit کنید (`git commit -m 'feat: add amazing feature'`)
4. Branch خود را Push کنید (`git push origin feat/amazing-feature`)
5. یک Pull Request ایجاد کنید

</div>

---

## 📄 License

MIT © [M.H. Nadali](https://github.com/mhnadali)

---

<div dir="rtl" align="right">

## 🙏 الهام‌گرفته از

| پروژه | الهام |
|---|---|
| [Hazm](https://github.com/roshan-research/hazm) | نرمال‌سازی، توکن‌بندی، ریشه‌یابی |
| [ParsBERT](https://github.com/hooshvare/parsbert) | مدل‌سازی زبان و درک معنایی |
| [Hezar](https://github.com/hezarai/hezar) | معماری ماژولار و API ساده |
| [DadmaTools](https://github.com/dadmatech/DadmaTools) | تحلیل ساختار دستوری |
| [Persian-Tools](https://github.com/persian-tools/persian-tools) | ابزارهای کاربردی و اعتبارسنجی |

</div>
