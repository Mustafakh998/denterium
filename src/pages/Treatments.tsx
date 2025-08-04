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
import { useToast } from "@/hooks/use-toast";
import AddTreatmentForm from "@/components/treatments/AddTreatmentForm";
import EditTreatmentForm from "@/components/treatments/EditTreatmentForm";
import TreatmentDetails from "@/components/treatments/TreatmentDetails";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Activity,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface Treatment {
  id: string;
  treatment_name: string;
  treatment_code: string;
  description: string;
  status: string;
  cost: number;
  patient_paid: number;
  insurance_covered: number;
  treatment_date: string;
  completion_date: string;
  tooth_numbers: string[];
  notes: string;
  clinic_id: string;
  patient_id: string;
  dentist_id: string;
  appointment_id: string;
  created_at: string;
  updated_at: string;
  // Patient details from join
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_avatar_url: string;
}

export default function Treatments() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchTreatments = async () => {
    if (!profile?.clinic_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("treatments")
        .select(`
          *,
          patients!inner(
            first_name,
            last_name,
            phone,
            avatar_url
          )
        `)
        .eq("clinic_id", profile.clinic_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedTreatments = data?.map((treatment: any) => ({
        ...treatment,
        patient_first_name: treatment.patients?.first_name || "",
        patient_last_name: treatment.patients?.last_name || "",
        patient_phone: treatment.patients?.phone || "",
        patient_avatar_url: treatment.patients?.avatar_url || "",
      })) || [];

      setTreatments(formattedTreatments);
    } catch (error) {
      console.error("Error fetching treatments:", error);
      toast({
        title: "خطأ في تحميل العلاجات",
        description: "حدث خطأ أثناء تحميل بيانات العلاجات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchTreatments();
    }
  }, [profile?.clinic_id]);

  const filterTreatments = () => {
    if (!searchTerm.trim()) {
      setFilteredTreatments(treatments);
      return;
    }

    const filtered = treatments.filter((treatment) =>
      treatment.treatment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.treatment_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${treatment.patient_first_name} ${treatment.patient_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTreatments(filtered);
  };

  useEffect(() => {
    filterTreatments();
  }, [treatments, searchTerm]);

  const handleTreatmentAdded = () => {
    fetchTreatments();
    setShowAddDialog(false);
  };

  const handleTreatmentUpdated = () => {
    fetchTreatments();
    setShowEditDialog(false);
    setSelectedTreatment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "planned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل";
      case "in_progress":
        return "قيد التنفيذ";
      case "planned":
        return "مخطط";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const totalTreatments = treatments.length;
  const completedTreatments = treatments.filter(t => t.status === 'completed').length;
  const inProgressTreatments = treatments.filter(t => t.status === 'in_progress').length;
  const totalRevenue = treatments
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.patient_paid || 0), 0);

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة العلاجات</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              متابعة وإدارة خطط العلاج للمرضى
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة علاج جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة علاج جديد</DialogTitle>
              </DialogHeader>
              <AddTreatmentForm onSuccess={handleTreatmentAdded} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العلاجات</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTreatments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العلاجات المكتملة</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTreatments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTreatments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في العلاجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="ml-2 h-4 w-4" />
            تصفية
          </Button>
        </div>

        {/* Treatments Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>اسم العلاج</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التكلفة</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>تاريخ العلاج</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTreatments.map((treatment) => (
                <TableRow key={treatment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-reverse space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={treatment.patient_avatar_url} />
                        <AvatarFallback>
                          {getPatientInitials(treatment.patient_first_name, treatment.patient_last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {treatment.patient_first_name} {treatment.patient_last_name}
                        </p>
                        <p className="text-sm text-gray-500">{treatment.patient_phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{treatment.treatment_name}</TableCell>
                  <TableCell>{treatment.treatment_code || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(treatment.status)}>
                      {getStatusText(treatment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(treatment.cost || 0)}</TableCell>
                  <TableCell>{formatCurrency(treatment.patient_paid || 0)}</TableCell>
                  <TableCell>
                    {treatment.treatment_date ? 
                      new Date(treatment.treatment_date).toLocaleDateString('ar-IQ') : 
                      "-"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTreatment(treatment);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTreatment(treatment);
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

        {/* Dialogs */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل العلاج</DialogTitle>
            </DialogHeader>
            {selectedTreatment && (
              <EditTreatmentForm
                treatment={selectedTreatment}
                onSuccess={handleTreatmentUpdated}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل العلاج</DialogTitle>
            </DialogHeader>
            {selectedTreatment && (
              <TreatmentDetails treatment={selectedTreatment} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}