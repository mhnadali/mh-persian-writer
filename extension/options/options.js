/**
 * ویراستار فارسی ام‌اچ (M.H.) - مدیریت و ذخیره‌سازی تنظیمات
 * M.H. Persian Writer - Options & Playground Controller
 *
 * @author M.H. Nadali
 */

document.addEventListener('DOMContentLoaded', () => {
  const Writer = window.MHPersianWriter;
  const optFloating = document.getElementById('opt-floating');
  const optDigits = document.getElementById('opt-digits');
  const optSpell = document.getElementById('opt-spell');
  const optZwnj = document.getElementById('opt-zwnj');
  const btnSave = document.getElementById('btn-save');
  const saveMsg = document.getElementById('save-msg');

  const testInput = document.getElementById('test-input');
  const btnTest = document.getElementById('btn-test');
  const testOutput = document.getElementById('test-output');

  // بارگذاری مقادیر ذخیره‌شده
  chrome.storage.sync.get(['amach_settings'], (result) => {
    if (result.amach_settings) {
      const s = result.amach_settings;
      optFloating.checked = s.floatingButton ?? true;
      optDigits.checked = s.persianDigits ?? true;
      optSpell.checked = s.spellCheck ?? true;
      optZwnj.checked = s.autoHalfSpace ?? true;
    }
  });

  // ذخیره مقادیر جدید
  btnSave.addEventListener('click', () => {
    const newSettings = {
      floatingButton: optFloating.checked,
      persianDigits: optDigits.checked,
      spellCheck: optSpell.checked,
      autoHalfSpace: optZwnj.checked,
      formalityTone: 'administrative'
    };

    chrome.storage.sync.set({ amach_settings: newSettings }, () => {
      saveMsg.classList.add('show');
      setTimeout(() => {
        saveMsg.classList.remove('show');
      }, 2400);
    });
  });

  // آزمون زنده تنظیمات در پلی‌گراند
  if (btnTest && testInput && testOutput && Writer) {
    btnTest.addEventListener('click', () => {
      let text = testInput.value;
      if (!text.trim()) {
        testOutput.textContent = 'لطفاً متنی برای تست وارد نمایید.';
        return;
      }

      // غلط‌یابی در صورت فعال بودن
      if (optSpell.checked) {
        const spell = Writer.spellCheck(text);
        text = spell.correctedText;
      }

      // نرمال‌سازی با گزینه‌های فعال
      text = Writer.normalize(text, {
        persianCharacters: true,
        persianDigits: optDigits.checked,
        fixSpacing: optZwnj.checked,
        removeDiacritics: true,
        fixPunctuation: true
      });

      testOutput.textContent = text;
    });
  }
});
