import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  Calendar
} from "lucide-react";

export default function Inventory() {
  const inventoryCategories = [
    {
      icon: Package,
      name: "أدوات طبية",
      items: 145,
      lowStock: 8,
      status: "active"
    },
    {
      icon: Package,
      name: "مواد التنظيف",
      items: 23,
      lowStock: 2,
      status: "active"
    },
    {
      icon: Package,
      name: "أدوية",
      items: 67,
      lowStock: 5,
      status: "active"
    },
    {
      icon: Package,
      name: "مستلزمات مكتبية",
      items: 34,
      lowStock: 1,
      status: "active"
    }
  ];

  const recentActivity = [
    {
      action: "إضافة عنصر جديد",
      item: "قفازات طبية - حجم متوسط",
      quantity: "100 قطعة",
      time: "منذ ساعتين",
      type: "add"
    },
    {
      action: "تنبيه مخزون منخفض",
      item: "أقنعة وجه",
      quantity: "5 قطع متبقية",
      time: "منذ 4 ساعات",
      type: "alert"
    },
    {
      action: "استخدام من المخزون",
      item: "إبر تخدير",
      quantity: "-2 قطعة",
      time: "منذ 6 ساعات",
      type: "usage"
    }
  ];

  const upcomingFeatures = [
    "تتبع تواريخ الانتهاء",
    "إنذارات المخزون المنخفض",
    "تقارير الاستهلاك",
    "طلبات الشراء التلقائية",
    "تكامل مع الموردين",
    "رموز QR للعناصر",
    "تتبع التكاليف",
    "إدارة المخازن المتعددة"
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إدارة المخزون
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              تتبع وإدارة مخزون العيادة والمستلزمات الطبية
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            قيد التطوير
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {inventoryCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                <category.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{category.items}</div>
                <div className="flex items-center space-x-2 mt-1">
                  {category.lowStock > 0 && (
                    <>
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      <p className="text-xs text-orange-600">
                        {category.lowStock} عنصر منخفض
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>
              أدوات سريعة لإدارة المخزون (ستكون متاحة قريباً)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" disabled className="flex items-center gap-2 h-12">
                <Plus className="h-4 w-4" />
                إضافة عنصر
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2 h-12">
                <Search className="h-4 w-4" />
                البحث في المخزون
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2 h-12">
                <TrendingDown className="h-4 w-4" />
                المخزون المنخفض
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2 h-12">
                <BarChart3 className="h-4 w-4" />
                تقرير الاستهلاك
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
              <CardDescription>آخر التحديثات على المخزون</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 space-x-reverse">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'add' ? 'bg-green-500' :
                      activity.type === 'alert' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.item}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {activity.quantity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الميزات القادمة</CardTitle>
              <CardDescription>ما نعمل على تطويره</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import/Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              استيراد وتصدير البيانات
            </CardTitle>
            <CardDescription>
              إدارة بيانات المخزون (قيد التطوير)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <Upload className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium mb-1">استيراد من Excel</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  رفع قائمة المخزون من ملف Excel
                </p>
                <Button size="sm" variant="outline" disabled className="mt-2">
                  قريباً
                </Button>
              </div>
              
              <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <Download className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium mb-1">تصدير إلى PDF</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  تصدير تقارير المخزون كملف PDF
                </p>
                <Button size="sm" variant="outline" disabled className="mt-2">
                  قريباً
                </Button>
              </div>
              
              <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-medium mb-1">تقارير دورية</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  تقارير تلقائية شهرية وسنوية
                </p>
                <Button size="sm" variant="outline" disabled className="mt-2">
                  قريباً
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              📦 نظام مخزون شامل قادم
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              نعمل على تطوير نظام إدارة مخزون متقدم مع ميزات الذكاء الاصطناعي والتتبع التلقائي
            </p>
            <Button variant="outline">
              طلب إشعار عند الإطلاق
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}