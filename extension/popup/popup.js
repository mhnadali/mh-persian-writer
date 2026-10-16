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
  const selectPopupTone = document.getElementById('select-popup-tone');

  const btnPaste = document.getElementById('btn-paste');
  const btnClear = document.getElementById('btn-clear');
  const btnUndo = document.getElementById('btn-undo');
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

  const undoStack = [];
  let currentSpellIssues = [];
  let customDictionary = [];
  let currentTone = 'administrative';

  function pushHistory(text) {
    if (!text) return;
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== text) {
      undoStack.push(text);
      if (undoStack.length > 25) undoStack.shift();
      if (btnUndo) {
        btnUndo.disabled = false;
        btnUndo.classList.remove('disabled');
      }
    }
  }

  function performUndo() {
    if (undoStack.length > 0) {
      const prev = undoStack.pop();
      inputEl.value = prev;
      updateStats();
      if (undoStack.length === 0 && btnUndo) {
        btnUndo.disabled = true;
        btnUndo.classList.add('disabled');
      }
      showNotification('تغییرات به حالت قبلی بازگردانده شد ↩️');
    }
  }

  if (btnUndo) {
    btnUndo.addEventListener('click', performUndo);
  }

  // ۱. بارگذاری تنظیمات لحن و واژه‌نامه اختصاصی از حافظه همگام‌ساز کروم
  chrome.storage.sync.get(['amach_settings', 'amach_custom_dict'], (res) => {
    if (res.amach_settings && res.amach_settings.formalityTone) {
      currentTone = res.amach_settings.formalityTone;
      if (selectPopupTone) selectPopupTone.value = currentTone;
    }
    if (Array.isArray(res.amach_custom_dict)) {
      customDictionary = res.amach_custom_dict;
    }
    updateStats();
  });

  // تغییر لحن نگارش توسط کاربر در پاپ‌آپ
  if (selectPopupTone) {
    selectPopupTone.addEventListener('change', () => {
      currentTone = selectPopupTone.value;
      chrome.storage.sync.get(['amach_settings'], (res) => {
        const s = res.amach_settings || {};
        s.formalityTone = currentTone;
        chrome.storage.sync.set({ amach_settings: s });
      });
      updateStats();
    });
  }

  // به‌روزرسانی آنی آمار و شاخص‌های کیفی متن
  function updateStats() {
    const text = inputEl.value;
    const len = text.length;

    statChars.textContent = `${Writer.toPersianDigits(len.toString())} کاراکتر`;

    if (!text.trim()) {
      statWords.textContent = '۰';
      statScore.textContent = '۱۰۰٪';
      statTime.textContent = '۰ ثانیه';
      formalityText.textContent = getToneLabel(currentTone);
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

    // تحلیل رسمیت متن بر اساس لحن انتخابی
    const formality = Writer.checkFormality(text, { mode: currentTone });
    const score = formality.score;
    statScore.textContent = `${Writer.toPersianDigits(score.toString())}٪`;

    formalityIndicator.className = 'formality-badge';
    if (score >= 80) {
      formalityText.textContent = `${getToneLabel(currentTone)} (رسمی)`;
    } else if (score >= 50) {
      formalityIndicator.classList.add('warning');
      formalityText.textContent = 'نیمه‌رسمی';
    } else {
      formalityIndicator.classList.add('danger');
      formalityText.textContent = 'غیررسمی / محاوره';
    }
  }

  function getToneLabel(tone) {
    switch (tone) {
      case 'academic': return 'نگارش علمی';
      case 'summary': return 'خلاصه و تیتروار';
      case 'persuasive': return 'متقاعدکننده و حماسی';
      case 'friendly': return 'دوستانه و صمیمی';
      case 'customer-support': return 'پشتیبانی مشتریان';
      case 'colloquial-cleanup': return 'روان‌سازی عمومی';
      case 'administrative':
      default: return 'رسمی و اداری';
    }
  }

  inputEl.addEventListener('input', updateStats);

  // میانبرهای صفحه کلید درون ویرایشگر پاپ‌آپ
  inputEl.addEventListener('keydown', (e) => {
    // واگرد تغییرات (Ctrl+Z / Cmd+Z)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (undoStack.length > 0) {
        e.preventDefault();
        performUndo();
      }
    }
    // پاک‌سازی و نیم‌فاصله‌گذاری فوق‌سریع (Ctrl+Enter / Cmd+Enter)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      btnNormalize.click();
    }
  });

  // پاک‌سازی کادر
  btnClear.addEventListener('click', () => {
    if (!inputEl.value) return;
    pushHistory(inputEl.value);
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
        pushHistory(inputEl.value);
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

    pushHistory(text);
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

  // ۲. تبدیل به نگارش رسمی و اداری (Formalize) بر اساس لحن انتخابی
  btnFormalize.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text.trim()) {
      showNotification('لطفاً ابتدا متنی را وارد نمایید.', 'warning');
      return;
    }

    pushHistory(text);
    const check = Writer.checkFormality(text, { mode: currentTone });
    inputEl.value = Writer.toFormal(text, { mode: currentTone });
    updateStats();

    if (check.suggestions && check.suggestions.length > 0) {
      btnApplyAll.classList.add('hidden');
      panelTitle.textContent = `پیشنهادات بهبود لحن (${Writer.toPersianDigits(check.suggestions.length.toString())} مورد)`;
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
      showNotification(`متن با موفقیت به ${getToneLabel(currentTone)} تبدیل شد 👔`);
    }
  });

  // ۳. غلط‌یاب هوشمند املایی (Spell Check) با واژه‌نامه اختصاصی کاربر
  btnSpell.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text.trim()) {
      showNotification('لطفاً ابتدا متنی را وارد نمایید.', 'warning');
      return;
    }

    const result = Writer.spellCheck(text, { customDictionary });
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
          <button type="button" class="add-to-dict-chip" data-word="${issue.word}" title="افزودن واژه «${issue.word}» به واژه‌نامه شخصی">
            ➕ واژه‌نامه
          </button>
        </div>
      </div>
    `).join('');

    // اتصال رویداد کلیک روی چیپ‌های پیشنهاد اصلاح
    panelBody.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const word = chip.getAttribute('data-word');
        const sug = chip.getAttribute('data-sug');
        applySingleCorrection(word, sug);
      });
    });

    // اتصال رویداد کلیک روی دکمه «افزودن به واژه‌نامه شخصی»
    panelBody.querySelectorAll('.add-to-dict-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const word = btn.getAttribute('data-word');
        addWordToCustomDict(word);
      });
    });
  }

  function addWordToCustomDict(word) {
    if (!word) return;
    if (!customDictionary.includes(word)) {
      customDictionary.push(word);
      chrome.storage.sync.set({ amach_custom_dict: customDictionary });
    }
    // حذف فوری واژه از لیست خطاهای جاری
    currentSpellIssues = currentSpellIssues.filter(i => i.word !== word);
    renderSpellIssues();
    showNotification(`واژه «${word}» با موفقیت به واژه‌نامه شخصی اضافه شد 📚`);
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function createPersianWordRegex(word) {
    const escaped = escapeRegex(word);
    return new RegExp(`(?<=^|[\\s،؛.!?؟()«»"'\\[\\]{}:–—-])${escaped}(?=[\\s،؛.!?؟()«»"'\\[\\]{}:–—-]|$)`, 'gu');
  }

  function applySingleCorrection(wrongWord, correctWord) {
    pushHistory(inputEl.value);
    const regex = createPersianWordRegex(wrongWord);
    inputEl.value = inputEl.value.replace(regex, correctWord);
    updateStats();

    // حذف کلمه اصلاح‌شده از لیست مسائل فعلی
    currentSpellIssues = currentSpellIssues.filter(i => i.word !== wrongWord);
    renderSpellIssues();
  }

  // اعمال خودکار همه پیشنهادات املایی
  btnApplyAll.addEventListener('click', () => {
    pushHistory(inputEl.value);
    const result = Writer.spellCheck(inputEl.value, { customDictionary });
    inputEl.value = result.correctedText;
    updateStats();
    currentSpellIssues = [];
    showNotification('تمام اشتباهات املایی با موفقیت تصحیح شدند ✨');
  });

  // ۴. بازنویسی هوشمند پاراگراف با هوش مصنوعی (AI Rewriter)
  const btnAiRewrite = document.getElementById('btn-ai-rewrite');
  const aiSubText = document.getElementById('ai-sub-text');

  if (btnAiRewrite) {
    btnAiRewrite.addEventListener('click', async () => {
      const text = inputEl.value;
      if (!text.trim()) {
        showNotification('لطفاً ابتدا متنی را برای بازنویسی وارد نمایید.', 'warning');
        return;
      }

      pushHistory(text);
      showNotification('🤖 در حال بازنویسی هوشمند متن با هوش مصنوعی...', 'info');
      if (aiSubText) aiSubText.textContent = 'در حال بازنویسی...';

      try {
        const storage = await new Promise(r => chrome.storage.sync.get(['amach_ai_settings'], r));
        const aiSettings = storage.amach_ai_settings || {
          provider: 'ollama',
          model: 'qwen2.5:7b',
        };

        const res = await Writer.rewriteWithLLM(text, {
          targetTone: currentTone,
          provider: {
            type: aiSettings.provider || 'ollama',
            apiKey: aiSettings.apiKey,
            model: aiSettings.model,
            endpoint: aiSettings.endpoint,
          },
        });

        inputEl.value = res.finalText;
        updateStats();
        if (aiSubText) aiSubText.textContent = (aiSettings.provider || 'Ollama').toUpperCase();
        showNotification('متن با هوش مصنوعی بازنویسی و توسط هسته ام‌اچ پالایش شد ✨');
      } catch (err) {
        console.error('AI Rewrite Error', err);
        if (aiSubText) aiSubText.textContent = 'خطا در اتصال';
        showNotification(`خطا در هوش مصنوعی: ${err.message || 'عدم دسترسی'}. به صفحه تنظیمات مراجعه فرمایید.`, 'warning');
      }
    });
  }

  // ۵. کپی در کلیپ‌بورد با بازخورد پویا
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
