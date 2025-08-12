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
  try {
    const { buildInvoicePDF } = await import('./invoice-templates/StandardInvoiceTemplate');
    const pdf = await buildInvoicePDF(invoice, patient, clinic);

    const fileName = `invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf`;
    if (options?.action === 'print') {
      try { 
        if (typeof (pdf as any).autoPrint === 'function') {
          (pdf as any).autoPrint(); 
        }
      } catch (e) {
        console.warn('Auto-print not supported:', e);
      }
      const url = pdf.output('bloburl');
      window.open(url, '_blank');
    } else {
      pdf.save(fileName);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};