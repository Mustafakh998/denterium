import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
}

interface Treatment {
  id: string;
  treatment_name: string;
  cost: number;
  patient_paid: number;
  created_at: string;
}

interface AddInvoiceFormProps {
  onSuccess: () => void;
}

export default function AddInvoiceForm({ onSuccess }: AddInvoiceFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    total_amount: "",
    tax_amount: "",
    discount_amount: "",
    paid_amount: "",
    due_date: "",
    payment_method: "",
    notes: "",
    status: "pending",
  });

  useEffect(() => {
    fetchPatients();
  }, [profile?.clinic_id]);

  useEffect(() => {
    if (formData.patient_id) {
      fetchPatientTreatments();
    }
  }, [formData.patient_id]);

  const fetchPatients = async () => {
    if (!profile?.clinic_id) return;

    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, patient_number")
        .eq("clinic_id", profile.clinic_id)
        .eq("is_active", true)
        .order("first_name");

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchPatientTreatments = async () => {
    if (!formData.patient_id) return;

    try {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, treatment_name, cost, patient_paid, created_at")
        .eq("patient_id", formData.patient_id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTreatments(data || []);

      // Auto-calculate total from unpaid treatments
      const unpaidAmount = data?.reduce((sum, treatment) => {
        const remaining = (treatment.cost || 0) - (treatment.patient_paid || 0);
        return sum + (remaining > 0 ? remaining : 0);
      }, 0) || 0;

      if (unpaidAmount > 0) {
        setFormData(prev => ({
          ...prev,
          total_amount: unpaidAmount.toString(),
        }));
      }
    } catch (error) {
      console.error("Error fetching treatments:", error);
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-4);
    return `INV-${year}${month}${day}-${time}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.clinic_id) return;

    setLoading(true);
    try {
      const invoiceData = {
        invoice_number: generateInvoiceNumber(),
        total_amount: parseFloat(formData.total_amount) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        paid_amount: parseFloat(formData.paid_amount) || 0,
        status: formData.status,
        due_date: formData.due_date || null,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
        patient_id: formData.patient_id,
        clinic_id: profile.clinic_id,
      };

      const { error } = await supabase
        .from("invoices")
        .insert([invoiceData]);

      if (error) throw error;

      toast({
        title: "تم إنشاء الفاتورة بنجاح",
        description: "تم حفظ بيانات الفاتورة الجديدة",
      });

      onSuccess();
    } catch (error) {
      console.error("Error adding invoice:", error);
      toast({
        title: "خطأ في إنشاء الفاتورة",
        description: "حدث خطأ أثناء حفظ بيانات الفاتورة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateNetAmount = () => {
    const total = parseFloat(formData.total_amount) || 0;
    const tax = parseFloat(formData.tax_amount) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    return total + tax - discount;
  };

  const calculateRemainingBalance = () => {
    const net = calculateNetAmount();
    const paid = parseFloat(formData.paid_amount) || 0;
    return net - paid;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patient_id">المريض *</Label>
          <Select
            value={formData.patient_id}
            onValueChange={(value) => handleInputChange("patient_id", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المريض" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.patient_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">حالة الفاتورة</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">في الانتظار</SelectItem>
              <SelectItem value="paid">مدفوعة</SelectItem>
              <SelectItem value="overdue">متأخرة</SelectItem>
              <SelectItem value="cancelled">ملغية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_amount">المبلغ الأساسي *</Label>
          <Input
            id="total_amount"
            type="number"
            step="0.01"
            value={formData.total_amount}
            onChange={(e) => handleInputChange("total_amount", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_amount">مبلغ الضريبة</Label>
          <Input
            id="tax_amount"
            type="number"
            step="0.01"
            value={formData.tax_amount}
            onChange={(e) => handleInputChange("tax_amount", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_amount">مبلغ الخصم</Label>
          <Input
            id="discount_amount"
            type="number"
            step="0.01"
            value={formData.discount_amount}
            onChange={(e) => handleInputChange("discount_amount", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paid_amount">المبلغ المدفوع</Label>
          <Input
            id="paid_amount"
            type="number"
            step="0.01"
            value={formData.paid_amount}
            onChange={(e) => handleInputChange("paid_amount", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => handleInputChange("due_date", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">طريقة الدفع</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => handleInputChange("payment_method", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">نقدي</SelectItem>
              <SelectItem value="card">بطاقة ائتمان</SelectItem>
              <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
              <SelectItem value="check">شيك</SelectItem>
              <SelectItem value="installment">تقسيط</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white">ملخص مالي</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>المبلغ الأساسي:</span>
            <span>{parseFloat(formData.total_amount || "0").toFixed(2)} د.ع</span>
          </div>
          <div className="flex justify-between">
            <span>الضريبة:</span>
            <span>{parseFloat(formData.tax_amount || "0").toFixed(2)} د.ع</span>
          </div>
          <div className="flex justify-between">
            <span>الخصم:</span>
            <span>-{parseFloat(formData.discount_amount || "0").toFixed(2)} د.ع</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>المبلغ الصافي:</span>
            <span>{calculateNetAmount().toFixed(2)} د.ع</span>
          </div>
          <div className="flex justify-between">
            <span>المدفوع:</span>
            <span className="text-green-600">{parseFloat(formData.paid_amount || "0").toFixed(2)} د.ع</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>المتبقي:</span>
            <span className={calculateRemainingBalance() > 0 ? "text-red-600" : "text-green-600"}>
              {calculateRemainingBalance().toFixed(2)} د.ع
            </span>
          </div>
        </div>
      </div>

      {/* Treatment History */}
      {treatments.length > 0 && (
        <div className="space-y-2">
          <Label>العلاجات المكتملة للمريض</Label>
          <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
            {treatments.map((treatment) => (
              <div key={treatment.id} className="flex justify-between text-sm">
                <span>{treatment.treatment_name}</span>
                <span>
                  متبقي: {((treatment.cost || 0) - (treatment.patient_paid || 0)).toFixed(2)} د.ع
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="ملاحظات إضافية حول الفاتورة..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-reverse space-x-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          إنشاء الفاتورة
        </Button>
      </div>
    </form>
  );
}