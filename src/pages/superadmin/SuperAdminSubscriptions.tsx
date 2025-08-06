import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Subscription {
  id: string;
  clinic_id: string;
  plan: string;
  status: string;
  amount_iqd: number;
  amount_usd: number;
  payment_method: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
  clinics: {
    name: string;
    email: string;
  } | null;
}

export default function SuperAdminSubscriptions() {
  const { toast } = useToast();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPlan, setNewPlan] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const { data: subscriptions = [], refetch } = useQuery({
    queryKey: ['super-admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          clinics (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Subscription[];
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-200 border-green-400/30">نشط</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30">قيد المراجعة</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-200 border-red-400/30">مرفوض</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500/20 text-gray-200 border-gray-400/30">منتهي</Badge>;
      default:
        return <Badge variant="outline" className="border-white/20 text-white">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const planText = plan === 'basic' ? 'أساسي' : plan === 'premium' ? 'احترافي' : 'مؤسسي';
    const planColor = plan === 'basic' ? 'bg-blue-500/20 text-blue-200 border-blue-400/30' : 
                     plan === 'premium' ? 'bg-purple-500/20 text-purple-200 border-purple-400/30' :
                     'bg-orange-500/20 text-orange-200 border-orange-400/30';
    
    return <Badge className={planColor}>{planText}</Badge>;
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'qi_card':
        return 'كي كارد';
      case 'zain_cash':
        return 'زين كاش';
      case 'stripe':
        return 'بطاقة ائتمانية';
      default:
        return method;
    }
  };

  const updateSubscription = async () => {
    if (!selectedSubscription || (!newStatus && !newPlan)) return;

    setUpdating(true);
    try {
      const updates: any = {};
      if (newStatus) updates.status = newStatus;
      if (newPlan) updates.plan = newPlan;

      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      toast({
        title: "تم تحديث الاشتراك",
        description: "تم تحديث بيانات الاشتراك بنجاح",
      });

      setSelectedSubscription(null);
      setNewStatus('');
      setNewPlan('');
      refetch();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الاشتراك",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            إدارة الاشتراكات
          </h1>
          <p className="text-blue-200 mt-2">
            عرض وإدارة جميع اشتراكات النظام
          </p>
        </div>

        <div className="grid gap-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white">
                    {subscription.clinics?.name || 'عيادة غير محددة'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(subscription.status)}
                    {getPlanBadge(subscription.plan)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <strong className="text-blue-200">البريد الإلكتروني:</strong> 
                    <span className="text-white ml-2">{subscription.clinics?.email}</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">المبلغ:</strong> 
                    <span className="text-white ml-2">{subscription.amount_iqd.toLocaleString()} د.ع</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">طريقة الدفع:</strong> 
                    <span className="text-white ml-2">{getPaymentMethodText(subscription.payment_method)}</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">تاريخ البداية:</strong> 
                    <span className="text-white ml-2">
                      {subscription.current_period_start 
                        ? new Date(subscription.current_period_start).toLocaleDateString('ar-IQ')
                        : 'غير محدد'
                      }
                    </span>
                  </div>
                  <div>
                    <strong className="text-blue-200">تاريخ الانتهاء:</strong> 
                    <span className={`ml-2 ${
                      subscription.current_period_end && isExpired(subscription.current_period_end) 
                        ? 'text-red-300' 
                        : subscription.current_period_end && isExpiringSoon(subscription.current_period_end)
                        ? 'text-yellow-300'
                        : 'text-white'
                    }`}>
                      {subscription.current_period_end 
                        ? new Date(subscription.current_period_end).toLocaleDateString('ar-IQ')
                        : 'غير محدد'
                      }
                    </span>
                  </div>
                  <div>
                    <strong className="text-blue-200">تاريخ الإنشاء:</strong> 
                    <span className="text-white ml-2">
                      {new Date(subscription.created_at).toLocaleDateString('ar-IQ')}
                    </span>
                  </div>
                </div>

                {subscription.current_period_end && (
                  <div className="mb-4">
                    {isExpired(subscription.current_period_end) && (
                      <div className="flex items-center gap-2 text-red-300">
                        <XCircle className="h-4 w-4" />
                        <span>الاشتراك منتهي</span>
                      </div>
                    )}
                    {isExpiringSoon(subscription.current_period_end) && !isExpired(subscription.current_period_end) && (
                      <div className="flex items-center gap-2 text-yellow-300">
                        <Clock className="h-4 w-4" />
                        <span>الاشتراك سينتهي قريباً</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubscription(subscription)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <CreditCard className="h-4 w-4 ml-2" />
                        تعديل الاشتراك
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-white/20">
                      <DialogHeader>
                        <DialogTitle className="text-white">تعديل الاشتراك</DialogTitle>
                        <DialogDescription className="text-blue-200">
                          تعديل حالة أو خطة الاشتراك
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="status" className="text-white">الحالة</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="اختر الحالة الجديدة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="approved">نشط</SelectItem>
                              <SelectItem value="pending">قيد المراجعة</SelectItem>
                              <SelectItem value="rejected">مرفوض</SelectItem>
                              <SelectItem value="expired">منتهي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="plan" className="text-white">الخطة</Label>
                          <Select value={newPlan} onValueChange={setNewPlan}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="اختر الخطة الجديدة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">أساسي</SelectItem>
                              <SelectItem value="premium">احترافي</SelectItem>
                              <SelectItem value="enterprise">مؤسسي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={updateSubscription}
                          disabled={updating || (!newStatus && !newPlan)}
                          className="w-full bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30"
                        >
                          {updating ? (
                            <>
                              <Clock className="h-4 w-4 ml-2 animate-spin" />
                              جاري التحديث...
                            </>
                          ) : (
                            'تحديث الاشتراك'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}

          {subscriptions.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-6">
                <p className="text-center text-blue-200">
                  لا توجد اشتراكات حالياً
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}