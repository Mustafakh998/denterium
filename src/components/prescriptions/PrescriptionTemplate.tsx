import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Drug {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionTemplateProps {
  prescription: {
    prescription_number: string;
    patient_name: string;
    patient_age: number;
    prescribed_drugs: Drug[];
    notes?: string;
    created_at: string;
  };
  clinic: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
  };
  dentist: {
    first_name: string;
    last_name: string;
    specialization?: string;
    license_number?: string;
  };
}

export default function PrescriptionTemplate({ 
  prescription, 
  clinic, 
  dentist 
}: PrescriptionTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="prescription-template bg-white p-8 max-w-4xl mx-auto" dir="rtl">
      {/* Header with decorative border */}
      <div className="border-4 border-primary/20 rounded-lg p-6 mb-6 bg-gradient-to-br from-primary/5 to-background">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-reverse space-x-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              {clinic.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clinic.logo_url} alt="شعار العيادة" className="h-full w-full object-contain" />
              ) : (
                <span className="text-2xl">🦷</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">{clinic.name}</h1>
              <p className="text-muted-foreground">{clinic.address}</p>
              <div className="flex items-center justify-center space-x-reverse space-x-4 text-sm text-muted-foreground mt-2">
                {clinic.phone && <span>📞 {clinic.phone}</span>}
                {clinic.email && <span>✉️ {clinic.email}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">وصفة طبية</h2>
        <Badge variant="outline" className="text-lg px-4 py-2">
          رقم الوصفة: {prescription.prescription_number}
        </Badge>
      </div>

      {/* Doctor and Patient Information */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-primary mb-3 flex items-center">
              <span className="ml-2">👨‍⚕️</span>
              معلومات الطبيب
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>الاسم:</strong> د. {dentist.first_name} {dentist.last_name}</p>
              {dentist.specialization && (
                <p><strong>التخصص:</strong> {dentist.specialization}</p>
              )}
              {dentist.license_number && (
                <p><strong>رقم الترخيص:</strong> {dentist.license_number}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-primary mb-3 flex items-center">
              <span className="ml-2">👤</span>
              معلومات المريض
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>الاسم:</strong> {prescription.patient_name}</p>
              <p><strong>العمر:</strong> {prescription.patient_age} سنة</p>
              <p><strong>التاريخ:</strong> {formatDate(prescription.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescribed Medications */}
      <Card className="border-primary/20 mb-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center">
            <span className="ml-2">💊</span>
            الأدوية الموصوفة
          </h3>
          
          <div className="space-y-4">
            {prescription.prescribed_drugs.map((drug, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-4 border border-primary/10">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{index + 1}. {drug.name}</h4>
                  <Badge variant="secondary">{drug.dosage}</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  {drug.frequency && (
                    <p><strong>التكرار:</strong> {drug.frequency}</p>
                  )}
                  {drug.duration && (
                    <p><strong>المدة:</strong> {drug.duration}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      {prescription.notes && (
        <Card className="border-primary/20 mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-primary mb-3 flex items-center">
              <span className="ml-2">📝</span>
              ملاحظات إضافية
            </h3>
            <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
              {prescription.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="border-t-2 border-primary/20 pt-6">
        <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold mb-2">تعليمات مهمة:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>يرجى اتباع تعليمات الطبيب بدقة</li>
              <li>لا تتوقف عن تناول الدواء دون استشارة الطبيب</li>
              <li>في حالة أي أعراض جانبية، اتصل بالعيادة فوراً</li>
            </ul>
          </div>
          
          <div className="text-left">
            <div className="border-t border-muted-foreground/20 pt-4 mt-8">
              <p className="mb-2">توقيع الطبيب</p>
              <p className="font-semibold">د. {dentist.first_name} {dentist.last_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .prescription-template {
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}