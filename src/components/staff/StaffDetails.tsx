import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Mail, 
  Phone, 
  FileText, 
  User, 
  Shield,
  Crown,
  UserCheck,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  specialization: string;
  license_number: string;
  is_active: boolean;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

interface StaffDetailsProps {
  staff: StaffMember;
}

export default function StaffDetails({ staff }: StaffDetailsProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "dentist":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "assistant":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "receptionist":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "مدير";
      case "dentist":
        return "طبيب أسنان";
      case "assistant":
        return "مساعد طبي";
      case "receptionist":
        return "موظف استقبال";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4" />;
      case "dentist":
        return <UserCheck className="h-4 w-4" />;
      case "assistant":
        return <Users className="h-4 w-4" />;
      case "receptionist":
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStaffInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={staff.avatar_url} />
            <AvatarFallback className="text-lg">
              {getStaffInitials(staff.first_name, staff.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">
              {staff.first_name} {staff.last_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getRoleColor(staff.role)}>
                <div className="flex items-center gap-1">
                  {getRoleIcon(staff.role)}
                  {getRoleText(staff.role)}
                </div>
              </Badge>
              <Badge variant={staff.is_active ? "default" : "secondary"}>
                <div className="flex items-center gap-1">
                  {staff.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {staff.is_active ? "نشط" : "غير نشط"}
                </div>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              معلومات الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{staff.email}</span>
            </div>
            {staff.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{staff.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              المعلومات المهنية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {staff.specialization && (
              <div>
                <span className="text-sm text-muted-foreground">التخصص:</span>
                <p className="text-sm font-medium">{staff.specialization}</p>
              </div>
            )}
            {staff.license_number && (
              <div>
                <span className="text-sm text-muted-foreground">رقم الترخيص:</span>
                <p className="text-sm font-medium">{staff.license_number}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            معلومات التوظيف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">تاريخ الانضمام:</span>
              <p className="text-sm font-medium">{formatDate(staff.created_at)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">آخر تحديث:</span>
              <p className="text-sm font-medium">{formatDate(staff.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            صلاحيات الدور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {staff.role === "admin" && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600">مدير - صلاحيات كاملة</p>
                <ul className="text-xs text-muted-foreground space-y-1 mr-4">
                  <li>• إدارة جميع البيانات</li>
                  <li>• إضافة وحذف المستخدمين</li>
                  <li>• الوصول للإعدادات</li>
                  <li>• عرض التقارير المالية</li>
                </ul>
              </div>
            )}
            {staff.role === "dentist" && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-600">طبيب أسنان</p>
                <ul className="text-xs text-muted-foreground space-y-1 mr-4">
                  <li>• إدارة المرضى والعلاجات</li>
                  <li>• عرض وتحديث المواعيد</li>
                  <li>• رفع الصور الطبية</li>
                  <li>• إنشاء الفواتير</li>
                </ul>
              </div>
            )}
            {staff.role === "assistant" && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-600">مساعد طبي</p>
                <ul className="text-xs text-muted-foreground space-y-1 mr-4">
                  <li>• مساعدة في إدارة المرضى</li>
                  <li>• تحديث بيانات العلاجات</li>
                  <li>• رفع الصور الطبية</li>
                  <li>• عرض المواعيد</li>
                </ul>
              </div>
            )}
            {staff.role === "receptionist" && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-600">موظف استقبال</p>
                <ul className="text-xs text-muted-foreground space-y-1 mr-4">
                  <li>• إدارة المواعيد</li>
                  <li>• استقبال المرضى</li>
                  <li>• معالجة المدفوعات</li>
                  <li>• إدارة الاتصالات</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      {!staff.is_active && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  الحساب غير نشط
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  هذا الموظف لا يمكنه الوصول للنظام حالياً
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}