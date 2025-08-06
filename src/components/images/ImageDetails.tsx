import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getSignedImageUrl } from "@/utils/imageHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MedicalImageEditor from "./MedicalImageEditor";
import { 
  Calendar, 
  Download, 
  FileText, 
  Circle, 
  User, 
  Image as ImageIcon,
  Info,
  Tag,
  Edit,
  Eye,
  ZoomIn
} from "lucide-react";

interface MedicalImage {
  id: string;
  title: string;
  description: string;
  image_type: string;
  image_url: string;
  thumbnail_url: string;
  tooth_numbers: number[];
  annotations: any;
  metadata: any;
  clinic_id: string;
  patient_id: string;
  appointment_id: string;
  created_by: string;
  created_at: string;
  // Patient details from join
  patient_first_name: string;
  patient_last_name: string;
  patient_avatar_url: string;
}

interface ImageDetailsProps {
  image: MedicalImage;
}

export default function ImageDetails({ image }: ImageDetailsProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const getTypeColor = (type: string) => {
    switch (type) {
      case "xray":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "photo":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "scan":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "impression":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "xray":
        return "أشعة سينية";
      case "photo":
        return "صورة فوتوغرافية";
      case "scan":
        return "مسح ضوئي";
      case "impression":
        return "طبعة أسنان";
      default:
        return type;
    }
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "-";
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    if (image.image_url) {
      try {
        const downloadUrl = await getSignedImageUrl(image.image_url) || image.image_url;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = image.title || 'medical-image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading image:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{image.title || "صورة طبية"}</h3>
          <Badge className={getTypeColor(image.image_type)}>
            {getTypeText(image.image_type)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowFullImage(true)} 
            variant="outline" 
            size="sm"
          >
            <Eye className="ml-2 h-4 w-4" />
            عرض
          </Button>
          <Button 
            onClick={() => setShowEditor(true)} 
            variant="outline" 
            size="sm"
          >
            <Edit className="ml-2 h-4 w-4" />
            تحرير
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="ml-2 h-4 w-4" />
            تحميل
          </Button>
        </div>
      </div>

      <Separator />

      {/* Image Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            {image.image_url ? (
              <div className="relative group">
                <img
                  src={image.image_url}
                  alt={image.title || "صورة طبية"}
                  className="max-w-full max-h-96 object-contain rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setShowFullImage(true)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            معلومات المريض
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-reverse space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={image.patient_avatar_url} />
              <AvatarFallback>
                {getPatientInitials(image.patient_first_name, image.patient_last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {image.patient_first_name} {image.patient_last_name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              تاريخ الرفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(image.created_at)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              معلومات الملف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {image.metadata?.file_name && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">اسم الملف:</span>
                <span className="text-sm">{image.metadata.file_name}</span>
              </div>
            )}
            {image.metadata?.file_size && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">حجم الملف:</span>
                <span className="text-sm">{formatFileSize(image.metadata.file_size)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tooth Numbers */}
      {image.tooth_numbers && image.tooth_numbers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-4 w-4" />
              الأسنان المصورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {image.tooth_numbers.map((tooth, index) => (
                <Badge key={index} variant="outline">
                  {tooth}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {image.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              وصف الصورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {image.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Technical Details */}
      {image.metadata && Object.keys(image.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              تفاصيل تقنية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {Object.entries(image.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-screen-xl h-[95vh] w-[98vw] p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <DialogTitle>محرر الصور الطبية - {image.title || "صورة طبية"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <MedicalImageEditor
                imageUrl={image.image_url}
                imageName={image.title}
                onClose={() => setShowEditor(false)}
                onSave={(blob) => {
                  // TODO: Implement save functionality
                  console.log("Saving edited image:", blob);
                  setShowEditor(false);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Size Image Dialog */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{image.title || "صورة طبية"}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={image.image_url}
              alt={image.title || "صورة طبية"}
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}