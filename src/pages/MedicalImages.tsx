import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import AddImageForm from "@/components/images/AddImageForm";
import ImageDetails from "@/components/images/ImageDetails";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Camera,
  Image as ImageIcon,
  Calendar,
  Users,
  FileImage,
  Loader2,
  Grid3X3,
  List,
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

export default function MedicalImages() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<MedicalImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<MedicalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<MedicalImage | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchImages = async () => {
    if (!profile?.clinic_id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("medical_images")
        .select(`
          *,
          patients!inner(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("clinic_id", profile.clinic_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedImages = await Promise.all(data?.map(async (image: any) => {
        // Generate signed URLs for private storage images
        let signedImageUrl = image.image_url;
        let signedThumbnailUrl = image.thumbnail_url;

        // Extract file path from full URL if it's a full URL
        const extractFilePath = (url: string) => {
          if (url?.includes('/storage/v1/object/')) {
            // Extract path after bucket name
            const parts = url.split('/storage/v1/object/public/medical-images/');
            if (parts.length > 1) {
              return parts[1];
            }
            // Try other format
            const parts2 = url.split('/medical-images/');
            if (parts2.length > 1) {
              return parts2[1];
            }
          }
          return url;
        };

        try {
          if (image.image_url && image.image_url.includes('storage/v1/object/')) {
            const filePath = extractFilePath(image.image_url);
            const { data: imageUrlData, error: imageError } = await supabase.storage
              .from('medical-images')
              .createSignedUrl(filePath, 3600); // 1 hour expiry
            
            if (!imageError && imageUrlData?.signedUrl) {
              signedImageUrl = imageUrlData.signedUrl;
            } else {
              console.error('Error creating signed URL for image:', imageError);
            }
          }

          if (image.thumbnail_url && image.thumbnail_url.includes('storage/v1/object/')) {
            const filePath = extractFilePath(image.thumbnail_url);
            const { data: thumbnailUrlData, error: thumbnailError } = await supabase.storage
              .from('medical-images')
              .createSignedUrl(filePath, 3600);
            
            if (!thumbnailError && thumbnailUrlData?.signedUrl) {
              signedThumbnailUrl = thumbnailUrlData.signedUrl;
            } else {
              console.error('Error creating signed URL for thumbnail:', thumbnailError);
            }
          }
        } catch (error) {
          console.error('Error processing image URLs:', error);
        }

        return {
          ...image,
          image_url: signedImageUrl,
          thumbnail_url: signedThumbnailUrl,
          patient_first_name: image.patients?.first_name || "",
          patient_last_name: image.patients?.last_name || "",
          patient_avatar_url: image.patients?.avatar_url || "",
        };
      }) || []);

      setImages(formattedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "خطأ في تحميل الصور",
        description: "حدث خطأ أثناء تحميل الصور الطبية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchImages();
    }
  }, [profile?.clinic_id]);

  const filterImages = () => {
    let filtered = images;

    if (searchTerm.trim()) {
      filtered = filtered.filter((image) =>
        image.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${image.patient_first_name} ${image.patient_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.image_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((image) => image.image_type === selectedType);
    }

    setFilteredImages(filtered);
  };

  useEffect(() => {
    filterImages();
  }, [images, searchTerm, selectedType]);

  const handleImageAdded = () => {
    fetchImages();
    setShowAddDialog(false);
  };

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
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const imageTypes = [
    { value: "all", label: "جميع الأنواع" },
    { value: "xray", label: "أشعة سينية" },
    { value: "photo", label: "صور فوتوغرافية" },
    { value: "scan", label: "مسح ضوئي" },
    { value: "impression", label: "طبعات أسنان" },
  ];

  const totalImages = images.length;
  const xrayImages = images.filter(img => img.image_type === 'xray').length;
  const photoImages = images.filter(img => img.image_type === 'photo').length;
  const thisMonthImages = images.filter(img => {
    const imageDate = new Date(img.created_at);
    const now = new Date();
    return imageDate.getMonth() === now.getMonth() && imageDate.getFullYear() === now.getFullYear();
  }).length;

  // Show no clinic setup message if user has no clinic_id
  if (!loading && !profile?.clinic_id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <ImageIcon className="h-16 w-16 text-gray-400" />
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الصور الطبية</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              إدارة وعرض الصور الطبية والأشعة السينية
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة صورة طبية
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة صورة طبية جديدة</DialogTitle>
              </DialogHeader>
              <AddImageForm onSuccess={handleImageAdded} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الصور</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalImages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الأشعة السينية</CardTitle>
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{xrayImages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الصور الفوتوغرافية</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photoImages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">هذا الشهر</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisMonthImages}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الصور الطبية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {imageTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Images Display */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div 
                  className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                  onClick={() => {
                    setSelectedImage(image);
                    setShowDetailsDialog(true);
                  }}
                >
                  {image.thumbnail_url || image.image_url ? (
                    <img
                      src={image.thumbnail_url || image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{image.title || "بدون عنوان"}</h3>
                      <Badge className={getTypeColor(image.image_type)}>
                        {getTypeText(image.image_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={image.patient_avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getPatientInitials(image.patient_first_name, image.patient_last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {image.patient_first_name} {image.patient_last_name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(image.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="space-y-4 p-6">
                {filteredImages.map((image) => (
                  <div key={image.id} className="flex items-center space-x-reverse space-x-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <div 
                      className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0"
                      onClick={() => {
                        setSelectedImage(image);
                        setShowDetailsDialog(true);
                      }}
                    >
                      {image.thumbnail_url || image.image_url ? (
                        <img
                          src={image.thumbnail_url || image.image_url}
                          alt={image.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{image.title || "بدون عنوان"}</h3>
                        <Badge className={getTypeColor(image.image_type)}>
                          {getTypeText(image.image_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={image.patient_avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getPatientInitials(image.patient_first_name, image.patient_last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {image.patient_first_name} {image.patient_last_name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(image.created_at)}</p>
                      {image.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {image.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(image);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {filteredImages.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد صور طبية
              </h3>
              <p className="text-gray-500 text-center mb-4">
                لم يتم العثور على صور طبية تطابق معايير البحث
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة صورة طبية
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Image Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الصورة الطبية</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <ImageDetails image={selectedImage} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}