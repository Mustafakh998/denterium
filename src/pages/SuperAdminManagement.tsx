import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { 
  Shield, 
  Users, 
  Building, 
  CreditCard, 
  Activity,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle,
  BarChart3,
  Database
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
    enabled: !!profile
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profile || profile?.system_role !== 'super_admin') {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">غير مخول</h3>
                <p className="text-blue-200">
                  ليس لديك صلاحية للوصول لوحة إدارة النظام
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SuperAdminLayout>
    );
  }

  const quickActions = [
    {
      title: "إدارة المستخدمين",
      description: "عرض وإدارة جميع المستخدمين",
      icon: Users,
      href: "/super-admin/users",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "إدارة العيادات", 
      description: "مراقبة وإدارة العيادات",
      icon: Building,
      href: "/super-admin/clinics",
      color: "from-green-500 to-green-600"
    },
    {
      title: "إدارة المدفوعات",
      description: "مراجعة وإدارة المدفوعات",
      icon: CreditCard,
      href: "/super-admin/payments",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "إدارة الاشتراكات",
      description: "إدارة الاشتراكات والخطط",
      icon: DollarSign,
      href: "/super-admin/subscriptions",
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "التقارير والإحصائيات",
      description: "عرض تقارير النظام",
      icon: BarChart3,
      href: "/super-admin/reports",
      color: "from-pink-500 to-pink-600"
    },
    {
      title: "إدارة البيانات",
      description: "إدارة قاعدة البيانات",
      icon: Database,
      href: "/super-admin/data",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            لوحة الإدارة العامة
          </h1>
          <p className="text-blue-200 mt-2">
            إدارة شاملة لنظام إدارة العيادات - مرحباً {profile?.first_name}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">العيادات المسجلة</CardTitle>
              <Building className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalClinics || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">الاشتراكات النشطة</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.activeSubscriptions || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">المدفوعات المعلقة</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-300">{stats?.pendingPayments || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-300">
                {((stats?.totalRevenue || 0) / 1000).toFixed(0)}K د.ع
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer" onClick={() => navigate(action.href)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{action.title}</CardTitle>
                      <p className="text-blue-200 text-sm">{action.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.users?.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">مستخدم جديد: {user.email}</p>
                    <p className="text-blue-200 text-sm">
                      {new Date(user.created_at).toLocaleDateString('ar-IQ')}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-200 border-green-400/30">
                    {user.role === 'dentist' ? 'طبيب' : 
                     user.role === 'supplier' ? 'مورد' : 'مستخدم'}
                  </Badge>
                </div>
              ))}
              {(!stats?.users || stats.users.length === 0) && (
                <p className="text-blue-200 text-center py-4">لا توجد أنشطة حديثة</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}