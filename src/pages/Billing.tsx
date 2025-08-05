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
import AddInvoiceForm from "@/components/billing/AddInvoiceForm";
import EditInvoiceForm from "@/components/billing/EditInvoiceForm";
import InvoiceDetails from "@/components/billing/InvoiceDetails";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Loader2,
  Download,
  Send,
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
  payment_method: string;
  notes: string;
  clinic_id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  // Patient details from join
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_avatar_url: string;
}

export default function Billing() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchInvoices = async () => {
    if (!profile?.clinic_id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
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

      const formattedInvoices = data?.map((invoice: any) => ({
        ...invoice,
        patient_first_name: invoice.patients?.first_name || "",
        patient_last_name: invoice.patients?.last_name || "",
        patient_phone: invoice.patients?.phone || "",
        patient_avatar_url: invoice.patients?.avatar_url || "",
      })) || [];

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "خطأ في تحميل الفواتير",
        description: "حدث خطأ أثناء تحميل بيانات الفواتير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchInvoices();
    }
  }, [profile?.clinic_id]);

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchTerm.trim()) {
      filtered = filtered.filter((invoice) =>
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${invoice.patient_first_name} ${invoice.patient_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === selectedStatus);
    }

    setFilteredInvoices(filtered);
  };

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, selectedStatus]);

  const handleInvoiceAdded = () => {
    fetchInvoices();
    setShowAddDialog(false);
  };

  const handleInvoiceUpdated = () => {
    fetchInvoices();
    setShowEditDialog(false);
    setSelectedInvoice(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "مدفوعة";
      case "pending":
        return "في الانتظار";
      case "overdue":
        return "متأخرة";
      case "cancelled":
        return "ملغية";
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('ar-IQ');
  };

  const calculateRemainingBalance = (invoice: Invoice) => {
    return (invoice.total_amount || 0) - (invoice.paid_amount || 0);
  };

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "pending", label: "في الانتظار" },
    { value: "paid", label: "مدفوعة" },
    { value: "overdue", label: "متأخرة" },
    { value: "cancelled", label: "ملغية" },
  ];

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + calculateRemainingBalance(inv), 0);

  // Show no clinic setup message if user has no clinic_id
  if (!loading && !profile?.clinic_id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Receipt className="h-16 w-16 text-gray-400" />
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الفواتير</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              إنشاء ومتابعة الفواتير والمدفوعات
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إنشاء فاتورة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
              </DialogHeader>
              <AddInvoiceForm onSuccess={handleInvoiceAdded} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الفواتير المدفوعة</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">في الانتظار</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices}</div>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المبالغ المعلقة</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الفواتير..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>المريض</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-reverse space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={invoice.patient_avatar_url} />
                        <AvatarFallback>
                          {getPatientInitials(invoice.patient_first_name, invoice.patient_last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {invoice.patient_first_name} {invoice.patient_last_name}
                        </p>
                        <p className="text-sm text-gray-500">{invoice.patient_phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.total_amount || 0)}</TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(invoice.paid_amount || 0)}
                  </TableCell>
                  <TableCell className={calculateRemainingBalance(invoice) > 0 ? "text-red-600" : "text-green-600"}>
                    {formatCurrency(calculateRemainingBalance(invoice))}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusText(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* No Results */}
        {filteredInvoices.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد فواتير
              </h3>
              <p className="text-gray-500 text-center mb-4">
                لم يتم العثور على فواتير تطابق معايير البحث
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إنشاء فاتورة جديدة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل الفاتورة</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <EditInvoiceForm
                invoice={selectedInvoice}
                onSuccess={handleInvoiceUpdated}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الفاتورة</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <InvoiceDetails invoice={selectedInvoice} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}