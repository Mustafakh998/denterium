import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AddStaffForm from "@/components/staff/AddStaffForm";
import EditStaffForm from "@/components/staff/EditStaffForm";
import StaffDetails from "@/components/staff/StaffDetails";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Users,
  UserPlus,
  Shield,
  Crown,
  UserCheck,
  Clock,
  MoreVertical,
  Loader2,
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
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

export default function Staff() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchStaff = async () => {
    if (!profile?.clinic_id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("clinic_id", profile.clinic_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "خطأ في تحميل الموظفين",
        description: "حدث خطأ أثناء تحميل بيانات الموظفين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchStaff();
    }
  }, [profile?.clinic_id]);

  const filterStaff = () => {
    let filtered = staff;

    if (searchTerm.trim()) {
      filtered = filtered.filter((member) =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter((member) => member.role === selectedRole);
    }

    setFilteredStaff(filtered);
  };

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm, selectedRole]);

  const handleStaffAdded = () => {
    fetchStaff();
    setShowAddDialog(false);
  };

  const handleStaffUpdated = () => {
    fetchStaff();
    setShowEditDialog(false);
    setSelectedStaff(null);
  };

  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", staffId);

      if (error) throw error;

      toast({
        title: "تم تحديث حالة الموظف",
        description: `تم ${!currentStatus ? "تفعيل" : "إلغاء تفعيل"} الموظف بنجاح`,
      });

      fetchStaff();
    } catch (error) {
      console.error("Error updating staff status:", error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: "حدث خطأ أثناء تحديث حالة الموظف",
        variant: "destructive",
      });
    }
  };

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
    return new Date(dateString).toLocaleDateString('ar-IQ');
  };

  const roleOptions = [
    { value: "all", label: "جميع الأدوار" },
    { value: "admin", label: "مدير" },
    { value: "dentist", label: "طبيب أسنان" },
    { value: "assistant", label: "مساعد طبي" },
    { value: "receptionist", label: "موظف استقبال" },
  ];

  const totalStaff = staff.length;
  const dentists = staff.filter(s => s.role === 'dentist').length;
  const assistants = staff.filter(s => s.role === 'assistant').length;
  const activeStaff = staff.filter(s => s.is_active).length;

  // Show no clinic setup message if user has no clinic_id
  if (!loading && !profile?.clinic_id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Users className="h-16 w-16 text-gray-400" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              لم يتم ربط حسابك بعيادة
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              يرجى التواصل مع مدير النظام لربط حسابك بعيادة لتتمكن من الوصول إلى هذه الميزة
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الموظفين</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              إدارة طاقم العمل وصلاحيات المستخدمين
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة موظف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
              </DialogHeader>
              <AddStaffForm onSuccess={handleStaffAdded} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStaff}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أطباء الأسنان</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dentists}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المساعدين</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assistants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النشطين</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStaff}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الموظفين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Staff Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>التخصص</TableHead>
                <TableHead>رقم الترخيص</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الانضمام</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-reverse space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {getStaffInitials(member.first_name, member.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(member.role)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        {getRoleText(member.role)}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{member.specialization || "-"}</TableCell>
                  <TableCell>{member.license_number || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(member.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* No Results */}
        {filteredStaff.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا يوجد موظفين
              </h3>
              <p className="text-gray-500 text-center mb-4">
                لم يتم العثور على موظفين يطابقون معايير البحث
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة موظف جديد
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل بيانات الموظف</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <EditStaffForm
                staff={selectedStaff}
                onSuccess={handleStaffUpdated}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الموظف</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <StaffDetails staff={selectedStaff} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}