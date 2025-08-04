import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Database,
  Cloud,
  Calendar,
  FileText,
  Archive,
  AlertTriangle
} from "lucide-react";

export default function Backup() {
  const backupHistory = [
    {
      id: 1,
      date: "2025-08-04 09:00",
      type: "تلقائي",
      size: "245 MB",
      status: "مكتمل",
      retention: "30 يوم"
    },
    {
      id: 2,
      date: "2025-08-03 09:00", 
      type: "تلقائي",
      size: "243 MB",
      status: "مكتمل",
      retention: "29 يوم"
    },
    {
      id: 3,
      date: "2025-08-02 15:30",
      type: "يدوي",
      size: "240 MB", 
      status: "مكتمل",
      retention: "90 يوم"
    }
  ];

  const backupSettings = {
    autoBackup: true,
    backupFrequency: "daily",
    retentionPeriod: 30,
    cloudBackup: false,
    encryptBackups: true
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            النسخ الاحتياطي والاستعادة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة النسخ الاحتياطية وضمان أمان البيانات
          </p>
        </div>

        {/* Backup Status Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">آخر نسخة احتياطية</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">اليوم 09:00</div>
              <p className="text-xs text-green-600 mt-1">✓ مكتملة بنجاح</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حجم البيانات</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245 MB</div>
              <p className="text-xs text-muted-foreground mt-1">+2 MB من الأمس</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النسخ المحفوظة</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">30</div>
              <p className="text-xs text-muted-foreground mt-1">آخر 30 يوم</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>
              إنشاء واستعادة النسخ الاحتياطية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button className="flex items-center gap-2 h-12">
                <Download className="h-4 w-4" />
                نسخة احتياطية الآن
              </Button>
              <Button variant="outline" className="flex items-center gap-2 h-12">
                <Upload className="h-4 w-4" />
                استعادة من ملف
              </Button>
              <Button variant="outline" className="flex items-center gap-2 h-12">
                <RotateCcw className="h-4 w-4" />
                استعادة سريعة
              </Button>
              <Button variant="outline" className="flex items-center gap-2 h-12">
                <Cloud className="h-4 w-4" />
                النسخ السحابية
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النسخ الاحتياطي</CardTitle>
              <CardDescription>
                تخصيص جدولة وخيارات النسخ الاحتياطي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>النسخ التلقائي</Label>
                  <p className="text-sm text-muted-foreground">
                    إنشاء نسخة احتياطية يومياً تلقائياً
                  </p>
                </div>
                <Switch checked={backupSettings.autoBackup} />
              </div>
              
              <div className="space-y-2">
                <Label>تكرار النسخ الاحتياطي</Label>
                <select className="w-full p-2 border rounded-md">
                  <option value="daily">يومياً</option>
                  <option value="weekly">أسبوعياً</option>
                  <option value="monthly">شهرياً</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>فترة الحفظ (بالأيام)</Label>
                <Input 
                  type="number" 
                  value={backupSettings.retentionPeriod}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تشفير النسخ</Label>
                  <p className="text-sm text-muted-foreground">
                    حماية إضافية للبيانات الحساسة
                  </p>
                </div>
                <Switch checked={backupSettings.encryptBackups} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>سجل النسخ الاحتياطية</CardTitle>
              <CardDescription>
                آخر النسخ الاحتياطية والحالة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backupHistory.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-2 h-2 rounded-full ${
                        backup.status === 'مكتمل' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium">{backup.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {backup.type} • {backup.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant={backup.status === 'مكتمل' ? 'default' : 'secondary'}>
                        {backup.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        استعادة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cloud Backup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              النسخ السحابية
            </CardTitle>
            <CardDescription>
              حفظ النسخ الاحتياطية في التخزين السحابي (قيد التطوير)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Cloud className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium mb-1">Google Drive</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  مساحة 15 GB مجانية
                </p>
                <Button size="sm" variant="outline" disabled>
                  قريباً
                </Button>
              </div>
              
              <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <Cloud className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-medium mb-1">Dropbox</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  مساحة 2 GB مجانية
                </p>
                <Button size="sm" variant="outline" disabled>
                  قريباً
                </Button>
              </div>
              
              <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium mb-1">التشفير المتقدم</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  حماية من النهاية للنهاية
                </p>
                <Button size="sm" variant="outline" disabled>
                  قريباً
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Banner */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3 space-x-reverse">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  تذكير مهم
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  تأكد من إجراء نسخ احتياطية منتظمة لحماية بيانات المرضى والعيادة. 
                  ينصح بحفظ نسخة إضافية في مكان آمن خارج العيادة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}