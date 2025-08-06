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
import { Loader2, Building2, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CreateClinic = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasApprovedSubscription, setHasApprovedSubscription] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user || !profile) return;

      try {
        // Check for approved subscriptions linked to this user via manual payments
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*, manual_payments!inner(user_id)')
          .eq('manual_payments.user_id', profile.user_id)
          .eq('status', 'approved')
          .maybeSingle();

        // Also check for approved manual payments directly  
        const { data: manualPayment } = await supabase
          .from('manual_payments')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('status', 'approved')
          .maybeSingle();

        console.log('Subscription check:', { 
          subscription, 
          manualPayment, 
          hasSubscription: !!(subscription || manualPayment),
          userId: profile.user_id 
        });
        setHasApprovedSubscription(!!(subscription || manualPayment));
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, [user, profile]);

  // Redirect if user already has a clinic
  useEffect(() => {
    if (profile?.clinic_id) {
      navigate('/');
      return;
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasApprovedSubscription) return;

    setLoading(true);
    try {
      // Create the clinic
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          subscription_status: 'active',
          subscription_plan: 'basic', // Default plan
        })
        .select()
        .single();

      if (clinicError) throw clinicError;

      // Update user profile with clinic_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          clinic_id: clinic.id,
          role: 'dentist' // Make them dentist role for their clinic
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update any approved subscriptions with the new clinic_id
      await supabase
        .from('subscriptions')
        .update({ clinic_id: clinic.id })
        .is('clinic_id', null)
        .eq('status', 'approved');

      // Also update manual payments
      await supabase
        .from('manual_payments')
        .update({ clinic_id: clinic.id })
        .is('clinic_id', null)
        .eq('status', 'approved');

      toast({
        title: "تم إنشاء العيادة بنجاح",
        description: "تم إنشاء عيادتك وربطها بحسابك بنجاح",
      });

      // Refresh profile to get updated clinic_id
      await refreshProfile();
      
      // Redirect to main dashboard
      navigate('/');
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      toast({
        title: "خطأ في إنشاء العيادة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري التحقق من حالة الاشتراك...</p>
        </div>
      </div>
    );
  }

  if (!hasApprovedSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              اشتراك غير مُفعَّل
            </CardTitle>
            <CardDescription>
              يجب أن يكون لديك اشتراك مُفعَّل لإنشاء عيادة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  لإنشاء عيادة، يجب أولاً الاشتراك في إحدى الخطط ثم انتظار موافقة المدير العام.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col space-y-2">
                <Button onClick={() => navigate('/subscription')} className="w-full">
                  الذهاب لصفحة الاشتراكات
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  العودة للصفحة الرئيسية
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500 ml-2" />
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            إنشاء عيادة جديدة
          </CardTitle>
          <CardDescription>
            اشتراكك مُفعَّل! يمكنك الآن إنشاء عيادتك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex flex-col space-y-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.phone || !formData.address}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري إنشاء العيادة...
                  </>
                ) : (
                  'إنشاء العيادة'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateClinic;