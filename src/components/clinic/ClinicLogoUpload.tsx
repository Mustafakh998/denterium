import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Building2 } from 'lucide-react';

interface ClinicLogoUploadProps {
  currentLogoUrl?: string;
  onLogoUpdated?: (newLogoUrl: string) => void;
}

export default function ClinicLogoUpload({ currentLogoUrl, onLogoUpdated }: ClinicLogoUploadProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.clinic_id) return;

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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "يرجى اختيار ملف أصغر من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${profile.clinic_id}.${fileExt}`;
      const filePath = `clinic-logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('clinic-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('فشل في رفع الشعار');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clinic-logos')
        .getPublicUrl(filePath);

      // Update clinic record
      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: publicUrl })
        .eq('id', profile.clinic_id);

      if (updateError) throw updateError;

      toast({
        title: "تم رفع الشعار بنجاح",
        description: "تم حفظ شعار العيادة الجديد",
      });

      if (onLogoUpdated) {
        onLogoUpdated(publicUrl);
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "خطأ في رفع الشعار",
        description: "حدث خطأ أثناء حفظ شعار العيادة",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label>شعار العيادة</Label>
      
      {/* Current Logo Display */}
      <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
        {currentLogoUrl ? (
          <img 
            src={currentLogoUrl} 
            alt="شعار العيادة" 
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <Building2 className="w-12 h-12 text-gray-400" />
        )}
      </div>

      {/* Upload Button */}
      <div className="space-y-2">
        <input
          type="file"
          id="logo-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('logo-upload')?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="ml-2 h-4 w-4" />
              {currentLogoUrl ? 'تغيير الشعار' : 'رفع شعار العيادة'}
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          PNG, JPG, WebP (الحد الأقصى 5MB)
        </p>
      </div>
    </div>
  );
}