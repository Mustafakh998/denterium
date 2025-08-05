import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Drug {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface CreatePrescriptionFormProps {
  patient: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreatePrescriptionForm({ 
  patient, 
  onSuccess, 
  onCancel 
}: CreatePrescriptionFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [drugs, setDrugs] = useState<Drug[]>([
    { name: "", dosage: "", frequency: "", duration: "" }
  ]);
  const [notes, setNotes] = useState("");

  const addDrug = () => {
    setDrugs([...drugs, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const removeDrug = (index: number) => {
    if (drugs.length > 1) {
      setDrugs(drugs.filter((_, i) => i !== index));
    }
  };

  const updateDrug = (index: number, field: keyof Drug, value: string) => {
    const updatedDrugs = drugs.map((drug, i) => 
      i === index ? { ...drug, [field]: value } : drug
    );
    setDrugs(updatedDrugs);
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one drug has a name
    const validDrugs = drugs.filter(drug => drug.name.trim() !== "");
    if (validDrugs.length === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب إضافة دواء واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Generate prescription number
      const { data: prescriptionNumber } = await supabase
        .rpc('generate_prescription_number');

      const patientAge = calculateAge(patient.date_of_birth);

      const { error } = await supabase
        .from("prescriptions")
        .insert({
          clinic_id: profile?.clinic_id,
          patient_id: patient.id,
          dentist_id: profile?.id,
          prescription_number: prescriptionNumber,
          patient_name: `${patient.first_name} ${patient.last_name}`,
          patient_age: patientAge,
          prescribed_drugs: validDrugs as any,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "تم إنشاء الوصفة الطبية",
        description: "تم إنشاء الوصفة الطبية بنجاح",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating prescription:", error);
      toast({
        title: "خطأ في إنشاء الوصفة",
        description: "حدث خطأ أثناء إنشاء الوصفة الطبية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-reverse space-x-2">
            <span>معلومات المريض</span>
            <FileText className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>اسم المريض</Label>
              <Input 
                value={`${patient.first_name} ${patient.last_name}`} 
                readOnly 
                className="bg-muted"
              />
            </div>
            <div>
              <Label>العمر</Label>
              <Input 
                value={`${calculateAge(patient.date_of_birth)} سنة`} 
                readOnly 
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescribed Drugs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>الأدوية الموصوفة</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDrug}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة دواء
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {drugs.map((drug, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">الدواء {index + 1}</span>
                {drugs.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDrug(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>اسم الدواء *</Label>
                  <Input
                    value={drug.name}
                    onChange={(e) => updateDrug(index, "name", e.target.value)}
                    placeholder="أدخل اسم الدواء"
                    required
                  />
                </div>
                <div>
                  <Label>الجرعة</Label>
                  <Input
                    value={drug.dosage}
                    onChange={(e) => updateDrug(index, "dosage", e.target.value)}
                    placeholder="مثال: 500 مج"
                  />
                </div>
                <div>
                  <Label>التكرار</Label>
                  <Input
                    value={drug.frequency}
                    onChange={(e) => updateDrug(index, "frequency", e.target.value)}
                    placeholder="مثال: مرتين يومياً"
                  />
                </div>
                <div>
                  <Label>المدة</Label>
                  <Input
                    value={drug.duration}
                    onChange={(e) => updateDrug(index, "duration", e.target.value)}
                    placeholder="مثال: 7 أيام"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>ملاحظات إضافية</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أدخل أي ملاحظات إضافية للمريض..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-reverse space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "جاري الإنشاء..." : "إنشاء الوصفة"}
        </Button>
      </div>
    </form>
  );
}