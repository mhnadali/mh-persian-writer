#!/usr/bin/env node
/**
 * رابط خط فرمان ابزار mh-persian-writer
 * Standalone CLI for mh-persian-writer
 *
 * @module cli
 * @author M.H. Nadali
 */

import { normalize } from './normalizer';
import { checkFormality, toFormal } from './formal-writer';
import { toWords, addThousandsSeparator } from './numbers';
import {
  validateNationalId,
  validateBankCard,
  validateIban,
  validatePhoneNumber,
  getBankName,
} from './validators';
import { spellCheck, fixCommonTypos, fixBrokenPlurals } from './spell-checker';
import { getJalaliDate, formatJalaliDate } from './jalali';
import { generateDocument } from './document-builder';
import { DocumentType, DocumentFormat } from './types';

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
mh-persian-writer CLI - ابزار جامع پردازش و نوشتار زبان فارسی
توسعه‌دهنده: محمدحسین نادعلی (M.H. Nadali)

دستورات قابل استفاده:
  normalize <text>              نرمال‌سازی نویسه‌ها، ارقام، فواصل و نیم‌فاصله
  check <text>                  بررسی میزان رسمیت متن و خطاهای عامیانه
  formal <text>                 تبدیل سریع متن عامیانه به متن اداری رسمی
  spell <text>                  غلط‌یابی املایی هوشمند و اصلاح خودکار
  words <number>                تبدیل عدد به حروف فارسی (مانند: words 1250000)
  date                          نمایش تاریخ رسمی امروز هجری خورشیدی
  letter <type> [options]       تولید نامه اداری استاندارد
                                  --subject "موضوع"
                                  --body "متن"
                                  --format text|markdown|html
  validate <type> <code>        اعتبارسنجی داده‌های هویتی و مالی ایران:
                                  national-id | card | iban | phone
  help, --help                  نمایش این راهنما
  --version                     نمایش نسخه پکیج

مثال‌ها:
  npx mh-persian-writer normalize "ميخوام برم به خانه ها"
  npx mh-persian-writer spell "لطفا گذارش را برای مسعول ارسال کنید"
  npx mh-persian-writer words 1540000
  npx mh-persian-writer validate card 6037991234567890
  npx mh-persian-writer letter leave_request --format html
`);
}

function runCli() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log('mh-persian-writer v1.0.0');
    return;
  }

  const subArgs = args.slice(1);
  const inputString = subArgs.join(' ').replace(/^["']|["']$/g, '');

  switch (command) {
    case 'normalize': {
      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      console.log(normalize(inputString));
      break;
    }

    case 'check': {
      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      const res = checkFormality(inputString);
      console.log(`سطح رسمیت: ${res.level}`);
      console.log(`امتیاز رسمیت: ${res.score} از ۱۰۰`);
      if (res.issues.length > 0) {
        console.log('\nواژگان عامیانه شناسایی‌شده:');
        res.issues.forEach(i => console.log(` - «${i.word}» -> «${i.suggestion}»`));
        console.log(`\nپیشنهاد متن رسمی:`);
        console.log(res.correctedText);
      } else {
        console.log('متن کاملاً رسمی است و واژه عامیانه‌ای یافت نشد.');
      }
      break;
    }

    case 'formal': {
      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      console.log(toFormal(inputString));
      break;
    }

    case 'spell': {
      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      const res = spellCheck(inputString);
      if (res.isValid) {
        console.log('متن از نظر املایی کاملاً صحیح است.');
      } else {
        console.log(`خطاهای املایی یافت‌شده (${res.issues.length} مورد):`);
        res.issues.forEach(issue => {
          console.log(` - واژه: «${issue.word}» -> پیشنهادها: [${issue.suggestions.join('، ')}]`);
        });
        console.log('\nمتن اصلاح‌شده:');
        console.log(res.correctedText);
      }
      break;
    }

    case 'words': {
      const num = Number(subArgs[0]);
      if (isNaN(num)) {
        console.error('خطا: لطفاً یک عدد معتبر وارد نمایید.');
        return;
      }
      console.log(`${toWords(num)} (${addThousandsSeparator(num, '٬', true)})`);
      break;
    }

    case 'date': {
      const j = getJalaliDate();
      console.log(`امروز: ${formatJalaliDate(new Date(), 'official', true)}`);
      console.log(`فرمت استاندارد: ${j.formattedPersianDigits}`);
      break;
    }

    case 'fix-typos': {
      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      console.log(fixCommonTypos(inputString));
      break;
    }

    case 'plurals': {
      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      console.log(fixBrokenPlurals(inputString));
      break;
    }


    case 'letter': {
      const type = (subArgs[0] || 'custom') as DocumentType;

      let format: DocumentFormat = 'text';
      let subject = '';
      let body = '';

      for (let i = 1; i < subArgs.length; i++) {
        if (subArgs[i] === '--format' && subArgs[i + 1]) {
          format = subArgs[i + 1] as DocumentFormat;
        }
        if (subArgs[i] === '--subject' && subArgs[i + 1]) {
          subject = subArgs[i + 1];
        }
        if (subArgs[i] === '--body' && subArgs[i + 1]) {
          body = subArgs[i + 1];
        }
      }

      const letterContent = generateDocument(type, {
        ...(subject ? { subject } : {}),
        ...(body ? { body } : {}),
      }, { format });

      console.log(letterContent);
      break;
    }

    case 'validate': {
      const valType = subArgs[0];
      const valCode = subArgs[1];

      if (!valType || !valCode) {
        console.error('نحوه استفاده: validate <national-id|card|iban|phone> <code>');
        return;
      }

      switch (valType) {
        case 'national-id': {
          const res = validateNationalId(valCode);
          console.log(res.isValid ? 'کد ملی معتبر است.' : `نامعتبر: ${res.errorMessage}`);
          break;
        }
        case 'card': {
          const res = validateBankCard(valCode);
          const bank = getBankName(valCode);
          console.log(res.isValid ? `کارت معتبر است (${bank || 'بانک نامشخص'})` : `نامعتبر: ${res.errorMessage}`);
          break;
        }
        case 'iban': {
          const res = validateIban(valCode);
          console.log(res.isValid ? 'شماره شبا معتبر است.' : `نامعتبر: ${res.errorMessage}`);
          break;
        }
        case 'phone': {
          const res = validatePhoneNumber(valCode);
          console.log(res.isValid ? 'شماره همراه معتبر است.' : `نامعتبر: ${res.errorMessage}`);
          break;
        }
        default:
          console.error('نوع اعتبارسنجی نامعتبر است.');
      }
      break;
    }

    default:
      console.error(`دستور نامعتبر «${command}». برای مشاهده راهنما از help استفاده فرمایید.`);
  }
}

runCli();
