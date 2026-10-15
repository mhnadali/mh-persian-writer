/**
 * ویراستار فارسی ام‌اچ (M.H.) - کنترلر رابط کاربری پاپ‌آپ
 * M.H. Persian Writer - Interactive Popup Controller
 * Designed per UI/UX Designer Agent Standards
 *
 * @author M.H. Nadali
 */

document.addEventListener('DOMContentLoaded', () => {
  const Writer = window.MHPersianWriter;
  if (!Writer) {
    console.error('[M.H. Writer] MHPersianWriter core bundle not loaded.');
    return;
  }

  // المان‌های DOM
  const inputEl = document.getElementById('popup-input');
  const statWords = document.getElementById('stat-words');
  const statChars = document.getElementById('stat-chars');
  const statScore = document.getElementById('stat-score');
  const statTime = document.getElementById('stat-time');
  const formalityIndicator = document.getElementById('formality-indicator');
  const formalityText = document.getElementById('formality-text');

  const btnPaste = document.getElementById('btn-paste');
  const btnClear = document.getElementById('btn-clear');
  const btnNormalize = document.getElementById('btn-normalize');
  const btnFormalize = document.getElementById('btn-formalize');
  const btnSpell = document.getElementById('btn-spell');
  const btnCopy = document.getElementById('btn-copy');
  const copySubText = document.getElementById('copy-sub-text');

  const resultsPanel = document.getElementById('results-panel');
  const panelTitle = document.getElementById('panel-title');
  const panelBody = document.getElementById('panel-body');
  const btnApplyAll = document.getElementById('btn-apply-all');
  const btnClosePanel = document.getElementById('btn-close-panel');

  let currentSpellIssues = [];

  // به‌روزرسانی آنی آمار و شاخص‌های کیفی متن
  function updateStats() {
    const text = inputEl.value;
    const len = text.length;

    statChars.textContent = `${Writer.toPersianDigits(len.toString())} کاراکتر`;

    if (!text.trim()) {
      statWords.textContent = '۰';
      statScore.textContent = '۱۰۰٪';
      statTime.textContent = '۰ ثانیه';
      formalityText.textContent = 'رسمی و اداری';
      formalityIndicator.className = 'formality-badge';
      return;
    }

    const words = Writer.countWords(text);
    statWords.textContent = Writer.toPersianDigits(words.toString());

    // تخمین زمان خواندن (میانگین سرعت خواندن فارسی: ۲۰۰ واژه در دقیقه)
    const seconds = Math.max(1, Math.round((words / 200) * 60));
    if (seconds < 60) {
      statTime.textContent = `~${Writer.toPersianDigits(seconds.toString())} ثانیه`;
    } else {
      const minutes = Math.ceil(seconds / 60);
      statTime.textContent = `~${Writer.toPersianDigits(minutes.toString())} دقیقه`;
    }

    // تحلیل رسمیت متن
    const formality = Writer.checkFormality(text);
    const score = formality.score;
    statScore.textContent = `${Writer.toPersianDigits(score.toString())}٪`;

    formalityIndicator.className = 'formality-badge';
    if (score >= 80) {
      formalityText.textContent = 'رسمی و اداری';
    } else if (score >= 50) {
      formalityIndicator.classList.add('warning');
      formalityText.textContent = 'نیمه‌رسمی';
    } else {
      formalityIndicator.classList.add('danger');
      formalityText.textContent = 'غیررسمی / محاوره';
    }
  }

  inputEl.addEventListener('input', updateStats);

  // پاک‌سازی کادر
  btnClear.addEventListener('click', () => {
    if (!inputEl.value) return;
    inputEl.value = '';
    updateStats();
    resultsPanel.classList.add('hidden');
    inputEl.focus();
  });

  // الصاق از کلیپ‌بورد
  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        inputEl.value = text;
        updateStats();
        showNotification('متن از حافظه کلیپ‌بورد الصاق شد.');
      }
    } catch (e) {
      inputEl.focus();
    }
  });

  // ۱. پاک‌سازی و نیم‌فاصله‌گذاری (Normalize)
  btnNormalize.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text.trim()) {
      showNotification('لطفاً ابتدا متنی را وارد نمایید.', 'warning');
      return;
    }

    inputEl.value = Writer.normalize(text, {
      persianCharacters: true,
      persianDigits: true,
      fixSpacing: true,
      removeDiacritics: true,
      fixPunctuation: true,
    });
    updateStats();
    showNotification('متن با موفقیت پاک‌سازی، یکدست و نیم‌فاصله‌گذاری شد ✨');
  });

  // ۲. تبدیل به نگارش رسمی و اداری (Formalize)
  btnFormalize.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text.trim()) {
      showNotification('لطفاً ابتدا متنی را وارد نمایید.', 'warning');
      return;
    }

    const check = Writer.checkFormality(text);
    inputEl.value = Writer.toFormal(text);
    updateStats();

    if (check.suggestions && check.suggestions.length > 0) {
      btnApplyAll.classList.add('hidden');
      panelTitle.textContent = `پیشنهادات بهبود لحن اداری (${Writer.toPersianDigits(check.suggestions.length.toString())} مورد)`;
      panelBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${check.suggestions.map(s => `
            <div class="suggestion-card">
              <span class="issue-label">💡 ${s}</span>
            </div>
          `).join('')}
        </div>
      `;
      resultsPanel.classList.remove('hidden');
    } else {
      showNotification('متن با موفقیت به نگارش رسمی و اداری تبدیل شد 👔');
    }
  });

  // ۳. غلط‌یاب هوشمند املایی (Spell Check)
  btnSpell.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text.trim()) {
      showNotification('لطفاً ابتدا متنی را وارد نمایید.', 'warning');
      return;
    }

    const result = Writer.spellCheck(text);
    currentSpellIssues = result.issues || [];

    if (currentSpellIssues.length === 0) {
      showNotification('تبریک! هیچ خطای املایی در متن یافت نشد 👏');
      return;
    }

    panelTitle.textContent = `اشتباهات املایی یافت‌شده (${Writer.toPersianDigits(currentSpellIssues.length.toString())} مورد)`;
    btnApplyAll.classList.remove('hidden');

    renderSpellIssues();
    resultsPanel.classList.remove('hidden');
  });

  function renderSpellIssues() {
    if (currentSpellIssues.length === 0) {
      showNotification('تمام اشتباهات املایی اصلاح گردیدند ✨');
      return;
    }

    panelBody.innerHTML = currentSpellIssues.map((issue, idx) => `
      <div class="suggestion-card">
        <div class="issue-label">
          <span class="issue-wrong">«${issue.word}»</span>
          <span style="color: #94a3b8; font-size: 11px;">➔</span>
        </div>
        <div class="suggestion-chips-container">
          ${issue.suggestions.map(sug => `
            <button type="button" class="suggestion-chip" data-idx="${idx}" data-word="${issue.word}" data-sug="${sug}" title="جایگزینی «${issue.word}» با «${sug}»">
              ${sug}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    // اتصال رویداد کلیک روی چیپ‌های پیشنهاد
    panelBody.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const word = chip.getAttribute('data-word');
        const sug = chip.getAttribute('data-sug');
        applySingleCorrection(word, sug);
      });
    });
  }

  function applySingleCorrection(wrongWord, correctWord) {
    const regex = new RegExp(`\\b${wrongWord}\\b`, 'g');
    inputEl.value = inputEl.value.replace(regex, correctWord);
    updateStats();

    // حذف کلمه اصلاح‌شده از لیست مسائل فعلی
    currentSpellIssues = currentSpellIssues.filter(i => i.word !== wrongWord);
    renderSpellIssues();
  }

  // اعمال خودکار همه پیشنهادات املایی
  btnApplyAll.addEventListener('click', () => {
    const result = Writer.spellCheck(inputEl.value);
    inputEl.value = result.correctedText;
    updateStats();
    currentSpellIssues = [];
    showNotification('تمام اشتباهات املایی با موفقیت تصحیح شدند ✨');
  });

  // ۴. کپی در کلیپ‌بورد با بازخورد پویا
  btnCopy.addEventListener('click', async () => {
    const text = inputEl.value;
    if (!text.trim()) {
      showNotification('متنی برای کپی وجود ندارد.', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      copySubText.textContent = 'کپی شد! ✓';
      copySubText.style.color = '#34d399';
      btnCopy.classList.add('copied');

      setTimeout(() => {
        copySubText.textContent = 'آماده انتقال';
        copySubText.style.color = '';
        btnCopy.classList.remove('copied');
      }, 1800);
    } catch (err) {
      console.error('Copy failed', err);
    }
  });

  function showNotification(msg, type = 'info') {
    btnApplyAll.classList.add('hidden');
    panelTitle.textContent = 'وضعیت عملیات';
    const color = type === 'warning' ? '#fbbf24' : '#38bdf8';
    panelBody.innerHTML = `<div class="panel-toast-msg" style="color: ${color};"><span>✨</span> <span>${msg}</span></div>`;
    resultsPanel.classList.remove('hidden');
  }

  btnClosePanel.addEventListener('click', () => {
    resultsPanel.classList.add('hidden');
  });

  // تلاش برای خواندن متن انتخاب‌شده در تب جاری کاربر هنگام باز شدن پاپ‌آپ
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'AMACH_GET_SELECTION' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response && response.selection && response.selection.trim()) {
          inputEl.value = response.selection.trim();
          updateStats();
        }
      });
    }
  });
});
