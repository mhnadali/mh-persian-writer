import { defineConfig } from 'tsup';

export default defineConfig({
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
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
  minify: false,
  target: 'es2022',
  outDir: 'dist',
});
