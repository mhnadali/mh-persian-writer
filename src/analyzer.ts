import { TextAnalysis, WordFrequency } from './types';
import { PERSIAN_ALPHABET, ZWNJ } from './constants';
import { tokenizeWords, tokenizeSentences } from './tokenizer';
import { normalize } from './normalizer';

/**
 * Extracts a string array of tokens from a tokenizer result or array.
 */
function getTokens(result: any): string[] {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.tokens)) return result.tokens;
  return [];
}

const PERSIAN_EXTENDED_CHARS = new Set<string>([
  ...PERSIAN_ALPHABET,
  'ء', 'ئ', 'ؤ', 'ة', 'ۀ', 'إ', 'أ',
  '\u0654', // Combining Hamza Above (used in هٔ)
  '\u064B', '\u064C', '\u064D', '\u064E', '\u064F', '\u0650', '\u0651', '\u0652', '\u0670', // Diacritics
  '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹',
  ZWNJ,
  '،', '؛', '؟', '«', '»', '٪',
]);

/**
 * Counts the number of Persian characters in a text.
 * @param text The input text
 * @returns The number of Persian characters
 */
export function countPersianChars(text: string): number {
  let count = 0;
  for (const char of text) {
    if (PERSIAN_EXTENDED_CHARS.has(char)) {
      count++;
    }
  }
  return count;
}

/**
 * Checks if a text is primarily Persian (>50% Persian chars).
 * @param text The input text
 * @returns True if primarily Persian
 */
export function isPersian(text: string): boolean {
  const chars = text.replace(/\s/g, '');
  if (chars.length === 0) return false;
  return (countPersianChars(chars) / chars.length) > 0.5;
}

/**
 * Simple language detection based on character ratios.
 * @param text The input text
 * @returns Detected language
 */
export function detectLanguage(text: string): 'persian' | 'arabic' | 'english' | 'mixed' {
  const chars = text.replace(/\s/g, '');
  if (chars.length === 0) return 'mixed';

  let persianCount = countPersianChars(chars);
  let englishCount = (chars.match(/[a-zA-Z]/g) || []).length;
  // Specific Arabic characters not part of standard Persian alphabet
  let arabicOnlyCount = (chars.match(/[يىكَة\u064B-\u064D]/g) || []).length;

  const total = chars.length;
  
  if (englishCount / total > 0.5) return 'english';
  if (arabicOnlyCount / total >= 0.10) return 'arabic';
  if (persianCount / total > 0.5) return 'persian';
  
  return 'mixed';
}

/**
 * Analyzes a text and returns comprehensive statistics.
 * @param text The input text
 * @returns TextAnalysis object containing various text statistics
 */
export function analyzeText(text: string): TextAnalysis {
  const normalizedText = normalize(text);
  
  const words = getTokens(tokenizeWords(normalizedText));
  const sentences = getTokens(tokenizeSentences(normalizedText));
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
  
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;
  
  const charCountWithSpaces = text.length;
  const charCount = text.replace(/\s/g, '').length;
  const zwnjCount = (text.match(new RegExp(ZWNJ, 'g')) || []).length;
  
  const persianCharRatio = charCount > 0 ? countPersianChars(text) / charCount : 0;
  
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const wordsCharLength = words.reduce((acc, word) => acc + word.length, 0);
  const avgWordLength = wordCount > 0 ? wordsCharLength / wordCount : 0;
  
  const estimatedReadingTime = wordCount > 0 ? Math.ceil((wordCount / 200) * 60) : 0;
  
  const uniqueWords = new Set(words).size;
  const lexicalDiversity = wordCount > 0 ? uniqueWords / wordCount : 0;
  
  let readabilityScore = 100 - (avgSentenceLength * 2) - (avgWordLength * 5);
  if (readabilityScore < 0) readabilityScore = 0;
  if (readabilityScore > 100) readabilityScore = 100;
  
  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    charCount,
    charCountWithSpaces,
    avgSentenceLength,
    avgWordLength,
    zwnjCount,
    persianCharRatio,
    estimatedReadingTime,
    lexicalDiversity,
    readabilityScore
  };
}

/**
 * Returns word frequency list sorted by count.
 * @param text The input text
 * @param topN Number of top words to return (default 10)
 * @returns Array of WordFrequency objects
 */
export function getWordFrequency(text: string, topN: number = 10): WordFrequency[] {
  const words = getTokens(tokenizeWords(normalize(text)));
  const totalWords = words.length;
  
  const frequencyMap = new Map<string, number>();
  for (const word of words) {
    if (word.trim().length === 0) continue;
    frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
  }
  
  const sorted = Array.from(frequencyMap.entries())
    .map(([word, count]) => ({
      word,
      count,
      percentage: totalWords > 0 ? (count / totalWords) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
    
  return sorted.slice(0, topN);
}

/**
 * Returns a human-readable Persian summary string of the text stats.
 * @param text The input text
 * @returns Persian summary string
 */
export function getSummaryStats(text: string): string {
  const stats = analyzeText(text);
  
  // A simple function to format numbers as Persian digits
  const toPersianDigits = (num: number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
  };

  const pWordCount = toPersianDigits(stats.wordCount);
  const pSentenceCount = toPersianDigits(stats.sentenceCount);
  const pParagraphCount = toPersianDigits(stats.paragraphCount);
  
  const minutes = Math.floor(stats.estimatedReadingTime / 60);
  const seconds = stats.estimatedReadingTime % 60;
  
  let timeStr = '';
  if (minutes > 0) {
    timeStr += `${toPersianDigits(minutes)} دقیقه`;
  }
  if (seconds > 0 || minutes === 0) {
    if (timeStr) timeStr += ' و ';
    timeStr += `${toPersianDigits(seconds)} ثانیه`;
  }

  return `این متن شامل ${pWordCount} واژه در ${pSentenceCount} جمله و ${pParagraphCount} پاراگراف است. زمان تقریبی مطالعه: ${timeStr}.`;
}
