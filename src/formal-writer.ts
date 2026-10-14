import { 
  FormalityCheckResult, 
  FormalityIssue, 
  LetterType, 
  FormalLetterParts,
  FormalityLevel 
} from './types';
import { 
  INFORMAL_TO_FORMAL_MAP, 
  LETTER_TEMPLATES,
  ZWNJ
} from './constants';

/**
 * Checks if a word is informal and returns its formal alternative.
 * @param word The word to check
 * @returns The formal alternative or null if not informal
 */
export function suggestFormalAlternative(word: string): string | null {
  const normalizedWord = word.trim();
  return INFORMAL_TO_FORMAL_MAP[normalizedWord] || null;
}

/**
 * Scans text and returns all informal words found with their positions and suggested replacements.
 * @param text The text to scan
 * @returns Array of formality issues
 */
export function detectInformalWords(text: string): FormalityIssue[] {
  const issues: FormalityIssue[] = [];
  
  // Using a regex to find words, considering Persian characters
  const wordsRegex = /[آ-ی]+/g;
  let match;
  
  while ((match = wordsRegex.exec(text)) !== null) {
    const word = match[0];
    const suggestion = suggestFormalAlternative(word);
    
    if (suggestion) {
      issues.push({
        word,
        suggestion,
        position: match.index,
        type: 'informal_word',
        severity: 'medium' // Defaulting to medium for general informal words
      });
    }
  }
  
  return issues;
}

/**
 * Returns just the formality score (0-100).
 * Calculates the score based on the density of informal words relative to total words.
 * 
 * @param text The text to score
 * @returns Formality score (0-100)
 */
export function calculateFormalityScore(text: string): number {
  if (!text || text.trim().length === 0) return 100;

  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = Math.max(words.length, 1);
  const issues = detectInformalWords(text);

  if (issues.length === 0) {
    let score = 100;
    if (!text.match(/[.!?؟]$/m) && text.length > 20) {
      score -= 5;
    }
    return score;
  }

  // Calculate weighted informal penalty
  let penaltyWeight = 0;
  for (const issue of issues) {
    if (issue.severity === 'high') penaltyWeight += 2;
    else if (issue.severity === 'medium') penaltyWeight += 1.5;
    else penaltyWeight += 1;
  }

  const informalRatio = Math.min(penaltyWeight / totalWords, 1);
  let score = Math.round((1 - informalRatio) * 100);

  if (!text.match(/[.!?؟]$/m) && text.length > 20) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}


/**
 * Analyzes text for formality. Returns level, score, found issues, suggestions, and auto-corrected text.
 * @param text The text to check
 * @returns Comprehensive formality check result
 */
export function checkFormality(text: string): FormalityCheckResult {
  const issues = detectInformalWords(text);
  let score = calculateFormalityScore(text);
  let correctedText = toFormal(text);
  
  // Determine level
  let level: FormalityLevel = 'informal';
  if (score >= 80) level = 'formal';
  else if (score >= 50) level = 'semi-formal';
  
  const suggestions = issues.map(issue => `به جای «${issue.word}» از «${issue.suggestion}» استفاده کنید.`);
  if (!text.match(/[.!?؟]$/m) && text.length > 20) {
    suggestions.push('در پایان جملات از علائم نگارشی مناسب مانند نقطه استفاده کنید.');
    issues.push({
      word: '',
      suggestion: '.',
      position: text.length,
      type: 'punctuation',
      severity: 'low'
    });
  }
  
  return {
    level,
    score,
    issues,
    suggestions,
    correctedText
  };
}

/**
 * Converts informal/colloquial Persian to formal writing.
 * @param text The text to convert
 * @returns Formalized text
 */
export function toFormal(text: string): string {
  let result = text;
  
  // Replace words based on INFORMAL_TO_FORMAL_MAP
  // We use word boundaries and lookarounds for Persian words
  for (const [informal, formal] of Object.entries(INFORMAL_TO_FORMAL_MAP)) {
    // A regex to match the exact word, not part of another word
    const regex = new RegExp(`(?<=^|[\\s،؛.!?؟()])${informal}(?=[\\s،؛.!?؟()]|$)`, 'g');
    result = result.replace(regex, formal);
  }
  
  // Basic ZWNJ spacing fix (e.g., 'می ' -> 'می‌')
  result = result.replace(/\b(می|نمی)\s+([آ-ی]+)\b/g, `$1${ZWNJ}$2`);
  
  return result;
}

/**
 * Returns a template skeleton for the given letter type.
 * @param type The type of the letter
 * @returns Skeleton of letter parts
 */
export function getLetterTemplate(type: LetterType): FormalLetterParts {
  const base: FormalLetterParts = {
    greeting: LETTER_TEMPLATES.greetings[0],
    introduction: LETTER_TEMPLATES.introductions[0],
    body: 'متن اصلی نامه...',
    closing: LETTER_TEMPLATES.closings[0],
  };

  switch (type) {
    case 'request':
      base.request = LETTER_TEMPLATES.requests[0];
      break;
    case 'response':
      base.introduction = 'عطف به درخواست مورخ ...';
      break;
    case 'complaint':
      base.introduction = 'بدین‌وسیله به استحضار می‌رساند';
      base.request = 'شایسته است دستور اقدام صادر فرمایید';
      break;
    // other types can be refined similarly
  }

  return base;
}

/**
 * Generates a complete formal administrative letter from parts.
 * @param type The type of the letter
 * @param parts The provided letter parts
 * @returns Formatted letter text
 */
export function generateLetter(type: LetterType, parts: Partial<FormalLetterParts>): string {
  const template = getLetterTemplate(type);
  const finalParts = { ...template, ...parts };
  
  let letter = '';
  
  if (finalParts.date || finalParts.referenceNumber) {
    if (finalParts.date) letter += `تاریخ: ${finalParts.date}\n`;
    if (finalParts.referenceNumber) letter += `شماره: ${finalParts.referenceNumber}\n`;
    letter += '\n';
  }
  
  letter += `${finalParts.greeting}\n\n`;
  letter += `${finalParts.introduction} ${finalParts.body}`;
  
  if (finalParts.request) {
    letter += `\n${finalParts.request}`;
  }
  
  letter += `\n\n${finalParts.closing}`;
  
  if (finalParts.signature) {
    letter += `\n\n${finalParts.signature}`;
  }
  
  return letter;
}

/**
 * Validates if a text has proper formal letter structure.
 * @param text The letter text
 * @returns Validation result
 */
export function validateLetterStructure(text: string): { isValid: boolean; missing: string[]; suggestions: string[] } {
  const missing: string[] = [];
  const suggestions: string[] = [];
  
  let hasGreeting = false;
  for (const greeting of LETTER_TEMPLATES.greetings) {
    if (text.includes(greeting) || text.includes('سلام') || text.includes('احتراما')) {
      hasGreeting = true;
      break;
    }
  }
  
  if (!hasGreeting) {
    missing.push('greeting');
    suggestions.push('نامه باید با یک سرآغاز رسمی مانند "با سلام و احترام" شروع شود.');
  }
  
  let hasClosing = false;
  for (const closing of LETTER_TEMPLATES.closings) {
    if (text.includes(closing) || text.includes('تشکر') || text.includes('سپاس')) {
      hasClosing = true;
      break;
    }
  }
  
  if (!hasClosing) {
    missing.push('closing');
    suggestions.push('نامه باید شامل یک عبارت پایانی رسمی مانند "با تشکر و احترام" باشد.');
  }
  
  const isValid = missing.length === 0;
  
  return { isValid, missing, suggestions };
}
