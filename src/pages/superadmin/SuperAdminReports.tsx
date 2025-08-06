import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, TrendingUp, Users, Building2, CreditCard, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SuperAdminReports() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const { data: overviewStats } = useQuery({
    queryKey: ['super-admin-overview-stats'],
    queryFn: async () => {
      const [
        clinicsCount,
        usersCount,
        subscriptionsCount,
        revenueSum,
        paymentsCount
      ] = await Promise.all([
        supabase.from('clinics').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('amount_iqd').eq('status', 'approved'),
        supabase.from('manual_payments').select('*', { count: 'exact', head: true })
      ]);

      const totalRevenue = revenueSum.data?.reduce((sum, sub) => sum + (sub.amount_iqd || 0), 0) || 0;

      return {
        clinics: clinicsCount.count || 0,
        users: usersCount.count || 0,
        subscriptions: subscriptionsCount.count || 0,
        revenue: totalRevenue,
        payments: paymentsCount.count || 0
      };
    }
  });

  const { data: monthlyGrowth } = useQuery({
    queryKey: ['super-admin-monthly-growth', dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return [];

      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();

      const [clinicsGrowth, usersGrowth, revenueGrowth] = await Promise.all([
        supabase
          .from('clinics')
          .select('created_at')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('subscriptions')
          .select('amount_iqd, created_at')
          .eq('status', 'approved')
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
      ]);

      // Group by month
      const monthlyData: { [key: string]: any } = {};

      clinicsGrowth.data?.forEach(clinic => {
        const month = format(new Date(clinic.created_at), 'yyyy-MM');
        if (!monthlyData[month]) monthlyData[month] = { clinics: 0, users: 0, revenue: 0 };
        monthlyData[month].clinics++;
      });

      usersGrowth.data?.forEach(user => {
        const month = format(new Date(user.created_at), 'yyyy-MM');
        if (!monthlyData[month]) monthlyData[month] = { clinics: 0, users: 0, revenue: 0 };
        monthlyData[month].users++;
      });

      revenueGrowth.data?.forEach(sub => {
        const month = format(new Date(sub.created_at), 'yyyy-MM');
        if (!monthlyData[month]) monthlyData[month] = { clinics: 0, users: 0, revenue: 0 };
        monthlyData[month].revenue += sub.amount_iqd || 0;
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data
      })).sort((a, b) => a.month.localeCompare(b.month));
    }
  });

  const { data: topClinics } = useQuery({
    queryKey: ['super-admin-top-clinics'],
    queryFn: async () => {
      const { data: clinics } = await supabase
        .from('clinics')
        .select(`
          id,
          name,
          subscription_plan,
          created_at,
          profiles (id),
          patients (id),
          appointments (id)
        `);

      return clinics?.map(clinic => ({
        ...clinic,
        staff_count: clinic.profiles?.length || 0,
        patients_count: clinic.patients?.length || 0,
        appointments_count: clinic.appointments?.length || 0
      })).sort((a, b) => b.patients_count - a.patients_count).slice(0, 10) || [];
    }
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['super-admin-payment-methods'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('payment_method, amount_iqd')
        .eq('status', 'approved');

      const methodStats: { [key: string]: { count: number; total: number } } = {};

      data?.forEach(sub => {
        const method = sub.payment_method;
        if (!methodStats[method]) {
          methodStats[method] = { count: 0, total: 0 };
        }
        methodStats[method].count++;
        methodStats[method].total += sub.amount_iqd || 0;
      });

      return Object.entries(methodStats).map(([method, stats]) => ({
        method: method === 'qi_card' ? 'كي كارد' : 
                method === 'zain_cash' ? 'زين كاش' : 
                method === 'stripe' ? 'بطاقة ائتمانية' : method,
        count: stats.count,
        total: stats.total
      }));
    }
  });

  const exportReport = () => {
    const reportData = {
      overview: overviewStats,
      monthlyGrowth,
      topClinics,
      paymentMethods,
      dateRange: {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superadmin_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              التقارير والإحصائيات
            </h1>
            <p className="text-blue-200 mt-2">
              تقارير شاملة عن أداء النظام
            </p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "dd/MM/yyyy", { locale: ar })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ar })}`
                    : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={exportReport} className="bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30">
              <Download className="h-4 w-4 ml-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="growth">النمو الشهري</TabsTrigger>
            <TabsTrigger value="clinics">أفضل العيادات</TabsTrigger>
            <TabsTrigger value="payments">طرق الدفع</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    العيادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {overviewStats?.clinics || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {overviewStats?.users || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    الاشتراكات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {overviewStats?.subscriptions || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    الإيرادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {(overviewStats?.revenue || 0).toLocaleString()} د.ع
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    المدفوعات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {overviewStats?.payments || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">النمو الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyGrowth?.map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white font-medium">{month.month}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-blue-200">{month.clinics} عيادة</span>
                        <span className="text-green-200">{month.users} مستخدم</span>
                        <span className="text-yellow-200">{month.revenue.toLocaleString()} د.ع</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clinics" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">أفضل العيادات حسب عدد المرضى</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topClinics?.map((clinic, index) => (
                    <div key={clinic.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-blue-200 font-bold">#{index + 1}</span>
                        <span className="text-white font-medium">{clinic.name}</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-blue-200">{clinic.staff_count} موظف</span>
                        <span className="text-green-200">{clinic.patients_count} مريض</span>
                        <span className="text-yellow-200">{clinic.appointments_count} موعد</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">إحصائيات طرق الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods?.map((method) => (
                    <div key={method.method} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white font-medium">{method.method}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-blue-200">{method.count} دفعة</span>
                        <span className="text-green-200">{method.total.toLocaleString()} د.ع</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}