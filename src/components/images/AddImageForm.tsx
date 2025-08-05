import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  chief_complaint: string;
}

interface AddImageFormProps {
  onSuccess: () => void;
}

export default function AddImageForm({ onSuccess }: AddImageFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_type: "photo",
    tooth_numbers: "",
    patient_id: "",
    appointment_id: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [profile?.clinic_id]);

  useEffect(() => {
    if (formData.patient_id) {
      fetchAppointments();
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

  const fetchAppointments = async () => {
    if (!formData.patient_id) return;

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, chief_complaint")
        .eq("patient_id", formData.patient_id)
        .order("appointment_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: "يرجى اختيار ملف صورة (JPG, PNG, WebP)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير جداً",
          description: "يرجى اختيار ملف أصغر من 10 ميجابايت",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `medical-images/${profile?.clinic_id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('medical-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('فشل في رفع الصورة');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medical-images')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.clinic_id || !selectedFile) return;

    setLoading(true);
    try {
      // Upload image first
      const imageUrl = await uploadImage(selectedFile);

      const imageData = {
        title: formData.title || "صورة طبية",
        description: formData.description || null,
        image_type: formData.image_type,
        image_url: imageUrl,
        thumbnail_url: imageUrl, // In a real app, you'd generate a thumbnail
        tooth_numbers: formData.tooth_numbers ? 
          formData.tooth_numbers.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t)) : 
          null,
        annotations: {},
        metadata: {
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          uploaded_at: new Date().toISOString(),
        },
        patient_id: formData.patient_id,
        appointment_id: formData.appointment_id || null,
        clinic_id: profile.clinic_id,
        created_by: profile.user_id,
      };

      const { error } = await supabase
        .from("medical_images")
        .insert([imageData]);

      if (error) throw error;

      toast({
        title: "تم رفع الصورة بنجاح",
        description: "تم حفظ الصورة الطبية الجديدة",
      });

      onSuccess();
    } catch (error) {
      console.error("Error adding image:", error);
      toast({
        title: "خطأ في رفع الصورة",
        description: "حدث خطأ أثناء حفظ الصورة الطبية",
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
          <Label htmlFor="appointment_id">الموعد (اختياري)</Label>
          <Select
            value={formData.appointment_id}
            onValueChange={(value) => handleInputChange("appointment_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الموعد" />
            </SelectTrigger>
            <SelectContent>
              {appointments.map((appointment) => (
                <SelectItem key={appointment.id} value={appointment.id}>
                  {new Date(appointment.appointment_date).toLocaleDateString('ar-IQ')} - {appointment.chief_complaint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">عنوان الصورة</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="مثال: أشعة سينية للفك العلوي"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image_type">نوع الصورة</Label>
          <Select
            value={formData.image_type}
            onValueChange={(value) => handleInputChange("image_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">صورة فوتوغرافية</SelectItem>
              <SelectItem value="xray">أشعة سينية</SelectItem>
              <SelectItem value="scan">مسح ضوئي</SelectItem>
              <SelectItem value="impression">طبعة أسنان</SelectItem>
            </SelectContent>
          </Select>
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
        <Label htmlFor="description">وصف الصورة</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="تفاصيل إضافية حول الصورة..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">ملف الصورة *</Label>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">انقر لرفع الصورة</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, WebP (الحد الأقصى 10MB)
              </p>
              {selectedFile && (
                <p className="text-xs text-green-600 mt-2">
                  تم اختيار: {selectedFile.name}
                </p>
              )}
            </div>
            <input
              id="file"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-reverse space-x-2">
        <Button type="submit" disabled={loading || uploading || !selectedFile}>
          {(loading || uploading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          {uploading ? "جاري الرفع..." : "إضافة الصورة"}
        </Button>
      </div>
    </form>
  );
}