import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  Users,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddPatientForm from "@/components/patients/AddPatientForm";
import EditPatientForm from "@/components/patients/EditPatientForm";
import PatientDetails from "@/components/patients/PatientDetails";

export default function Patients() {
  const { profile, profileLoading } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!profileLoading) {
      fetchPatients();
    }
  }, [profile?.clinic_id, profileLoading]);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    console.log("fetchPatients called, profile:", profile, "profileLoading:", profileLoading);
    
    // Wait for profile to load before checking clinic_id
    if (profileLoading) {
      console.log("Profile still loading, waiting...");
      return;
    }
    
    if (!profile?.clinic_id) {
      console.log("No clinic_id found in profile:", profile);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", profile.clinic_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل بيانات المرضى",
          variant: "destructive",
        });
        setPatients([]);
        return;
      }
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "خطأ في جلب المرضى",
        description: "حدث خطأ أثناء جلب قائمة المرضى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient =>
      patient.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_number?.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  };

  const handlePatientAdded = () => {
    fetchPatients();
    setShowAddDialog(false);
    toast({
      title: "تم إضافة المريض",
      description: "تم إضافة المريض الجديد بنجاح",
    });
  };

  const handlePatientUpdated = () => {
    fetchPatients();
    setShowEditDialog(false);
    setSelectedPatient(null);
    toast({
      title: "تم تحديث المريض",
      description: "تم تحديث بيانات المريض بنجاح",
    });
  };

  const getPatientInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "غير محدد";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} سنة`;
  };

  // Show loading while profile or patients are loading
  if (loading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show no clinic setup message only after profile is loaded and clinic_id is null
  if (!profileLoading && !profile?.clinic_id) {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة المرضى</h1>
            <p className="text-muted-foreground">
              إدارة ومتابعة جميع المرضى في العيادة
            </p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-reverse space-x-2">
                <span>إضافة مريض جديد</span>
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة مريض جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المريض الجديد
                </DialogDescription>
              </DialogHeader>
              <AddPatientForm 
                onSuccess={handlePatientAdded}
                clinicId={profile?.clinic_id}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مرضى جدد هذا الشهر</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patients.filter(p => {
                  const createdAt = new Date(p.created_at);
                  const now = new Date();
                  return createdAt.getMonth() === now.getMonth() && 
                         createdAt.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <span>البحث والتصفية</span>
              <Search className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="البحث بالاسم، رقم الهاتف، البريد الإلكتروني، أو رقم المريض..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-right"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المرضى</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا يوجد مرضى</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? "لا توجد نتائج للبحث المحدد" : "ابدأ بإضافة أول مريض"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المريض</TableHead>
                    <TableHead className="text-right">رقم المريض</TableHead>
                    <TableHead className="text-right">العمر</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center space-x-reverse space-x-3">
                          <div>
                            <div className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : ''}
                            </div>
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={patient.avatar_url} />
                            <AvatarFallback>
                              {getPatientInitials(patient.first_name, patient.last_name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{patient.patient_number}</Badge>
                      </TableCell>
                      <TableCell>{calculateAge(patient.date_of_birth)}</TableCell>
                      <TableCell>{patient.phone || "غير محدد"}</TableCell>
                      <TableCell>{patient.email || "غير محدد"}</TableCell>
                      <TableCell>
                        {new Date(patient.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-reverse space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient);
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
            )}
          </CardContent>
        </Card>

        {/* Edit Patient Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل بيانات المريض</DialogTitle>
              <DialogDescription>
                تحديث بيانات المريض
              </DialogDescription>
            </DialogHeader>
            {selectedPatient && (
              <EditPatientForm 
                patient={selectedPatient}
                onSuccess={handlePatientUpdated}
                onCancel={() => {
                  setShowEditDialog(false);
                  setSelectedPatient(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Patient Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>تفاصيل المريض</DialogTitle>
            </DialogHeader>
            {selectedPatient && (
              <PatientDetails patient={selectedPatient} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}