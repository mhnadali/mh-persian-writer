import { StemResult } from './types';
import { PERSIAN_PREFIXES, PERSIAN_SUFFIXES, VERB_STEMS, ZWNJ } from './constants';

/**
 * Removes the longest matching Persian suffix from a word.
 * @param word The word to remove the suffix from
 * @returns Object containing the base word and the removed suffix
 */
export function removeSuffix(word: string): { base: string; suffix: string } {
  const sortedSuffixes = [...PERSIAN_SUFFIXES].sort((a, b) => b.length - a.length);

  for (const suffix of sortedSuffixes) {
    if (word.endsWith(ZWNJ + suffix)) {
      return {
        base: word.slice(0, -(suffix.length + 1)),
        suffix: suffix
      };
    } else if (word.endsWith(suffix)) {
      return {
        base: word.slice(0, -suffix.length),
        suffix: suffix
      };
    }
  }

  return { base: word, suffix: '' };
}

/**
 * Removes a matching Persian prefix from a word.
 * @param word The word to remove the prefix from
 * @returns Object containing the base word and the removed prefix
 */
export function removePrefix(word: string): { base: string; prefix: string } {
  const sortedPrefixes = [...PERSIAN_PREFIXES].sort((a, b) => b.length - a.length);

  for (const prefix of sortedPrefixes) {
    if (word.startsWith(prefix + ZWNJ)) {
      return {
        base: word.slice(prefix.length + 1),
        prefix: prefix
      };
    } else if (word.startsWith(prefix)) {
      // Some prefixes might be attached directly, though usually with ZWNJ.
      // E.g., بی‌حوصله or بیحوصله. Let's allow direct match if needed.
      return {
        base: word.slice(prefix.length),
        prefix: prefix
      };
    }
  }

  return { base: word, prefix: '' };
}

/**
 * Checks if a word matches a known verb pattern.
 * @param word The word to check
 * @returns True if the word is likely a verb
 */
export function isVerb(word: string): boolean {
  if (word.startsWith('می' + ZWNJ) || word.startsWith('نمی' + ZWNJ) || word.startsWith('ب')) {
    return true;
  }
  
  const { base: noPrefixBase } = removePrefix(word);
  const { base: pureBase } = removeSuffix(noPrefixBase);

  if (VERB_STEMS[pureBase] || Object.values(VERB_STEMS).includes(pureBase)) {
    return true;
  }
  
  if (VERB_STEMS[word] || Object.values(VERB_STEMS).includes(word)) {
    return true;
  }

  return false;
}

/**
 * Gets the past and present stems of a known verb stem.
 * @param verb The verb stem (past or present)
 * @returns Object containing past and present stems, or null if not found
 */
export function getVerbStem(verb: string): { past: string; present: string } | null {
  if (VERB_STEMS[verb]) {
    return { past: verb, present: VERB_STEMS[verb] };
  }
  
  for (const [past, present] of Object.entries(VERB_STEMS)) {
    if (present === verb) {
      return { past, present };
    }
  }
  
  return null;
}

/**
 * Stems a Persian word by removing known prefixes and suffixes.
 * @param word The word to stem
 * @returns The stem result containing word, stem, prefix, and suffix
 */
export function stem(word: string): StemResult {
  let currentStem = word;
  
  const { base: afterPrefixBase, prefix } = removePrefix(currentStem);
  currentStem = afterPrefixBase;
  
  const { base: afterSuffixBase, suffix } = removeSuffix(currentStem);
  currentStem = afterSuffixBase;
  
  const result: StemResult = {
    word,
    stem: currentStem,
  };

  if (prefix) result.prefix = prefix;
  if (suffix) result.suffix = suffix;

  return result;
}

/**
 * Stems a batch of Persian words.
 * @param words The array of words to stem
 * @returns An array of stem results
 */
export function stemBatch(words: string[]): StemResult[] {
  return words.map(w => stem(w));
}

/**
 * Finds the root (stem) of a Persian word.
 * @param word The word to find the root for
 * @returns The root string
 */
export function findRoot(word: string): string {
  return stem(word).stem;
}
