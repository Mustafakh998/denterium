import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Download, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ManualPayment {
  id: string;
  clinic_id: string | null;
  user_id: string;
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
  } | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function SuperAdminPayments() {
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: payments = [], refetch } = useQuery({
    queryKey: ['super-admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual_payments')
        .select(`
          *,
          clinics (
            name
          ),
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any;
    }
  });

  const handleApprovePayment = async (paymentId: string, userId: string, clinicId: string | null) => {
    setProcessing(true);
    try {
      // Get the payment details first
      const { data: payment, error: paymentFetchError } = await supabase
        .from('manual_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentFetchError) throw paymentFetchError;

      // Update payment status
      const { error: paymentError } = await supabase
        .from('manual_payments')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Determine plan based on amount
      let plan: 'basic' | 'premium' | 'enterprise' = 'basic';
      if (payment.amount_iqd >= 30000) {
        plan = 'enterprise';
      } else if (payment.amount_iqd >= 20000) {
        plan = 'premium';
      }

      // Create or update subscription record
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      // Check if subscription already exists for this clinic
      let existingSubscription = null;
      if (clinicId) {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        existingSubscription = data;
      }

      if (existingSubscription) {
        // Update existing subscription
        await supabase
          .from('subscriptions')
          .update({
            status: 'approved',
            plan: plan,
            amount_iqd: payment.amount_iqd,
            amount_usd: Math.round(payment.amount_iqd / 1316),
            payment_method: payment.payment_method,
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString()
          })
          .eq('id', existingSubscription.id);
      } else {
        // Create new subscription record
        const { data: newSubscription } = await supabase
          .from('subscriptions')
          .insert({
            clinic_id: clinicId,
            plan: plan,
            status: 'approved',
            amount_iqd: payment.amount_iqd,
            amount_usd: Math.round(payment.amount_iqd / 1316),
            payment_method: payment.payment_method,
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString()
          })
          .select()
          .single();

        // Link the manual payment to the subscription
        if (newSubscription) {
          await supabase
            .from('manual_payments')
            .update({ subscription_id: newSubscription.id })
            .eq('id', paymentId);
        }
      }

      toast({
        title: "تم الموافقة على الدفع",
        description: `تم تفعيل اشتراك ${plan === 'basic' ? 'أساسي' : plan === 'premium' ? 'احترافي' : 'مؤسسي'} بنجاح`,
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
        return <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30">قيد المراجعة</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-200 border-green-400/30">موافق عليه</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-200 border-red-400/30">مرفوض</Badge>;
      default:
        return <Badge variant="outline" className="border-white/20 text-white">{status}</Badge>;
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

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            إدارة المدفوعات
          </h1>
          <p className="text-blue-200 mt-2">
            مراجعة والموافقة على طلبات الدفع المحلية
          </p>
        </div>

        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white">
                    {payment.profiles?.first_name} {payment.profiles?.last_name}
                    {payment.clinics?.name && ` - ${payment.clinics.name}`}
                  </CardTitle>
                  {getStatusBadge(payment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <strong className="text-blue-200">المبلغ:</strong> 
                    <span className="text-white ml-2">{payment.amount_iqd.toLocaleString()} د.ع</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">طريقة الدفع:</strong> 
                    <span className="text-white ml-2">{getPaymentMethodText(payment.payment_method)}</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">اسم المرسل:</strong> 
                    <span className="text-white ml-2">{payment.sender_name}</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">رقم الهاتف:</strong> 
                    <span className="text-white ml-2">{payment.sender_phone}</span>
                  </div>
                  {payment.transaction_reference && (
                    <div>
                      <strong className="text-blue-200">رقم المعاملة:</strong> 
                      <span className="text-white ml-2">{payment.transaction_reference}</span>
                    </div>
                  )}
                  <div>
                    <strong className="text-blue-200">تاريخ الطلب:</strong> 
                    <span className="text-white ml-2">{new Date(payment.created_at).toLocaleDateString('ar-IQ')}</span>
                  </div>
                </div>

                {payment.notes && (
                  <div className="mb-4">
                    <strong className="text-blue-200">الملاحظات:</strong>
                    <p className="text-white mt-1">{payment.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadScreenshot(payment.screenshot_url, payment.id)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل الصورة
                  </Button>

                  {payment.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprovePayment(payment.id, payment.user_id, payment.clinic_id)}
                        disabled={processing}
                        className="bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/30"
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        موافقة
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                            className="border-red-400/20 text-red-300 hover:bg-red-500/10"
                          >
                            <XCircle className="h-4 w-4 ml-2" />
                            رفض
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-white/20">
                          <DialogHeader>
                            <DialogTitle className="text-white">رفض طلب الدفع</DialogTitle>
                            <DialogDescription className="text-blue-200">
                              يرجى إدخال سبب رفض طلب الدفع
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="rejection-reason" className="text-white">سبب الرفض</Label>
                              <Textarea
                                id="rejection-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="اكتب سبب رفض الطلب..."
                                rows={4}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                              />
                            </div>
                            <Button
                              onClick={() => handleRejectPayment(payment.id)}
                              disabled={processing || !rejectionReason.trim()}
                              className="w-full bg-red-500/20 text-red-200 border-red-400/30 hover:bg-red-500/30"
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-6">
                <p className="text-center text-blue-200">
                  لا توجد طلبات دفع حالياً
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}