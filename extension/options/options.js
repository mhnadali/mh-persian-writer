/**
 * ویراستار فارسی ام‌اچ (M.H.) - مدیریت و ذخیره‌سازی تنظیمات و واژه‌نامه شخصی
 * M.H. Persian Writer - Options & Custom Dictionary Controller
 *
 * @author M.H. Nadali
 */

document.addEventListener('DOMContentLoaded', () => {
  const Writer = window.MHPersianWriter;

  // المان‌های تنظیمات
  const optRealtime = document.getElementById('opt-realtime');
  const optFloating = document.getElementById('opt-floating');
  const optTone = document.getElementById('opt-tone');
  const optDigits = document.getElementById('opt-digits');
  const optSpell = document.getElementById('opt-spell');
  const optZwnj = document.getElementById('opt-zwnj');
  const btnSave = document.getElementById('btn-save');
  const saveMsg = document.getElementById('save-msg');

  // المان‌های واژه‌نامه اختصاصی
  const dictWordInput = document.getElementById('dict-word-input');
  const btnAddWord = document.getElementById('btn-add-word');
  const dictChipsContainer = document.getElementById('dict-chips-container');

  // المان‌های پلی‌گراند
  const testInput = document.getElementById('test-input');
  const btnTest = document.getElementById('btn-test');
  const testOutput = document.getElementById('test-output');

  let customDictionary = [];

  // ۱. بارگذاری تنظیمات و واژه‌نامه شخصی
  chrome.storage.sync.get(['amach_settings', 'amach_custom_dict'], (result) => {
    if (result.amach_settings) {
      const s = result.amach_settings;
      if (optRealtime) optRealtime.checked = s.realtimeAssistant ?? true;
      if (optFloating) optFloating.checked = s.floatingButton ?? true;
      if (optTone && s.formalityTone) optTone.value = s.formalityTone;
      if (optDigits) optDigits.checked = s.persianDigits ?? true;
      if (optSpell) optSpell.checked = s.spellCheck ?? true;
      if (optZwnj) optZwnj.checked = s.autoHalfSpace ?? true;
    }

    if (Array.isArray(result.amach_custom_dict)) {
      customDictionary = result.amach_custom_dict;
    }
    renderCustomDictChips();
  });

  // رندر واژه‌های دیکشنری شخصی به صورت چیپ‌های تعاملی
  function renderCustomDictChips() {
    if (!dictChipsContainer) return;
    dictChipsContainer.innerHTML = '';

    if (customDictionary.length === 0) {
      dictChipsContainer.innerHTML = '<span class="dict-empty-note">هنوز واژه‌ای به واژه‌نامه شخصی خود اضافه نکرده‌اید.</span>';
      return;
    }

    customDictionary.forEach((word, index) => {
      const chip = document.createElement('span');
      chip.className = 'dict-chip';
      chip.innerHTML = `
        <span>${word}</span>
        <span class="chip-del" data-index="${index}" title="حذف واژه">✕</span>
      `;
      dictChipsContainer.appendChild(chip);
    });

    // افزودن رویداد حذف به هر چیپ
    dictChipsContainer.querySelectorAll('.chip-del').forEach(delBtn => {
      delBtn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (!isNaN(idx) && idx >= 0 && idx < customDictionary.length) {
          customDictionary.splice(idx, 1);
          chrome.storage.sync.set({ amach_custom_dict: customDictionary }, () => {
            renderCustomDictChips();
          });
        }
      });
    });
  }

  // افزودن واژه جدید به دیکشنری شخصی
  function addCustomWord() {
    if (!dictWordInput) return;
    const word = dictWordInput.value.trim();
    if (!word) return;

    if (!customDictionary.includes(word)) {
      customDictionary.push(word);
      chrome.storage.sync.set({ amach_custom_dict: customDictionary }, () => {
        renderCustomDictChips();
        dictWordInput.value = '';
        dictWordInput.focus();
      });
    } else {
      dictWordInput.value = '';
    }
  }

  if (btnAddWord) {
    btnAddWord.addEventListener('click', addCustomWord);
  }

  if (dictWordInput) {
    dictWordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomWord();
      }
    });
  }

  // ذخیره مقادیر جدید تنظیمات
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const newSettings = {
        realtimeAssistant: optRealtime ? optRealtime.checked : true,
        floatingButton: optFloating ? optFloating.checked : true,
        persianDigits: optDigits ? optDigits.checked : true,
        spellCheck: optSpell ? optSpell.checked : true,
        autoHalfSpace: optZwnj ? optZwnj.checked : true,
        formalityTone: optTone ? optTone.value : 'administrative'
      };

      chrome.storage.sync.set({ amach_settings: newSettings }, () => {
        if (saveMsg) {
          saveMsg.classList.add('show');
          setTimeout(() => {
            saveMsg.classList.remove('show');
          }, 2400);
        }
      });
    });
  }

  // آزمون زنده تنظیمات در پلی‌گراند با پشتیبانی از لحن‌های انتخابی و دیکشنری شخصی
  if (btnTest && testInput && testOutput && Writer) {
    btnTest.addEventListener('click', () => {
      let text = testInput.value;
      if (!text.trim()) {
        testOutput.textContent = 'لطفاً متنی برای تست وارد نمایید.';
        return;
      }

      const tone = optTone ? optTone.value : 'administrative';

      // رسمی‌سازی با در نظر گرفتن لحن انتخابی
      text = Writer.toFormal(text, { mode: tone });

      // غلط‌یابی در صورت فعال بودن با اعمال دیکشنری شخصی
      if (optSpell && optSpell.checked) {
        const spell = Writer.spellCheck(text, { customDictionary });
        text = spell.correctedText;
      }

      // نرمال‌سازی با گزینه‌های فعال
      text = Writer.normalize(text, {
        persianCharacters: true,
        persianDigits: optDigits ? optDigits.checked : true,
        fixSpacing: optZwnj ? optZwnj.checked : true,
        removeDiacritics: true,
        fixPunctuation: true
      });

      testOutput.textContent = text;
    });
  }
});
