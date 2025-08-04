import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ReportData {
  patients: {
    total: number;
    new: number;
    active: number;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    scheduled: number;
  };
  treatments: {
    total: number;
    completed: number;
    revenue: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    revenue: number;
  };
}

export default function Reports() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<any>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [reportType, setReportType] = useState("overview");
  const [reportData, setReportData] = useState<ReportData>({
    patients: { total: 0, new: 0, active: 0 },
    appointments: { total: 0, completed: 0, cancelled: 0, scheduled: 0 },
    treatments: { total: 0, completed: 0, revenue: 0 },
    invoices: { total: 0, paid: 0, pending: 0, revenue: 0 },
  });

  const fetchReportData = async () => {
    if (!profile?.clinic_id) return;
    
    setLoading(true);
    try {
      const startDate = dateRange.from?.toISOString();
      const endDate = dateRange.to?.toISOString();

      // Fetch patients data
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id, created_at, is_active")
        .eq("clinic_id", profile.clinic_id)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (patientsError) throw patientsError;

      // Fetch appointments data
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, status, created_at")
        .eq("clinic_id", profile.clinic_id)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (appointmentsError) throw appointmentsError;

      // Fetch treatments data
      const { data: treatments, error: treatmentsError } = await supabase
        .from("treatments")
        .select("id, status, cost, patient_paid, created_at")
        .eq("clinic_id", profile.clinic_id)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (treatmentsError) throw treatmentsError;

      // Fetch invoices data
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, status, total_amount, paid_amount, created_at")
        .eq("clinic_id", profile.clinic_id)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (invoicesError) throw invoicesError;

      // Process data
      const processedData: ReportData = {
        patients: {
          total: patients?.length || 0,
          new: patients?.length || 0,
          active: patients?.filter(p => p.is_active).length || 0,
        },
        appointments: {
          total: appointments?.length || 0,
          completed: appointments?.filter(a => a.status === 'completed').length || 0,
          cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
          scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
        },
        treatments: {
          total: treatments?.length || 0,
          completed: treatments?.filter(t => t.status === 'completed').length || 0,
          revenue: treatments?.filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.patient_paid || 0), 0) || 0,
        },
        invoices: {
          total: invoices?.length || 0,
          paid: invoices?.filter(i => i.status === 'paid').length || 0,
          pending: invoices?.filter(i => i.status === 'pending').length || 0,
          revenue: invoices?.filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + (i.paid_amount || 0), 0) || 0,
        },
      };

      setReportData(processedData);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "خطأ في تحميل التقارير",
        description: "حدث خطأ أثناء تحميل بيانات التقارير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchReportData();
    }
  }, [profile?.clinic_id, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const chartData = [
    { name: "المرضى", value: reportData.patients.total, color: "#8884d8" },
    { name: "المواعيد", value: reportData.appointments.total, color: "#82ca9d" },
    { name: "العلاجات", value: reportData.treatments.total, color: "#ffc658" },
    { name: "الفواتير", value: reportData.invoices.total, color: "#ff7300" },
  ];

  const appointmentStatusData = [
    { name: "مكتملة", value: reportData.appointments.completed, color: "#10b981" },
    { name: "مجدولة", value: reportData.appointments.scheduled, color: "#3b82f6" },
    { name: "ملغية", value: reportData.appointments.cancelled, color: "#ef4444" },
  ];

  const revenueData = [
    {
      name: "العلاجات",
      revenue: reportData.treatments.revenue,
    },
    {
      name: "الفواتير",
      revenue: reportData.invoices.revenue,
    },
  ];

  const handleExportReport = () => {
    const reportContent = {
      period: `${dateRange.from?.toLocaleDateString('ar-IQ')} - ${dateRange.to?.toLocaleDateString('ar-IQ')}`,
      data: reportData,
      generatedAt: new Date().toLocaleString('ar-IQ'),
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم تصدير التقرير",
      description: "تم تحميل ملف التقرير بنجاح",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">التقارير والإحصائيات</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              تحليل أداء العيادة والتقارير المالية
            </p>
          </div>
          <Button onClick={handleExportReport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <DatePickerWithRange 
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">نظرة عامة</SelectItem>
              <SelectItem value="financial">التقرير المالي</SelectItem>
              <SelectItem value="patients">تقرير المرضى</SelectItem>
              <SelectItem value="appointments">تقرير المواعيد</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.patients.total}</div>
              <p className="text-xs text-muted-foreground">
                +{reportData.patients.new} جديد هذا الشهر
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المواعيد المكتملة</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.appointments.completed}</div>
              <p className="text-xs text-muted-foreground">
                من أصل {reportData.appointments.total} موعد
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العلاجات المكتملة</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.treatments.completed}</div>
              <p className="text-xs text-muted-foreground">
                من أصل {reportData.treatments.total} علاج
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(reportData.invoices.revenue)}</div>
              <p className="text-xs text-muted-foreground">
                من الفواتير المدفوعة
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="financial">التقرير المالي</TabsTrigger>
            <TabsTrigger value="patients">المرضى</TabsTrigger>
            <TabsTrigger value="appointments">المواعيد</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات عامة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>حالة المواعيد</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={appointmentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>تحليل الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي المرضى</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {reportData.patients.total}
                  </div>
                  <p className="text-sm text-muted-foreground">مريض مسجل</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>المرضى الجدد</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {reportData.patients.new}
                  </div>
                  <p className="text-sm text-muted-foreground">في هذه الفترة</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>المرضى النشطين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {reportData.patients.active}
                  </div>
                  <p className="text-sm text-muted-foreground">نشط حالياً</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات المواعيد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>إجمالي المواعيد:</span>
                    <Badge variant="outline">{reportData.appointments.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>مكتملة:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {reportData.appointments.completed}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>مجدولة:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {reportData.appointments.scheduled}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ملغية:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {reportData.appointments.cancelled}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>معدل الإكمال</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {reportData.appointments.total > 0 
                        ? Math.round((reportData.appointments.completed / reportData.appointments.total) * 100)
                        : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      من المواعيد تم إكمالها بنجاح
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}