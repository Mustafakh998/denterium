import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  LogOut, 
  ExternalLink, 
  Users, 
  Building, 
  CreditCard, 
  Activity,
  Settings,
  BarChart3
} from "lucide-react";

export default function SuperAdminManagement() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/super-admin-auth');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error || profileData?.system_role !== 'super_admin') {
        await supabase.auth.signOut();
        navigate('/super-admin-auth');
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/super-admin-auth');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/super-admin-auth');
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const openExternalDashboard = () => {
    // This would redirect to your external admin platform
    // For demo purposes, opening a placeholder URL
    window.open('https://admin.dentalmanagement.com', '_blank');
    toast({
      title: "فتح لوحة الإدارة الخارجية",
      description: "سيتم توجيهك إلى منصة الإدارة المتقدمة",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  const adminFeatures = [
    {
      title: "إدارة المستخدمين",
      description: "عرض وإدارة جميع المستخدمين في النظام",
      icon: Users,
      action: () => openExternalDashboard()
    },
    {
      title: "إدارة العيادات",
      description: "مراقبة وإدارة العيادات المسجلة",
      icon: Building,
      action: () => openExternalDashboard()
    },
    {
      title: "إدارة المدفوعات",
      description: "مراجعة وإدارة المدفوعات والاشتراكات",
      icon: CreditCard,
      action: () => openExternalDashboard()
    },
    {
      title: "التقارير والإحصائيات",
      description: "عرض التقارير التفصيلية وإحصائيات النظام",
      icon: BarChart3,
      action: () => openExternalDashboard()
    },
    {
      title: "إعدادات النظام",
      description: "إدارة إعدادات النظام العامة",
      icon: Settings,
      action: () => openExternalDashboard()
    },
    {
      title: "مراقبة النشاط",
      description: "مراقبة نشاط المستخدمين والنظام",
      icon: Activity,
      action: () => openExternalDashboard()
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    لوحة الإدارة العامة
                  </h1>
                  <p className="text-blue-200">
                    مرحباً {profile?.first_name} {profile?.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-green-500/20 text-green-200 border-green-400/30">
                  مدير عام
                </Badge>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border-white/20">
            <CardContent className="p-8 text-center">
              <ExternalLink className="h-16 w-16 text-white mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">
                منصة الإدارة المتقدمة
              </h2>
              <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
                للوصول إلى الأدوات المتقدمة لإدارة النظام، يرجى النقر على الزر أدناه للانتقال إلى منصة الإدارة الخارجية المخصصة
              </p>
              <Button
                onClick={openExternalDashboard}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-3"
              >
                <ExternalLink className="h-5 w-5 ml-2" />
                فتح منصة الإدارة المتقدمة
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200 mb-4">{feature.description}</p>
                <Button
                  onClick={feature.action}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  فتح
                  <ExternalLink className="h-4 w-4 mr-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">إحصائيات سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 text-center py-8">
                للاطلاع على الإحصائيات التفصيلية، يرجى استخدام منصة الإدارة المتقدمة
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}