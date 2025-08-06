import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Check, X, Shield, UserX, UserCheck } from "lucide-react";

interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  system_role: string;
  is_active: boolean;
  created_at: string;
  clinic_id: string;
  clinics?: {
    name: string;
  };
}

export default function SuperAdminUsers() {
  const { toast } = useToast();

  const { data: users = [], refetch, isLoading } = useQuery({
    queryKey: ['super-admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          clinics (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as User[];
    }
  });

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

      refetch();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: "حدث خطأ أثناء تحديث حالة المستخدم",
        variant: "destructive",
      });
    }
  };

  const promoteToSuperAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ system_role: 'super_admin' })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "تم ترقية المستخدم",
        description: "تم ترقية المستخدم إلى مدير عام بنجاح",
      });

      refetch();
    } catch (error) {
      console.error("Error promoting user:", error);
      toast({
        title: "خطأ في الترقية",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive",
      });
    }
  };

  const demoteFromSuperAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ system_role: 'user' })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "تم إلغاء الترقية",
        description: "تم إلغاء ترقية المستخدم من مدير عام",
      });

      refetch();
    } catch (error) {
      console.error("Error demoting user:", error);
      toast({
        title: "خطأ في إلغاء الترقية",
        description: "حدث خطأ أثناء إلغاء ترقية المستخدم",
        variant: "destructive",
      });
    }
  };

  const getRoleDisplayName = (role: string, systemRole: string) => {
    if (systemRole === 'super_admin') return 'مدير عام';
    
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

  const getStatusBadge = (isActive: boolean, systemRole: string) => {
    if (systemRole === 'super_admin') {
      return <Badge className="bg-red-500/20 text-red-200 border-red-400/30">مدير عام</Badge>;
    }
    return (
      <Badge variant={isActive ? "default" : "destructive"} className={isActive ? "bg-green-500/20 text-green-200 border-green-400/30" : ""}>
        {isActive ? 'نشط' : 'غير نشط'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              إدارة المستخدمين
            </h1>
            <p className="text-blue-200">
              عرض وإدارة جميع المستخدمين في النظام
            </p>
          </div>
          <Badge className="bg-white/10 text-white border-white/20 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {users.length} مستخدم
          </Badge>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">قائمة المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-blue-200">الاسم</TableHead>
                    <TableHead className="text-blue-200">البريد الإلكتروني</TableHead>
                    <TableHead className="text-blue-200">الهاتف</TableHead>
                    <TableHead className="text-blue-200">العيادة</TableHead>
                    <TableHead className="text-blue-200">الدور</TableHead>
                    <TableHead className="text-blue-200">الحالة</TableHead>
                    <TableHead className="text-blue-200">تاريخ التسجيل</TableHead>
                    <TableHead className="text-blue-200">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-white/10">
                      <TableCell className="font-medium text-white">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="text-blue-200">{user.email}</TableCell>
                      <TableCell className="text-blue-200">{user.phone || '-'}</TableCell>
                      <TableCell className="text-blue-200">{user.clinics?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-white/20 text-white">
                          {getRoleDisplayName(user.role, user.system_role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.is_active, user.system_role)}
                      </TableCell>
                      <TableCell className="text-blue-200">
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className="border-white/20 text-white hover:bg-white/10"
                            disabled={user.system_role === 'super_admin'}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {user.system_role === 'super_admin' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => demoteFromSuperAdmin(user.id)}
                              className="border-red-400/20 text-red-300 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => promoteToSuperAdmin(user.id)}
                              className="border-yellow-400/20 text-yellow-300 hover:bg-yellow-500/10"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  لا توجد مستخدمين
                </h3>
                <p className="text-blue-200">
                  لم يتم العثور على مستخدمين في النظام
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}