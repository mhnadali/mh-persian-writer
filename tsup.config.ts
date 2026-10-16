import { defineConfig } from 'tsup';

export default defineConfig([
  // Main Library Build
  {
    entry: {
      index: 'src/index.ts',
      browser: 'src/browser.ts',
      normalizer: 'src/normalizer.ts',
      tokenizer: 'src/tokenizer.ts',
      'formal-writer': 'src/formal-writer.ts',
      numbers: 'src/numbers.ts',
      validators: 'src/validators.ts',
      stemmer: 'src/stemmer.ts',
      analyzer: 'src/analyzer.ts',
      'spell-checker': 'src/spell-checker.ts',
      jalali: 'src/jalali.ts',
      'document-builder': 'src/document-builder.ts',
      'document-scanner': 'src/document-scanner.ts',
      'document-scanner-core': 'src/document-scanner-core.ts',
      'llm-adapter': 'src/llm-adapter.ts',
      'colloquial-engine': 'src/colloquial-engine.ts',
      trie: 'src/trie.ts',
      'contextual-spell': 'src/contextual-spell.ts',
      cli: 'src/cli.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: true,
    sourcemap: true,
    minify: false,
    target: 'es2022',
    outDir: 'dist',
  },
  // Chrome Extension Standalone IIFE Bundle (Browser-pure without Node dependencies)
  {
    entry: {
      'core-bundle': 'src/browser.ts',
    },
    format: ['iife'],
    globalName: 'MHPersianWriter',
    dts: false,
    clean: false,
    minify: true,
    target: 'es2022',
    outDir: 'extension/scripts',
    footer: {
      js: 'if (typeof window !== "undefined") { window.MHPersianWriter = MHPersianWriter; } if (typeof globalThis !== "undefined") { globalThis.MHPersianWriter = MHPersianWriter; } if (typeof self !== "undefined") { self.MHPersianWriter = MHPersianWriter; }',
    },
  },
]);
