import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Eye, Clock, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";

interface ManualPayment {
  id: string;
  clinic_id: string;
  payment_method: string;
  amount_iqd: number;
  screenshot_url: string;
  transaction_reference: string;
  sender_name: string;
  sender_phone: string;
  notes: string;
  status: string;
  created_at: string;
  clinics: {
    name: string;
  };
}

export default function AdminPayments() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  const { data: payments = [], refetch } = useQuery({
    queryKey: ['manual-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual_payments')
        .select(`
          *,
          clinics (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ManualPayment[];
    },
    enabled: isAdmin
  });

  const handleApprovePayment = async (paymentId: string, clinicId: string) => {
    setProcessing(true);
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('manual_payments')
        .update({
          status: 'approved',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Find the corresponding subscription and activate it
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (subscriptions && subscriptions.length > 0) {
        const subscription = subscriptions[0];
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        await supabase
          .from('subscriptions')
          .update({
            status: 'approved',
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString()
          })
          .eq('id', subscription.id);
      }

      toast({
        title: "تم الموافقة على الدفع",
        description: "تم تفعيل الاشتراك بنجاح",
      });

      refetch();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "خطأ في الموافقة",
        description: "حدث خطأ أثناء الموافقة على الدفع",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "سبب الرفض مطلوب",
        description: "يرجى إدخال سبب رفض الدفع",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('manual_payments')
        .update({
          status: 'rejected',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "تم رفض الدفع",
        description: "تم رفض طلب الدفع",
      });

      setRejectionReason('');
      setSelectedPayment(null);
      refetch();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "خطأ في الرفض",
        description: "حدث خطأ أثناء رفض الدفع",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">قيد المراجعة</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">موافق عليه</Badge>;
      case 'rejected':
        return <Badge variant="destructive">مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'qi_card':
        return 'كي كارد';
      case 'zain_cash':
        return 'زين كاش';
      default:
        return method;
    }
  };

  const downloadScreenshot = async (screenshotUrl: string, paymentId: string) => {
    try {
      const { data } = await supabase.storage
        .from('payment-screenshots')
        .download(screenshotUrl);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-${paymentId}-screenshot`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading screenshot:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل الصورة",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                ليس لديك صلاحية للوصول لهذه الصفحة
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            إدارة المدفوعات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            مراجعة والموافقة على طلبات الدفع المحلية
          </p>
        </div>

        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {payment.clinics?.name || 'عيادة غير محددة'}
                  </CardTitle>
                  {getStatusBadge(payment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <strong>المبلغ:</strong> {payment.amount_iqd.toLocaleString()} د.ع
                  </div>
                  <div>
                    <strong>طريقة الدفع:</strong> {getPaymentMethodText(payment.payment_method)}
                  </div>
                  <div>
                    <strong>اسم المرسل:</strong> {payment.sender_name}
                  </div>
                  <div>
                    <strong>رقم الهاتف:</strong> {payment.sender_phone}
                  </div>
                  {payment.transaction_reference && (
                    <div>
                      <strong>رقم المعاملة:</strong> {payment.transaction_reference}
                    </div>
                  )}
                  <div>
                    <strong>تاريخ الطلب:</strong> {new Date(payment.created_at).toLocaleDateString('ar-IQ')}
                  </div>
                </div>

                {payment.notes && (
                  <div className="mb-4">
                    <strong>الملاحظات:</strong>
                    <p className="text-muted-foreground mt-1">{payment.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadScreenshot(payment.screenshot_url, payment.id)}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل الصورة
                  </Button>

                  {payment.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprovePayment(payment.id, payment.clinic_id)}
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        موافقة
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <XCircle className="h-4 w-4 ml-2" />
                            رفض
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>رفض طلب الدفع</DialogTitle>
                            <DialogDescription>
                              يرجى إدخال سبب رفض طلب الدفع
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="rejection-reason">سبب الرفض</Label>
                              <Textarea
                                id="rejection-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="اكتب سبب رفض الطلب..."
                                rows={4}
                              />
                            </div>
                            <Button
                              onClick={() => handleRejectPayment(payment.id)}
                              disabled={processing || !rejectionReason.trim()}
                              variant="destructive"
                              className="w-full"
                            >
                              {processing ? (
                                <>
                                  <Clock className="h-4 w-4 ml-2 animate-spin" />
                                  جاري الرفض...
                                </>
                              ) : (
                                'تأكيد الرفض'
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {payments.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  لا توجد طلبات دفع حالياً
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}