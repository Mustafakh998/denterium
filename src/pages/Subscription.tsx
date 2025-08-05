import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Upload, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SubscriptionData {
  subscribed: boolean;
  plan: string | null;
  subscription_end: string | null;
  payment_method: string | null;
}

export default function Subscription() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'أساسي',
      price: '10,000 د.ع',
      usdPrice: '$7.60',
      features: [
        'حتى 100 مريض',
        'حتى 3 موظفين',
        '500 موعد شهرياً',
        'التقارير الأساسية',
        'الدعم الفني'
      ]
    },
    {
      id: 'premium',
      name: 'متميز',
      price: '20,000 د.ع',
      usdPrice: '$15.20',
      features: [
        'حتى 500 مريض',
        'حتى 10 موظفين',
        '2000 موعد شهرياً',
        'تقارير متقدمة',
        'النسخ الاحتياطي',
        'التحليلات المتقدمة',
        'حتى 3 عيادات'
      ]
    },
    {
      id: 'enterprise',
      name: 'مؤسسي',
      price: '30,000 د.ع',
      usdPrice: '$22.80',
      features: [
        'مرضى غير محدود',
        'موظفين غير محدود',
        'مواعيد غير محدودة',
        'جميع التقارير',
        'النسخ الاحتياطي المتقدم',
        'التحليلات الشاملة',
        'عيادات غير محدودة',
        'الدعم المتميز'
      ]
    }
  ];

  const checkSubscriptionStatus = async () => {
    if (!user || checkingStatus) return;
    
    setCheckingStatus(true);
    try {
      // Check subscription status from database directly (no Stripe needed)
      const { data: subData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('clinic_id', profile?.clinic_id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (subData) {
        setSubscription({
          subscribed: true,
          plan: subData.plan,
          subscription_end: subData.current_period_end,
          payment_method: subData.payment_method
        });
      } else {
        setSubscription({
          subscribed: false,
          plan: null,
          subscription_end: null,
          payment_method: null
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "خطأ في التحقق من الاشتراك",
        description: "حدث خطأ أثناء التحقق من حالة الاشتراك",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Initial check with a small delay to prevent rapid calls
    const timer = setTimeout(() => {
      checkSubscriptionStatus();
    }, 500);
    
    // Auto-refresh every 60 seconds (reduced frequency to avoid rate limits)
    const interval = setInterval(() => {
      if (!checkingStatus) { // Only check if not already checking
        checkSubscriptionStatus();
      }
    }, 60000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [user]);

  const handleStripeSubscription = async (plan: string) => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { plan }
      });

      if (error) {
        console.error('Create subscription error:', error);
        
        // Handle specific Stripe errors
        if (error.message?.includes('business name')) {
          toast({
            title: "مطلوب إعداد حساب Stripe",
            description: "يرجى إعداد اسم الشركة أو الأعمال في حساب Stripe الخاص بك لاستكمال العملية",
            variant: "destructive",
          });
          return;
        }
        
        if (error.message?.includes('rate limit')) {
          toast({
            title: "يرجى الانتظار",
            description: "الكثير من الطلبات، يرجى المحاولة بعد دقيقة",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "تم فتح صفحة الدفع",
          description: "تم فتح صفحة الدفع في نافذة جديدة، يرجى إكمال عملية الدفع",
        });
      } else {
        throw new Error("لم يتم الحصول على رابط الدفع");
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      
      let errorMessage = "حدث خطأ أثناء إنشاء الاشتراك";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ في إنشاء الاشتراك",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: "خطأ في الوصول لإدارة الاشتراك",
        description: "حدث خطأ أثناء الوصول لصفحة إدارة الاشتراك",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return null;
    
    if (subscription.subscribed) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">نشط</Badge>;
    }
    return <Badge variant="outline">غير مفعل</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إدارة الاشتراك
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              اختر الخطة المناسبة لعيادتك
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={checkSubscriptionStatus}
              disabled={checkingStatus}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${checkingStatus ? 'animate-spin' : ''}`} />
              تحديث الحالة
            </Button>
            {getStatusBadge()}
          </div>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                حالة الاشتراك الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription.subscribed ? (
                <div className="space-y-2">
                  <p><strong>الخطة:</strong> {subscription.plan === 'basic' ? 'أساسي' : subscription.plan === 'premium' ? 'متميز' : 'مؤسسي'}</p>
                  <p><strong>طريقة الدفع:</strong> {
                    subscription.payment_method === 'stripe' ? 'بطاقة ائتمان' :
                    subscription.payment_method === 'qi_card' ? 'كي كارد' :
                    subscription.payment_method === 'zain_cash' ? 'زين كاش' : 
                    subscription.payment_method
                  }</p>
                  {subscription.subscription_end && (
                    <p><strong>تاريخ انتهاء الاشتراك:</strong> {new Date(subscription.subscription_end).toLocaleDateString('ar-IQ')}</p>
                  )}
                  {subscription.payment_method === 'stripe' && (
                    <Button onClick={handleManageSubscription} disabled={loading} className="mt-4">
                      <CreditCard className="h-4 w-4 ml-2" />
                      إدارة الاشتراك
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">لا يوجد اشتراك نشط حالياً</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${subscription?.plan === plan.id ? 'ring-2 ring-primary' : ''}`}>
              {subscription?.plan === plan.id && (
                <Badge className="absolute -top-2 right-4 bg-primary">
                  الخطة الحالية
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-center">{plan.name}</CardTitle>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.usdPrice} شهرياً</div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-2">
                  
                  {/* Local Payment Method */}
                  <ManualPaymentDialog planId={plan.id} planName={plan.name} price={plan.price} />
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                      طرق الدفع المتاحة:
                    </p>
                    <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                      <p>🟢 كي كارد (Qi Card)</p>
                      <p>🟡 زين كاش (Zain Cash)</p>
                      <p>🏦 تحويل بنكي مباشر</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Manual Payment Dialog Component
function ManualPaymentDialog({ planId, planName, price }: { planId: string, planName: string, price: string }) {
  const [open, setOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qi_card' | 'zain_cash' | 'bank_transfer'>('qi_card');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleManualPayment = async () => {
    if (!user || !profile?.clinic_id || !screenshot) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload screenshot
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      // Create manual payment record
      const { error: paymentError } = await supabase
        .from('manual_payments')
        .insert({
          clinic_id: profile.clinic_id,
          payment_method: paymentMethod,
          amount_iqd: parseInt(price.replace(/[^\d]/g, '')),
          screenshot_url: fileName,
          transaction_reference: transactionRef,
          sender_name: senderName,
          sender_phone: senderPhone,
          notes: notes,
          status: 'pending'
        });

      if (paymentError) throw paymentError;

      // Create pending subscription
      const planPricing = {
        basic: { iqd: 10000, usd: 7.60 },
        premium: { iqd: 20000, usd: 15.20 },
        enterprise: { iqd: 30000, usd: 22.80 }
      };

      await supabase
        .from('subscriptions')
        .insert({
          clinic_id: profile.clinic_id,
          plan: planId as 'basic' | 'premium' | 'enterprise',
          status: 'pending',
          amount_iqd: planPricing[planId as keyof typeof planPricing].iqd,
          amount_usd: planPricing[planId as keyof typeof planPricing].usd,
          payment_method: paymentMethod
        });

      toast({
        title: "تم إرسال طلب الدفع",
        description: "تم إرسال طلب الدفع للمراجعة، سيتم تفعيل الاشتراك خلال 24 ساعة",
      });

      setOpen(false);
      // Reset form
      setSenderName('');
      setSenderPhone('');
      setTransactionRef('');
      setNotes('');
      setScreenshot(null);
    } catch (error) {
      console.error('Error submitting manual payment:', error);
      toast({
        title: "خطأ في إرسال طلب الدفع",
        description: "حدث خطأ أثناء إرسال طلب الدفع",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="h-4 w-4 ml-2" />
          الدفع المحلي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>الدفع المحلي - {planName}</DialogTitle>
          <DialogDescription>
            السعر: {price} شهرياً
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="payment-method">طريقة الدفع</Label>
            <Select value={paymentMethod} onValueChange={(value: 'qi_card' | 'zain_cash') => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qi_card">كي كارد</SelectItem>
                <SelectItem value="zain_cash">زين كاش</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sender-name">اسم المرسل</Label>
            <Input
              id="sender-name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="الاسم الكامل"
            />
          </div>

          <div>
            <Label htmlFor="sender-phone">رقم الهاتف</Label>
            <Input
              id="sender-phone"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="07xxxxxxxxx"
            />
          </div>

          <div>
            <Label htmlFor="transaction-ref">رقم المعاملة (اختياري)</Label>
            <Input
              id="transaction-ref"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="رقم الإيصال أو المرجع"
            />
          </div>

          <div>
            <Label htmlFor="screenshot">لقطة شاشة من العملية</Label>
            <Input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات (اختيارية)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleManualPayment} 
            disabled={!screenshot || !senderName || !senderPhone || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Clock className="h-4 w-4 ml-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              'إرسال طلب الدفع'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}