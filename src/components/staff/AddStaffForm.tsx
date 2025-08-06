import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddStaffFormProps {
  onSuccess: () => void;
}

export default function AddStaffForm({ onSuccess }: AddStaffFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "assistant",
    specialization: "",
    license_number: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.clinic_id) return;

    setLoading(true);
    try {
      // First, invite the user to sign up
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        formData.email,
        {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: formData.role,
            clinic_id: profile.clinic_id,
          },
          redirectTo: `${window.location.origin}/auth`
        }
      );

      if (authError) {
        // If auth admin is not available, create the profile directly
        const profileData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          role: 'dentist' as const, // Simplified role system - all staff are dentists
          specialization: formData.specialization || null,
          license_number: formData.license_number || null,
          clinic_id: profile.clinic_id,
          is_active: true,
        };

        const { error: profileError } = await supabase
          .from("profiles")
          .insert([profileData]);

        if (profileError) throw profileError;
        
        toast({
          title: "تم إضافة الموظف بنجاح",
          description: "تم إنشاء ملف الموظف الجديد",
        });
      } else {
        toast({
          title: "تم إرسال دعوة الموظف",
          description: "تم إرسال رابط الدعوة للموظف الجديد",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error adding staff:", error);
      toast({
        title: "خطأ في إضافة الموظف",
        description: "حدث خطأ أثناء إضافة الموظف الجديد",
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
          <Label htmlFor="email">البريد الإلكتروني *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="example@clinic.com"
            required
          />
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
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          سيتم إرسال دعوة للموظف الجديد عبر البريد الإلكتروني لإكمال التسجيل
        </Label>
      </div>

      <div className="flex justify-end space-x-reverse space-x-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          إضافة الموظف
        </Button>
      </div>
    </form>
  );
}