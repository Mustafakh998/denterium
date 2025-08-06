import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Building2, Save, Loader2 } from 'lucide-react';
import ClinicLogoUpload from '@/components/clinic/ClinicLogoUpload';

interface ClinicData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
}

export default function ClinicSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  useEffect(() => {
    fetchClinicData();
  }, [profile?.clinic_id]);

  const fetchClinicData = async () => {
    if (!profile?.clinic_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', profile.clinic_id)
        .single();

      if (error) throw error;

      setClinic(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || ''
      });
    } catch (error) {
      console.error('Error fetching clinic data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات العيادة",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.clinic_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.clinic_id);

      if (error) throw error;

      toast({
        title: "تم حفظ التغييرات",
        description: "تم تحديث بيانات العيادة بنجاح",
      });

      // Refresh clinic data
      fetchClinicData();
    } catch (error) {
      console.error('Error updating clinic:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpdated = (newLogoUrl: string) => {
    if (clinic) {
      setClinic({ ...clinic, logo_url: newLogoUrl });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري تحميل بيانات العيادة...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          لا توجد عيادة مسجلة
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          يجب أن تكون مسجلاً في عيادة لعرض هذه الصفحة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات العيادة</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          إدارة معلومات وإعدادات العيادة
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinic Logo */}
        <Card>
          <CardHeader>
            <CardTitle>شعار العيادة</CardTitle>
            <CardDescription>
              رفع أو تحديث شعار العيادة الذي سيظهر في جميع المطبوعات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClinicLogoUpload 
              currentLogoUrl={clinic.logo_url}
              onLogoUpdated={handleLogoUpdated}
            />
          </CardContent>
        </Card>

        {/* Clinic Information Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>معلومات العيادة</CardTitle>
            <CardDescription>
              تحديث البيانات الأساسية للعيادة
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
                    placeholder="اسم العيادة"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="رقم الهاتف"
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
                  placeholder="البريد الإلكتروني"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="عنوان العيادة"
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">الموقع الإلكتروني</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saving || !formData.name || !formData.phone || !formData.address}
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}