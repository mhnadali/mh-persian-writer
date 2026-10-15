/**
 * ویراستار فارسی اماچ - کانتنت اسکریپت تعاملی
 * Amach Content Script - High Performance Persian In-page Assistant
 *
 * @author M.H. Nadali
 */

(function () {
  // دسترسی به موتور هسته mh-persian-writer از طریق باندل سراسری
  const Writer = window.MHPersianWriter;
  if (!Writer) {
    console.warn('[Amach] MHPersianWriter core bundle not loaded.');
    return;
  }

  let activeElement = null;
  let floatingBtn = null;
  let currentSelectionText = '';

  // بارگذاری تنظیمات
  let settings = {
    autoHalfSpace: true,
    spellCheck: true,
    persianDigits: true,
    floatingButton: true,
    formalityTone: 'administrative'
  };

  chrome.storage.sync.get(['amach_settings'], (res) => {
    if (res.amach_settings) {
      settings = Object.assign(settings, res.amach_settings);
    }
  });

  // به‌روزرسانی آنی تنظیمات بدون نیاز به رفرش تب‌ها
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.amach_settings && changes.amach_settings.newValue) {
      settings = Object.assign(settings, changes.amach_settings.newValue);
    }
  });

  // ساخت و مدیریت دکمه شناور تعاملی (Floating Action Button)
  function createFloatingButton() {
    if (floatingBtn) return floatingBtn;

    const btn = document.createElement('div');
    btn.id = 'amach-floating-action-bubble';
    btn.className = 'amach-bubble-hidden';
    btn.setAttribute('dir', 'rtl');
    btn.innerHTML = `
      <div class="amach-bubble-main">
        <span class="amach-logo-icon">🖊️</span>
        <span class="amach-bubble-title">امـاچ</span>
      </div>
      <div class="amach-bubble-menu">
        <button type="button" class="amach-action-btn" data-action="normalize" title="نرمال‌سازی و نیم‌فاصله">
          <span>✨</span> پاک‌سازی
        </button>
        <button type="button" class="amach-action-btn" data-action="formalize" title="تبدیل به متن اداری">
          <span>👔</span> رسمی‌سازی
        </button>
        <button type="button" class="amach-action-btn" data-action="spell" title="اصلاح غلط‌های املایی">
          <span>🔍</span> غلط‌یاب
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

  // ثبت آخرین عنصر فوکوس‌شده
  document.addEventListener('focusin', (e) => {
    if (isEditable(e.target)) {
      activeElement = e.target;
    }
  }, true);

  function isEditable(el) {
    if (!el) return false;
    return (
      el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && ['text', 'search', 'email', 'url'].includes(el.type)) ||
      el.isContentEditable ||
      el.getAttribute('contenteditable') === 'true'
    );
  }

  // رویداد انتخاب متن توسط کاربر
  document.addEventListener('mouseup', (e) => {
    // اگر کلیک روی خود دکمه شناور است، نادیده بگیر
    if (floatingBtn && floatingBtn.contains(e.target)) return;

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
        replacement = Writer.toFormal(currentSelectionText);
        replacement = Writer.normalize(replacement, {
          persianDigits: settings.persianDigits,
          fixSpacing: true,
        });
        break;

      case 'spell':
        const spellResult = Writer.spellCheck(currentSelectionText);
        replacement = spellResult.correctedText;
        break;

      default:
        return;
    }

    applyReplacement(replacement);
    showToastNotification(`متن با موفقیت توسط امـاچ به‌روزرسانی شد ✨`);
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

  // نمایش پیام زیبا (Toast)
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

})();
