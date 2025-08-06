import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
}

interface EditStaffFormProps {
  staff: StaffMember;
  onSuccess: () => void;
}

export default function EditStaffForm({ staff, onSuccess }: EditStaffFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: staff.first_name || "",
    last_name: staff.last_name || "",
    phone: staff.phone || "",
    role: staff.role || "assistant",
    specialization: staff.specialization || "",
    license_number: staff.license_number || "",
    is_active: staff.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        role: 'dentist' as const, // Simplified role system - all staff are dentists
        specialization: formData.specialization || null,
        license_number: formData.license_number || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", staff.id);

      if (error) throw error;

      toast({
        title: "تم تحديث بيانات الموظف",
        description: "تم حفظ التغييرات بنجاح",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        title: "خطأ في تحديث البيانات",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            value={staff.email}
            disabled
            className="bg-gray-50 dark:bg-gray-800"
          />
          <p className="text-xs text-muted-foreground">
            لا يمكن تعديل البريد الإلكتروني
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">الدور الوظيفي *</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleInputChange("role", value)}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dentist">طبيب أسنان</SelectItem>
              <SelectItem value="assistant">مساعد طبي</SelectItem>
              <SelectItem value="receptionist">موظف استقبال</SelectItem>
              <SelectItem value="admin">مدير</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="first_name">الاسم الأول *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => handleInputChange("first_name", e.target.value)}
            placeholder="أحمد"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">الاسم الأخير *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => handleInputChange("last_name", e.target.value)}
            placeholder="محمد"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="07812345678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="license_number">رقم الترخيص</Label>
          <Input
            id="license_number"
            value={formData.license_number}
            onChange={(e) => handleInputChange("license_number", e.target.value)}
            placeholder="DDS-12345"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="specialization">التخصص</Label>
          <Input
            id="specialization"
            value={formData.specialization}
            onChange={(e) => handleInputChange("specialization", e.target.value)}
            placeholder="طب الأسنان العام، تقويم الأسنان، إلخ"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-reverse space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
            />
            <Label htmlFor="is_active">الموظف نشط</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            إلغاء التفعيل يمنع الموظف من الوصول للنظام
          </p>
        </div>
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