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
import { spellCheck } from './spell-checker';
import { toFormal } from './formal-writer';
import {
  FileProcessOptions,
  ScanResult,
  ScanSummary,
} from './types';
import {
  processMarkdown,
  processHtml,
  processJson,
  scanText,
} from './document-scanner-core';

export {
  colors,
  processMarkdown,
  processHtml,
  processJson,
  scanText,
  renderColoredDiff,
} from './document-scanner-core';

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

  function collectFiles(dirOrFile: string): void {
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
