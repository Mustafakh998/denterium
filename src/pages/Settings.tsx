import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings as SettingsIcon, 
  User, 
  Database, 
  Bell, 
  Shield, 
  Palette,
  Save
} from "lucide-react";

export default function Settings() {
  const auth = useAuth();
  const { user, profile, loading, refreshProfile } = auth || {};
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    phone: profile?.phone || "",
    specialization: profile?.specialization || "",
    license_number: profile?.license_number || ""
  });

  // Clinic settings state
  const [clinicSettings, setClinicSettings] = useState({
    notifications_enabled: true,
    email_reminders: true,
    sms_reminders: false,
    theme: "light"
  });

  const handleProfileUpdate = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileForm)
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم حفظ التغييرات بنجاح",
      });
      
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة إعدادات العيادة والمستخدمين
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              الملف الشخصي
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              الأمان
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              المظهر
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الملف الشخصي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">الاسم الأول</Label>
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        first_name: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">الاسم الأخير</Label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        last_name: e.target.value
                      }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialization">التخصص</Label>
                  <Input
                    id="specialization"
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      specialization: e.target.value
                    }))}
                    placeholder="مثل: جراحة الفم والأسنان"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="license_number">رقم الترخيص</Label>
                  <Input
                    id="license_number"
                    value={profileForm.license_number}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      license_number: e.target.value
                    }))}
                  />
                </div>

                <Button 
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="ml-2 h-4 w-4" />
                  {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الإشعارات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل الإشعارات</Label>
                    <p className="text-sm text-muted-foreground">
                      استقبال إشعارات حول أنشطة العيادة
                    </p>
                  </div>
                  <Switch
                    checked={clinicSettings.notifications_enabled}
                    onCheckedChange={(checked) => 
                      setClinicSettings(prev => ({
                        ...prev,
                        notifications_enabled: checked
                      }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تذكيرات البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال تذكيرات المواعيد عبر البريد الإلكتروني
                    </p>
                  </div>
                  <Switch
                    checked={clinicSettings.email_reminders}
                    onCheckedChange={(checked) => 
                      setClinicSettings(prev => ({
                        ...prev,
                        email_reminders: checked
                      }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تذكيرات الرسائل النصية</Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال تذكيرات المواعيد عبر الرسائل النصية
                    </p>
                  </div>
                  <Switch
                    checked={clinicSettings.sms_reminders}
                    onCheckedChange={(checked) => 
                      setClinicSettings(prev => ({
                        ...prev,
                        sms_reminders: checked
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الأمان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input value={user?.email} disabled className="mt-2" />
                </div>
                
                <div>
                  <Label>معرف المستخدم</Label>
                  <Input value={user?.id} disabled className="mt-2 font-mono text-sm" />
                </div>
                
                <Button variant="outline" className="w-full">
                  تغيير كلمة المرور
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المظهر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>نمط العرض</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      variant={theme === "light" ? "default" : "outline"} 
                      className="h-20 flex flex-col"
                      onClick={() => setTheme("light")}
                    >
                      <div className="w-6 h-6 bg-white border rounded mb-1"></div>
                      فاتح
                    </Button>
                    <Button 
                      variant={theme === "dark" ? "default" : "outline"} 
                      className="h-20 flex flex-col"
                      onClick={() => setTheme("dark")}
                    >
                      <div className="w-6 h-6 bg-gray-800 rounded mb-1"></div>
                      داكن
                    </Button>
                    <Button 
                      variant={theme === "system" ? "default" : "outline"} 
                      className="h-20 flex flex-col"
                      onClick={() => setTheme("system")}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-white to-gray-800 rounded mb-1"></div>
                      تلقائي
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Debug Information - Only show if profile is null */}
        {!profile && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardHeader>
              <CardTitle className="text-red-800 dark:text-red-200">
                🔧 معلومات التشخيص
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>حالة المستخدم:</strong> {user ? "مُسجل الدخول" : "غير مُسجل"}</p>
                <p><strong>حالة الملف الشخصي:</strong> {profile ? "موجود" : "غير موجود"}</p>
                <p><strong>معرف العيادة:</strong> {profile?.clinic_id || "غير متوفر"}</p>
                <p className="text-red-700 dark:text-red-300 mt-4">
                  الملف الشخصي غير موجود - يرجى التواصل مع الدعم الفني.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}