import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Heart,
  Pill,
  AlertTriangle,
  Shield,
  FileText
} from "lucide-react";

interface PatientDetailsProps {
  patient: any;
}

export default function PatientDetails({ patient }: PatientDetailsProps) {
  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "غير محدد";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} سنة`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="text-right">
              <CardTitle className="text-2xl">
                {patient.first_name} {patient.last_name}
              </CardTitle>
              <div className="flex items-center space-x-reverse space-x-2 mt-2">
                <Badge variant="outline">{patient.patient_number}</Badge>
                <Badge variant="secondary">
                  {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : 'غير محدد'}
                </Badge>
                <Badge variant="secondary">{calculateAge(patient.date_of_birth)}</Badge>
              </div>
            </div>
            <Avatar className="h-16 w-16">
              <AvatarImage src={patient.avatar_url} />
              <AvatarFallback className="text-lg">
                {getPatientInitials(patient.first_name, patient.last_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <span>معلومات الاتصال</span>
              <User className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">{patient.phone || "غير محدد"}</p>
              </div>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium">{patient.email || "غير محدد"}</p>
              </div>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-start space-x-reverse space-x-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium">{patient.address || "غير محدد"}</p>
              </div>
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
            </div>
            
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">تاريخ الميلاد</p>
                <p className="font-medium">{formatDate(patient.date_of_birth)}</p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <span>جهة الاتصال للطوارئ</span>
              <AlertTriangle className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">الاسم</p>
              <p className="font-medium">{patient.emergency_contact_name || "غير محدد"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رقم الهاتف</p>
              <p className="font-medium">{patient.emergency_contact_phone || "غير محدد"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <span>المعلومات الطبية</span>
              <Heart className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center space-x-reverse space-x-2 mb-2">
                <span className="text-sm font-medium">الحساسيات</span>
                <Pill className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((allergy: string, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {allergy}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد حساسيات مسجلة</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center space-x-reverse space-x-2 mb-2">
                <span className="text-sm font-medium">الأدوية الحالية</span>
                <Pill className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.medications && patient.medications.length > 0 ? (
                  patient.medications.map((medication: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {medication}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد أدوية مسجلة</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <span>معلومات التأمين</span>
              <Shield className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">شركة التأمين</p>
              <p className="font-medium">{patient.insurance_provider || "غير محدد"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رقم التأمين</p>
              <p className="font-medium">{patient.insurance_number || "غير محدد"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Notes */}
      {patient.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <span>ملاحظات إضافية</span>
              <FileText className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-right leading-relaxed">{patient.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Registration Information */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات التسجيل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ التسجيل:</span>
            <span>{formatDate(patient.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">آخر تحديث:</span>
            <span>{formatDate(patient.updated_at)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}