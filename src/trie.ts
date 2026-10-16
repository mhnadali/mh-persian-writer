/**
 * ساختار داده درخت پیشوندی فشرده و کارآمد برای زبان فارسی
 * High-Performance Compact Persian Trie Data Structure
 *
 * قابلیت‌ها:
 * ۱. جستجو و درج با زمان O(L) مستقل از اندازه کل واژه‌نامه
 * ۲. جستجوی تقریبی دامرو-لون‌اشتاین (Fuzzy Search) روی Trie با هرس شاخه‌ای
 * ۳. وزن‌دهی به حروف هم‌آوا و کلیدهای مجاور کیبورد فارسی
 * ۴. بررسی و تفکیک کلمات مرکب و پیشوندی
 *
 * @module trie
 * @author M.H. Nadali
 */

import { HOMOPHONE_MAP, KEYBOARD_NEIGHBORS } from './constants';

export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency?: number;
}

export interface TrieSearchResult {
  word: string;
  distance: number;
  frequency: number;
}

/**
 * کلاسی با کارایی بالا جهت نگهداری و پیمایش ده‌ها هزار کلمه فارسی
 */
export class PersianTrie {
  public root: TrieNode;
  private _size: number = 0;

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode {
    return {
      children: new Map<string, TrieNode>(),
      isEndOfWord: false,
      frequency: 1,
    };
  }

  /**
   * تعداد واژگان موجود در درخت
   */
  public get size(): number {
    return this._size;
  }

  /**
   * درج یک واژه در درخت
   */
  public insert(word: string, frequency: number = 1): void {
    if (!word) return;
    let current = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      let next = current.children.get(char);
      if (!next) {
        next = this.createNode();
        current.children.set(char, next);
      }
      current = next;
    }
    if (!current.isEndOfWord) {
      this._size++;
    }
    current.isEndOfWord = true;
    current.frequency = Math.max(current.frequency || 1, frequency);
  }

  /**
   * درج دسته‌جمعی واژگان
   */
  public insertBatch(words: Iterable<string> | Record<string, number>): void {
    if (Array.isArray(words) || words instanceof Set) {
      for (const word of words as Iterable<string>) {
        this.insert(word);
      }
    } else if (typeof words === 'object' && words !== null) {
      for (const [word, freq] of Object.entries(words as Record<string, number>)) {
        this.insert(word, Number(freq));
      }
    }
  }

  /**
   * بررسی وجود دقیق یک واژه در واژه‌نامه در زمان O(L)
   */
  public has(word: string): boolean {
    if (!word) return false;
    let current = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const next = current.children.get(char);
      if (!next) return false;
      current = next;
    }
    return current.isEndOfWord;
  }

  /**
   * دریافت فرکانس واژه (در صورت عدم وجود ۰ بازمی‌گرداند)
   */
  public getFrequency(word: string): number {
    if (!word) return 0;
    let current = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const next = current.children.get(char);
      if (!next) return 0;
      current = next;
    }
    return current.isEndOfWord ? (current.frequency || 1) : 0;
  }

  /**
   * بررسی شروع کلمات با یک پیشوند خاص
   */
  public startsWith(prefix: string): boolean {
    if (!prefix) return true;
    let current = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const char = prefix[i];
      const next = current.children.get(char);
      if (!next) return false;
      current = next;
    }
    return true;
  }

  /**
   * جستجوی سریع هوشمند دامرو-لون‌اشتاین با پیمایش درخت پیشوندی
   * این روش بسیار سریع‌تر از محاسبه فاصله تک‌تک کلمات واژه‌نامه است.
   *
   * @param targetWord کلمه هدف که احتمالا دارای غلط املایی است
   * @param maxDistance حداکثر فاصله مجاز ویرایشی (پیش‌فرض ۲)
   * @param usePhonetics وزن کمتر به حروف هم‌آوا و کلیدهای مجاور
   */
  public searchFuzzy(
    targetWord: string,
    maxDistance: number = 2.0,
    usePhonetics: boolean = true
  ): TrieSearchResult[] {
    const results: TrieSearchResult[] = [];
    if (!targetWord) return results;

    const targetLen = targetWord.length;
    // سطر اولیه الگوریتم دامرو-لون‌اشتاین
    const initialRow: number[] = [];
    for (let i = 0; i <= targetLen; i++) {
      initialRow.push(i);
    }

    // پیمایش بازگشتی شاخه‌ها با هرس شاخه‌های نامرتبط
    for (const [char, childNode] of this.root.children.entries()) {
      this.searchRecursive(
        childNode,
        char,
        '',
        targetWord,
        initialRow,
        null,
        results,
        maxDistance,
        usePhonetics
      );
    }

    // مرتب‌سازی نتایج: ابتدا کمترین فاصله ویرایشی، سپس بالاترین فرکانس کاربرد
    results.sort((a, b) => {
      if (Math.abs(a.distance - b.distance) > 0.001) {
        return a.distance - b.distance;
      }
      return b.frequency - a.frequency;
    });

    return results;
  }

  private searchRecursive(
    node: TrieNode,
    char: string,
    previousWord: string,
    targetWord: string,
    previousRow: number[],
    prevChar: string | null,
    results: TrieSearchResult[],
    maxDistance: number,
    usePhonetics: boolean
  ): void {
    const word = previousWord + char;
    const targetLen = targetWord.length;
    const currentRow: number[] = [previousRow[0] + 1];

    let minRowCost = currentRow[0];

    for (let col = 1; col <= targetLen; col++) {
      const targetChar = targetWord[col - 1];

      let cost = 1.0;
      if (char === targetChar) {
        cost = 0;
      } else if (usePhonetics) {
        const homophones = HOMOPHONE_MAP[char];
        if (homophones && homophones.includes(targetChar)) {
          cost = 0.5; // هم‌آوا
        } else {
          const neighbors = KEYBOARD_NEIGHBORS[char];
          if (neighbors && neighbors.includes(targetChar)) {
            cost = 0.6; // مجاورت فیزیکی روی کیبورد فارسی
          }
        }
      }

      const insertCost = currentRow[col - 1] + 1.0;
      const deleteCost = previousRow[col] + 1.0;
      const replaceCost = previousRow[col - 1] + cost;

      let cellValue = Math.min(insertCost, deleteCost, replaceCost);

      // Transposition (جابجایی دو حرف متوالی)
      if (
        prevChar !== null &&
        col > 1 &&
        char === targetWord[col - 2] &&
        prevChar === targetWord[col - 1]
      ) {
        cellValue = Math.min(cellValue, previousRow[col - 2] + 0.8);
      }

      currentRow.push(cellValue);
      if (cellValue < minRowCost) {
        minRowCost = cellValue;
      }
    }

    // اگر واژه معتبر بود و فاصله کمتر یا مساوی حداکثر بود، ذخیره کن
    if (node.isEndOfWord && currentRow[targetLen] <= maxDistance) {
      results.push({
        word,
        distance: currentRow[targetLen],
        frequency: node.frequency || 1,
      });
    }

    // هرس شاخه (Branch Pruning): اگر کمترین هزینه در سطر جاری از maxDistance بیشتر باشد، ادامه نده
    if (minRowCost <= maxDistance) {
      for (const [nextChar, childNode] of node.children.entries()) {
        this.searchRecursive(
          childNode,
          nextChar,
          word,
          targetWord,
          currentRow,
          char,
          results,
          maxDistance,
          usePhonetics
        );
      }
    }
  }

  /**
   * دریافت تمام کلمات موجود در درخت با یک پیشوند مشخص
   */
  public findWordsWithPrefix(prefix: string, maxLimit: number = 50): string[] {
    const list: string[] = [];
    if (!prefix) return list;

    let current = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const char = prefix[i];
      const next = current.children.get(char);
      if (!next) return list;
      current = next;
    }

    this.collectWords(current, prefix, list, maxLimit);
    return list;
  }

  private collectWords(node: TrieNode, currentWord: string, list: string[], limit: number): void {
    if (list.length >= limit) return;
    if (node.isEndOfWord) {
      list.push(currentWord);
    }
    for (const [char, childNode] of node.children.entries()) {
      if (list.length >= limit) break;
      this.collectWords(childNode, currentWord + char, list, limit);
    }
  }
}
