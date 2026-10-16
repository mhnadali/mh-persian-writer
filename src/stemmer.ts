import { StemResult } from './types';
import {
  PERSIAN_PREFIXES,
  PERSIAN_SUFFIXES,
  VERB_STEMS,
  BROKEN_PLURALS_MAP,
  BASE_PERSIAN_DICTIONARY,
  ZWNJ,
} from './constants';

const baseDictionarySet = new Set<string>(BASE_PERSIAN_DICTIONARY);

/**
 * Removes the longest matching Persian suffix from a word.
 * @param word The word to remove the suffix from
 * @returns Object containing the base word and the removed suffix
 */
export function removeSuffix(word: string): { base: string; suffix: string } {
  // اگر واژه مستقیماً جزو فرهنگ لغات پایه باشد و فاقد نیم‌فاصله تفکیک‌کننده پسوند باشد، خود کلمه ریشه است
  if (!word.includes(ZWNJ) && baseDictionarySet.has(word)) {
    return { base: word, suffix: '' };
  }

  const sortedSuffixes = [...PERSIAN_SUFFIXES].sort((a, b) => b.length - a.length);

  for (const suffix of sortedSuffixes) {
    if (word.endsWith(ZWNJ + suffix) && word.length >= suffix.length + 2) {
      return {
        base: word.slice(0, -(suffix.length + 1)),
        suffix: suffix
      };
    } else if (word.endsWith(suffix) && word.length >= suffix.length + 2) {
      const remainingBase = word.slice(0, -suffix.length);
      if (remainingBase.length >= 2) {
        return {
          base: remainingBase,
          suffix: suffix
        };
      }
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
    if (word.startsWith(prefix + ZWNJ) && word.length >= prefix.length + 2) {
      return {
        base: word.slice(prefix.length + 1),
        prefix: prefix
      };
    } else if (word.startsWith(prefix) && word.length >= prefix.length + 2 && (prefix === 'می' || prefix === 'نمی')) {
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
  if (word.startsWith('می' + ZWNJ) || word.startsWith('نمی' + ZWNJ)) {
    return true;
  }

  const pastStems = Object.keys(VERB_STEMS);
  const presentStems = Object.values(VERB_STEMS);
  
  // If starting with imperative prefix 'ب', verify that the remainder has a verb stem
  if (word.startsWith('ب') && word.length >= 3) {
    const withoutB = word.slice(1);
    if (VERB_STEMS[withoutB] || presentStems.includes(withoutB)) {
      return true;
    }
    const { base: pureWithoutB } = removeSuffix(withoutB);
    if (VERB_STEMS[pureWithoutB] || presentStems.includes(pureWithoutB)) {
      return true;
    }
  }

  const { base: noPrefixBase } = removePrefix(word);
  const { base: pureBase } = removeSuffix(noPrefixBase);

  if (VERB_STEMS[pureBase] || presentStems.includes(pureBase)) {
    return true;
  }
  
  if (VERB_STEMS[word] || presentStems.includes(word)) {
    return true;
  }

  // بررسی شناسه‌های فعلی شخصی: م، ی، د، یم، ید، ند
  const personalEndings = ['ند', 'ید', 'یم', 'د', 'ی', 'م'];
  for (const ending of personalEndings) {
    if (noPrefixBase.endsWith(ending) && noPrefixBase.length >= ending.length + 2) {
      const stemPart = noPrefixBase.slice(0, -ending.length);
      if (pastStems.includes(stemPart) || presentStems.includes(stemPart)) {
        return true;
      }
    }
  }

  // بررسی ضمایر متصل مفعولی چسبیده به فعل: دیدمشان، دیدمش، خواندیمش
  const pronominalClitics = ['شان', 'تان', 'مان', 'ش', 'ت', 'م'];
  for (const clitic of pronominalClitics) {
    if (word.endsWith(clitic) && word.length >= clitic.length + 3) {
      const baseWithoutClitic = word.slice(0, -clitic.length);
      if (isVerb(baseWithoutClitic)) {
        return true;
      }
    }
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
 * Handles broken plurals by mapping them to their standard base.
 * 
 * @param word The word to stem
 * @returns The stem result containing word, stem, prefix, and suffix
 */
export function stem(word: string): StemResult {
  const standardPlural = BROKEN_PLURALS_MAP[word];
  const targetWord = standardPlural || word;

  let currentStem = targetWord;
  
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
