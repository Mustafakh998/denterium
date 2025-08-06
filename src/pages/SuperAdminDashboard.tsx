import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Building, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  DollarSign,
  UserCheck,
  AlertCircle
} from "lucide-react";

export default function SuperAdminDashboard() {
  const { user, profile } = useAuth();

  // Check if user is super admin
  const isSuperAdmin = profile?.system_role === 'super_admin';

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      const [clinicsRes, usersRes, subscriptionsRes, paymentsRes] = await Promise.all([
        supabase.from('clinics').select('id, name, created_at').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, email, role, system_role, created_at').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('id, plan, status, amount_iqd, created_at').order('created_at', { ascending: false }),
        supabase.from('manual_payments').select('id, amount_iqd, status, created_at').order('created_at', { ascending: false })
      ]);

      const totalClinics = clinicsRes.data?.length || 0;
      const totalUsers = usersRes.data?.length || 0;
      const activeSubscriptions = subscriptionsRes.data?.filter(s => s.status === 'approved').length || 0;
      const pendingPayments = paymentsRes.data?.filter(p => p.status === 'pending').length || 0;
      const totalRevenue = subscriptionsRes.data?.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.amount_iqd, 0) || 0;

      return {
        totalClinics,
        totalUsers,
        activeSubscriptions,
        pendingPayments,
        totalRevenue,
        clinics: clinicsRes.data || [],
        users: usersRes.data || [],
        subscriptions: subscriptionsRes.data || [],
        payments: paymentsRes.data || []
      };
    },
    enabled: isSuperAdmin
  });

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">غير مخول</h3>
                <p className="text-muted-foreground">
                  ليس لديك صلاحية للوصول لوحة إدارة النظام
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            لوحة إدارة النظام
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة شاملة لنظام إدارة العيادات
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العيادات المسجلة</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClinics || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المدفوعات المعلقة</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.pendingPayments || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {((stats?.totalRevenue || 0) / 1000).toFixed(0)}K د.ع
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="clinics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clinics">العيادات</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
            <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          </TabsList>

          <TabsContent value="clinics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>العيادات المسجلة</CardTitle>
                <CardDescription>قائمة بجميع العيادات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.clinics?.slice(0, 10).map((clinic) => (
                    <div key={clinic.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{clinic.name}</p>
                        <p className="text-sm text-muted-foreground">
                          تاريخ التسجيل: {new Date(clinic.created_at).toLocaleDateString('ar-IQ')}
                        </p>
                      </div>
                      <Badge variant="outline">نشط</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>المستخدمين</CardTitle>
                <CardDescription>قائمة بجميع المستخدمين في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.users?.slice(0, 10).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          تاريخ التسجيل: {new Date(user.created_at).toLocaleDateString('ar-IQ')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {user.role === 'dentist' ? 'طبيب' : 
                           user.role === 'supplier' ? 'مورد' : 'مريض'}
                        </Badge>
                        {user.system_role && user.system_role !== 'user' && (
                          <Badge variant="destructive">
                            {user.system_role === 'super_admin' ? 'مدير عام' : 'دعم'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الاشتراكات</CardTitle>
                <CardDescription>قائمة بجميع الاشتراكات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.subscriptions?.slice(0, 10).map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">
                          خطة {subscription.plan === 'basic' ? 'أساسي' : 
                                subscription.plan === 'premium' ? 'متميز' : 'مؤسسي'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.amount_iqd.toLocaleString()} د.ع - 
                          {new Date(subscription.created_at).toLocaleDateString('ar-IQ')}
                        </p>
                      </div>
                      <Badge 
                        variant={subscription.status === 'approved' ? 'default' : 
                                subscription.status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {subscription.status === 'approved' ? 'نشط' : 
                         subscription.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>المدفوعات</CardTitle>
                <CardDescription>قائمة بجميع المدفوعات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.payments?.slice(0, 10).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{payment.amount_iqd.toLocaleString()} د.ع</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString('ar-IQ')}
                        </p>
                      </div>
                      <Badge 
                        variant={payment.status === 'approved' ? 'default' : 
                                payment.status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {payment.status === 'approved' ? 'موافق عليه' : 
                         payment.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}