import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

export interface Clinic {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

export interface Patient {
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  paid_amount: number;
  status: string;
  due_date?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ar-IQ', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const calculateNetAmount = (invoice: Invoice) => (invoice.total_amount || 0) + (invoice.tax_amount || 0) - (invoice.discount_amount || 0);
const calculateRemainingBalance = (invoice: Invoice) => calculateNetAmount(invoice) - (invoice.paid_amount || 0);

async function fetchAsDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function ensureArabicFont(pdf: jsPDF) {
  try {
    const res = await fetch('/fonts/NotoNaskhArabic-Regular.ttf');
    const ab = await res.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
    pdf.addFileToVFS('NotoNaskhArabic-Regular.ttf', base64);
    pdf.addFont('NotoNaskhArabic-Regular.ttf', 'NotoNaskhArabic', 'normal');
    pdf.setFont('NotoNaskhArabic');
  } catch (e) {
    // Fallback to default font
  }
}

export async function buildInvoicePDF(invoice: Invoice, patient: Patient, clinic: Clinic) {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await ensureArabicFont(pdf);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  let cursorY = margin;

  // Header
  const logoDataUrl = clinic.logo_url ? await fetchAsDataURL(clinic.logo_url) : null;
  const headerHeight = 26;
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', margin, cursorY, 30, 20);
    } catch {}
  }

  pdf.setFontSize(16);
  pdf.text(clinic.name || 'اسم العيادة', pageWidth - margin, cursorY + 6, { align: 'right' });
  pdf.setFontSize(10);
  const contactLines = [clinic.address, clinic.phone, clinic.email].filter(Boolean) as string[];
  contactLines.forEach((line, idx) => {
    pdf.text(line, pageWidth - margin, cursorY + 12 + idx * 5, { align: 'right' });
  });

  // Invoice title and meta
  cursorY += headerHeight;
  pdf.setFontSize(22);
  pdf.setTextColor(33);
  pdf.text('فاتورة', pageWidth - margin, cursorY, { align: 'right' });
  pdf.setFontSize(12);
  pdf.setTextColor(80);
  cursorY += 6;
  pdf.text(`رقم: ${invoice.invoice_number || `INV-${invoice.id.slice(0,8)}`}`, pageWidth - margin, cursorY, { align: 'right' });
  cursorY += 6;
  pdf.text(`التاريخ: ${formatDate(invoice.created_at)}`, pageWidth - margin, cursorY, { align: 'right' });

  // Patient box
  cursorY += 10;
  pdf.setDrawColor(220);
  pdf.setFillColor(247, 249, 252);
  pdf.roundedRect(margin, cursorY, pageWidth - margin * 2, 22, 2, 2, 'F');
  pdf.setTextColor(30);
  pdf.setFontSize(13);
  pdf.text('معلومات المريض', pageWidth - margin - 4, cursorY + 7, { align: 'right' });
  pdf.setFontSize(11);
  pdf.setTextColor(60);
  pdf.text(`${patient.first_name} ${patient.last_name}`, pageWidth - margin - 4, cursorY + 14, { align: 'right' });
  if (patient.phone) {
    pdf.text(`الهاتف: ${patient.phone}`, pageWidth - margin - 4, cursorY + 20, { align: 'right' });
  }
  cursorY += 28;

  // Financial table
  const rows: RowInput[] = [];
  rows.push(['المبلغ الأساسي', formatCurrency(invoice.total_amount || 0)]);
  if ((invoice.tax_amount || 0) > 0) rows.push(['الضريبة', formatCurrency(invoice.tax_amount || 0)]);
  if ((invoice.discount_amount || 0) > 0) rows.push(['الخصم', `-${formatCurrency(invoice.discount_amount || 0)}`]);
  rows.push(['المبلغ الصافي', formatCurrency(calculateNetAmount(invoice))]);
  rows.push(['المدفوع', formatCurrency(invoice.paid_amount || 0)]);
  rows.push(['الرصيد المتبقي', formatCurrency(calculateRemainingBalance(invoice))]);

  autoTable(pdf, {
    head: [['البيان', 'المبلغ']],
    body: rows,
    styles: { font: 'NotoNaskhArabic', halign: 'right' },
    headStyles: { fillColor: [229, 231, 235], textColor: 33, font: 'NotoNaskhArabic' },
    columnStyles: {
      0: { cellWidth: (pageWidth - margin * 2) * 0.6, halign: 'right' },
      1: { cellWidth: (pageWidth - margin * 2) * 0.4, halign: 'left' },
    },
    startY: cursorY,
    margin: { left: margin, right: margin },
  });

  let afterTableY = (pdf as any).lastAutoTable.finalY || cursorY + 6;

  // Notes
  if (invoice.notes) {
    afterTableY += 8;
    pdf.setFontSize(12);
    pdf.setTextColor(30);
    pdf.text('ملاحظات:', pageWidth - margin, afterTableY, { align: 'right' });
    pdf.setFontSize(10);
    pdf.setTextColor(60);
    const wrapped = pdf.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    pdf.text(wrapped, pageWidth - margin, afterTableY + 6, { align: 'right' });
    afterTableY += 6 + (wrapped.length * 5);
  }

  // Due date
  if (invoice.due_date) {
    pdf.setTextColor(80);
    pdf.text(`تاريخ الاستحقاق: ${formatDate(invoice.due_date)}`, pageWidth - margin, afterTableY + 8, { align: 'right' });
    afterTableY += 12;
  }

  // Footer
  pdf.setDrawColor(230);
  pdf.line(margin, 285 - 20, pageWidth - margin, 285 - 20);
  pdf.setTextColor(120);
  pdf.setFontSize(10);
  pdf.text('شكراً لثقتكم بنا', pageWidth / 2, 285 - 12, { align: 'center' });

  return pdf;
}
