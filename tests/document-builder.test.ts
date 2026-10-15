import { describe, it, expect } from 'vitest';
import {
  generateDocument,
  renderTextDocument,
  renderMarkdownDocument,
  renderHtmlDocument,
  getDefaultDocumentTemplate,
} from '../src/document-builder';

describe('Phase 3: Administrative Document Builder', () => {
  describe('Document Templates', () => {
    it('provides default templates for all types', () => {
      const leave = getDefaultDocumentTemplate('leave_request');
      expect(leave.subject).toContain('مرخصی');

      const minutes = getDefaultDocumentTemplate('meeting_minutes');
      expect(minutes.clauses).toBeDefined();
      expect(minutes.attendees).toBeDefined();

      const promo = getDefaultDocumentTemplate('job_promotion');
      expect(promo.subject).toContain('ترفیع');

      const cert = getDefaultDocumentTemplate('employment_certificate');
      expect(cert.title).toContain('اشتغال به کار');
    });
  });

  describe('Document Rendering (Text, Markdown, HTML)', () => {
    const sampleData = {
      subject: 'درخواست موافقت با مأموریت آموزشی',
      body: 'احتراماً بدین‌وسیله تقاضای حضور در کارگاه هوش مصنوعی را دارم.',
      senderName: 'محمدحسین نادعلی',
      senderTitle: 'مهندس ارشد نرم‌افزار',
      recipientTitle: 'مدیریت محترم فناوری اطلاعات',
      letterNumber: '1405/998',
    };

    it('renders clean text document', () => {
      const text = renderTextDocument(sampleData, { persianDigits: true });
      expect(text).toContain('بسمه تعالی');
      expect(text).toContain('موضوع: درخواست موافقت با مأموریت آموزشی');
      expect(text).toContain('محمدحسین نادعلی');
      expect(text).toContain('۱۴۰۵/۹۹۸');
    });

    it('renders structured markdown document with metadata table', () => {
      const md = renderMarkdownDocument(sampleData, { persianDigits: true });
      expect(md).toContain('| **موضوع** |');
      expect(md).toContain('## شرح نامه');
      expect(md).toContain('محمدحسین نادعلی');
    });

    it('renders full RTL HTML document with inline styles', () => {
      const html = renderHtmlDocument(sampleData, { persianDigits: true });
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('dir="rtl"');
      expect(html).toContain('letter-sheet');
      expect(html).toContain('درخواست موافقت با مأموریت آموزشی');
      expect(html).toContain('محمدحسین نادعلی');
    });

    it('generates meeting minutes with attendees and clauses', () => {
      const minutesDoc = generateDocument('meeting_minutes', {
        subject: 'جلسه هماهنگی بازطراحی سامانه',
        attendees: ['مدیر فنی', 'مدیر محصول'],
        clauses: ['طراحی مجدد پایگاه داده', 'پیاده‌سازی ماژول جدید'],
      }, { format: 'markdown' });

      expect(minutesDoc).toContain('حاضرین جلسه');
      expect(minutesDoc).toContain('مدیر فنی');
      expect(minutesDoc).toContain('بندها و مصوبات');
      expect(minutesDoc).toContain('طراحی مجدد پایگاه داده');
    });
  });
});
