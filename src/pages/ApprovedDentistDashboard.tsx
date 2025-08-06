import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, CheckCircle, CreditCard, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApprovedPayment {
  id: string;
  amount_iqd: number;
  status: string;
  payment_method: string;
  created_at: string;
  sender_name: string;
  sender_phone: string;
}

const ApprovedDentistDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [creatingClinic, setCreatingClinic] = useState(false);
  const [approvedPayment, setApprovedPayment] = useState<ApprovedPayment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: user?.email || '',
    website: ''
  });

  useEffect(() => {
    const checkApprovedPayment = async () => {
      if (!user) return;

      try {
        if (profile?.clinic_id) {
          navigate('/');
          return;
        }
        
        const { data: payment } = await supabase
          .from('manual_payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setApprovedPayment(payment);

      } catch (error) {
        console.error('Error checking approved payment:', error);
      } finally {
        setLoading(false);
      }
    };

    checkApprovedPayment();
  }, [user, profile, navigate]);

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !approvedPayment) return;

    setCreatingClinic(true);
    try {
      // Call the single, secure database function
      const { error } = await supabase.rpc('create_clinic_for_approved_dentist', {
        name_input: formData.name,
        address_input: formData.address,
        phone_input: formData.phone,
        email_input: formData.email,
        website_input: formData.website || null,
        payment_id_input: approvedPayment.id,
        amount_input: approvedPayment.amount_iqd
      });

      if (error) throw error;

      toast({
        title: "تم إنشاء العيادة بنجاح",
        description: "تم إنشاء عيادتك وربطها بحسابك بنجاح",
      });

      await refreshProfile();
      
      navigate('/');
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      toast({
        title: "خطأ في إنشاء العيادة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingClinic(false);
    }
  };

  const getSubscriptionPlan = (amount: number): 'basic' | 'premium' | 'enterprise' => {
    if (amount >= 30000) return 'enterprise';
    if (amount >= 20000) return 'premium';
    return 'basic';
  };

  const getPlanName = (amount: number) => {
    const plan = getSubscriptionPlan(amount);
    switch (plan) {
      case 'enterprise': return 'خطة المؤسسة';
      case 'premium': return 'الخطة المميزة';
      case 'basic': return 'الخطة الأساسية';
      default: return 'خطة غير محددة';
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري التحقق من حالة الدفع...</p>
        </div>
      </div>
    );
  }

  if (!approvedPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              لا توجد دفعات مُعتمدة
            </CardTitle>
            <CardDescription>
              لم يتم العثور على أي دفعة مُعتمدة لحسابك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  يرجى التأكد من إتمام عملية الدفع والانتظار حتى موافقة المدير العام.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col space-y-2">
                <Button onClick={() => navigate('/subscription')} className="w-full">
                  الذهاب لصفحة الاشتراكات
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-l from-green-600 to-blue-600 text-white">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-200 ml-4" />
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              مرحباً {profile?.first_name}! تم قبول دفعتك
            </CardTitle>
            <CardDescription className="text-green-100">
              تم اعتماد دفعتك من قبل الإدارة. يمكنك الآن إنشاء عيادتك والبدء في استخدام النظام.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                تفاصيل الدفعة المُعتمدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">المبلغ:</span>
                <span className="font-bold text-lg">{approvedPayment.amount_iqd.toLocaleString()} دينار عراقي</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">الخطة:</span>
                <Badge variant="secondary">{getPlanName(approvedPayment.amount_iqd)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">طريقة الدفع:</span>
                <span>{approvedPayment.payment_method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">حالة الدفع:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  مُعتمد
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">تاريخ الدفع:</span>
                <span>{new Date(approvedPayment.created_at).toLocaleDateString('ar-IQ')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                إنشاء عيادتك
              </CardTitle>
              <CardDescription>
                أدخل بيانات عيادتك لبدء استخدام النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClinic} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم العيادة *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="أدخل اسم العيادة"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="أدخل رقم الهاتف"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="أدخل عنوان العيادة"
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">الموقع الإلكتروني (اختياري)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={creatingClinic || !formData.name || !formData.phone || !formData.address}
                  className="w-full"
                >
                  {creatingClinic ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري إنشاء العيادة...
                    </>
                  ) : (
                    <>
                      <Building2 className="ml-2 h-4 w-4" />
                      إنشاء العيادة والبدء
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApprovedDentistDashboard;