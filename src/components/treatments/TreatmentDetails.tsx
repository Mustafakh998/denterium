import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  Circle, 
  User, 
  Clock,
  CheckCircle,
  CreditCard,
  Shield
} from "lucide-react";

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
  created_at: string;
  updated_at: string;
  // Patient details from join
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_avatar_url: string;
}

interface TreatmentDetailsProps {
  treatment: Treatment;
}

export default function TreatmentDetails({ treatment }: TreatmentDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "planned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل";
      case "in_progress":
        return "قيد التنفيذ";
      case "planned":
        return "مخطط";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount || 0);
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

  const remainingBalance = (treatment.cost || 0) - (treatment.patient_paid || 0) - (treatment.insurance_covered || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{treatment.treatment_name}</h3>
          {treatment.treatment_code && (
            <p className="text-sm text-muted-foreground">رمز العلاج: {treatment.treatment_code}</p>
          )}
        </div>
        <Badge className={getStatusColor(treatment.status)}>
          {getStatusText(treatment.status)}
        </Badge>
      </div>

      <Separator />

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
              <AvatarImage src={treatment.patient_avatar_url} />
              <AvatarFallback>
                {getPatientInitials(treatment.patient_first_name, treatment.patient_last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {treatment.patient_first_name} {treatment.patient_last_name}
              </p>
              <p className="text-sm text-muted-foreground">{treatment.patient_phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              التواريخ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">تاريخ العلاج:</span>
              <span className="text-sm">{formatDate(treatment.treatment_date)}</span>
            </div>
            {treatment.completion_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">تاريخ الإكمال:</span>
                <span className="text-sm">{formatDate(treatment.completion_date)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span>
              <span className="text-sm">{formatDate(treatment.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              التفاصيل المالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">التكلفة الإجمالية:</span>
              <span className="text-sm font-medium">{formatCurrency(treatment.cost || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">المبلغ المدفوع:</span>
              <span className="text-sm text-green-600">{formatCurrency(treatment.patient_paid || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">التأمين الصحي:</span>
              <span className="text-sm text-blue-600">{formatCurrency(treatment.insurance_covered || 0)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">المتبقي:</span>
              <span className={`text-sm font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tooth Numbers */}
      {treatment.tooth_numbers && treatment.tooth_numbers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-4 w-4" />
              الأسنان المعالجة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {treatment.tooth_numbers.map((tooth, index) => (
                <Badge key={index} variant="outline">
                  {tooth}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {treatment.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              وصف العلاج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {treatment.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {treatment.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ملاحظات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {treatment.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}