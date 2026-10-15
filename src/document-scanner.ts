/**
 * ماژول اسکن، پردازش دسته‌جمعی اسناد و دیف رنگی (CLI 2.0)
 * Document Scanner, Batch Processor, and Git-style Diff Engine
 *
 * @module document-scanner
 * @author M.H. Nadali
 */

import * as fs from 'fs';
import * as path from 'path';
import { normalize } from './normalizer';
import { toPersianDigits } from './numbers';
import { spellCheck } from './spell-checker';
import { toFormal, detectInformalWords } from './formal-writer';
import { isPersian } from './analyzer';
import {
  FileProcessOptions,
  ScanIssue,
  ScanResult,
  ScanSummary,
} from './types';

/** کدهای خروجی رنگی ANSI برای خط فرمان بدون وابستگی خارجی */
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

/**
 * پردازش هوشمند فایل‌های Markdown با محافظت از بلوک‌های کد و لینک‌ها
 *
 * @param content - محتوای متنی مارک‌داون
 * @param transform - تابع تبدیل و ویرایش متن
 * @returns متن ویرایش‌شده مارک‌داون
 */
export function processMarkdown(content: string, transform: (text: string) => string): string {
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  // ۱. حفاظت از بلوک‌های کد فنس‌شده (``` یا ~~~)
  let protectedContent = content.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g, (match) => {
    const placeholder = `__AMACH_CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });

  // ۲. حفاظت از کدهای درون‌خطی (`code`)
  protectedContent = protectedContent.replace(/(`[^`\n]+`)/g, (match) => {
    const placeholder = `__AMACH_INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(match);
    return placeholder;
  });

  // ۳. اعمال تبدیل روی متن پروز (پاراگراف‌ها و عناوین مارک‌داون)
  const lines = protectedContent.split('\n');
  const processedLines = lines.map((line) => {
    // خطوط خالی یا کدهای محافظت‌شده کامل را دست‌نخورده بگذار
    if (!line.trim() || line.trim().startsWith('__AMACH_CODE_BLOCK_')) {
      return line;
    }
    // اگر خط عنوان مارک‌داون است (# عنوان)
    const headerMatch = line.match(/^(#{1,6}\s+)(.*)$/);
    if (headerMatch) {
      return headerMatch[1] + transform(headerMatch[2]);
    }
    // اگر آیتم لیست است (- یا * یا 1.)
    const listMatch = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)(.*)$/);
    if (listMatch) {
      return listMatch[1] + transform(listMatch[2]);
    }
    return transform(line);
  });

  let result = processedLines.join('\n');

  // ۴. بازیابی کدهای درون‌خطی
  inlineCodes.forEach((code, idx) => {
    const pIdx = toPersianDigits(idx.toString());
    result = result.replace(`__AMACH_INLINE_CODE_${idx}__`, code)
                   .replace(`__AMACH_INLINE_CODE_${pIdx}__`, code);
  });

  // ۵. بازیابی بلوک‌های کد فنس‌شده
  codeBlocks.forEach((block, idx) => {
    const pIdx = toPersianDigits(idx.toString());
    result = result.replace(`__AMACH_CODE_BLOCK_${idx}__`, block)
                   .replace(`__AMACH_CODE_BLOCK_${pIdx}__`, block);
  });

  return result;
}

/**
 * پردازش فایل‌های HTML با محافظت از تگ‌ها و اسکریپت‌ها
 *
 * @param content - محتوای سند HTML
 * @param transform - تابع تبدیل و ویرایش متن
 * @returns سند HTML با متن‌های ویراستاری‌شده
 */
export function processHtml(content: string, transform: (text: string) => string): string {
  const protectedTags: string[] = [];

  // حفاظت از تگ‌های <script>، <style>، <pre> و <code>
  let protectedContent = content.replace(/(<(?:script|style|pre|code)[^>]*>[\s\S]*?<\/(?:script|style|pre|code)>)/gi, (match) => {
    const placeholder = `__AMACH_HTML_TAG_${protectedTags.length}__`;
    protectedTags.push(match);
    return placeholder;
  });

  // تبدیل متن‌های واقع در میان تگ‌های HTML (>متن<)
  protectedContent = protectedContent.replace(/(>)([^<]+)(<)/g, (_match, open, text, close) => {
    if (!text.trim() || !isPersian(text)) return open + text + close;
    return open + transform(text) + close;
  });

  // بازیابی تگ‌های محافظت‌شده
  protectedTags.forEach((tag, idx) => {
    const pIdx = toPersianDigits(idx.toString());
    protectedContent = protectedContent.replace(`__AMACH_HTML_TAG_${idx}__`, tag)
                                       .replace(`__AMACH_HTML_TAG_${pIdx}__`, tag);
  });

  return protectedContent;
}

/**
 * پردازش فایل‌های JSON با پیمایش بازگشتی مقادیر رشته‌ای فارسی
 *
 * @param content - محتوای متنی JSON
 * @param transform - تابع تبدیل و ویرایش متن
 * @returns رشته استاندارد JSON ویرایش‌شده
 */
export function processJson(content: string, transform: (text: string) => string): string {
  try {
    const parsed = JSON.parse(content);

    function walk(obj: any): any {
      if (typeof obj === 'string') {
        return isPersian(obj) ? transform(obj) : obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(walk);
      }
      if (obj !== null && typeof obj === 'object') {
        const res: Record<string, any> = {};
        for (const key of Object.keys(obj)) {
          res[key] = walk(obj[key]);
        }
        return res;
      }
      return obj;
    }

    const transformed = walk(parsed);
    return JSON.stringify(transformed, null, 2) + '\n';
  } catch {
    // در صورت نامعتبر بودن ساختار JSON، متن به عنوان متن عادی پردازش می‌شود
    return transform(content);
  }
}

/**
 * اسکن عمیق خط به خط متن و استخراج تمام مشکلات املایی، فاصله‌گذاری و لحن
 *
 * @param text - متن ورودی
 * @param options - تنظیمات اسکن و پردازش
 * @returns نتیجه ساختاریافته اسکن متن
 */
export function scanText(text: string, options: FileProcessOptions = {}): ScanResult {
  const issues: ScanIssue[] = [];
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;
    if (!line.trim() || !isPersian(line)) return;

    // ۱. بررسی املایی
    const spellRes = spellCheck(line, { customDictionary: options.customDictionary });
    if (!spellRes.isValid && spellRes.issues) {
      spellRes.issues.forEach((issue) => {
        const col = line.indexOf(issue.word) + 1;
        issues.push({
          type: 'spelling',
          line: lineNum,
          column: col > 0 ? col : 1,
          matched: issue.word,
          suggestion: issue.suggestions[0] || '',
          message: `غلط املایی در واژه «${issue.word}» (پیشنهاد: ${issue.suggestions.join('، ')})`,
        });
      });
    }

    // ۲. بررسی نیم‌فاصله و فاصله‌گذاری
    const normalizedLine = normalize(line, {
      persianCharacters: true,
      persianDigits: true,
      fixSpacing: true,
      fixPunctuation: true,
    });

    if (normalizedLine !== line) {
      // پیدا کردن اولین تفاوت در خط
      let diffCol = 1;
      for (let i = 0; i < Math.min(line.length, normalizedLine.length); i++) {
        if (line[i] !== normalizedLine[i]) {
          diffCol = i + 1;
          break;
        }
      }

      // اگر غلط املایی در همان مکان ثبت نشده بود
      const hasSpellHere = issues.some(iss => iss.line === lineNum && Math.abs(iss.column - diffCol) <= 3);
      if (!hasSpellHere) {
        issues.push({
          type: 'spacing',
          line: lineNum,
          column: diffCol,
          matched: line.trim().slice(0, 30),
          suggestion: normalizedLine.trim().slice(0, 30),
          message: 'نیاز به اصلاح نیم‌فاصله، نویسه یا علائم نگارشی',
        });
      }
    }

    // ۳. بررسی لحن و واژگان غیررسمی (در صورت درخواست strict یا حالت رسمی)
    if (options.strict || options.mode === 'formal' || options.mode === 'all') {
      const informalIssues = detectInformalWords(line);
      informalIssues.forEach((inf) => {
        const col = line.indexOf(inf.word) + 1;
        issues.push({
          type: 'informal',
          line: lineNum,
          column: col > 0 ? col : 1,
          matched: inf.word,
          suggestion: inf.suggestion,
          message: `واژه عامیانه/غیررسمی «${inf.word}» (پیشنهاد رسمی: «${inf.suggestion}»)`,
        });
      });
    }
  });

  // تولید متن اصلاح‌شده نهایی
  const mode = options.mode || 'normalize';
  let fixedText = text;

  const transform = (chunk: string): string => {
    let res = chunk;
    if (mode === 'spell' || mode === 'all') {
      res = spellCheck(res, { customDictionary: options.customDictionary }).correctedText;
    }
    if (mode === 'formal' || mode === 'all') {
      res = toFormal(res, { mode: options.formalityMode || 'administrative' });
    }
    if (mode === 'normalize' || mode === 'all') {
      res = normalize(res, {
        persianCharacters: true,
        persianDigits: true,
        fixSpacing: true,
        removeDiacritics: true,
        fixPunctuation: true,
      });
    }
    return res;
  };

  fixedText = transform(text);

  return {
    isValid: issues.length === 0,
    issues,
    fixedText,
    hasChanges: text !== fixedText,
  };
}

/**
 * پردازش یک فایل از روی دیسک، استخراج خطاها و اصلاح اختیاری
 *
 * @param filePath - مسیر فایل روی دیسک
 * @param options - گزینه‌های پردازش فایل
 * @returns نتیجه اسکن فایل
 */
export function processFile(filePath: string, options: FileProcessOptions = {}): ScanResult {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`فایل یافت نشد: ${filePath}`);
  }

  const rawContent = fs.readFileSync(absolutePath, 'utf-8');
  const ext = path.extname(absolutePath).toLowerCase();

  const mode = options.mode || 'normalize';
  const transform = (chunk: string): string => {
    let res = chunk;
    if (mode === 'spell' || mode === 'all') {
      res = spellCheck(res, { customDictionary: options.customDictionary }).correctedText;
    }
    if (mode === 'formal' || mode === 'all') {
      res = toFormal(res, { mode: options.formalityMode || 'administrative' });
    }
    if (mode === 'normalize' || mode === 'all') {
      res = normalize(res, {
        persianCharacters: true,
        persianDigits: true,
        fixSpacing: true,
        removeDiacritics: true,
        fixPunctuation: true,
      });
    }
    return res;
  };

  let fixedContent = rawContent;
  if (ext === '.md' || ext === '.markdown') {
    fixedContent = processMarkdown(rawContent, transform);
  } else if (ext === '.html' || ext === '.htm') {
    fixedContent = processHtml(rawContent, transform);
  } else if (ext === '.json') {
    fixedContent = processJson(rawContent, transform);
  } else {
    fixedContent = transform(rawContent);
  }

  const scan = scanText(rawContent, options);
  scan.filePath = absolutePath;
  scan.fixedText = fixedContent;
  scan.hasChanges = rawContent !== fixedContent;

  // در صورت تعیین فلگ write و وجود تغییرات، روی فایل ذخیره می‌شود
  if (options.write && scan.hasChanges) {
    fs.writeFileSync(absolutePath, fixedContent, 'utf-8');
  }

  return scan;
}

/**
 * اسکن دسته‌جمعی مسیرها، پوشه‌ها و الگوهای فایلی
 *
 * @param targets - آرایه‌ای از فایل‌ها یا پوشه‌ها
 * @param options - گزینه‌های اسکن
 * @returns خلاصه آمار و نتایج اسکن
 */
export function scanDirectoryOrFiles(targets: string[], options: FileProcessOptions = {}): ScanSummary {
  const startTime = Date.now();
  const filePaths: string[] = [];

  const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'coverage', '.gemini', 'build']);
  const allowedExtensions = new Set(['.md', '.markdown', '.txt', '.json', '.html', '.htm']);

  function collectFiles(dirOrFile: string) {
    const fullPath = path.resolve(dirOrFile);
    if (!fs.existsSync(fullPath)) return;

    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      filePaths.push(fullPath);
    } else if (stat.isDirectory()) {
      const baseName = path.basename(fullPath);
      if (ignoredDirs.has(baseName)) return;

      const entries = fs.readdirSync(fullPath);
      for (const entry of entries) {
        collectFiles(path.join(fullPath, entry));
      }
    }
  }

  targets.forEach(collectFiles);

  // پالایش فایل‌ها بر اساس پسوندهای مجاز
  const validFiles = filePaths.filter(fp => allowedExtensions.has(path.extname(fp).toLowerCase()));

  const results: ScanResult[] = [];
  let totalIssues = 0;
  let filesWithIssues = 0;

  for (const fp of validFiles) {
    const res = processFile(fp, options);
    results.push(res);
    if (!res.isValid || res.hasChanges) {
      filesWithIssues++;
    }
    totalIssues += res.issues.length;
  }

  return {
    totalFiles: validFiles.length,
    filesWithIssues,
    totalIssues,
    durationMs: Date.now() - startTime,
    results,
  };
}

/**
 * تولید نمایش بصری تفاوت‌ها (Diff) به سبک گیت با رنگ‌های پایانه ANSI
 *
 * @param oldText - متن اصلی اولیه
 * @param newText - متن اصلاح‌شده ثانویه
 * @returns رشته خروجی فرمت‌شده و رنگ‌آمیزی‌شده دیف
 */
export function renderColoredDiff(oldText: string, newText: string): string {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  if (oldText === newText) {
    return `${colors.dim}هیچ تغییری در متن یافت نشد.${colors.reset}`;
  }

  const diffOutput: string[] = [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oLine = oldLines[i];
    const nLine = newLines[i];

    if (oLine === undefined) {
      // خط جدید اضافه شده
      diffOutput.push(`${colors.green}+ [${i + 1}] ${nLine}${colors.reset}`);
    } else if (nLine === undefined) {
      // خط قبلی حذف شده
      diffOutput.push(`${colors.red}- [${i + 1}] ${oLine}${colors.reset}`);
    } else if (oLine !== nLine) {
      // خط تغییر کرده است
      diffOutput.push(`${colors.red}- [${i + 1}] ${oLine}${colors.reset}`);
      diffOutput.push(`${colors.green}+ [${i + 1}] ${nLine}${colors.reset}`);
    }
  }

  return diffOutput.join('\n');
}
