import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen,
  Video,
  FileText,
  Award,
  Clock,
  Users,
  TrendingUp,
  Play,
  Download,
  Star,
  CheckCircle,
  Calendar
} from "lucide-react";

export default function Training() {
  const { toast } = useToast();
  const [activeLesson, setActiveLesson] = useState(null);

  const trainingModules = [
    {
      id: 1,
      title: "أساسيات استخدام النظام",
      description: "تعلم كيفية التنقل واستخدام الميزات الأساسية",
      duration: "45 دقيقة",
      lessons: 8,
      difficulty: "مبتدئ",
      progress: 100,
      topics: [
        "تسجيل الدخول والخروج",
        "فهم لوحة التحكم",
        "إدارة الملف الشخصي",
        "أساسيات التنقل"
      ]
    },
    {
      id: 2,
      title: "إدارة المرضى",
      description: "إدارة ملفات المرضى والسجلات الطبية بفعالية",
      duration: "60 دقيقة",
      lessons: 12,
      difficulty: "متوسط",
      progress: 75,
      topics: [
        "إضافة مريض جديد",
        "تحديث المعلومات الطبية",
        "إدارة السجلات",
        "البحث والفلترة"
      ]
    },
    {
      id: 3,
      title: "جدولة المواعيد",
      description: "تنظيم وإدارة مواعيد العيادة بكفاءة",
      duration: "30 دقيقة",
      lessons: 6,
      difficulty: "مبتدئ",
      progress: 50,
      topics: [
        "إنشاء موعد جديد",
        "تعديل وإلغاء المواعيد",
        "إدارة التذكيرات",
        "عرض التقويم"
      ]
    },
    {
      id: 4,
      title: "الفواتير والمدفوعات",
      description: "إدارة النواحي المالية والفواتير",
      duration: "40 دقيقة",
      lessons: 10,
      difficulty: "متقدم",
      progress: 25,
      topics: [
        "إنشاء فاتورة",
        "تتبع المدفوعات",
        "التقارير المالية",
        "إدارة التأمين"
      ]
    }
  ];

  const quickTips = [
    {
      title: "اختصارات لوحة المفاتيح",
      description: "Ctrl+N لإضافة مريض جديد، Ctrl+A لموعد جديد",
      icon: "⌨️"
    },
    {
      title: "حفظ تلقائي",
      description: "يتم حفظ البيانات تلقائياً كل 30 ثانية",
      icon: "💾"
    },
    {
      title: "البحث السريع",
      description: "استخدم / للبحث السريع في أي صفحة",
      icon: "🔍"
    },
    {
      title: "النسخ الاحتياطي",
      description: "يتم إنشاء نسخة احتياطية يومياً في الساعة 2:00 صباحاً",
      icon: "🔒"
    }
  ];

  const webinars = [
    {
      title: "أفضل الممارسات لإدارة العيادة",
      date: "2025-08-10 14:00",
      duration: "60 دقيقة",
      instructor: "د. سارة أحمد",
      registered: false
    },
    {
      title: "التقارير والتحليلات المالية",
      date: "2025-08-15 16:00", 
      duration: "45 دقيقة",
      instructor: "أحمد محمد",
      registered: true
    },
    {
      title: "أمان البيانات والخصوصية",
      date: "2025-08-20 10:00",
      duration: "30 دقيقة", 
      instructor: "م. فاطمة علي",
      registered: false
    }
  ];

  const handleStartLesson = (moduleId: number) => {
    toast({
      title: "بدء الدرس",
      description: "سيتم توفير المحتوى التعليمي قريباً",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            التدريب والتعلم
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            تعلم كيفية استخدام النظام بفعالية وتطوير مهاراتك
          </p>
        </div>

        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              الدورات
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              الفيديوهات
            </TabsTrigger>
            <TabsTrigger value="webinars" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              الندوات
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              النصائح
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {trainingModules.map((module) => (
                <Card key={module.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                      <Badge variant={
                        module.difficulty === "مبتدئ" ? "default" :
                        module.difficulty === "متوسط" ? "secondary" : "destructive"
                      }>
                        {module.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {module.duration}
                      </span>
                      <span>{module.lessons} درس</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>التقدم</span>
                        <span>{module.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${module.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">المواضيع:</h4>
                      <ul className="text-sm space-y-1">
                        {module.topics.slice(0, 3).map((topic, index) => (
                          <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-3 h-3 text-green-500 ml-2" />
                            {topic}
                          </li>
                        ))}
                        {module.topics.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{module.topics.length - 3} مواضيع أخرى
                          </li>
                        )}
                      </ul>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => handleStartLesson(module.id)}
                      variant={module.progress === 100 ? "outline" : "default"}
                    >
                      <Play className="w-4 h-4 ml-2" />
                      {module.progress === 100 ? "مراجعة" : "متابعة التعلم"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((video) => (
                <Card key={video}>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-500" />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-medium">فيديو تعليمي #{video}</h3>
                      <p className="text-sm text-muted-foreground">
                        شرح مفصل لميزات النظام
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">5:30</span>
                        <Button size="sm" variant="outline" disabled>
                          قريباً
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="webinars" className="space-y-6">
            <div className="space-y-4">
              {webinars.map((webinar, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">{webinar.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          مع {webinar.instructor}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {webinar.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {webinar.duration}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {webinar.registered && (
                          <Badge variant="default">مسجل</Badge>
                        )}
                        <Button 
                          variant={webinar.registered ? "outline" : "default"}
                          disabled
                        >
                          {webinar.registered ? "مسجل" : "التسجيل"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {quickTips.map((tip, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <span className="text-2xl">{tip.icon}</span>
                      <div>
                        <h3 className="font-medium">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>مركز المساعدة</CardTitle>
                <CardDescription>
                  موارد إضافية للمساعدة والدعم
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Button variant="outline" className="flex items-center gap-2 h-12">
                  <FileText className="h-4 w-4" />
                  دليل المستخدم
                </Button>
                <Button variant="outline" className="flex items-center gap-2 h-12">
                  <Download className="h-4 w-4" />
                  تحميل الأدلة
                </Button>
                <Button variant="outline" className="flex items-center gap-2 h-12">
                  <Star className="h-4 w-4" />
                  التقييم والمراجعة
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🎓 تقدمك التعليمي
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  أكملت 62% من المحتوى التعليمي المتاح
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">62%</div>
                <p className="text-sm text-muted-foreground">مكتمل</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}