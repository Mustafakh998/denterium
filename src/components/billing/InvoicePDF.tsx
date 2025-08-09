import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Clinic {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

interface Patient {
  first_name: string;
  last_name: string;
  phone?: string;
}

interface Invoice {
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

interface InvoicePDFProps {
  invoice: Invoice;
  patient: Patient;
  clinic: Clinic;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateNetAmount = (invoice: Invoice) => {
  return (invoice.total_amount || 0) + (invoice.tax_amount || 0) - (invoice.discount_amount || 0);
};

const calculateRemainingBalance = (invoice: Invoice) => {
  return calculateNetAmount(invoice) - (invoice.paid_amount || 0);
};

export const generateInvoicePDF = async ({ invoice, patient, clinic }: InvoicePDFProps, options?: { action?: 'save' | 'print' }) => {
  // Create a temporary div for the invoice content
  const invoiceElement = document.createElement('div');
  invoiceElement.style.fontFamily = 'Arial, sans-serif';
  invoiceElement.style.direction = 'rtl';
  invoiceElement.style.textAlign = 'right';
  invoiceElement.style.padding = '20px';
  invoiceElement.style.backgroundColor = 'white';
  invoiceElement.style.width = '800px';
  invoiceElement.style.margin = '0 auto';

  // Build the HTML content
  invoiceElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
      <div>
        ${clinic.logo_url ? `<img src="${clinic.logo_url}" alt="شعار العيادة" style="max-height: 80px; max-width: 200px;" />` : ''}
        <h1 style="margin: 10px 0 5px 0; font-size: 24px; color: #1f2937;">${clinic.name}</h1>
        ${clinic.address ? `<p style="margin: 2px 0; color: #6b7280;">${clinic.address}</p>` : ''}
        ${clinic.phone ? `<p style="margin: 2px 0; color: #6b7280;">الهاتف: ${clinic.phone}</p>` : ''}
        ${clinic.email ? `<p style="margin: 2px 0; color: #6b7280;">البريد الإلكتروني: ${clinic.email}</p>` : ''}
      </div>
      <div style="text-align: left;">
        <h2 style="margin: 0; font-size: 28px; color: #3b82f6;">فاتورة</h2>
        <p style="margin: 5px 0; font-size: 18px; color: #6b7280;">رقم: ${invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}</p>
        <p style="margin: 5px 0; color: #6b7280;">التاريخ: ${formatDate(invoice.created_at)}</p>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="margin-bottom: 10px; font-size: 18px; color: #1f2937;">معلومات المريض:</h3>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
        <p style="margin: 5px 0; font-weight: bold;">${patient.first_name} ${patient.last_name}</p>
        ${patient.phone ? `<p style="margin: 5px 0; color: #6b7280;">الهاتف: ${patient.phone}</p>` : ''}
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="margin-bottom: 15px; font-size: 18px; color: #1f2937;">التفاصيل المالية:</h3>
      <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
        <tr style="background-color: #e5e7eb;">
          <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #d1d5db;">البيان</td>
          <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #d1d5db; text-align: left;">المبلغ</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db;">المبلغ الأساسي</td>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: left;">${formatCurrency(invoice.total_amount || 0)}</td>
        </tr>
        ${(invoice.tax_amount || 0) > 0 ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db;">الضريبة</td>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: left;">${formatCurrency(invoice.tax_amount || 0)}</td>
        </tr>
        ` : ''}
        ${(invoice.discount_amount || 0) > 0 ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db;">الخصم</td>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: left; color: #ef4444;">-${formatCurrency(invoice.discount_amount || 0)}</td>
        </tr>
        ` : ''}
        <tr style="background-color: #e5e7eb; font-weight: bold; font-size: 16px;">
          <td style="padding: 15px; border-bottom: 1px solid #d1d5db;">المبلغ الصافي</td>
          <td style="padding: 15px; border-bottom: 1px solid #d1d5db; text-align: left;">${formatCurrency(calculateNetAmount(invoice))}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db;">المدفوع</td>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: left; color: #10b981;">${formatCurrency(invoice.paid_amount || 0)}</td>
        </tr>
        <tr style="background-color: #fef3c7; font-weight: bold; font-size: 16px;">
          <td style="padding: 15px;">الرصيد المتبقي</td>
          <td style="padding: 15px; text-align: left; color: ${calculateRemainingBalance(invoice) > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(calculateRemainingBalance(invoice))}</td>
        </tr>
      </table>
    </div>

    ${invoice.notes ? `
    <div style="margin-bottom: 30px;">
      <h3 style="margin-bottom: 10px; font-size: 18px; color: #1f2937;">ملاحظات:</h3>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; color: #6b7280;">
        ${invoice.notes}
      </div>
    </div>
    ` : ''}

    ${invoice.due_date ? `
    <div style="margin-bottom: 20px;">
      <p style="color: #6b7280; text-align: center;"><strong>تاريخ الاستحقاق:</strong> ${formatDate(invoice.due_date)}</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
      <p>شكراً لثقتكم بنا</p>
    </div>
  `;

  // Add the element to the document temporarily
  document.body.appendChild(invoiceElement);

  try {
    // Convert to canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: invoiceElement.offsetHeight
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions to fit on page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // 10mm top margin

    // Add first page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 20; // Account for margins

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
    }

    // Download or print the PDF
    const fileName = `invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf`;
    if (options?.action === 'print') {
      try { pdf.autoPrint && (pdf as any).autoPrint(); } catch {}
      const url = pdf.output('bloburl');
      window.open(url, '_blank');
    } else {
      pdf.save(fileName);
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Remove the temporary element
    document.body.removeChild(invoiceElement);
  }
};