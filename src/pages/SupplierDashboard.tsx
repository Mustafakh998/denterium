import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Eye,
  Edit
} from 'lucide-react';
import AddProductForm from '@/components/supplier/AddProductForm';
import SupplierLayout from '@/components/layout/SupplierLayout';
import { FibPaymentDialog } from '@/components/billing/FibPaymentDialog';
import { ensureSupplierExists } from '@/utils/supplier';

interface SupplierData {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  verified: boolean;
  rating: number;
  total_reviews: number;
  is_active: boolean;
}

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageRating: number;
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<'basic' | 'premium' | 'enterprise' | null>(null);

  useEffect(() => {
    if (user) {
      fetchSupplierData();
      fetchDashboardStats();
      fetchSubscription();
    }
  }, [user]);

  const fetchSupplierData = async () => {
    try {
      // Try to get existing supplier row for this user
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create supplier record if missing
        const createdId = await ensureSupplierExists(supabase, user);
        if (createdId) {
          const { data: created } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', createdId)
            .maybeSingle();
          setSupplier(created);
        } else {
          setSupplier(null);
        }
      } else {
        setSupplier(data);
      }
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Get supplier ID first
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id, rating')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!supplierData) return;

      // Fetch products stats
      const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_level, is_active')
        .eq('supplier_id', supplierData.id);

      // Fetch orders stats
      const { data: orders } = await supabase
        .from('supplier_orders')
        .select('status, total_amount')
        .eq('supplier_id', supplierData.id);

      // Calculate stats
      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_active).length || 0;
      const lowStockProducts = products?.filter(p => 
        p.stock_quantity <= p.min_stock_level
      ).length || 0;

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const totalRevenue = orders?.reduce((sum, order) => 
        sum + parseFloat(String(order.total_amount || 0)), 0
      ) || 0;

      setStats({
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        averageRating: supplierData?.rating || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!supplierData) return;

      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.plan && data?.status === 'approved') {
        setCurrentPlan(data.plan as any);
        // Ensure supplier is marked active and verified when subscription is approved
        const { data: sRow } = await supabase
          .from('suppliers')
          .select('is_active, verified')
          .eq('id', supplierData.id)
          .maybeSingle();
        if (!sRow || sRow.is_active === false || sRow.verified === false) {
          await supabase
            .from('suppliers')
            .update({ is_active: true, verified: true })
            .eq('id', supplierData.id);
          setSupplier((prev) => (prev ? { ...prev, is_active: true, verified: true } as SupplierData : prev));
        }
      } else {
        setCurrentPlan(null);
      }
    } catch (e) {
      console.error('Error fetching subscription', e);
    }
  };

  if (loading) {
    return (
      <SupplierLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </SupplierLayout>
    );
  }

  return (
    <SupplierLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">لوحة قيادة المورد</h1>
          <p className="text-muted-foreground">
            أهلاً بعودتك، {supplier?.company_name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={supplier?.verified ? "default" : "secondary"}>
            {supplier?.verified ? "موثق" : "في انتظار التوثيق"}
          </Badge>
          <Badge variant={supplier?.is_active ? "default" : "destructive"}>
            {supplier?.is_active ? "نشط" : "غير نشط"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProducts} نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} في الانتظار
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي الإيرادات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التقييم</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {supplier?.total_reviews} تقييم
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>تنبيه نقص المخزون</span>
            </CardTitle>
            <CardDescription className="text-orange-700">
              لديك {stats.lowStockProducts} منتج بمستوى مخزون منخفض.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              عرض المنتجات ذات المخزون المنخفض
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>المخزون</CardTitle>
            <CardDescription>
              إدارة المنتجات ومستويات المخزون
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/supplier-inventory')}>
              <Package className="h-4 w-4 mr-2" />
              عرض المخزون
            </Button>
            <AddProductForm 
              onProductAdded={() => fetchDashboardStats()} 
              trigger={
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة منتج
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المدفوعات المعلقة</CardTitle>
            <CardDescription>
              تتبع مدفوعات أطباء الأسنان
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/supplier-payments')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              عرض المدفوعات
            </Button>
            <Button variant="outline" className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              متأخرة ({0})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الطلبات</CardTitle>
            <CardDescription>
              إدارة الطلبات الواردة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/supplier-orders')}>
              <Eye className="h-4 w-4 mr-2" />
              عرض الطلبات
            </Button>
            <Button variant="outline" className="w-full">
              <ShoppingCart className="h-4 w-4 mr-2" />
              في الانتظار ({stats.pendingOrders})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإعدادات</CardTitle>
            <CardDescription>
              إعدادات الحساب والدفع
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/supplier-settings')}>
              <Edit className="h-4 w-4 mr-2" />
              إعدادات الدفع
            </Button>
            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              عرض التقييمات
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle>اشتراك المورد</CardTitle>
          <CardDescription>اختر خطة الاشتراك الشهرية المناسبة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'basic', name: 'أساسي', price: 20000 },
              { id: 'premium', name: 'ممتاز', price: 40000 },
              { id: 'enterprise', name: 'مؤسسات', price: 60000 },
            ].map((tier) => {
              const priceMap: any = { basic: 20000, premium: 40000, enterprise: 60000 };
              const current = currentPlan ? priceMap[currentPlan] : 0;
              const finalPrice = currentPlan ? Math.max(0, tier.price - current) : tier.price;
              const disabled = currentPlan ? priceMap[currentPlan] >= tier.price : false;
              return (
                <div key={tier.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{tier.name}</h4>
                    {currentPlan === tier.id && (
                      <Badge>خطة حالية</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{finalPrice.toLocaleString()} د.ع / شهر</p>
                  <FibPaymentDialog 
                    planId={tier.id}
                    planName={tier.name}
                    price={finalPrice}
                    isUpgrade={!!currentPlan}
                  />
                  {disabled && (
                    <p className="text-xs text-muted-foreground">أنت على خطة أعلى أو مساوية</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            يتم تفعيل الاشتراك بعد موافقة المشرف العام. للترقية، يتم دفع الفرق فقط.
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
          <CardDescription>
            آخر التحديثات من حساب المورد الخاص بك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">تم استلام طلب جديد</p>
                <p className="text-xs text-muted-foreground">منذ ساعتين</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">تم تحديث مخزون المنتج</p>
                <p className="text-xs text-muted-foreground">منذ يوم واحد</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">تقييم عميل جديد</p>
                <p className="text-xs text-muted-foreground">منذ 3 أيام</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </SupplierLayout>
  );
}