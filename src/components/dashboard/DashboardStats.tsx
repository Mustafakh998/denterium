import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  Clock,
  FileText,
  Camera,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

function StatCard({ title, value, icon: Icon, change, changeType = "neutral" }: StatCardProps) {
  const changeColor = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600"
  }[changeType];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${changeColor}`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    completedTreatments: 0,
    pendingAppointments: 0,
    totalImages: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.clinic_id) return;

      try {
        // Fetch total patients
        const { count: patientsCount, error: patientsError } = await supabase
          .from("patients")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", profile.clinic_id)
          .eq("is_active", true);

        if (patientsError) {
          console.error('Error fetching patients count:', patientsError);
        }

        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", profile.clinic_id)
          .gte("appointment_date", `${today}T00:00:00`)
          .lt("appointment_date", `${today}T23:59:59`);

        if (appointmentsError) {
          console.error('Error fetching appointments count:', appointmentsError);
        }

        // Fetch monthly revenue
        const currentMonth = new Date().toISOString().substring(0, 7);
        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("paid_amount")
          .eq("clinic_id", profile.clinic_id)
          .gte("created_at", `${currentMonth}-01`)
          .eq("status", "paid");

        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError);
        }

        const monthlyRevenue = invoices?.reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0) || 0;

        // Fetch completed treatments this month
        const { count: treatmentsCount, error: treatmentsError } = await supabase
          .from("treatments")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", profile.clinic_id)
          .eq("status", "completed")
          .gte("completion_date", `${currentMonth}-01`);

        if (treatmentsError) {
          console.error('Error fetching treatments count:', treatmentsError);
        }

        // Fetch pending appointments
        const { count: pendingCount, error: pendingError } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", profile.clinic_id)
          .eq("status", "scheduled");

        if (pendingError) {
          console.error('Error fetching pending appointments:', pendingError);
        }

        // Fetch total medical images
        const { count: imagesCount, error: imagesError } = await supabase
          .from("medical_images")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", profile.clinic_id);

        if (imagesError) {
          console.error('Error fetching images count:', imagesError);
        }

        setStats({
          totalPatients: patientsCount || 0,
          todayAppointments: todayCount || 0,
          monthlyRevenue: monthlyRevenue,
          completedTreatments: treatmentsCount || 0,
          pendingAppointments: pendingCount || 0,
          totalImages: imagesCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Set default stats on error
        setStats({
          totalPatients: 0,
          todayAppointments: 0,
          monthlyRevenue: 0,
          completedTreatments: 0,
          pendingAppointments: 0,
          totalImages: 0,
        });
      }
    };

    fetchStats();
  }, [profile?.clinic_id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="إجمالي المرضى"
        value={stats.totalPatients}
        icon={Users}
        change="+12% من الشهر الماضي"
        changeType="positive"
      />
      <StatCard
        title="مواعيد اليوم"
        value={stats.todayAppointments}
        icon={Calendar}
        change="3 مكتملة"
        changeType="neutral"
      />
      <StatCard
        title="الإيرادات الشهرية"
        value={formatCurrency(stats.monthlyRevenue)}
        icon={DollarSign}
        change="+8% من الشهر الماضي"
        changeType="positive"
      />
      <StatCard
        title="العلاجات المكتملة"
        value={stats.completedTreatments}
        icon={UserCheck}
        change="هذا الشهر"
        changeType="neutral"
      />
      <StatCard
        title="المواعيد المعلقة"
        value={stats.pendingAppointments}
        icon={Clock}
        change="تحتاج متابعة"
        changeType="neutral"
      />
      <StatCard
        title="الصور الطبية"
        value={stats.totalImages}
        icon={Camera}
        change="المحفوظة إجمالاً"
        changeType="neutral"
      />
    </div>
  );
}