/**
 * ویراستار فارسی اماچ - منطق رابط کاربری Popup
 * Amach Popup Controller
 *
 * @author M.H. Nadali
 */

document.addEventListener('DOMContentLoaded', () => {
  const Writer = window.MHPersianWriter;
  if (!Writer) {
    console.error('MHPersianWriter is not available.');
    return;
  }

  const inputEl = document.getElementById('popup-input');
  const statWords = document.getElementById('stat-words');
  const statScore = document.getElementById('stat-score');

  const btnNormalize = document.getElementById('btn-normalize');
  const btnFormalize = document.getElementById('btn-formalize');
  const btnSpell = document.getElementById('btn-spell');
  const btnCopy = document.getElementById('btn-copy');

  const resultsPanel = document.getElementById('results-panel');
  const panelTitle = document.getElementById('panel-title');
  const panelBody = document.getElementById('panel-body');
  const btnClosePanel = document.getElementById('btn-close-panel');

  // به‌روزرسانی آنی آمار متن
  function updateStats() {
    const text = inputEl.value;
    if (!text.trim()) {
      statWords.textContent = '۰';
      statScore.textContent = '۱۰۰';
      return;
    }

    const words = Writer.countWords(text);
    const formality = Writer.checkFormality(text);

    statWords.textContent = Writer.toPersianDigits(words.toString());
    statScore.textContent = Writer.toPersianDigits(formality.score.toString());
  }

  inputEl.addEventListener('input', updateStats);

  // پاک‌سازی و نرمال‌سازی
  btnNormalize.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text.trim()) return;

    inputEl.value = Writer.normalize(text, {
      persianCharacters: true,
      persianDigits: true,
      fixSpacing: true,
      removeDiacritics: true,
      fixPunctuation: true,
    });
    updateStats();
    showToast('متن با موفقیت پاک‌سازی و نیم‌فاصله‌گذاری شد.');
  });

  // تبدیل به متن رسمی
  btnFormalize.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text.trim()) return;

    const check = Writer.checkFormality(text);
    inputEl.value = Writer.toFormal(text);
    updateStats();

    if (check.suggestions.length > 0) {
      showPanel('پیشنهادات بهبود رسمیت', `
        <ul>
          ${check.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      `);
    } else {
      showToast('متن به نگارش رسمی و اداری تبدیل گردید.');
    }
  });

  // غلط‌یابی املایی
  btnSpell.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text.trim()) return;

    const result = Writer.spellCheck(text);
    inputEl.value = result.correctedText;
    updateStats();

    if (result.issues.length > 0) {
      showPanel(`خطاهای املایی یافت‌شده (${Writer.toPersianDigits(result.issues.length.toString())} مورد)`, `
        <ul>
          ${result.issues.map(i => `<li>واژه «<b>${i.word}</b>» ➔ پیشنهاد: <i>${i.suggestions.join('، ')}</i></li>`).join('')}
        </ul>
      `);
    } else {
      showToast('هیچ خطای املایی در متن یافت نشد! 👏');
    }
  });

  // کپی در کلیپ‌بورد
  btnCopy.addEventListener('click', async () => {
    const text = inputEl.value;
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      const originalText = btnCopy.querySelector('span:last-child').textContent;
      btnCopy.querySelector('span:last-child').textContent = 'کپی شد! ✓';
      setTimeout(() => {
        btnCopy.querySelector('span:last-child').textContent = originalText;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  });

  function showPanel(title, html) {
    panelTitle.textContent = title;
    panelBody.innerHTML = html;
    resultsPanel.classList.remove('hidden');
  }

  btnClosePanel.addEventListener('click', () => {
    resultsPanel.classList.add('hidden');
  });

  function showToast(msg) {
    panelTitle.textContent = 'نتیجه عملیات';
    panelBody.innerHTML = `<p style="color: #38bdf8;">${msg}</p>`;
    resultsPanel.classList.remove('hidden');
  }

  // تلاش برای خواندن متن انتخاب‌شده در تب جاری هنگام باز شدن پاپ‌آپ
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => window.getSelection().toString()
      }).then((results) => {
        if (results && results[0] && results[0].result && results[0].result.trim()) {
          inputEl.value = results[0].result.trim();
          updateStats();
        }
      }).catch(() => {
        // نادیده گرفتن محدودیت دسترسی در صفحات سیستمی کروم
      });
    }
  });
});
