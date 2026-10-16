/**
 * موتور قالب‌ساز و تولید اسناد و مکاتبات اداری استاندارد
 * Administrative Document Builder & Template Engine
 *
 * @module document-builder
 * @author M.H. Nadali
 */

import {
  DocumentType,
  DocumentData,
  DocumentOptions,
} from './types';
import { getJalaliDate } from './jalali';
import { toPersianDigits } from './normalizer';

/**
 * دریافت قالب پیش‌فرض برای انواع اسناد اداری
 *
 * @param type نوع سند
 * @returns داده‌های اسکلت سند
 */
export function getDefaultDocumentTemplate(type: DocumentType): DocumentData {
  switch (type) {
    case 'leave_request':
      return {
        title: 'برگ درخواست مرخصی',
        subject: 'درخواست مرخصی استحقاقی',
        recipientTitle: 'مدیریت محترم منابع انسانی',
        body: 'احتراماً، اینجانب تقاضای استفاده از مرخصی استحقاقی به مدت ... روز کاری از تاریخ ... لغایت ... را دارم. شایان ذکر است در غیاب اینجانب، وظایف محوله با هماهنگی همکار محترم جناب آقای / سرکار خانم ... انجام خواهد پذیرفت.',
        signatureText: 'با تشکر و احترام\nامضای متقاضی',
      };

    case 'job_promotion':
      return {
        title: 'درخواست ارتقای شغلی و بازنگری پایه',
        subject: 'درخواست ترفیع رتبه و ارتقای شغلی',
        recipientTitle: 'مدیرعامل محترم / ریاست محترم سازمان',
        body: 'با سلام و احترام، بدین‌وسیله به استحضار می‌رساند اینجانب از تاریخ ... به عنوان ... در این مجموعه مشغول به فعالیت بوده‌ام. با عنایت به دستاوردهای اخیر، ارتقای مهارت‌های تخصصی و تعهد کامل به اهداف سازمان، خواهشمند است نسبت به بررسی امکان ارتقای رتبه شغلی اینجانب مساعدت لازم مبذول فرمایید.',
        signatureText: 'با تقدیم احترامات فائقه',
      };

    case 'resignation':
      return {
        title: 'اعلام استعفا و خاتمه همکاری',
        subject: 'اعلام استعفا از سمت ...',
        recipientTitle: 'مدیریت محترم عامل',
        body: 'با سلام و عرض ادب، احتراما بدین‌وسیله استعفای خود را از سمت ... در آن شرکت محترم اعلام می‌دارم. حضور در جمع همکاران گرامی برای اینجانب تجربه‌ای ارزشمند بوده است. متعهد می‌گردم تا پایان مهلت قانونی مقرر (مورخ ...)، کلیه امور محوله و اسناد را به صورت کامل به جانشین تعیین‌شده تحویل نمایم.',
        signatureText: 'با آرزوی توفیق و بهروزی روزافزون برای مجموعه',
      };

    case 'meeting_minutes':
      return {
        title: 'صورت‌جلسه رسمی',
        subject: 'صورت‌جلسه هماهنگی پروژه ...',
        body: 'جلسه در تاریخ مذکور با حضور اعضای محترم در محل دفتر مرکزی تشکیل گردید و پیرامون موضوعات تعیین‌شده بحث و تبادل نظر صورت پذیرفت.',
        attendees: ['مدیر پروژه', 'کارشناس ارشد فنی', 'نماینده کارفرما'],
        clauses: [
          'مقرر گردید فاز اول سامانه تا پایان ماه جاری نهایی و مستقر گردد.',
          'تیم فنی متعهد به ارائه مستندات معماری ظرف ۴۸ ساعت آینده شد.',
          'جلسه آتی جهت بررسی بازخورد کاربران در تاریخ ... برگزار خواهد شد.',
        ],
        signatureText: 'امضای حاضرین در جلسه',
      };

    case 'employment_certificate':
      return {
        title: 'گواهی اشتغال به کار',
        subject: 'گواهی اشتغال به کار و میزان حقوق',
        recipientTitle: 'ریاست محترم شعبه بانک / سازمان مربوطه',
        body: 'بدین‌وسیله گواهی می‌شود جناب آقای / سرکار خانم ... با کد ملی ... از تاریخ ... تا کنون به عنوان ... به صورت تمام‌وقت در این شرکت مشغول به فعالیت بوده و دارای حسن سابقه کاری می‌باشند.',
        clauses: [
          'این گواهی صرفاً بنا به درخواست نامبرده و جهت ارائه به مرجع فوق‌الذکر صادر گردیده و فاقد هرگونه ارزش قانونی و تعهد مالی دیگری است.',
        ],
        signatureText: 'مدیر امور اداری و منابع انسانی',
      };

    case 'warning_letter':
      return {
        title: 'اخطار کتبی و تذکر انضباطی',
        subject: 'اخطار کتبی ناشی از عدم رعایت ضوابط اداری',
        recipientTitle: 'همکار گرامی جناب آقای / سرکار خانم ...',
        body: 'احتراماً، پیرو بررسی‌های به عمل آمده و گزارش واصله، متأسفانه ضوابط سازمانی در خصوص ... رعایت نگردیده است. مقتضی است ضمن اصلاح رویه، حداکثر ظرف مدت سه روز کاری توضیحات کتبی خود را به واحد منابع انسانی ارسال فرمایید.',
        clauses: [
          'تکرار موارد مشابه موجب اتخاذ تدابیر انضباطی شدیدتر طبق آیین‌نامه داخلی شرکت خواهد گردید.',
        ],
        signatureText: 'کمیته انضباط کار و منابع انسانی',
      };

    case 'recommendation_letter':
      return {
        title: 'توصیه‌نامه و گواهی حسن انجام کار',
        subject: 'توصیه‌نامه حرفه‌ای جهت همکاری',
        recipientTitle: 'به مراجع محترم ذی‌صلاح',
        body: 'با سلام و تحیات، بدین‌وسیله گواهی می‌شود جناب آقای / سرکار خانم ... در طول مدت همکاری با این شرکت، فردی متعهد، خلاق و با پشتکار بالا بوده و همواره وظایف محوله را با بالاترین کیفیت به انجام رسانده‌اند. بهره‌مندی از تجارب و توانمندی‌های ایشان را به تمامی کارفرمایان محترم توصیه می‌نمایم.',
        signatureText: 'با آرزوی موفقیت روزافزون',
      };

    case 'nda_summary':
      return {
        title: 'تعهدنامه حفظ محرمانگی و عدم افشا (NDA)',
        subject: 'تعهدنامه حفظ اسرار تجاری و اطلاعات فنی',
        recipientTitle: 'به شرکت / سازمان ...',
        body: 'اینجانب متعهد می‌گردم کلیه داده‌ها، اسرار تجاری، کدهای منبع، اطلاعات مشتریان و راهکارهای نرم‌افزاری که در طول همکاری در اختیار اینجانب قرار می‌گیرد را به صورت اکیداً محرمانه تلقی نموده و از هرگونه انتقال، افشا یا استفاده غیرمجاز خودداری نمایم.',
        clauses: [
          'این تعهد پس از پایان همکاری نیز به مدت ۵ سال به قوت خود باقی خواهد ماند.',
          'هرگونه تخلف پیگرد قانونی و الزام به جبران خسارت به همراه خواهد داشت.',
        ],
        signatureText: 'امضا و اثر انگشت متعهد',
      };

    case 'custom':
    default:
      return {
        title: 'نامه اداری',
        subject: 'موضوع نامه',
        recipientTitle: 'مقام محترم مربوطه',
        body: 'با سلام و احترام، بدین‌وسیله به استحضار می‌رساند ...',
        signatureText: 'با تشکر و احترام',
      };
  }
}

/**
 * تولید سند اداری با فرمت متنی (Plain Text)
 */
export function renderTextDocument(
  data: DocumentData,
  options: DocumentOptions = {}
): string {
  const { persianDigits = true, autoDate = true } = options;
  const today = getJalaliDate();
  const dateStr = data.date || (autoDate ? today.formattedPersianDigits : today.formatted);

  const lines: string[] = [];

  // سربرگ
  if (options.headerTitle) {
    lines.push(`بسمه تعالی`);
    lines.push(`سازمان: ${options.headerTitle}`);
    lines.push('────────────────────────────────────────');
  } else {
    lines.push(`بسمه تعالی`);
  }

  // فراداده‌ها
  lines.push(`تاریخ: ${dateStr}`);
  if (data.letterNumber) lines.push(`شماره: ${persianDigits ? toPersianDigits(data.letterNumber) : data.letterNumber}`);
  if (data.attachment) lines.push(`پیوست: ${data.attachment}`);
  lines.push('');

  // مخاطب
  if (data.recipientTitle || data.recipientName) {
    const rec = [data.recipientTitle, data.recipientName].filter(Boolean).join(' ');
    lines.push(`به: ${rec}`);
  }
  if (data.senderTitle || data.senderName) {
    const snd = [data.senderTitle, data.senderName].filter(Boolean).join(' ');
    lines.push(`از: ${snd}`);
  }

  // موضوع
  lines.push(`موضوع: ${data.subject}`);
  lines.push('────────────────────────────────────────');
  lines.push('');

  // متن اصلی
  lines.push(data.body);
  lines.push('');

  // بندها یا مصوبات
  if (data.clauses && data.clauses.length > 0) {
    lines.push('مصوبات و بندها:');
    data.clauses.forEach((clause, index) => {
      const idxStr = persianDigits ? toPersianDigits((index + 1).toString()) : (index + 1).toString();
      lines.push(`${idxStr}. ${clause}`);
    });
    lines.push('');
  }

  // حاضرین (صورتجلسه)
  if (data.attendees && data.attendees.length > 0) {
    lines.push('حاضرین در جلسه:');
    lines.push(data.attendees.join(' - '));
    lines.push('');
  }

  // امضا
  if (data.signatureText) {
    lines.push(data.signatureText);
  }
  if (data.senderName) {
    lines.push(data.senderName);
  }

  // رونوشت‌ها
  if (data.copiesTo && data.copiesTo.length > 0) {
    lines.push('');
    lines.push('رونوشت:');
    data.copiesTo.forEach(c => lines.push(`- ${c}`));
  }

  const result = lines.join('\n');
  return persianDigits ? toPersianDigits(result) : result;
}

/**
 * تولید سند اداری با فرمت مارک‌داون (Markdown)
 */
export function renderMarkdownDocument(
  data: DocumentData,
  options: DocumentOptions = {}
): string {
  const { persianDigits = true, autoDate = true } = options;
  const today = getJalaliDate();
  const dateStr = data.date || (autoDate ? today.formattedPersianDigits : today.formatted);

  const lines: string[] = [];

  lines.push(`### به نام خدا`);
  if (data.title) {
    lines.push(`# ${data.title}`);
  }
  lines.push('');

  // جدول مشخصات اداری
  lines.push('| مشخصات سند | مقدار |');
  lines.push('| :--- | :--- |');
  lines.push(`| **تاریخ** | ${dateStr} |`);
  if (data.letterNumber) lines.push(`| **شماره نامه** | ${data.letterNumber} |`);
  if (data.attachment) lines.push(`| **پیوست** | ${data.attachment} |`);
  if (data.recipientTitle || data.recipientName) {
    lines.push(`| **گیرنده** | ${[data.recipientTitle, data.recipientName].filter(Boolean).join(' ')} |`);
  }
  if (data.senderTitle || data.senderName) {
    lines.push(`| **فرستنده** | ${[data.senderTitle, data.senderName].filter(Boolean).join(' ')} |`);
  }
  lines.push(`| **موضوع** | **${data.subject}** |`);
  lines.push('');

  // متن اصلی
  lines.push(`## شرح نامه`);
  lines.push(data.body);
  lines.push('');

  // بندها
  if (data.clauses && data.clauses.length > 0) {
    lines.push(`## بندها و مصوبات`);
    data.clauses.forEach((clause, index) => {
      lines.push(`${index + 1}. ${clause}`);
    });
    lines.push('');
  }

  // حاضرین
  if (data.attendees && data.attendees.length > 0) {
    lines.push(`## حاضرین جلسه`);
    data.attendees.forEach(a => lines.push(`* ${a}`));
    lines.push('');
  }

  // امضا
  lines.push(`---`);
  if (data.signatureText) lines.push(`**${data.signatureText.replace(/\n/g, '<br>')}**`);
  if (data.senderName) lines.push(`*${data.senderName}*`);

  // رونوشت
  if (data.copiesTo && data.copiesTo.length > 0) {
    lines.push('');
    lines.push(`> **رونوشت:**  `);
    data.copiesTo.forEach(c => lines.push(`> - ${c}  `));
  }

  const result = lines.join('\n');
  return persianDigits ? toPersianDigits(result) : result;
}

/**
 * تولید سند اداری با فرمت HTML شرکتی و استاندارد راست‌به‌چپ (RTL) آماده پرینت
 */
export function renderHtmlDocument(
  data: DocumentData,
  options: DocumentOptions = {}
): string {
  const { persianDigits = true, autoDate = true } = options;
  const today = getJalaliDate();
  const dateStr = data.date || (autoDate ? today.formattedPersianDigits : today.formatted);

  const toP = (s?: string): string => {
    if (!s) return '';
    return persianDigits ? toPersianDigits(s) : s;
  };

  const title = toP(options.headerTitle || data.title || 'مکاتبه اداری');
  const safeDateStr = toP(dateStr);
  const safeSubject = toP(data.subject);
  const safeBody = toP(data.body);

  let clausesHtml = '';
  if (data.clauses && data.clauses.length > 0) {
    clausesHtml = `
      <div class="clauses-section">
        <h3>بندها و مقررات:</h3>
        <ol>
          ${data.clauses.map(c => `<li>${toP(c)}</li>`).join('\n')}
        </ol>
      </div>
    `;
  }

  let attendeesHtml = '';
  if (data.attendees && data.attendees.length > 0) {
    attendeesHtml = `
      <div class="attendees-section">
        <h3>حاضرین در جلسه:</h3>
        <p>${data.attendees.map(a => toP(a)).join(' &bull; ')}</p>
      </div>
    `;
  }

  let copiesHtml = '';
  if (data.copiesTo && data.copiesTo.length > 0) {
    copiesHtml = `
      <div class="copies-section">
        <strong>رونوشت:</strong>
        <ul>
          ${data.copiesTo.map(c => `<li>${toP(c)}</li>`).join('\n')}
        </ul>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 30px;
      color: #1e293b;
      line-height: 1.8;
      direction: rtl;
    }
    .letter-sheet {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 50px 60px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      position: relative;
    }
    .letter-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-center {
      text-align: center;
      flex: 1;
    }
    .header-center h1 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #0f172a;
    }
    .header-center .bismillah {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 5px;
    }
    .header-meta {
      font-size: 13px;
      color: #475569;
      text-align: left;
    }
    .header-meta div {
      margin-bottom: 4px;
    }
    .recipient-block {
      margin-bottom: 25px;
      font-size: 15px;
      font-weight: 600;
    }
    .subject-block {
      background: #f1f5f9;
      padding: 10px 15px;
      border-radius: 6px;
      margin-bottom: 25px;
      font-size: 15px;
      border-right: 4px solid #2563eb;
    }
    .letter-body {
      font-size: 15px;
      text-align: justify;
      margin-bottom: 35px;
      white-space: pre-line;
    }
    .clauses-section ol {
      padding-right: 20px;
    }
    .letter-signature {
      margin-top: 40px;
      text-align: left;
      padding-left: 20px;
    }
    .letter-signature .title {
      font-weight: 600;
      color: #0f172a;
    }
    .copies-section {
      margin-top: 50px;
      padding-top: 15px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
      color: #64748b;
    }
    @media print {
      body { background: transparent; padding: 0; }
      .letter-sheet { box-shadow: none; border: none; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="letter-sheet">
    <div class="letter-header">
      <div style="width: 120px;"></div>
      <div class="header-center">
        <div class="bismillah">بسمه تعالی</div>
        <h1>${title}</h1>
      </div>
      <div class="header-meta">
        <div><strong>تاریخ:</strong> ${safeDateStr}</div>
        ${data.letterNumber ? `<div><strong>شماره:</strong> ${toP(data.letterNumber)}</div>` : ''}
        ${data.attachment ? `<div><strong>پیوست:</strong> ${toP(data.attachment)}</div>` : ''}
      </div>
    </div>

    ${data.recipientTitle ? `
    <div class="recipient-block">
      جناب آقای / سرکار خانم ${toP([data.recipientTitle, data.recipientName].filter(Boolean).join(' '))}<br>
      ${data.organization ? `<span style="font-weight: normal; color: #64748b;">${toP(data.organization)}</span>` : ''}
    </div>` : ''}

    <div class="subject-block">
      <strong>موضوع:</strong> ${safeSubject}
    </div>

    <div class="letter-body">
      ${safeBody}
    </div>

    ${clausesHtml}
    ${attendeesHtml}

    <div class="letter-signature">
      <div class="title">${data.signatureText ? toP(data.signatureText).replace(/\n/g, '<br>') : 'با احترام'}</div>
      ${data.senderName ? `<div style="margin-top: 8px;">${toP(data.senderName)}</div>` : ''}
    </div>

    ${copiesHtml}
  </div>
</body>
</html>`;

  return html;
}

/**
 * تولید سند اداری کامل بر اساس نوع و تنظیمات دلخواه
 *
 * @param type نوع سند اداری (leave_request, job_promotion, meeting_minutes, ...)
 * @param customData داده‌های اختصاصی جهت ترکیب با قالب پیش‌فرض
 * @param options تنظیمات فرمت خروجی (text, markdown, html)
 * @returns سند نهایی تولیدشده
 */
export function generateDocument(
  type: DocumentType,
  customData: Partial<DocumentData> = {},
  options: DocumentOptions = {}
): string {
  const defaultTemplate = getDefaultDocumentTemplate(type);
  const mergedData: DocumentData = {
    ...defaultTemplate,
    ...customData,
    subject: customData.subject || defaultTemplate.subject,
    body: customData.body || defaultTemplate.body,
  };

  const format = options.format || 'text';

  switch (format) {
    case 'html':
      return renderHtmlDocument(mergedData, options);
    case 'markdown':
      return renderMarkdownDocument(mergedData, options);
    case 'text':
    default:
      return renderTextDocument(mergedData, options);
  }
}
