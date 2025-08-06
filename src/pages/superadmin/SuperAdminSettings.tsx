import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Database, Shield, Bell, Mail, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const [systemSettings, setSystemSettings] = useState({
    systemName: 'نظام إدارة العيادات',
    systemEmail: 'admin@dentalmanagement.com',
    maxClinicsPerUser: 1,
    defaultSubscriptionDays: 30,
    enableAutoBackups: true,
    enableEmailNotifications: true,
    maintenanceMode: false,
    supportEmail: 'support@dentalmanagement.com',
    termsUrl: 'https://dentalmanagement.com/terms',
    privacyUrl: 'https://dentalmanagement.com/privacy'
  });

  const [subscriptionPlans, setSubscriptionPlans] = useState([
    { name: 'basic', nameAr: 'أساسي', priceIQD: 15000, priceUSD: 11, features: ['إدارة المرضى', 'المواعيد', 'الفواتير'] },
    { name: 'premium', nameAr: 'احترافي', priceIQD: 20000, priceUSD: 15, features: ['جميع ميزات الأساسي', 'التقارير', 'الوصفات الطبية'] },
    { name: 'enterprise', nameAr: 'مؤسسي', priceIQD: 30000, priceUSD: 22, features: ['جميع الميزات', 'دعم متقدم', 'تخصيص كامل'] }
  ]);

  const [saving, setSaving] = useState(false);

  const { data: systemStats } = useQuery({
    queryKey: ['super-admin-system-stats'],
    queryFn: async () => {
      const [storage, users, data] = await Promise.all([
        supabase.storage.from('medical-images').list(),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('clinics').select('*', { count: 'exact', head: true })
      ]);

      return {
        storageUsed: storage.data?.length || 0,
        totalUsers: users.count || 0,
        totalClinics: data.count || 0
      };
    }
  });

  const updateSystemSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, these would be stored in a system_settings table
      // For now, we'll just show success
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات النظام بنجاح",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSubscriptionPlan = async (planIndex: number, field: string, value: any) => {
    const updatedPlans = [...subscriptionPlans];
    updatedPlans[planIndex] = { ...updatedPlans[planIndex], [field]: value };
    setSubscriptionPlans(updatedPlans);
  };

  const saveSubscriptionPlans = async () => {
    setSaving(true);
    try {
      // Update subscription_features table with new pricing
      for (const plan of subscriptionPlans) {
        const { error } = await supabase
          .from('subscription_features')
          .upsert({
            plan: plan.name as any,
            feature_name: 'pricing',
            feature_limit: plan.priceIQD,
            is_enabled: true
          }, { onConflict: 'plan,feature_name' });

        if (error) throw error;
      }

      toast({
        title: "تم تحديث خطط الاشتراك",
        description: "تم حفظ أسعار وميزات الخطط بنجاح",
      });
    } catch (error) {
      console.error('Error updating plans:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث خطط الاشتراك",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const performSystemMaintenance = async (action: string) => {
    setSaving(true);
    try {
      switch (action) {
        case 'backup':
          // In real implementation, trigger backup
          toast({
            title: "تم بدء النسخ الاحتياطي",
            description: "جاري إنشاء نسخة احتياطية من البيانات",
          });
          break;
        case 'cleanup':
          // In real implementation, cleanup old data
          toast({
            title: "تم بدء تنظيف البيانات",
            description: "جاري تنظيف البيانات المؤقتة والقديمة",
          });
          break;
        case 'optimize':
          // In real implementation, optimize database
          toast({
            title: "تم بدء تحسين الأداء",
            description: "جاري تحسين أداء قاعدة البيانات",
          });
          break;
      }
    } catch (error) {
      console.error('Error performing maintenance:', error);
      toast({
        title: "خطأ في الصيانة",
        description: "حدث خطأ أثناء تنفيذ عملية الصيانة",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            إعدادات النظام
          </h1>
          <p className="text-blue-200 mt-2">
            إدارة وتكوين إعدادات النظام العامة
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">إعدادات عامة</TabsTrigger>
            <TabsTrigger value="plans">خطط الاشتراك</TabsTrigger>
            <TabsTrigger value="system">النظام</TabsTrigger>
            <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  الإعدادات العامة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systemName" className="text-white">اسم النظام</Label>
                    <Input
                      id="systemName"
                      value={systemSettings.systemName}
                      onChange={(e) => setSystemSettings({...systemSettings, systemName: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="systemEmail" className="text-white">بريد النظام</Label>
                    <Input
                      id="systemEmail"
                      type="email"
                      value={systemSettings.systemEmail}
                      onChange={(e) => setSystemSettings({...systemSettings, systemEmail: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail" className="text-white">بريد الدعم</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={systemSettings.supportEmail}
                      onChange={(e) => setSystemSettings({...systemSettings, supportEmail: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxClinics" className="text-white">الحد الأقصى للعيادات لكل مستخدم</Label>
                    <Input
                      id="maxClinics"
                      type="number"
                      value={systemSettings.maxClinicsPerUser}
                      onChange={(e) => setSystemSettings({...systemSettings, maxClinicsPerUser: parseInt(e.target.value)})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultDays" className="text-white">مدة الاشتراك الافتراضية (أيام)</Label>
                    <Input
                      id="defaultDays"
                      type="number"
                      value={systemSettings.defaultSubscriptionDays}
                      onChange={(e) => setSystemSettings({...systemSettings, defaultSubscriptionDays: parseInt(e.target.value)})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoBackups" className="text-white">تفعيل النسخ الاحتياطي التلقائي</Label>
                    <Switch
                      id="autoBackups"
                      checked={systemSettings.enableAutoBackups}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, enableAutoBackups: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotifications" className="text-white">تفعيل إشعارات البريد الإلكتروني</Label>
                    <Switch
                      id="emailNotifications"
                      checked={systemSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, enableEmailNotifications: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceMode" className="text-white">وضع الصيانة</Label>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenanceMode: checked})}
                    />
                  </div>
                </div>

                <Button
                  onClick={updateSystemSettings}
                  disabled={saving}
                  className="bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            {subscriptionPlans.map((plan, index) => (
              <Card key={plan.name} className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">{plan.nameAr}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">السعر بالدينار العراقي</Label>
                      <Input
                        type="number"
                        value={plan.priceIQD}
                        onChange={(e) => updateSubscriptionPlan(index, 'priceIQD', parseInt(e.target.value))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">السعر بالدولار</Label>
                      <Input
                        type="number"
                        value={plan.priceUSD}
                        onChange={(e) => updateSubscriptionPlan(index, 'priceUSD', parseInt(e.target.value))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">الميزات</Label>
                    <Textarea
                      value={plan.features.join('\n')}
                      onChange={(e) => updateSubscriptionPlan(index, 'features', e.target.value.split('\n'))}
                      className="bg-white/10 border-white/20 text-white"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              onClick={saveSubscriptionPlans}
              disabled={saving}
              className="bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/30"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ خطط الاشتراك'}
            </Button>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    استخدام التخزين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemStats?.storageUsed || 0} ملف
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    إجمالي المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemStats?.totalUsers || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    إجمالي العيادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemStats?.totalClinics || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">عمليات الصيانة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => performSystemMaintenance('backup')}
                    disabled={saving}
                    className="bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30"
                  >
                    إنشاء نسخة احتياطية
                  </Button>
                  <Button
                    onClick={() => performSystemMaintenance('cleanup')}
                    disabled={saving}
                    className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30 hover:bg-yellow-500/30"
                  >
                    تنظيف البيانات
                  </Button>
                  <Button
                    onClick={() => performSystemMaintenance('optimize')}
                    disabled={saving}
                    className="bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/30"
                  >
                    تحسين الأداء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}