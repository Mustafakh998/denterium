import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';

export default function CreateSuperAdmin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: 'mustafa.hk998@gmail.com',
    password: 'Saja1998',
    firstName: 'Mustafa',
    lastName: 'Admin'
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
        // Update the profile to make them superadmin
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            system_role: 'super_admin',
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_id: authData.user.id
          })
          .eq('email', formData.email);

        if (profileError) {
          console.error('Profile update error:', profileError);
          // If profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              email: formData.email,
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: 'dentist',
              system_role: 'super_admin',
              is_active: true
            });

          if (insertError) throw insertError;
        }

        toast({
          title: "تم إنشاء حساب المدير العام",
          description: `تم إنشاء حساب ${formData.email} كمدير عام بنجاح`,
        });

        // Clear form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: ''
        });
      }
    } catch (error: any) {
      console.error('Error creating superadmin:', error);
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message || "حدث خطأ أثناء إنشاء حساب المدير العام",
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
            إنشاء حساب مدير عام
          </CardTitle>
          <CardDescription>
            إنشاء حساب المدير العام للمنصة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Shield className="ml-2 h-4 w-4" />
                  إنشاء حساب المدير العام
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}