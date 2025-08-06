import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Upload, Clock, CheckCircle, XCircle, RefreshCw, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FibPaymentDialog } from "@/components/billing/FibPaymentDialog";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionData {
  subscribed: boolean;
  plan: string | null;
  subscription_end: string | null;
  payment_method: string | null;
}

export default function Subscription() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { subscription: userSubscription, loading: subscriptionLoading, refetch } = useSubscription();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'أساسي',
      price: '10,000 د.ع',
      usdPrice: '$7.60',
      monthlyPrice: '/شهر',
      features: [
        '50 مريض كحد أقصى',
        '2 موظف',
        '100 موعد شهرياً',
        'التقارير الأساسية',
        'إدارة المرضى والمواعيد',
        'الفواتير الأساسية',
        'الدعم الفني العادي'
      ],
      notIncluded: [
        'التحليلات المتقدمة',
        'الصور الطبية',
        'إدارة الوصفات الطبية',
        'ميزات التواصل',
        'النسخ الاحتياطي'
      ]
    },
    {
      id: 'premium',
      name: 'احترافي',
      price: '20,000 د.ع',
      usdPrice: '$15.20',
      monthlyPrice: '/شهر',
      badge: 'الأكثر شعبية',
      features: [
        '200 مريض كحد أقصى',
        '5 موظفين',
        '500 موعد شهرياً',
        'جميع ميزات الخطة الأساسية',
        'التحليلات المتقدمة',
        'إدارة الصور الطبية',
        'إدارة الوصفات الطبية',
        'ميزات التواصل',
        'التقارير المتقدمة'
      ],
      notIncluded: [
        'النسخ الاحتياطي والاستعادة'
      ]
    },
    {
      id: 'enterprise',
      name: 'مؤسسي',
      price: '30,000 د.ع',
      usdPrice: '$22.80',
      monthlyPrice: '/شهر',
      badge: 'الأكثر تميزاً',
      features: [
        'مرضى غير محدود',
        'موظفين غير محدود',
        'مواعيد غير محدودة',
        'جميع ميزات الخطة الاحترافية',
        'النسخ الاحتياطي والاستعادة',
        'الدعم المميز',
        'الأمان المتقدم',
        'تخصيص كامل',
        'تدريب مخصص'
      ],
      notIncluded: []
    }
  ];

  const getPlanDisplayName = (plan: string) => {
    const planNames = {
      basic: 'أساسي',
      premium: 'احترافي', 
      enterprise: 'مؤسسي'
    };
    return planNames[plan as keyof typeof planNames] || plan;
  };

  const getUpgradePrice = (currentPlan: string, targetPlan: string) => {
    const prices = {
      basic: 10000,
      premium: 20000,
      enterprise: 30000
    };
    
    const currentPrice = prices[currentPlan as keyof typeof prices] || 0;
    const targetPrice = prices[targetPlan as keyof typeof prices] || 0;
    
    return Math.max(0, targetPrice - currentPrice);
  };

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
    if (!userSubscription) return <Badge variant="outline">غير مفعل</Badge>;
    
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      <Crown className="h-3 w-3 ml-1" />
      نشط
    </Badge>;
  };

  // Show message for users without clinic_id
  if (!profile?.clinic_id) {
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
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg text-center">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              مرحباً بك!
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              يمكنك الاشتراك الآن وسيتم إنشاء عيادتك تلقائياً بعد تأكيد الدفع
            </p>
          </div>

          {/* Show subscription plans even for users without clinic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id}>
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
                    {/* FIB Credit Card Payment */}
                    <FibPaymentDialog 
                      planId={plan.id} 
                      planName={plan.name} 
                      price={parseInt(plan.price.replace(/[^\d]/g, ''))} 
                    />
                    
                    {/* Local Payment Method */}
                    <ManualPaymentDialog planId={plan.id} planName={plan.name} price={plan.price} />
                    
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                        طرق الدفع المتاحة:
                      </p>
                      <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        <p>🏛️ بنك العراق الأول (FIB)</p>
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
              onClick={refetch}
              disabled={subscriptionLoading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${subscriptionLoading ? 'animate-spin' : ''}`} />
              تحديث الحالة
            </Button>
            {getStatusBadge()}
          </div>
        </div>

        {/* Current Subscription Status */}
        {userSubscription && (
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                اشتراكك النشط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">الخطة الحالية</p>
                  <p className="font-semibold text-lg">{getPlanDisplayName(userSubscription.plan)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">المبلغ المدفوع</p>
                  <p className="font-semibold text-lg">{userSubscription.amount_iqd.toLocaleString()} د.ع</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                  <p className="font-medium">{
                    userSubscription.payment_method === 'stripe' ? 'بطاقة ائتمان' :
                    userSubscription.payment_method === 'qi_card' ? 'كي كارد' :
                    userSubscription.payment_method === 'zain_cash' ? 'زين كاش' :
                    userSubscription.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                    userSubscription.payment_method
                  }</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                  <p className="font-medium">
                    {userSubscription.current_period_end ? 
                      new Date(userSubscription.current_period_end).toLocaleDateString('ar-IQ') : 
                      'غير محدد'
                    }
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  تاريخ بداية الاشتراك: {new Date(userSubscription.created_at).toLocaleDateString('ar-IQ')}
                </p>
                
                {userSubscription.payment_method === 'stripe' && (
                  <Button onClick={handleManageSubscription} disabled={loading} variant="outline">
                    <CreditCard className="h-4 w-4 ml-2" />
                    إدارة الاشتراك عبر Stripe
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = userSubscription?.plan === plan.id;
            const canUpgrade = userSubscription && !isCurrentPlan && 
              (plans.findIndex(p => p.id === userSubscription.plan) < plans.findIndex(p => p.id === plan.id));
            const upgradePrice = userSubscription ? getUpgradePrice(userSubscription.plan, plan.id) : 0;
            
            return (
              <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-primary border-primary/50' : ''}`}>
                {isCurrentPlan && (
                  <Badge className="absolute -top-2 right-4 bg-primary">
                    <Crown className="h-3 w-3 ml-1" />
                    خطتك الحالية
                  </Badge>
                )}
                {plan.badge && !isCurrentPlan && (
                  <Badge className="absolute -top-2 right-4 bg-orange-500">
                    {plan.badge}
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="text-center">{plan.name}</CardTitle>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{plan.price}</div>
                    <div className="text-sm text-muted-foreground">{plan.usdPrice} شهرياً</div>
                    {canUpgrade && upgradePrice > 0 && (
                      <div className="text-sm text-orange-600 font-medium mt-1">
                        ترقية بـ {upgradePrice.toLocaleString()} د.ع فقط
                      </div>
                    )}
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
                    {plan.notIncluded.map((feature, index) => (
                      <li key={`not-${index}`} className="flex items-center gap-2 opacity-50">
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {isCurrentPlan ? (
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-green-700 dark:text-green-300 font-medium">
                        هذه خطتك الحالية
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* FIB Credit Card Payment */}
                      <FibPaymentDialog 
                        planId={plan.id} 
                        planName={plan.name} 
                        price={canUpgrade ? upgradePrice : parseInt(plan.price.replace(/[^\d]/g, ''))}
                        isUpgrade={canUpgrade}
                      />
                      
                      {/* Local Payment Method */}
                      <ManualPaymentDialog 
                        planId={plan.id} 
                        planName={plan.name} 
                        price={canUpgrade ? `${upgradePrice.toLocaleString()} د.ع` : plan.price}
                        isUpgrade={canUpgrade}
                      />
                      
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                          طرق الدفع المتاحة:
                        </p>
                        <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                          <p>🏛️ بنك العراق الأول (FIB)</p>
                          <p>🟢 كي كارد (Qi Card)</p>
                          <p>🟡 زين كاش (Zain Cash)</p>
                          <p>🏦 تحويل بنكي مباشر</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Manual Payment Dialog Component
function ManualPaymentDialog({ planId, planName, price, isUpgrade }: { planId: string, planName: string, price: string, isUpgrade?: boolean }) {
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
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!senderName || !senderPhone || !screenshot) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع البيانات المطلوبة وإرفاق صورة الإيصال",
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
          user_id: user.id, // Required field that was missing
          clinic_id: profile?.clinic_id, // Allow null clinic_id for new users
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

      // Only create subscription if user has clinic_id
      if (profile?.clinic_id) {
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
      }

      toast({
        title: "تم إرسال طلب الدفع",
        description: profile?.clinic_id 
          ? "تم إرسال طلب الدفع للمراجعة، سيتم تفعيل الاشتراك خلال 24 ساعة"
          : "تم إرسال طلب الدفع للمراجعة، سيتم إنشاء العيادة وتفعيل الاشتراك خلال 24 ساعة",
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
            <Select value={paymentMethod} onValueChange={(value: 'qi_card' | 'zain_cash' | 'bank_transfer') => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qi_card">كي كارد</SelectItem>
                <SelectItem value="zain_cash">زين كاش</SelectItem>
                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
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