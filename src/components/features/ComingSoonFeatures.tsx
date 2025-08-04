import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Scan,
  Palette,
  CreditCard,
  MessageSquare,
  BarChart3,
  Calendar,
  FileImage,
  Stethoscope,
  Cloud,
  Shield
} from "lucide-react";

const ComingSoonFeatures = () => {
  const features = [
    {
      icon: Scan,
      title: "نماذج الأسنان ثلاثية الأبعاد",
      description: "تصور تفاعلي ثلاثي الأبعاد لبنية أسنان المريض مع إمكانية التلاعب والتحليل",
      status: "قريباً",
      priority: "عالية"
    },
    {
      icon: FileImage,
      title: "تحليل الأشعة السينية",
      description: "معالجة صور متقدمة وأدوات تشخيصية ذكية باستخدام الذكاء الاصطناعي",
      status: "قيد التطوير",
      priority: "عالية"
    },
    {
      icon: CreditCard,
      title: "تكامل الدفع المحلي",
      description: "طرق الدفع العراقية المحلية وإدارة الاشتراكات والفواتير الإلكترونية",
      status: "قريباً",
      priority: "متوسطة"
    },
    {
      icon: MessageSquare,
      title: "نظام الرسائل والتذكيرات",
      description: "إرسال تذكيرات المواعيد عبر SMS والبريد الإلكتروني مع قوالب قابلة للتخصيص",
      status: "قيد التخطيط",
      priority: "متوسطة"
    },
    {
      icon: BarChart3,
      title: "تحليلات متقدمة",
      description: "تقارير مالية وإحصائيات المرضى مع رؤى تجارية ذكية",
      status: "قيد التطوير",
      priority: "متوسطة"
    },
    {
      icon: Calendar,
      title: "جدولة ذكية",
      description: "جدولة تلقائية للمواعيد مع تحسين الوقت وإدارة قوائم الانتظار",
      status: "قريباً",
      priority: "عالية"
    },
    {
      icon: Stethoscope,
      title: "السجلات الطبية الذكية",
      description: "تشخيص مدعوم بالذكاء الاصطناعي وتوصيات العلاج المخصصة",
      status: "قيد البحث",
      priority: "منخفضة"
    },
    {
      icon: Cloud,
      title: "النسخ الاحتياطي التلقائي",
      description: "نسخ احتياطية تلقائية مشفرة مع استعادة فورية للبيانات",
      status: "قيد التطوير",
      priority: "عالية"
    },
    {
      icon: Shield,
      title: "أمان متقدم",
      description: "مصادقة ثنائية العامل وتشفير من النهاية إلى النهاية",
      status: "قيد التطوير",
      priority: "عالية"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "عالية": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "متوسطة": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "منخفضة": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "قيد التطوير": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "قريباً": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "قيد التخطيط": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "قيد البحث": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          الميزات القادمة
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          نعمل على تطوير ميزات جديدة لتحسين تجربة إدارة العيادة
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(feature.priority)}>
                    {feature.priority}
                  </Badge>
                  <Badge className={getStatusColor(feature.status)}>
                    {feature.status}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg leading-tight">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed mb-4">
                {feature.description}
              </CardDescription>
              <Button variant="outline" size="sm" disabled className="w-full">
                {feature.status === "قيد التطوير" ? "جاري التطوير" : "قريباً"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💡 هل لديك اقتراح؟
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            نحن نسعى لتطوير النظام باستمرار. شاركنا أفكارك واقتراحاتك لميزات جديدة.
          </p>
          <Button variant="outline">
            إرسال اقتراح
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoonFeatures;