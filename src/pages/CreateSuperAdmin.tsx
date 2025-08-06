import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, Check } from 'lucide-react';

export default function CreateSuperAdmin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'create-user' | 'make-admin'>('create-user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'dentist'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        toast({
          title: "تم إنشاء المستخدم",
          description: `تم إنشاء حساب ${formData.email} بنجاح. الآن قم بترقيته إلى مدير عام.`,
        });
        setStep('make-admin');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: error.message || "حدث خطأ أثناء إنشاء المستخدم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMakeSuperAdmin = async () => {
    setLoading(true);
    
    try {
      // Call the function to make user superadmin
      const { data, error } = await supabase.rpc('create_superadmin_profile', {
        p_email: formData.email,
        p_first_name: formData.firstName,
        p_last_name: formData.lastName
      });

      if (error) throw error;

      toast({
        title: "تم إنشاء حساب المدير العام",
        description: `تم ترقية ${formData.email} إلى مدير عام بنجاح`,
      });

      // Clear form and reset
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      });
      setStep('create-user');
    } catch (error: any) {
      console.error('Error making superadmin:', error);
      toast({
        title: "خطأ في ترقية المستخدم",
        description: error.message || "حدث خطأ أثناء ترقية المستخدم إلى مدير عام",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            {step === 'create-user' ? 'إنشاء مستخدم جديد' : 'ترقية إلى مدير عام'}
          </CardTitle>
          <CardDescription>
            {step === 'create-user' 
              ? 'إنشاء حساب مستخدم جديد أولاً'
              : 'ترقية المستخدم إلى مدير عام للمنصة'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'create-user' ? (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">الاسم الأول</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">الاسم الأخير</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Shield className="ml-2 h-4 w-4" />
                    إنشاء المستخدم
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Check className="h-16 w-16 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  المستخدم: {formData.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  الاسم: {formData.firstName} {formData.lastName}
                </p>
              </div>
              
              <Button
                onClick={handleMakeSuperAdmin}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الترقية...
                  </>
                ) : (
                  <>
                    <Shield className="ml-2 h-4 w-4" />
                    ترقية إلى مدير عام
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setStep('create-user')}
                className="w-full"
                disabled={loading}
              >
                إنشاء مستخدم آخر
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}