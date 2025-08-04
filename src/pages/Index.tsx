import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Plus, Activity } from "lucide-react";

const Index = () => {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-l from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            أهلاً وسهلاً، {profile?.first_name || "دكتور"}!
          </h1>
          <p className="text-blue-100">
            إليك ما يحدث في عيادتك اليوم.
          </p>
        </div>

        {/* Stats Overview */}
        <DashboardStats />

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                الإجراءات السريعة
              </CardTitle>
              <CardDescription>
                الميزات الأكثر استخداماً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="ml-2 h-4 w-4" />
                إضافة مريض جديد
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="ml-2 h-4 w-4" />
                جدولة موعد
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="ml-2 h-4 w-4" />
                عرض جميع المرضى
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
              <CardDescription>
                آخر التحديثات من عيادتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-reverse space-x-3">
                  <div>
                    <p className="text-sm font-medium">تسجيل مريض جديد</p>
                    <p className="text-xs text-muted-foreground">منذ ساعتين</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center space-x-reverse space-x-3">
                  <div>
                    <p className="text-sm font-medium">موعد مكتمل</p>
                    <p className="text-xs text-muted-foreground">منذ 4 ساعات</p>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex items-center space-x-reverse space-x-3">
                  <div>
                    <p className="text-sm font-medium">تحديث خطة العلاج</p>
                    <p className="text-xs text-muted-foreground">منذ 6 ساعات</p>
                  </div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">نماذج الأسنان ثلاثية الأبعاد</CardTitle>
              <CardDescription>
                تصور تفاعلي ثلاثي الأبعاد لبنية أسنان المريض
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                قريباً
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">تحليل الأشعة السينية</CardTitle>
              <CardDescription>
                معالجة صور متقدمة وأدوات تشخيصية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                قريباً
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">تكامل الدفع</CardTitle>
              <CardDescription>
                طرق الدفع العراقية المحلية وإدارة الاشتراكات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                قريباً
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
