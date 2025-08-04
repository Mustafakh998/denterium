import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditPatientFormProps {
  patient: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditPatientForm({ patient, onSuccess, onCancel }: EditPatientFormProps) {
  const [loading, setLoading] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    patient.date_of_birth ? new Date(patient.date_of_birth) : undefined
  );
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      firstName: patient.first_name || "",
      lastName: patient.last_name || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      emergencyContactName: patient.emergency_contact_name || "",
      emergencyContactPhone: patient.emergency_contact_phone || "",
      allergies: patient.allergies?.join(", ") || "",
      medications: patient.medications?.join(", ") || "",
      insuranceProvider: patient.insurance_provider || "",
      insuranceNumber: patient.insurance_number || "",
      notes: patient.notes || "",
    }
  });

  useEffect(() => {
    setValue("gender", patient.gender);
  }, [patient.gender, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: dateOfBirth?.toISOString().split('T')[0],
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          address: data.address,
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_phone: data.emergencyContactPhone,
          notes: data.notes,
          allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
          medications: data.medications ? data.medications.split(',').map(m => m.trim()) : [],
          insurance_provider: data.insuranceProvider,
          insurance_number: data.insuranceNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", patient.id);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error("Error updating patient:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">الاسم الأول*</Label>
          <Input
            id="firstName"
            {...register("firstName", { required: true })}
            className="text-right"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">اسم العائلة*</Label>
          <Input
            id="lastName"
            {...register("lastName", { required: true })}
            className="text-right"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>تاريخ الميلاد</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-right font-normal",
                  !dateOfBirth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {dateOfBirth ? (
                  format(dateOfBirth, "PPP", { locale: ar })
                ) : (
                  <span>اختر التاريخ</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateOfBirth}
                onSelect={setDateOfBirth}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">الجنس</Label>
          <Select defaultValue={patient.gender} onValueChange={(value) => setValue("gender", value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الجنس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">ذكر</SelectItem>
              <SelectItem value="female">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            className="text-right"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="text-right"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">العنوان</Label>
        <Textarea
          id="address"
          {...register("address")}
          className="text-right"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">اسم جهة الاتصال للطوارئ</Label>
          <Input
            id="emergencyContactName"
            {...register("emergencyContactName")}
            className="text-right"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">هاتف جهة الاتصال للطوارئ</Label>
          <Input
            id="emergencyContactPhone"
            type="tel"
            {...register("emergencyContactPhone")}
            className="text-right"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergies">الحساسيات (مفصولة بفواصل)</Label>
        <Input
          id="allergies"
          {...register("allergies")}
          className="text-right"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="medications">الأدوية الحالية (مفصولة بفواصل)</Label>
        <Input
          id="medications"
          {...register("medications")}
          className="text-right"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="insuranceProvider">شركة التأمين</Label>
          <Input
            id="insuranceProvider"
            {...register("insuranceProvider")}
            className="text-right"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="insuranceNumber">رقم التأمين</Label>
          <Input
            id="insuranceNumber"
            {...register("insuranceNumber")}
            className="text-right"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات إضافية</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          className="text-right"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-reverse space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>
    </form>
  );
}