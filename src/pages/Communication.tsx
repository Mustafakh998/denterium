import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare,
  Bell,
  Users,
  Calendar,
  FileText,
  Settings,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Inbox,
  Archive
} from "lucide-react";

export default function Communication() {
  const communicationFeatures = [
    {
      icon: MessageSquare,
      title: "رسائل المرضى",
      description: "نظام رسائل مباشر مع المرضى",
      status: "قريباً",
      features: ["محادثات فردية", "إرسال الملفات", "حالة القراءة", "ترجمة تلقائية"]
    },
    {
      icon: Bell,
      title: "تذكيرات ذكية",
      description: "تذكيرات تلقائية للمواعيد والأدوية",
      status: "قيد التطوير",
      features: ["تذكيرات SMS", "تذكيرات البريد", "تذكيرات التطبيق", "جدولة مخصصة"]
    },
    {
      icon: Mail,
      title: "حملات البريد الإلكتروني",
      description: "إرسال نصائح طبية ونشرات إخبارية",
      status: "قيد التخطيط",
      features: ["قوالب جاهزة", "جدولة الإرسال", "تتبع المعدلات", "تخصيص المحتوى"]
    },
    {
      icon: Phone,
      title: "مكالمات صوتية",
      description: "استشارات صوتية مع المرضى",
      status: "قيد البحث",
      features: ["مكالمات آمنة", "تسجيل المكالمات", "جدولة المكالمات", "تقييم الجودة"]
    }
  ];

  const templates = [
    {
      title: "تذكير بالموعد",
      content: "مرحباً {اسم_المريض}، لديك موعد غداً في تمام الساعة {وقت_الموعد}. يرجى التواصل معنا في حالة التأجيل.",
      category: "مواعيد"
    },
    {
      title: "تعليمات بعد العلاج",
      content: "شكراً لزيارتك اليوم. يرجى اتباع التعليمات التالية للعناية بالأسنان بعد العلاج...",
      category: "رعاية"
    },
    {
      title: "تذكير بالدفع",
      content: "تذكير ودود بأن لديك مبلغ مستحق قدره {المبلغ}. يمكنك الدفع عبر الطرق المتاحة.",
      category: "مالية"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            التواصل مع المرضى
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            أدوات شاملة للتواصل وإدارة العلاقات مع المرضى
          </p>
        </div>

        {/* Communication Features Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {communicationFeatures.map((feature, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <Badge variant={feature.status === "قريباً" ? "default" : "secondary"}>
                    {feature.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">الميزات المتاحة:</h4>
                  <ul className="text-sm space-y-1">
                    {feature.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-2"></div>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button variant="outline" className="w-full mt-4" disabled>
                  {feature.status === "قيد التطوير" ? "جاري التطوير" : "قريباً"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Message Templates Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              قوالب الرسائل
            </CardTitle>
            <CardDescription>
              قوالب جاهزة للرسائل المختلفة (قيد التطوير)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {templates.map((template, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{template.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {template.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>
              أدوات سريعة للتواصل (ستكون متاحة قريباً)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" disabled className="flex items-center gap-2 h-12">
                <Send className="h-4 w-4" />
                رسالة جماعية
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2 h-12">
                <MessageCircle className="h-4 w-4" />
                رسالة سريعة
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2 h-12">
                <Inbox className="h-4 w-4" />
                صندوق الرسائل
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2 h-12">
                <Archive className="h-4 w-4" />
                الرسائل المؤرشفة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Request */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              💬 تطوير قائم على احتياجاتك
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              نعمل على تطوير أنظمة التواصل بناءً على ملاحظات المستخدمين. شاركنا احتياجاتك!
            </p>
            <Button variant="outline">
              إرسال طلب ميزة
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}