import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  patient_id: z.string().min(1, "يجب اختيار مريض"),
  appointment_date: z.date({
    required_error: "يجب اختيار تاريخ الموعد",
  }),
  appointment_time: z.string().min(1, "يجب اختيار وقت الموعد"),
  duration_minutes: z.number().min(15, "يجب أن تكون المدة 15 دقيقة على الأقل"),
  chief_complaint: z.string().optional(),
  treatment_type: z.string().optional(),
  notes: z.string().optional(),
});

interface AddAppointmentFormProps {
  onSuccess: () => void;
}

export default function AddAppointmentForm({ onSuccess }: AddAppointmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      return data;
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration_minutes: 60,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!profile?.clinic_id) {
      toast({
        title: "خطأ",
        description: "لا يمكن تحديد العيادة، يرجى المحاولة لاحقاً",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = values.appointment_time.split(':').map(Number);
      const appointmentDateTime = new Date(values.appointment_date);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      console.log('Creating appointment with data:', {
        patient_id: values.patient_id,
        clinic_id: profile.clinic_id,
        dentist_id: profile.id,
        appointment_date: appointmentDateTime.toISOString(),
        duration_minutes: values.duration_minutes,
        chief_complaint: values.chief_complaint,
        treatment_type: values.treatment_type,
        notes: values.notes,
        status: 'scheduled',
      });

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: values.patient_id,
          clinic_id: profile.clinic_id,
          dentist_id: profile.id,
          appointment_date: appointmentDateTime.toISOString(),
          duration_minutes: values.duration_minutes,
          chief_complaint: values.chief_complaint,
          treatment_type: values.treatment_type,
          notes: values.notes,
          status: 'scheduled',
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "تم إضافة الموعد بنجاح",
        description: "تم حفظ بيانات الموعد الجديد",
      });
      onSuccess();
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        title: "خطأ في إضافة الموعد",
        description: error.message || "حدث خطأ أثناء إضافة الموعد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المريض</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المريض" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                      {patient.phone && ` (${patient.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="appointment_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الموعد</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMMM yyyy", { locale: ar })
                        ) : (
                          <span>اختر التاريخ</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={ar}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointment_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>وقت الموعد</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="time"
                      {...field}
                      className="pr-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="duration_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>مدة الموعد (بالدقائق)</FormLabel>
              <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدة" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="45">45 دقيقة</SelectItem>
                  <SelectItem value="60">60 دقيقة</SelectItem>
                  <SelectItem value="90">90 دقيقة</SelectItem>
                  <SelectItem value="120">120 دقيقة</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chief_complaint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الشكوى الرئيسية</FormLabel>
              <FormControl>
                <Input {...field} placeholder="وصف مختصر لسبب الزيارة" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="treatment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع العلاج</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع العلاج" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="consultation">استشارة</SelectItem>
                  <SelectItem value="cleaning">تنظيف أسنان</SelectItem>
                  <SelectItem value="filling">حشو أسنان</SelectItem>
                  <SelectItem value="root_canal">علاج جذور</SelectItem>
                  <SelectItem value="extraction">خلع أسنان</SelectItem>
                  <SelectItem value="crown">تركيب تاج</SelectItem>
                  <SelectItem value="orthodontics">تقويم أسنان</SelectItem>
                  <SelectItem value="whitening">تبييض أسنان</SelectItem>
                  <SelectItem value="implant">زراعة أسنان</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="ملاحظات إضافية حول الموعد"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "جاري الحفظ..." : "حفظ الموعد"}
          </Button>
        </div>
      </form>
    </Form>
  );
};