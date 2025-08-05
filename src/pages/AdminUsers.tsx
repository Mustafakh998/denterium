import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Check, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
  clinic_id: string;
}

export default function AdminUsers() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.system_role === 'super_admin') {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase.from("profiles").select("*");
      
      // If regular admin, only show users from their clinic
      if (profile?.role === 'admin' && profile?.system_role !== 'super_admin') {
        query = query.eq('clinic_id', profile.clinic_id);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "خطأ في تحميل المستخدمين",
          description: "حدث خطأ أثناء تحميل قائمة المستخدمين",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "خطأ في تحميل المستخدمين",
        description: "حدث خطأ أثناء تحميل قائمة المستخدمين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "تم تحديث حالة المستخدم",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم بنجاح`,
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: "حدث خطأ أثناء تحديث حالة المستخدم",
        variant: "destructive",
      });
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'dentist': 'طبيب أسنان',
      'assistant': 'مساعد',
      'receptionist': 'موظف استقبال',
      'admin': 'مدير',
      'supplier': 'مورد',
      'patient': 'مريض'
    };
    return roleMap[role] || role;
  };

  if (profile?.role !== 'admin' && profile?.system_role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            غير مصرح لك بالوصول
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            هذه الصفحة مخصصة للمديرين فقط
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إدارة المستخدمين
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              عرض وإدارة جميع المستخدمين في النظام
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {users.length} مستخدم
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.is_active ? "default" : "destructive"}
                        >
                          {user.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  لا توجد مستخدمين
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  لم يتم العثور على مستخدمين في النظام
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}