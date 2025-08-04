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
  patient_id: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
}

interface EditTreatmentFormProps {
  treatment: Treatment;
  onSuccess: () => void;
}

export default function EditTreatmentForm({ treatment, onSuccess }: EditTreatmentFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    treatment_name: treatment.treatment_name || "",
    treatment_code: treatment.treatment_code || "",
    description: treatment.description || "",
    status: treatment.status || "planned",
    cost: treatment.cost?.toString() || "",
    patient_paid: treatment.patient_paid?.toString() || "",
    insurance_covered: treatment.insurance_covered?.toString() || "",
    treatment_date: treatment.treatment_date ? new Date(treatment.treatment_date).toISOString().slice(0, 16) : "",
    completion_date: treatment.completion_date ? new Date(treatment.completion_date).toISOString().slice(0, 16) : "",
    tooth_numbers: treatment.tooth_numbers?.join(', ') || "",
    notes: treatment.notes || "",
    patient_id: treatment.patient_id || "",
  });

  useEffect(() => {
    fetchPatients();
  }, [profile?.clinic_id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const updateData = {
        treatment_name: formData.treatment_name,
        treatment_code: formData.treatment_code || null,
        description: formData.description || null,
        status: formData.status,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        patient_paid: formData.patient_paid ? parseFloat(formData.patient_paid) : 0,
        insurance_covered: formData.insurance_covered ? parseFloat(formData.insurance_covered) : 0,
        treatment_date: formData.treatment_date || null,
        completion_date: formData.completion_date || null,
        tooth_numbers: formData.tooth_numbers ? 
          formData.tooth_numbers.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t)) : 
          null,
        notes: formData.notes || null,
        patient_id: formData.patient_id,
      };

      const { error } = await supabase
        .from("treatments")
        .update(updateData)
        .eq("id", treatment.id);

      if (error) throw error;

      toast({
        title: "تم تحديث العلاج بنجاح",
        description: "تم حفظ التغييرات على بيانات العلاج",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating treatment:", error);
      toast({
        title: "خطأ في تحديث العلاج",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <Label htmlFor="treatment_name">اسم العلاج *</Label>
          <Input
            id="treatment_name"
            value={formData.treatment_name}
            onChange={(e) => handleInputChange("treatment_name", e.target.value)}
            placeholder="مثال: حشو أسنان"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="treatment_code">رمز العلاج</Label>
          <Input
            id="treatment_code"
            value={formData.treatment_code}
            onChange={(e) => handleInputChange("treatment_code", e.target.value)}
            placeholder="مثال: D2150"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">حالة العلاج</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">مخطط</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">التكلفة الإجمالية</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => handleInputChange("cost", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="patient_paid">المبلغ المدفوع</Label>
          <Input
            id="patient_paid"
            type="number"
            step="0.01"
            value={formData.patient_paid}
            onChange={(e) => handleInputChange("patient_paid", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="insurance_covered">التأمين الصحي</Label>
          <Input
            id="insurance_covered"
            type="number"
            step="0.01"
            value={formData.insurance_covered}
            onChange={(e) => handleInputChange("insurance_covered", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="treatment_date">تاريخ العلاج</Label>
          <Input
            id="treatment_date"
            type="datetime-local"
            value={formData.treatment_date}
            onChange={(e) => handleInputChange("treatment_date", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="completion_date">تاريخ الإكمال</Label>
          <Input
            id="completion_date"
            type="datetime-local"
            value={formData.completion_date}
            onChange={(e) => handleInputChange("completion_date", e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="tooth_numbers">أرقام الأسنان</Label>
          <Input
            id="tooth_numbers"
            value={formData.tooth_numbers}
            onChange={(e) => handleInputChange("tooth_numbers", e.target.value)}
            placeholder="مثال: 14, 15, 16 (مفصولة بفواصل)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">وصف العلاج</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="تفاصيل العلاج المطلوب..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="ملاحظات إضافية..."
          rows={2}
        />
      </div>

      <div className="flex justify-end space-x-reverse space-x-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>
    </form>
  );
}