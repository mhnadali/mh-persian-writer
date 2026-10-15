/**
 * ویراستار فارسی اماچ - ذخیره و مدیریت تنظیمات
 * Amach Options Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const optFloating = document.getElementById('opt-floating');
  const optDigits = document.getElementById('opt-digits');
  const optSpell = document.getElementById('opt-spell');
  const optZwnj = document.getElementById('opt-zwnj');
  const btnSave = document.getElementById('btn-save');
  const saveMsg = document.getElementById('save-msg');

  // بارگذاری مقادیر فعلی
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
      saveMsg.style.display = 'block';
      setTimeout(() => {
        saveMsg.style.display = 'none';
      }, 2500);
    });
  });
});
