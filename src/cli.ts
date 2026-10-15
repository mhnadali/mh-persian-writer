#!/usr/bin/env node
/**
 * رابط خط فرمان ابزار mh-persian-writer (نسخه ۲.۰ سازمانی)
 * Standalone Enterprise CLI 2.0 for mh-persian-writer
 *
 * قابلیت‌ها:
 * - اسکن دسته‌جمعی اسناد (Markdown, HTML, JSON, TXT)
 * - خطایابی و تست کیفیت پایپ‌لاین‌های CI/CD و Git Hooks (دستور lint)
 * - نمایش تفاوت‌ها به سبک گیت با رنگ‌های پایانه (دستور diff)
 * - نرمال‌سازی، رسمی‌سازی و غلط‌یابی هوشمند در خط فرمان
 *
 * @module cli
 * @author M.H. Nadali
 */

import * as path from 'path';
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
import {
  processFile,
  scanDirectoryOrFiles,
  renderColoredDiff,
  colors,
} from './document-scanner';
import { DocumentType, DocumentFormat, FormalityMode } from './types';

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
${colors.bold}${colors.cyan}mh-persian-writer CLI 2.0${colors.reset} - جعبه‌ابزار جامع و سازمانی پردازش و نوشتار زبان فارسی
توسعه‌دهنده: ${colors.bold}محمدحسین نادعلی (M.H. Nadali)${colors.reset}

${colors.bold}دستورات خط فرمان:${colors.reset}
  ${colors.green}lint <files/dirs...>${colors.reset}       بررسی و اعتبارسنجی املایی، نیم‌فاصله و نگارشی اسناد (مناسب CI/CD)
                             ${colors.gray}گزینه‌ها: --fix (اصلاح خودکار), --strict (سخت‌گیرانه)${colors.reset}
  ${colors.green}diff <file>${colors.reset}                 نمایش رنگی تفاوت‌های متن اصلی و متن ویراستاری‌شده
                             ${colors.gray}گزینه‌ها: --mode=normalize|formal|spell|all${colors.reset}
  ${colors.green}scan <files/dirs...>${colors.reset}       اسکن و ویراستاری دسته‌جمعی اسناد (.md, .html, .json, .txt)
                             ${colors.gray}گزینه‌ها: --write (ذخیره روی فایل), --diff (نمایش تفاوت‌ها)${colors.reset}
  ${colors.green}normalize <text>${colors.reset}           نرمال‌سازی نویسه‌ها، ارقام، فواصل و نیم‌فاصله
  ${colors.green}check <text>${colors.reset}               بررسی میزان رسمیت متن و خطاهای عامیانه
  ${colors.green}formal <text>${colors.reset}              تبدیل سریع متن عامیانه به متن اداری رسمی (--tone=...)
  ${colors.green}spell <text>${colors.reset}               غلط‌یابی املایی هوشمند و اصلاح خودکار
  ${colors.green}words <number>${colors.reset}             تبدیل عدد به حروف فارسی (مانند: words 1250000)
  ${colors.green}date${colors.reset}                       نمایش تاریخ رسمی امروز هجری خورشیدی
  ${colors.green}letter <type> [options]${colors.reset}    تولید نامه اداری استاندارد
                             ${colors.gray}--subject "موضوع" --body "متن" --format text|markdown|html${colors.reset}
  ${colors.green}validate <type> <code>${colors.reset}     اعتبارسنجی داده‌های هویتی و مالی ایران:
                             ${colors.gray}national-id | card | iban | phone${colors.reset}
  ${colors.green}help, --help${colors.reset}               نمایش این راهنما
  ${colors.green}--version, -v${colors.reset}              نمایش نسخه پکیج

${colors.bold}مثال‌های کاربردی:${colors.reset}
  npx mh-persian-writer lint docs/ README.md
  npx mh-persian-writer lint src/content/ --fix
  npx mh-persian-writer diff article.md --mode=all
  npx mh-persian-writer scan docs/ --mode=normalize --write
  npx mh-persian-writer normalize "ميخوام برم به خانه ها"
  npx mh-persian-writer spell "لطفا گذارش را برای مسعول ارسال کنید"
`);
}

function runCli() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log('mh-persian-writer v1.0.0 (CLI 2.0)');
    return;
  }

  const subArgs = args.slice(1);

  switch (command) {
    // ─── ۱. دستور lint برای CI/CD و Git Hooks ──────────────────────────
    case 'lint': {
      const fix = subArgs.includes('--fix');
      const strict = subArgs.includes('--strict');
      const targets = subArgs.filter(a => !a.startsWith('--'));

      if (targets.length === 0) {
        targets.push('.'); // اسکن پوشه جاری به صورت پیش‌فرض
      }

      console.log(`${colors.cyan}🔍 در حال بازبینی و اعتبارسنجی اسناد فارسی...${colors.reset}`);
      const summary = scanDirectoryOrFiles(targets, {
        mode: fix ? 'all' : 'normalize',
        write: fix,
        strict,
      });

      let exitCode = 0;

      summary.results.forEach((res) => {
        if (!res.isValid && res.issues.length > 0) {
          exitCode = 1;
          const relativePath = path.relative(process.cwd(), res.filePath || '');
          console.log(`\n${colors.bold}${colors.red}✗ ${relativePath}${colors.reset}`);
          res.issues.forEach((iss) => {
            const loc = `${colors.gray}${iss.line}:${iss.column}${colors.reset}`;
            const tag = iss.type === 'spelling' ? `${colors.red}[غلط املایی]${colors.reset}` :
                        iss.type === 'informal' ? `${colors.yellow}[لحن عامیانه]${colors.reset}` :
                        `${colors.blue}[نیم‌فاصله/نگارش]${colors.reset}`;
            console.log(`  ${loc} ${tag} ${iss.message}`);
          });
        }
      });

      console.log(`\n${colors.bold}─── خلاصه اعتبارسنجی ───${colors.reset}`);
      console.log(`کل فایل‌های بررسی‌شده: ${summary.totalFiles}`);
      console.log(`فایل‌های دارای اشکال: ${summary.filesWithIssues}`);
      console.log(`کل اشکالات شناسایی‌شده: ${summary.totalIssues}`);
      console.log(`زمان صرف‌شده: ${summary.durationMs} میلی‌ثانیه`);

      if (fix) {
        console.log(`${colors.green}✓ تمام فایل‌های دارای تغییر با موفقیت اصلاح و ذخیره شدند.${colors.reset}`);
        process.exit(0);
      } else if (exitCode !== 0) {
        console.log(`${colors.red}❌ اعتبارسنجی با خطا مواجه شد. لطفاً خطاهای فوق را اصلاح نمایید یا از گزینه --fix استفاده کنید.${colors.reset}`);
        process.exit(1);
      } else {
        console.log(`${colors.green}✔ تمام متون و اسناد بدون هرگونه اشکال نگارشی و املایی هستند.${colors.reset}`);
        process.exit(0);
      }
      break;
    }

    // ─── ۲. دستور diff برای مشاهده تفاوت‌ها ─────────────────────────────
    case 'diff': {
      const filePath = subArgs.find(a => !a.startsWith('--'));
      if (!filePath) {
        console.error(`${colors.red}خطا: لطفاً مسیر فایل مورد نظر را وارد نمایید.${colors.reset}`);
        process.exit(1);
      }

      const modeArg = subArgs.find(a => a.startsWith('--mode='));
      const mode = (modeArg ? modeArg.split('=')[1] : 'all') as 'normalize' | 'formal' | 'spell' | 'all';

      try {
        const res = processFile(filePath, { mode, write: false });
        const original = require('fs').readFileSync(res.filePath, 'utf-8');
        console.log(`\n${colors.bold}تفاوت‌های فایل: ${filePath} (${mode})${colors.reset}`);
        console.log(renderColoredDiff(original, res.fixedText));
      } catch (err: any) {
        console.error(`${colors.red}خطا در پردازش فایل: ${err.message}${colors.reset}`);
        process.exit(1);
      }
      break;
    }

    // ─── ۳. دستور scan برای اسکن و ویراستاری دسته‌جمعی اسناد ───────────
    case 'scan': {
      const write = subArgs.includes('--write') || subArgs.includes('-w');
      const showDiff = subArgs.includes('--diff');
      const modeArg = subArgs.find(a => a.startsWith('--mode='));
      const mode = (modeArg ? modeArg.split('=')[1] : 'normalize') as 'normalize' | 'formal' | 'spell' | 'all';
      const targets = subArgs.filter(a => !a.startsWith('--') && !a.startsWith('-'));

      if (targets.length === 0) {
        targets.push('.');
      }

      console.log(`${colors.cyan}🚀 شروع اسکن دسته‌جمعی با مد «${mode}»...${colors.reset}`);
      const summary = scanDirectoryOrFiles(targets, { mode, write });

      summary.results.forEach((res) => {
        const relPath = path.relative(process.cwd(), res.filePath || '');
        if (res.hasChanges) {
          console.log(`${colors.yellow}• تغییر یافته: ${relPath}${colors.reset}`);
          if (showDiff) {
            const original = require('fs').readFileSync(res.filePath, 'utf-8');
            console.log(renderColoredDiff(original, res.fixedText));
            console.log('────────────────────────────────────────');
          }
        }
      });

      console.log(`\n${colors.green}اسکن به پایان رسید: ${summary.totalFiles} فایل بررسی شد (${summary.durationMs}ms).${colors.reset}`);
      if (write) {
        console.log(`${colors.green}تمام تغییرات روی فایل‌ها ذخیره گردید.${colors.reset}`);
      }
      break;
    }

    // ─── ۴. دستورات عادی و تک‌متنی ─────────────────────────────────────
    case 'normalize': {
      const inputString = subArgs.join(' ').replace(/^["']|["']$/g, '');
      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      console.log(normalize(inputString));
      break;
    }

    case 'check': {
      const inputString = subArgs.join(' ').replace(/^["']|["']$/g, '');
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
      const toneArg = subArgs.find(a => a.startsWith('--tone='));
      const tone = (toneArg ? toneArg.split('=')[1] : 'administrative') as FormalityMode;
      const textArgs = subArgs.filter(a => !a.startsWith('--'));
      const inputString = textArgs.join(' ').replace(/^["']|["']$/g, '');

      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      console.log(toFormal(inputString, { mode: tone }));
      break;
    }

    case 'spell': {
      const inputString = subArgs.join(' ').replace(/^["']|["']$/g, '');
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
      const inputString = subArgs.join(' ').replace(/^["']|["']$/g, '');
      if (!inputString) {
        console.error('خطا: لطفاً متن مورد نظر را وارد نمایید.');
        return;
      }
      console.log(fixCommonTypos(inputString));
      break;
    }

    case 'plurals': {
      const inputString = subArgs.join(' ').replace(/^["']|["']$/g, '');
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
