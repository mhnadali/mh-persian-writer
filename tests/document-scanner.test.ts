/**
 * آزمون‌های واحد ماژول اسکن، پردازش اسناد و CLI 2.0
 * Unit tests for document-scanner and CLI 2.0 features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  processMarkdown,
  processHtml,
  processJson,
  scanText,
  processFile,
  scanDirectoryOrFiles,
  renderColoredDiff,
} from '../src/document-scanner';
import { normalize } from '../src/normalizer';

describe('Document Scanner - Markdown Processor', () => {
  it('should normalize Persian text in markdown while preserving code blocks and inline code', () => {
    const md = [
      '# عنوان اصلي مستندات',
      '',
      'اين يك متن آزمايشي مي باشد.',
      '',
      '```javascript',
      'const text = "اين متن نبايد دست بخورد";',
      '```',
      '',
      '- مورد اول با `inline code` و ادامه متن',
      '- مورد دوم: مي توانيد استفاده كنيد.',
    ].join('\n');

    const processed = processMarkdown(md, (text) => normalize(text, { persianCharacters: true, fixSpacing: true }));

    // عنوان اصلی نرمال شده باشد
    expect(processed).toContain('# عنوان اصلی مستندات');
    // متن آزمایشی اصلاح شده باشد
    expect(processed).toContain('این یک متن آزمایشی');
    // کد داخل بلوک کد فنس‌شده نباید تغییر کند
    expect(processed).toContain('const text = "اين متن نبايد دست بخورد";');
    // کد درون‌خطی باید حفظ شود
    expect(processed).toContain('`inline code`');
    // نیم‌فاصله در آیتم لیست اصلاح شود
    expect(processed).toContain('می‌توانید استفاده کنید');
  });
});

describe('Document Scanner - HTML Processor', () => {
  it('should normalize text nodes while preserving tags, scripts, and pre blocks', () => {
    const html = `
      <div class="content">
        <h1>سلام به همه کاربران</h1>
        <p>اين متن بايد اصلاح شود.</p>
        <script>const x = "دست_نخورده";</script>
        <code>کد دست نخورده</code>
      </div>
    `;

    const processed = processHtml(html, (text) => normalize(text, { persianCharacters: true, fixSpacing: true }));

    expect(processed).toContain('<p>این متن باید اصلاح شود.</p>');
    expect(processed).toContain('const x = "دست_نخورده";');
    expect(processed).toContain('<code>کد دست نخورده</code>');
  });
});

describe('Document Scanner - JSON Processor', () => {
  it('should traverse and normalize Persian string values while keeping keys and structure', () => {
    const jsonStr = JSON.stringify({
      title: 'گزارش سالانه شركت',
      version: 1,
      isActive: true,
      tags: ['فناوري', 'امنيت'],
      author: {
        name: 'علي رضايي',
      },
    }, null, 2);

    const processed = processJson(jsonStr, (text) => normalize(text, { persianCharacters: true }));
    const parsed = JSON.parse(processed);

    expect(parsed.title).toBe('گزارش سالانه شرکت');
    expect(parsed.version).toBe(1);
    expect(parsed.tags[0]).toBe('فناوری');
    expect(parsed.tags[1]).toBe('امنیت');
    expect(parsed.author.name).toBe('علی رضایی');
  });
});

describe('Document Scanner - scanText & Linting', () => {
  it('should identify spelling mistakes and provide accurate line and column numbers', () => {
    const text = [
      'این یک متن کاملاً صحیح است.',
      'اما در این خط یک قلط فاحش وجود دارد.',
    ].join('\n');

    const result = scanText(text);

    expect(result.isValid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    const spellIssue = result.issues.find(i => i.matched === 'قلط');
    expect(spellIssue).toBeDefined();
    expect(spellIssue?.line).toBe(2);
    expect(spellIssue?.suggestion).toBe('غلط');
  });

  it('should identify spacing/half-space issues', () => {
    const text = 'آنها می روند به دانشگاه.';
    const result = scanText(text);

    expect(result.hasChanges).toBe(true);
    expect(result.fixedText).toContain('می‌روند');
  });

  it('should detect informal words when strict option is enabled', () => {
    const text = 'ما میخوایم کارمونو درست انجام بدیم.';
    const result = scanText(text, { strict: true, mode: 'formal' });

    expect(result.issues.some(i => i.type === 'informal')).toBe(true);
    expect(result.fixedText).toContain('می‌خواهیم');
  });
});

describe('Document Scanner - Colored Diff', () => {
  it('should generate colored diff lines with line numbers and +/- indicators', () => {
    const oldText = 'خط اول\nخط دوم قدیمی\nخط سوم';
    const newText = 'خط اول\nخط دوم جدید\nخط سوم';

    const diff = renderColoredDiff(oldText, newText);

    expect(diff).toContain('- [2] خط دوم قدیمی');
    expect(diff).toContain('+ [2] خط دوم جدید');
  });

  it('should return no changes message if texts are identical', () => {
    const text = 'متن بدون تغییر';
    const diff = renderColoredDiff(text, text);

    expect(diff).toContain('هیچ تغییری در متن یافت نشد');
  });
});

describe('Document Scanner - File and Directory Batch Processing', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-writer-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should process and write corrections to file when write option is true', () => {
    const filePath = path.join(tempDir, 'test-doc.md');
    fs.writeFileSync(filePath, '# مستند آزمايشي\n\nاين يك تست مي باشد.', 'utf-8');

    const res = processFile(filePath, { mode: 'normalize', write: true });

    expect(res.hasChanges).toBe(true);
    const updatedContent = fs.readFileSync(filePath, 'utf-8');
    expect(updatedContent).toContain('# مستند آزمایشی');
    expect(updatedContent).toContain('این یک تست');
  });

  it('should scan a directory batch of mixed files (.md, .json, .txt)', () => {
    fs.writeFileSync(path.join(tempDir, 'file1.md'), 'متن اول با نيم فاصله مي رود.', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'متن دوم كاملا صحيح.', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify({ name: 'علي' }), 'utf-8');

    const summary = scanDirectoryOrFiles([tempDir], { mode: 'normalize' });

    expect(summary.totalFiles).toBe(3);
    expect(summary.filesWithIssues).toBeGreaterThan(0);
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);
  });
});
