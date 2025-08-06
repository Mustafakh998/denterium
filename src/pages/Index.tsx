import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ComingSoonFeatures from "@/components/features/ComingSoonFeatures";
import AddPatientForm from "@/components/patients/AddPatientForm";
import AddAppointmentForm from "@/components/appointments/AddAppointmentForm";
import AddInvoiceForm from "@/components/billing/AddInvoiceForm";
import { User, Calendar, FileText, Activity, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [addAppointmentOpen, setAddAppointmentOpen] = useState(false);
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [isSupplier, setIsSupplier] = useState<boolean | null>(null);

  // Check if user is a supplier
  useEffect(() => {
    const checkSupplierStatus = async () => {
      if (user && !profile) {
        try {
          const { data } = await supabase
            .from('suppliers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setIsSupplier(!!data);
        } catch (error) {
          console.error('Error checking supplier status:', error);
          setIsSupplier(false);
        }
      } else {
        setIsSupplier(false);
      }
    };

    checkSupplierStatus();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect suppliers to their dashboard
  if (profile?.role === 'supplier' || isSupplier) {
    return <Navigate to="/supplier-dashboard" replace />;
  }
  
  // Check if user needs to create a clinic (but first check if they have approved subscription)
  if (user && profile && !profile.clinic_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              مرحباً {profile.first_name}!
            </CardTitle>
            <CardDescription>
              لإكمال إعداد حسابك، تحتاج لإنشاء عيادة أو الانضمام لعيادة موجودة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => navigate('/create-clinic')} className="w-full">
                <Building2 className="ml-2 h-4 w-4" />
                إنشاء عيادة جديدة
              </Button>
              <Button variant="outline" onClick={() => navigate('/subscription')} className="w-full">
                عرض الاشتراكات
              </Button>
              <Button variant="ghost" onClick={signOut} className="w-full">
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              الإجراءات السريعة
            </CardTitle>
            <CardDescription>
              الإجراءات الأكثر استخداماً في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Dialog open={addPatientOpen} onOpenChange={setAddPatientOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <User className="h-6 w-6" />
                    إضافة مريض جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة مريض جديد</DialogTitle>
                    <DialogDescription>
                      أدخل بيانات المريض الجديد
                    </DialogDescription>
                  </DialogHeader>
                  <AddPatientForm 
                    onSuccess={() => setAddPatientOpen(false)} 
                    clinicId={profile?.clinic_id || "default"} 
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={addAppointmentOpen} onOpenChange={setAddAppointmentOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Calendar className="h-6 w-6" />
                    جدولة موعد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>جدولة موعد جديد</DialogTitle>
                    <DialogDescription>
                      أدخل بيانات الموعد الجديد
                    </DialogDescription>
                  </DialogHeader>
                  <AddAppointmentForm onSuccess={() => setAddAppointmentOpen(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    إنشاء فاتورة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
                    <DialogDescription>
                      أدخل بيانات الفاتورة الجديدة
                    </DialogDescription>
                  </DialogHeader>
                  <AddInvoiceForm onSuccess={() => setAddInvoiceOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
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

        {/* Coming Soon Features */}
        <ComingSoonFeatures />
      </div>
    </DashboardLayout>
  );
}