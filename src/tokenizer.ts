import { TokenizeResult, TokenizerOptions } from './types';
import { SENTENCE_TERMINATORS, NON_BOUNDARY_PATTERNS } from './constants';
import { normalize } from './normalizer';

/**
 * Splits text into sentences based on SENTENCE_TERMINATORS.
 * Handles edge cases such as decimal numbers and abbreviations.
 * 
 * @param text The input string
 * @returns An array of sentences
 */
export function tokenizeSentences(text: string): string[] {
  if (!text) return [];

  // Protect non-boundaries by replacing them temporarily
  let protectedText = text;
  const nonBoundaryReplacements: { orig: string, repl: string }[] = [];
  
  NON_BOUNDARY_PATTERNS.forEach((pattern, index) => {
    const globalPattern = new RegExp(pattern.source, 'g');
    protectedText = protectedText.replace(globalPattern, match => {
      const repl = `__NON_BOUNDARY_${index}_${nonBoundaryReplacements.length}__`;
      nonBoundaryReplacements.push({ orig: match, repl });
      return repl;
    });
  });

  // Replace sentence terminators with a common split marker
  let splitText = protectedText;
  
  // Escape terminators for regex
  const escapedTerminators = SENTENCE_TERMINATORS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const terminatorPattern = new RegExp(`([${escapedTerminators.join('')}]+)`, 'g');
  
  // Add a special marker after terminators
  splitText = splitText.replace(terminatorPattern, '$1<SPLIT>');

  let sentences = splitText.split('<SPLIT>')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Restore non-boundaries
  sentences = sentences.map(sentence => {
    let restored = sentence;
    nonBoundaryReplacements.forEach(({ orig, repl }) => {
      restored = restored.replace(repl, orig);
    });
    return restored;
  });

  return sentences;
}

/**
 * Splits text into word tokens.
 * Handles Persian punctuation, ZWNJ-connected words, and numbers.
 * 
 * @param text The input string
 * @param options Tokenization options
 * @returns A TokenizeResult containing the tokens and their count
 */
export function tokenizeWords(text: string, options: TokenizerOptions = {}): TokenizeResult {
  if (!text) return { tokens: [], count: 0 };

  const {
    keepPunctuation = false,
    keepNumbers = true,
    normalize: doNormalize = false
  } = options;

  let processingText = text;
  if (doNormalize) {
    processingText = normalize(processingText);
  }

  const tokens: string[] = [];
  
  // Regex matches words (including ZWNJ), numbers, or punctuation/other characters
  // \p{L}: Letters
  // \p{M}: Marks (Diacritics)
  // \p{N}: Numbers
  // \u200C: ZWNJ
  const regex = /([\p{L}\p{M}\u200C]+)|([\p{N}\.]+)|([^\s\p{L}\p{N}\p{M}\u200C])/gu;
  
  let match;
  while ((match = regex.exec(processingText)) !== null) {
    const wordMatch = match[1];
    const numberMatch = match[2];
    const punctMatch = match[3];

    if (wordMatch) {
      tokens.push(wordMatch);
    } else if (numberMatch) {
      if (keepNumbers) {
        // Exclude standalone dots that might be captured as numbers
        if (numberMatch === '.') {
            if (keepPunctuation) tokens.push(numberMatch);
        } else {
            tokens.push(numberMatch);
        }
      }
    } else if (punctMatch) {
      if (keepPunctuation) tokens.push(punctMatch);
    }
  }

  return { tokens, count: tokens.length };
}

/**
 * Returns only meaningful words (no punctuation, no numbers).
 * 
 * @param text The input string
 * @returns An array of word strings
 */
export function extractWords(text: string): string[] {
  const result = tokenizeWords(text, { keepPunctuation: false, keepNumbers: false });
  return result.tokens;
}

/**
 * Quick word count.
 * 
 * @param text The input string
 * @returns The number of meaningful words in the text
 */
export function countWords(text: string): number {
  return extractWords(text).length;
}

/**
 * Quick sentence count.
 * 
 * @param text The input string
 * @returns The number of sentences in the text
 */
export function countSentences(text: string): number {
  return tokenizeSentences(text).length;
}
