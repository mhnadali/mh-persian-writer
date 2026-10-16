/**
 * ویراستار فارسی ام‌اچ (M.H.) - کانتنت اسکریپت تعاملی و دستیار هوشمند درون‌صفحه
 * M.H. Persian Writer - Real-time In-Page Field Assistant & Floating Menu
 * Designed per UI/UX Designer Agent Standards
 *
 * @author M.H. Nadali
 */

(function () {
  // دسترسی به موتور هسته mh-persian-writer از طریق باندل سراسری
  const Writer = window.MHPersianWriter;
  if (!Writer) {
    console.warn('[M.H. Writer] MHPersianWriter core bundle not loaded.');
    return;
  }

  let activeElement = null;
  let floatingBtn = null;
  let fieldBadge = null;
  let quickPopover = null;
  let currentSelectionText = '';
  let debounceTimer = null;
  let blurTimer = null;

  let currentFieldIssues = [];
  let currentFormalityTips = [];
  let customDictionary = [];

  // تنظیمات افزونه
  let settings = {
    realtimeAssistant: true,
    autoHalfSpace: true,
    spellCheck: true,
    persianDigits: true,
    floatingButton: true,
    formalityTone: 'administrative',
  };

  // بارگذاری تنظیمات و واژه‌نامه اختصاصی از حافظه محلی کروم
  chrome.storage.sync.get(['amach_settings', 'amach_custom_dict'], (res) => {
    if (res.amach_settings) {
      settings = Object.assign(settings, res.amach_settings);
    }
    if (Array.isArray(res.amach_custom_dict)) {
      customDictionary = res.amach_custom_dict;
    }
  });

  // به‌روزرسانی آنی تنظیمات بدون نیاز به رفرش صفحه
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.amach_settings && changes.amach_settings.newValue) {
        settings = Object.assign(settings, changes.amach_settings.newValue);
        if (!settings.realtimeAssistant) {
          hideFieldBadge();
          hideQuickPopover();
        }
      }
      if (changes.amach_custom_dict && Array.isArray(changes.amach_custom_dict.newValue)) {
        customDictionary = changes.amach_custom_dict.newValue;
        if (activeElement) checkActiveField(activeElement);
      }
    }
  });

  // ========================================================
  // ۱. دستیار زنده فیلدهای متنی (Real-time In-Page Field Assistant)
  // ========================================================

  function createFieldBadge() {
    if (fieldBadge) return fieldBadge;

    const badge = document.createElement('div');
    badge.id = 'amach-field-badge';
    badge.setAttribute('dir', 'rtl');
    badge.title = 'دستیار نگارش فارسی ام‌اچ (M.H.) - برای مشاهده جزئیات و اصلاح کلیک کنید';
    badge.innerHTML = `
      <span class="amach-badge-dot gray" id="amach-badge-dot"></span>
      <span class="amach-badge-text" id="amach-badge-text">ام‌اچ</span>
    `;

    document.body.appendChild(badge);

    badge.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleQuickPopover();
    });

    fieldBadge = badge;
    return badge;
  }

  function positionFieldBadge(el) {
    if (!el || !settings.realtimeAssistant) return;
    const badge = createFieldBadge();
    const rect = el.getBoundingClientRect();

    // اگر المان نامرئی است یا ابعاد صفر دارد
    if (rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight) {
      badge.classList.remove('amach-badge-visible');
      return;
    }

    // لنگراندازی گوشه چپ فیلد متنی (مناسب جهت RTL فارسی)
    let left = rect.left + 8;
    let top = rect.height >= 44 ? (rect.bottom - 28) : (rect.bottom + 4);

    // مرزبندی با صفحه
    left = Math.max(8, Math.min(window.innerWidth - 110, left));
    top = Math.max(6, Math.min(window.innerHeight - 34, top));

    badge.style.left = `${left}px`;
    badge.style.top = `${top}px`;
    badge.classList.add('amach-badge-visible');
  }

  function hideFieldBadge() {
    if (fieldBadge) {
      fieldBadge.classList.remove('amach-badge-visible');
    }
  }

  function checkActiveField(el) {
    if (!el || !settings.realtimeAssistant) return;
    const text = getFieldText(el);

    const badgeDot = document.getElementById('amach-badge-dot');
    const badgeText = document.getElementById('amach-badge-text');
    if (!badgeDot || !badgeText) return;

    if (!text || text.trim().length < 2 || !Writer.isPersian(text)) {
      badgeDot.className = 'amach-badge-dot gray';
      badgeText.textContent = 'ام‌اچ';
      currentFieldIssues = [];
      currentFormalityTips = [];
      if (quickPopover && quickPopover.classList.contains('amach-popover-visible')) {
        renderPopoverContent();
      }
      return;
    }

    // تحلیل املایی با واژه‌نامه شخصی
    let issues = [];
    if (settings.spellCheck) {
      const spellRes = Writer.spellCheck(text, { customDictionary });
      issues = spellRes.issues || [];
    }
    currentFieldIssues = issues;

    // تحلیل رسمی‌سازی بر اساس لحن منتخب
    const formRes = Writer.checkFormality(text, { mode: settings.formalityTone });
    currentFormalityTips = formRes.suggestions || [];

    if (issues.length > 0) {
      badgeDot.className = 'amach-badge-dot red';
      badgeText.textContent = `${Writer.toPersianDigits(issues.length.toString())} خطا`;
    } else if (currentFormalityTips.length > 0) {
      badgeDot.className = 'amach-badge-dot yellow';
      badgeText.textContent = `${Writer.toPersianDigits(currentFormalityTips.length.toString())} پیشنهاد`;
    } else {
      badgeDot.className = 'amach-badge-dot green';
      badgeText.textContent = 'صحیح ✓';
    }

    if (quickPopover && quickPopover.classList.contains('amach-popover-visible')) {
      renderPopoverContent();
    }
  }

  // ========================================================
  // ۲. پاپ‌اور سریع دستیار درون‌صفحه (Quick Popover)
  // ========================================================

  function createQuickPopover() {
    if (quickPopover) return quickPopover;

    const popover = document.createElement('div');
    popover.id = 'amach-quick-popover';
    popover.setAttribute('dir', 'rtl');
    popover.innerHTML = `
      <div class="amach-popover-header">
        <div class="amach-popover-brand">
          <span>🖊️</span>
          <span>ویراستار ام‌اچ (M.H.)</span>
        </div>
        <button type="button" class="amach-popover-close" id="amach-popover-close-btn">&times;</button>
      </div>
      <div class="amach-popover-toolbar">
        <button type="button" class="amach-popover-btn primary" id="amach-btn-norm-field" title="پاک‌سازی، اصلاح ارقام و نیم‌فاصله‌گذاری">
          <span>✨</span>
          <span>نیم‌فاصله</span>
        </button>
        <button type="button" class="amach-popover-btn" id="amach-btn-form-field" title="رسمی‌سازی هوشمند اداری">
          <span>👔</span>
          <span>رسمی‌سازی</span>
        </button>
        <button type="button" class="amach-popover-btn" id="amach-btn-fixall-field" title="اعمال خودکار تمام پیشنهادات املایی">
          <span>⚡</span>
          <span>اصلاح خطاها</span>
        </button>
        <button type="button" class="amach-popover-btn ai" id="amach-btn-ai-field" title="بازنویسی هوشمند پاراگراف با هوش مصنوعی (Gemini / Ollama / OpenAI)">
          <span>🤖</span>
          <span>هوش مصنوعی</span>
        </button>
      </div>
      <div class="amach-popover-body" id="amach-popover-body"></div>
    `;

    document.body.appendChild(popover);

    // بستن پاپ‌اور
    popover.querySelector('#amach-popover-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      hideQuickPopover();
    });

    // دکمه نرمال‌سازی کل فیلد
    popover.querySelector('#amach-btn-norm-field').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeElement) return;
      const original = getFieldText(activeElement);
      const normalized = Writer.normalize(original, {
        persianCharacters: true,
        persianDigits: settings.persianDigits,
        fixSpacing: true,
        removeDiacritics: true,
        fixPunctuation: true,
      });
      setFieldText(activeElement, normalized);
      checkActiveField(activeElement);
      showToastNotification('فیلد با موفقیت پاک‌سازی و نیم‌فاصله‌گذاری شد ✨');
    });

    // دکمه رسمی‌سازی کل فیلد
    popover.querySelector('#amach-btn-form-field').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeElement) return;
      const original = getFieldText(activeElement);
      let formalized = Writer.toFormal(original, { mode: settings.formalityTone });
      formalized = Writer.normalize(formalized, {
        persianDigits: settings.persianDigits,
        fixSpacing: true,
      });
      setFieldText(activeElement, formalized);
      checkActiveField(activeElement);
      showToastNotification('متن به نگارش رسمی و اداری تبدیل گردید 👔');
    });

    // دکمه اصلاح یکجای تمام غلط‌های املایی
    popover.querySelector('#amach-btn-fixall-field').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeElement) return;
      const original = getFieldText(activeElement);
      const res = Writer.spellCheck(original, { customDictionary });
      setFieldText(activeElement, res.correctedText);
      checkActiveField(activeElement);
      showToastNotification('تمام خطاهای املایی تصحیح شدند ✨');
    });

    // دکمه بازنویسی هوشمند پاراگراف با هوش مصنوعی
    popover.querySelector('#amach-btn-ai-field').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!activeElement) return;
      const original = getFieldText(activeElement);
      if (!original || !original.trim()) {
        showToastNotification('متنی برای بازنویسی وجود ندارد.');
        return;
      }

      showToastNotification('🤖 در حال بازنویسی پاراگراف با هوش مصنوعی...');
      try {
        const storage = await new Promise(r => chrome.storage.sync.get(['amach_ai_settings'], r));
        const ai = storage.amach_ai_settings || { provider: 'ollama', model: 'qwen2.5:7b' };
        const res = await Writer.rewriteWithLLM(original, {
          targetTone: settings.formalityTone || 'administrative',
          provider: {
            type: ai.provider || 'ollama',
            apiKey: ai.apiKey,
            model: ai.model,
            endpoint: ai.endpoint,
          },
        });
        setFieldText(activeElement, res.finalText);
        checkActiveField(activeElement);
        showToastNotification('متن با هوش مصنوعی بازنویسی و پیراسته شد ✨');
      } catch (err) {
        showToastNotification(`خطا در هوش مصنوعی: ${err.message || 'عدم اتصال'}`);
      }
    });

    quickPopover = popover;
    return popover;
  }

  function toggleQuickPopover() {
    const popover = createQuickPopover();
    if (popover.classList.contains('amach-popover-visible')) {
      hideQuickPopover();
    } else {
      showQuickPopover();
    }
  }

  function showQuickPopover() {
    if (!activeElement) return;
    const popover = createQuickPopover();
    const rect = activeElement.getBoundingClientRect();

    let left = rect.left + 8;
    let top = rect.bottom + 8;

    if (top + 320 > window.innerHeight) {
      top = Math.max(10, rect.top - 310);
    }
    left = Math.max(10, Math.min(window.innerWidth - 340, left));

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;

    renderPopoverContent();
    popover.classList.add('amach-popover-visible');
  }

  function hideQuickPopover() {
    if (quickPopover) {
      quickPopover.classList.remove('amach-popover-visible');
    }
  }

  function renderPopoverContent() {
    const body = document.getElementById('amach-popover-body');
    if (!body) return;

    if (currentFieldIssues.length === 0 && currentFormalityTips.length === 0) {
      body.innerHTML = `
        <div class="amach-popover-empty">
          <span style="font-size: 24px; display: block; margin-bottom: 6px;">🎉</span>
          متن شما کاملاً صحیح، پاکیزه و استاندارد است.
        </div>
      `;
      return;
    }

    let html = '';

    // رندر خطاهای املایی
    if (currentFieldIssues.length > 0) {
      html += currentFieldIssues.map((issue) => `
        <div class="amach-popover-card">
          <div class="amach-popover-row">
            <span class="amach-popover-wrong">«${issue.word}»</span>
            <button type="button" class="amach-popover-dict-btn" data-word="${issue.word}" title="افزودن واژه به واژه‌نامه شخصی">
              ➕ واژه‌نامه
            </button>
          </div>
          <div class="amach-popover-chips">
            ${issue.suggestions.map(sug => `
              <button type="button" class="amach-popover-chip" data-word="${issue.word}" data-sug="${sug}" title="جایگزینی با «${sug}»">
                ${sug}
              </button>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    // رندر نکات رسمی‌سازی
    if (currentFormalityTips.length > 0) {
      html += currentFormalityTips.map(tip => `
        <div class="amach-popover-tip-card">
          💡 ${tip}
        </div>
      `).join('');
    }

    body.innerHTML = html;

    // اتصال رویداد کلیک روی چیپ‌های جایگزینی کلمه
    body.querySelectorAll('.amach-popover-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = chip.getAttribute('data-word');
        const sug = chip.getAttribute('data-sug');
        replaceWordInField(activeElement, word, sug);
        checkActiveField(activeElement);
      });
    });

    // اتصال رویداد کلیک روی دکمه واژه‌نامه
    body.querySelectorAll('.amach-popover-dict-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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
    currentFieldIssues = currentFieldIssues.filter(i => i.word !== word);
    if (activeElement) checkActiveField(activeElement);
    showToastNotification(`واژه «${word}» به واژه‌نامه شخصی اضافه شد 📚`);
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function createPersianWordRegex(word) {
    const escaped = escapeRegex(word);
    return new RegExp(`(?<=^|[\\s،؛.!?؟()«»"'\\[\\]{}:–—-])${escaped}(?=[\\s،؛.!?؟()«»"'\\[\\]{}:–—-]|$)`, 'gu');
  }

  // جایگزینی کلمه واحد در متن فیلد با تشخیص دقیق مرز واژگان فارسی (نه \\b اسکی)
  function replaceWordInField(el, oldWord, newWord) {
    if (!el) return;
    const current = getFieldText(el);
    const regex = createPersianWordRegex(oldWord);
    const updated = current.replace(regex, newWord);
    setFieldText(el, updated);
  }

  function getFieldText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value || '';
    }
    return el.innerText || el.textContent || '';
  }

  function setFieldText(el, newText) {
    if (!el) return;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = newText;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    // ویرایشگرهای محتوایی (contenteditable نظیر جیمیل، تلگرام، نوشن و...)
    try {
      el.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      const success = document.execCommand('insertText', false, newText);
      if (success) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    } catch (e) {
      // استفاده از fallback در صورت خطا
    }
    el.innerText = newText;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ========================================================
  // ۳. مدیریت رویدادهای فوکوس و تایپ در صفحه
  // ========================================================

  document.addEventListener('focusin', (e) => {
    if (isEditable(e.target)) {
      activeElement = e.target;
      clearTimeout(blurTimer);
      positionFieldBadge(activeElement);
      checkActiveField(activeElement);
    }
  }, true);

  document.addEventListener('input', (e) => {
    if (isEditable(e.target)) {
      activeElement = e.target;
      positionFieldBadge(activeElement);

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        checkActiveField(activeElement);
      }, 300);
    }
  }, true);

  // خروج فوکوس
  document.addEventListener('focusout', (e) => {
    blurTimer = setTimeout(() => {
      const active = document.activeElement;
      if (
        (fieldBadge && fieldBadge.contains(active)) ||
        (quickPopover && quickPopover.contains(active))
      ) {
        return;
      }
      hideFieldBadge();
      hideQuickPopover();
    }, 250);
  }, true);

  // تغییر سایز یا اسکرول صفحه: به‌روزرسانی موقعیت لنگر نشانگر
  window.addEventListener('scroll', () => {
    if (activeElement && fieldBadge && fieldBadge.classList.contains('amach-badge-visible')) {
      positionFieldBadge(activeElement);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (activeElement && fieldBadge && fieldBadge.classList.contains('amach-badge-visible')) {
      positionFieldBadge(activeElement);
    }
  });

  function isEditable(el) {
    if (!el) return false;
    return (
      el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && ['text', 'search', 'email', 'url'].includes(el.type)) ||
      el.isContentEditable ||
      el.getAttribute('contenteditable') === 'true'
    );
  }

  // ========================================================
  // ۴. دکمه شناور انتخاب متن (Floating Action Bubble)
  // ========================================================

  function createFloatingButton() {
    if (floatingBtn) return floatingBtn;

    const btn = document.createElement('div');
    btn.id = 'amach-floating-action-bubble';
    btn.className = 'amach-bubble-hidden';
    btn.setAttribute('dir', 'rtl');
    btn.innerHTML = `
      <div class="amach-bubble-main">
        <span class="amach-logo-icon">🖊️</span>
        <span class="amach-bubble-title">ام‌اچ</span>
        <span class="amach-bubble-badge">M.H.</span>
      </div>
      <div class="amach-bubble-menu">
        <button type="button" class="amach-action-btn" data-action="normalize" title="نرمال‌سازی، کاراکترها و نیم‌فاصله (Alt+Shift+N)">
          <span class="btn-icon">✨</span>
          <span>نیم‌فاصله</span>
        </button>
        <button type="button" class="amach-action-btn" data-action="formalize" title="تبدیل به متن رسمی و اداری (Alt+Shift+F)">
          <span class="btn-icon">👔</span>
          <span>رسمی‌سازی</span>
        </button>
        <button type="button" class="amach-action-btn" data-action="spell" title="اصلاح غلط‌های املایی">
          <span class="btn-icon">🔍</span>
          <span>غلط‌یاب</span>
        </button>
        <button type="button" class="amach-action-btn ai" data-action="ai" title="بازنویسی هوشمند با هوش مصنوعی">
          <span class="btn-icon">🤖</span>
          <span>هوش مصنوعی</span>
        </button>
      </div>
    `;

    document.body.appendChild(btn);

    // افزودن رویداد کلیک به دکمه‌های منو
    btn.querySelectorAll('.amach-action-btn').forEach(button => {
      button.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        processSelectedText(action);
        hideFloatingButton();
      });
    });

    floatingBtn = btn;
    return btn;
  }

  function showFloatingButton(x, y) {
    if (!settings.floatingButton) return;
    const btn = createFloatingButton();
    btn.style.left = `${Math.max(10, x - 60)}px`;
    btn.style.top = `${Math.max(10, y - 45)}px`;
    btn.classList.remove('amach-bubble-hidden');
    btn.classList.add('amach-bubble-visible');
  }

  function hideFloatingButton() {
    if (floatingBtn) {
      floatingBtn.classList.remove('amach-bubble-visible');
      floatingBtn.classList.add('amach-bubble-hidden');
    }
  }

  // رویداد انتخاب متن توسط کاربر
  document.addEventListener('mouseup', (e) => {
    // اگر کلیک روی خود دکمه شناور، نشانگر فیلد یا پاپ‌اور است، نادیده بگیر
    if (
      (floatingBtn && floatingBtn.contains(e.target)) ||
      (fieldBadge && fieldBadge.contains(e.target)) ||
      (quickPopover && quickPopover.contains(e.target))
    ) {
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      const selected = selection ? selection.toString().trim() : '';

      if (selected && selected.length >= 2 && Writer.isPersian(selected)) {
        currentSelectionText = selected;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        showFloatingButton(rect.left + window.scrollX, rect.top + window.scrollY);
      } else {
        hideFloatingButton();
      }
    }, 20);
  });

  // پنهان کردن دکمه هنگام کلیک در جای دیگر
  document.addEventListener('mousedown', (e) => {
    if (floatingBtn && !floatingBtn.contains(e.target)) {
      hideFloatingButton();
    }
    if (
      quickPopover &&
      !quickPopover.contains(e.target) &&
      fieldBadge &&
      !fieldBadge.contains(e.target)
    ) {
      hideQuickPopover();
    }
  });

  // پردازش متن انتخاب‌شده بر اساس اکشن درخواست‌شده
  function processSelectedText(action) {
    if (!currentSelectionText) {
      const selection = window.getSelection();
      currentSelectionText = selection ? selection.toString().trim() : '';
    }
    if (!currentSelectionText) return;

    let replacement = currentSelectionText;

    switch (action) {
      case 'normalize':
        replacement = Writer.normalize(currentSelectionText, {
          persianCharacters: true,
          persianDigits: settings.persianDigits,
          fixSpacing: true,
          removeDiacritics: true,
          fixPunctuation: true,
        });
        break;

      case 'formalize':
        replacement = Writer.toFormal(currentSelectionText, { mode: settings.formalityTone });
        replacement = Writer.normalize(replacement, {
          persianDigits: settings.persianDigits,
          fixSpacing: true,
        });
        break;

      case 'spell':
        const spellResult = Writer.spellCheck(currentSelectionText, { customDictionary });
        replacement = spellResult.correctedText;
        break;

      case 'ai':
        showToastNotification('🤖 در حال بازنویسی با هوش مصنوعی...');
        chrome.storage.sync.get(['amach_ai_settings'], async (res) => {
          try {
            const ai = res.amach_ai_settings || { provider: 'ollama', model: 'qwen2.5:7b' };
            const aiRes = await Writer.rewriteWithLLM(currentSelectionText, {
              targetTone: settings.formalityTone || 'administrative',
              provider: {
                type: ai.provider || 'ollama',
                apiKey: ai.apiKey,
                model: ai.model,
                endpoint: ai.endpoint,
              },
            });
            applyReplacement(aiRes.finalText);
            showToastNotification('متن با هوش مصنوعی بازنویسی شد ✨');
          } catch (err) {
            showToastNotification(`خطا در هوش مصنوعی: ${err.message || 'عدم دسترسی'}`);
          }
        });
        return;

      default:
        return;
    }

    applyReplacement(replacement);
    showToastNotification(`متن با موفقیت توسط ام‌اچ (M.H.) ویرایش شد ✨`);
  }

  // جایگزینی متن در DOM با پشتیبانی کامل از ویرایشگرهای ریچ‌تکست (Gmail, Notion, Slack)
  function applyReplacement(newText) {
    const el = activeElement || document.activeElement;

    // روش ۱: استفاده از execCommand برای یکپارچگی با فریم‌ورک‌های مدرن (React, Draft.js, ProseMirror) و قابلیت Undo/Redo
    try {
      const success = document.execCommand('insertText', false, newText);
      if (success) {
        if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    } catch (e) {
      // در صورت محدود بودن execCommand به روش‌های جایگزین می‌رویم
    }

    // روش ۲: فیلدهای textarea و input استاندارد
    if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (typeof start === 'number' && typeof end === 'number' && start !== end) {
        const val = el.value;
        el.value = val.substring(0, start) + newText + val.substring(end);
        el.selectionStart = start;
        el.selectionEnd = start + newText.length;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }

    // روش ۳: ویرایشگرهای contenteditable بر پایه Range
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(newText);
      range.insertNode(textNode);

      // بردن کرسر به انتهای متن درج‌شده
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      if (el) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  // ========================================================
  // ۵. پیام توست زیبا (Toast Notification)
  // ========================================================

  function showToastNotification(msg) {
    const toast = document.createElement('div');
    toast.className = 'amach-toast-pill';
    toast.setAttribute('dir', 'rtl');
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('amach-toast-show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('amach-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  // گوش دادن به پیام‌های Background و Popup
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.type === 'AMACH_GET_SELECTION') {
      const sel = window.getSelection();
      sendResponse({ selection: sel ? sel.toString() : '' });
      return true;
    }

    if (req.type === 'AMACH_CONTEXT_ACTION') {
      if (req.selectedText) {
        currentSelectionText = req.selectedText;
      }
      processSelectedText(req.action);
      sendResponse({ status: 'ok' });
      return true;
    }
  });

  // بستن منوهای شناور و پاپ‌اور با زدن کلید Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideQuickPopover();
      hideFloatingButton();
    }
  });

})();
