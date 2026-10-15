/**
 * ویراستار فارسی اماچ - پس‌زمینه افزونه (Service Worker)
 * Amach Persian Writer - Manifest V3 Background Service Worker
 *
 * @author M.H. Nadali
 */

// ایجاد آیتم‌های منوی راست‌کلیک (Context Menu) به صورت امن
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "amach_root",
      title: "ویراستار فارسی ام‌اچ (M.H.)",
      contexts: ["selection", "editable"]
    });

    chrome.contextMenus.create({
      id: "amach_normalize",
      parentId: "amach_root",
      title: "✨ نرمال‌سازی و تنظیم نیم‌فاصله",
      contexts: ["selection", "editable"]
    });

    chrome.contextMenus.create({
      id: "amach_formalize",
      parentId: "amach_root",
      title: "👔 تبدیل به متن رسمی و اداری",
      contexts: ["selection", "editable"]
    });

    chrome.contextMenus.create({
      id: "amach_spell",
      parentId: "amach_root",
      title: "🔍 بررسی و اصلاح غلط‌های املایی",
      contexts: ["selection", "editable"]
    });
  });

  // تنظیمات پیش‌فرض افزونه
  chrome.storage.sync.get(['amach_settings'], (result) => {
    if (!result.amach_settings) {
      chrome.storage.sync.set({
        amach_settings: {
          autoHalfSpace: true,
          spellCheck: true,
          persianDigits: true,
          floatingButton: true,
          formalityTone: 'administrative'
        }
      });
    }
  });
});

// مدیریت رویداد کلیک روی منوی راست‌کلیک
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  let action = '';
  if (info.menuItemId === 'amach_normalize') action = 'normalize';
  else if (info.menuItemId === 'amach_formalize') action = 'formalize';
  else if (info.menuItemId === 'amach_spell') action = 'spell';

  if (action) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'AMACH_CONTEXT_ACTION',
      action,
      selectedText: info.selectionText || ''
    }).catch(() => {
      // نادیده گرفتن خطای احتمالی در صورت عدم بارگذاری کانتنت اسکریپت
    });
  }
});

// مدیریت کلیدهای میانبر تعریف‌شده
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      if (command === 'normalize_selected_text') {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'AMACH_CONTEXT_ACTION', action: 'normalize' });
      } else if (command === 'formalize_selected_text') {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'AMACH_CONTEXT_ACTION', action: 'formalize' });
      }
    }
  });
});
