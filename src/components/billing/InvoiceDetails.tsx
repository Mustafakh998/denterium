import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar, 
  Download, 
  FileText, 
  DollarSign, 
  User, 
  Receipt,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Send
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
  payment_method: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Patient details from join
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_avatar_url: string;
}

interface InvoiceDetailsProps {
  invoice: Invoice;
}

export default function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const { toast } = useToast();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "مدفوعة";
      case "pending":
        return "في الانتظار";
      case "overdue":
        return "متأخرة";
      case "cancelled":
        return "ملغية";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "نقدي";
      case "card":
        return "بطاقة ائتمان";
      case "bank_transfer":
        return "تحويل بنكي";
      case "check":
        return "شيك";
      case "installment":
        return "تقسيط";
      default:
        return method || "-";
    }
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

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

  const calculateNetAmount = () => {
    return (invoice.total_amount || 0) + (invoice.tax_amount || 0) - (invoice.discount_amount || 0);
  };

  const calculateRemainingBalance = () => {
    return calculateNetAmount() - (invoice.paid_amount || 0);
  };

  const handleDownload = async () => {
    try {
      const { generateInvoicePDF } = await import('@/components/billing/InvoicePDF');
      
      // Get clinic data
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('name, address, phone, email, logo_url')
        .eq('id', (window as any).currentClinicId || 'current-clinic-id') // This would come from auth context
        .single();

      if (clinicError) throw clinicError;

      const patient = {
        first_name: invoice.patient_first_name,
        last_name: invoice.patient_last_name,
        phone: invoice.patient_phone
      };

      await generateInvoicePDF({ invoice, patient, clinic });
      
      toast({
        title: "تم تحميل الفاتورة",
        description: "تم إنشاء وتحميل ملف PDF للفاتورة بنجاح",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "خطأ في تحميل الفاتورة",
        description: "حدث خطأ أثناء إنشاء ملف PDF",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = () => {
    // In a real implementation, this would send the invoice via email or SMS
    toast({
      title: "إرسال الفاتورة",
      description: "سيتم إرسال الفاتورة للمريض",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            فاتورة رقم: {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {getStatusIcon(invoice.status)}
            <Badge className={getStatusColor(invoice.status)}>
              {getStatusText(invoice.status)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <FileText className="ml-2 h-4 w-4" />
            طباعة
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="ml-2 h-4 w-4" />
            تحميل PDF
          </Button>
          <Button onClick={handleSend} variant="outline" size="sm">
            <Send className="ml-2 h-4 w-4" />
            إرسال
          </Button>
        </div>
      </div>

      <Separator />

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            معلومات المريض
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-reverse space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={invoice.patient_avatar_url} />
              <AvatarFallback>
                {getPatientInitials(invoice.patient_first_name, invoice.patient_last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {invoice.patient_first_name} {invoice.patient_last_name}
              </p>
              <p className="text-sm text-muted-foreground">{invoice.patient_phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              تواريخ الفاتورة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span>
              <span className="text-sm">{formatDate(invoice.created_at)}</span>
            </div>
            {invoice.due_date && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">تاريخ الاستحقاق:</span>
                <span className="text-sm">{formatDate(invoice.due_date)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">آخر تحديث:</span>
              <span className="text-sm">{formatDate(invoice.updated_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              معلومات الدفع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">طريقة الدفع:</span>
              <span className="text-sm">{getPaymentMethodText(invoice.payment_method)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">المبلغ المدفوع:</span>
              <span className="text-sm text-green-600">{formatCurrency(invoice.paid_amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">المتبقي:</span>
              <span className={`text-sm ${calculateRemainingBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(calculateRemainingBalance())}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            التفاصيل المالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ الأساسي:</span>
              <span>{formatCurrency(invoice.total_amount || 0)}</span>
            </div>
            {(invoice.tax_amount || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الضريبة:</span>
                <span>{formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
            )}
            {(invoice.discount_amount || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الخصم:</span>
                <span className="text-red-600">-{formatCurrency(invoice.discount_amount || 0)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-medium">
              <span>المبلغ الصافي:</span>
              <span>{formatCurrency(calculateNetAmount())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المدفوع:</span>
              <span className="text-green-600">{formatCurrency(invoice.paid_amount || 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>الرصيد المتبقي:</span>
              <span className={calculateRemainingBalance() > 0 ? 'text-red-600' : 'text-green-600'}>
                {formatCurrency(calculateRemainingBalance())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ملاحظات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Status Alert */}
      {calculateRemainingBalance() > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  يوجد مبلغ مستحق
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  المبلغ المتبقي: {formatCurrency(calculateRemainingBalance())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}