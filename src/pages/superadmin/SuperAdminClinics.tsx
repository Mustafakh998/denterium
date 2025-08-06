import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Calendar, FileText, Settings } from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logo_url: string;
  subscription_status: string;
  subscription_plan: string;
  subscription_end_date: string;
  created_at: string;
  settings: any;
  profiles: Array<{
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }>;
  patients: Array<{ id: string }>;
  appointments: Array<{ id: string }>;
  invoices: Array<{ id: string }>;
}

export default function SuperAdminClinics() {
  const { toast } = useToast();

  const { data: clinics = [], refetch } = useQuery({
    queryKey: ['super-admin-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email,
            role
          ),
          patients (
            id
          ),
          appointments (
            id
          ),
          invoices (
            id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Clinic[];
    }
  });

  const getSubscriptionBadge = (status: string, plan: string) => {
    const statusColor = status === 'active' ? 'bg-green-500/20 text-green-200 border-green-400/30' : 'bg-red-500/20 text-red-200 border-red-400/30';
    const planText = plan === 'basic' ? 'أساسي' : plan === 'premium' ? 'احترافي' : 'مؤسسي';
    
    return (
      <div className="flex gap-2">
        <Badge className={statusColor}>
          {status === 'active' ? 'نشط' : 'منتهي'}
        </Badge>
        <Badge variant="outline" className="border-white/20 text-white">
          {planText}
        </Badge>
      </div>
    );
  };

  const updateSubscriptionStatus = async (clinicId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('clinics')
        .update({ subscription_status: status })
        .eq('id', clinicId);

      if (error) throw error;

      toast({
        title: "تم تحديث حالة الاشتراك",
        description: `تم ${status === 'active' ? 'تفعيل' : 'إلغاء'} الاشتراك بنجاح`,
      });

      refetch();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث حالة الاشتراك",
        variant: "destructive",
      });
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            إدارة العيادات
          </h1>
          <p className="text-blue-200 mt-2">
            عرض وإدارة جميع العيادات المسجلة في النظام
          </p>
        </div>

        <div className="grid gap-4">
          {clinics.map((clinic) => (
            <Card key={clinic.id} className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {clinic.name}
                  </CardTitle>
                  {getSubscriptionBadge(clinic.subscription_status, clinic.subscription_plan)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <strong className="text-blue-200">البريد الإلكتروني:</strong> 
                    <span className="text-white ml-2">{clinic.email}</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">الهاتف:</strong> 
                    <span className="text-white ml-2">{clinic.phone || 'غير محدد'}</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">العنوان:</strong> 
                    <span className="text-white ml-2">{clinic.address || 'غير محدد'}</span>
                  </div>
                  <div>
                    <strong className="text-blue-200">تاريخ التسجيل:</strong> 
                    <span className="text-white ml-2">{new Date(clinic.created_at).toLocaleDateString('ar-IQ')}</span>
                  </div>
                  {clinic.subscription_end_date && (
                    <div>
                      <strong className="text-blue-200">انتهاء الاشتراك:</strong> 
                      <span className="text-white ml-2">{new Date(clinic.subscription_end_date).toLocaleDateString('ar-IQ')}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-blue-200">
                    <Users className="h-4 w-4" />
                    <span>{clinic.profiles?.length || 0} موظف</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200">
                    <Users className="h-4 w-4" />
                    <span>{clinic.patients?.length || 0} مريض</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200">
                    <Calendar className="h-4 w-4" />
                    <span>{clinic.appointments?.length || 0} موعد</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200">
                    <FileText className="h-4 w-4" />
                    <span>{clinic.invoices?.length || 0} فاتورة</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {clinic.subscription_status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSubscriptionStatus(clinic.id, 'expired')}
                      className="border-red-400/20 text-red-300 hover:bg-red-500/10"
                    >
                      إلغاء الاشتراك
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => updateSubscriptionStatus(clinic.id, 'active')}
                      className="bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/30"
                    >
                      تفعيل الاشتراك
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {clinics.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-6">
                <p className="text-center text-blue-200">
                  لا توجد عيادات مسجلة حالياً
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}