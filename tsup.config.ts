import { defineConfig } from 'tsup';

export default defineConfig([
  // Main Library Build
  {
    entry: {
      index: 'src/index.ts',
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
      'llm-adapter': 'src/llm-adapter.ts',
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
  // Chrome Extension Standalone IIFE Bundle
  {
    entry: {
      'core-bundle': 'src/index.ts',
    },
    format: ['iife'],
    globalName: 'MHPersianWriter',
    dts: false,
    clean: false,
    minify: true,
    target: 'es2022',
    outDir: 'extension/scripts',
  },
]);
