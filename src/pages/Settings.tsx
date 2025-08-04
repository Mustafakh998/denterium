import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Settings as SettingsIcon, User, Database } from "lucide-react";

export default function Settings() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة إعدادات العيادة والمستخدمين
          </p>
        </div>

        {/* Debug Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                معلومات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">البريد الإلكتروني: </span>
                <span>{user?.email}</span>
              </div>
              <div>
                <span className="font-medium">معرف المستخدم: </span>
                <span className="font-mono text-sm">{user?.id}</span>
              </div>
              <div>
                <span className="font-medium">الدور: </span>
                <span>{user?.user_metadata?.role || "غير محدد"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                معلومات الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile ? (
                <>
                  <div>
                    <span className="font-medium">الاسم الأول: </span>
                    <span>{profile.first_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">الاسم الأخير: </span>
                    <span>{profile.last_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">معرف العيادة: </span>
                    <span className="font-mono text-sm">{profile.clinic_id || "غير مُعيَّن"}</span>
                  </div>
                  <div>
                    <span className="font-medium">الدور: </span>
                    <span>{profile.role}</span>
                  </div>
                </>
              ) : (
                <div className="text-red-600">
                  <p>⚠️ لا يوجد ملف شخصي في قاعدة البيانات</p>
                  <p className="text-sm mt-2">
                    هذا قد يكون سبب مشكلة التحميل اللانهائي في الصفحات الأخرى.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Temporary Debug Panel */}
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              🔧 معلومات التشخيص
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>حالة المستخدم:</strong> {user ? "مُسجل الدخول" : "غير مُسجل"}</p>
              <p><strong>حالة الملف الشخصي:</strong> {profile ? "موجود" : "غير موجود"}</p>
              <p><strong>معرف العيادة:</strong> {profile?.clinic_id || "غير متوفر"}</p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-4">
                إذا كان الملف الشخصي "غير موجود"، فهذا سبب عدم عرض البيانات في الصفحات الأخرى.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}