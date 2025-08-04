import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, Phone, FileText, Stethoscope, Edit } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface AppointmentDetailsProps {
  appointment: {
    id: string;
    patient_id: string | null;
    appointment_date: string;
    duration_minutes: number | null;
    status: string | null;
    chief_complaint: string | null;
    treatment_type: string | null;
    notes: string | null;
    patients?: {
      first_name: string;
      last_name: string;
      phone: string | null;
    } | null;
  };
  onEdit: () => void;
}

export const AppointmentDetails = ({ appointment, onEdit }: AppointmentDetailsProps) => {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'no-show': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'scheduled': return 'مجدول';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      case 'no-show': return 'لم يحضر';
      default: return 'غير محدد';
    }
  };

  const getTreatmentTypeText = (type: string | null) => {
    switch (type) {
      case 'consultation': return 'استشارة';
      case 'cleaning': return 'تنظيف أسنان';
      case 'filling': return 'حشو أسنان';
      case 'root_canal': return 'علاج جذور';
      case 'extraction': return 'خلع أسنان';
      case 'crown': return 'تركيب تاج';
      case 'orthodontics': return 'تقويم أسنان';
      case 'whitening': return 'تبييض أسنان';
      case 'implant': return 'زراعة أسنان';
      case 'other': return 'أخرى';
      default: return type || 'غير محدد';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {appointment.patients ? 
              `${appointment.patients.first_name} ${appointment.patients.last_name}` : 
              'مريض غير محدد'
            }
          </h2>
          <Badge className={getStatusColor(appointment.status)}>
            {getStatusText(appointment.status)}
          </Badge>
        </div>
        <Button onClick={onEdit} variant="outline">
          <Edit className="ml-2 h-4 w-4" />
          تعديل
        </Button>
      </div>

      <Separator />

      {/* Appointment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">معلومات الموعد</h3>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">التاريخ</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(appointment.appointment_date), 'dd MMMM yyyy', { locale: ar })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">الوقت</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(appointment.appointment_date), 'HH:mm')}
                {appointment.duration_minutes && ` (${appointment.duration_minutes} دقيقة)`}
              </p>
            </div>
          </div>

          {appointment.treatment_type && (
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">نوع العلاج</p>
                <p className="text-sm text-muted-foreground">
                  {getTreatmentTypeText(appointment.treatment_type)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">معلومات المريض</h3>
          
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">الاسم</p>
              <p className="text-sm text-muted-foreground">
                {appointment.patients ? 
                  `${appointment.patients.first_name} ${appointment.patients.last_name}` : 
                  'غير محدد'
                }
              </p>
            </div>
          </div>

          {appointment.patients?.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">رقم الهاتف</p>
                <p className="text-sm text-muted-foreground direction-ltr text-right">
                  {appointment.patients.phone}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Section */}
      {(appointment.chief_complaint || appointment.notes) && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">التفاصيل</h3>
            
            {appointment.chief_complaint && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">الشكوى الرئيسية</p>
                </div>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {appointment.chief_complaint}
                </p>
              </div>
            )}

            {appointment.notes && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">ملاحظات</p>
                </div>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};