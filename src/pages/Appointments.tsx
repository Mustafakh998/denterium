import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Calendar as CalendarIcon, List, Clock, User, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { AddAppointmentForm } from "@/components/appointments/AddAppointmentForm";
import { EditAppointmentForm } from "@/components/appointments/EditAppointmentForm";
import { AppointmentDetails } from "@/components/appointments/AppointmentDetails";

interface Appointment {
  id: string;
  patient_id: string | null;
  dentist_id: string | null;
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
}

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            phone
          )
        `)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    }
  });

  const filteredAppointments = appointments.filter(appointment => {
    const patientName = appointment.patients 
      ? `${appointment.patients.first_name} ${appointment.patients.last_name}`.toLowerCase()
      : '';
    return patientName.includes(searchTerm.toLowerCase()) ||
           appointment.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           appointment.treatment_type?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const todayAppointments = filteredAppointments.filter(appointment => {
    if (!selectedDate) return false;
    const appointmentDate = new Date(appointment.appointment_date);
    return appointmentDate.toDateString() === selectedDate.toDateString();
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'no-show': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">المواعيد</h1>
            <p className="text-muted-foreground">إدارة مواعيد المرضى والجدولة</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة موعد جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة موعد جديد</DialogTitle>
              </DialogHeader>
              <AddAppointmentForm onSuccess={() => {
                setIsAddDialogOpen(false);
                refetch();
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث في المواعيد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المواعيد</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مواعيد اليوم</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(a => a.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ملغية</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(a => a.status === 'cancelled').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarIcon className="ml-2 h-4 w-4" />
              التقويم
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="ml-2 h-4 w-4" />
              القائمة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle>اختر التاريخ</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ar}
                    className="pointer-events-auto"
                  />
                </CardContent>
              </Card>

              {/* Day's Appointments */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      مواعيد {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: ar }) : 'اليوم'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {todayAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                            onClick={() => handleViewAppointment(appointment)}
                          >
                            <div className="space-y-1">
                              <div className="font-medium">
                                {appointment.patients ? 
                                  `${appointment.patients.first_name} ${appointment.patients.last_name}` : 
                                  'مريض غير محدد'
                                }
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(appointment.appointment_date), 'HH:mm')}
                                {appointment.duration_minutes && ` (${appointment.duration_minutes} دقيقة)`}
                              </div>
                              {appointment.chief_complaint && (
                                <div className="text-sm text-muted-foreground">
                                  {appointment.chief_complaint}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status === 'scheduled' && 'مجدول'}
                                {appointment.status === 'completed' && 'مكتمل'}
                                {appointment.status === 'cancelled' && 'ملغي'}
                                {appointment.status === 'no-show' && 'لم يحضر'}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAppointment(appointment);
                                }}
                              >
                                تعديل
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد مواعيد في هذا التاريخ
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>جميع المواعيد</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => handleViewAppointment(appointment)}
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {appointment.patients ? 
                              `${appointment.patients.first_name} ${appointment.patients.last_name}` : 
                              'مريض غير محدد'
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(appointment.appointment_date), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                            {appointment.duration_minutes && ` (${appointment.duration_minutes} دقيقة)`}
                          </div>
                          {appointment.chief_complaint && (
                            <div className="text-sm text-muted-foreground">
                              {appointment.chief_complaint}
                            </div>
                          )}
                          {appointment.patients?.phone && (
                            <div className="text-sm text-muted-foreground">
                              {appointment.patients.phone}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status === 'scheduled' && 'مجدول'}
                            {appointment.status === 'completed' && 'مكتمل'}
                            {appointment.status === 'cancelled' && 'ملغي'}
                            {appointment.status === 'no-show' && 'لم يحضر'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAppointment(appointment);
                            }}
                          >
                            تعديل
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مواعيد
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل الموعد</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <EditAppointmentForm 
              appointment={selectedAppointment}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedAppointment(null);
                refetch();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الموعد</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentDetails 
              appointment={selectedAppointment}
              onEdit={() => {
                setIsDetailsDialogOpen(false);
                setIsEditDialogOpen(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Appointments;