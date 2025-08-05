import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Eye, RefreshCw } from 'lucide-react';

interface SubscriptionWithProfile {
  id: string;
  plan: string;
  status: string;
  amount_iqd: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  clinic_id: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  }[];
  clinics: {
    name: string;
  } | null;
}

const SuperAdminSubscriptions = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionWithProfile | null>(null);
  const [editForm, setEditForm] = useState({
    plan: '',
    status: '',
    current_period_end: ''
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles!inner(first_name, last_name, email),
          clinics(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب بيانات الاشتراكات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleEditSubscription = (subscription: SubscriptionWithProfile) => {
    setEditingSubscription(subscription);
    setEditForm({
      plan: subscription.plan,
      status: subscription.status,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end).toISOString().split('T')[0] : ''
    });
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscription) return;

    try {
      const updateData: any = {
        plan: editForm.plan,
        status: editForm.status
      };

      if (editForm.current_period_end) {
        updateData.current_period_end = new Date(editForm.current_period_end).toISOString();
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', editingSubscription.id);

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات الاشتراك بنجاح",
      });

      setEditingSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الاشتراك",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      approved: { label: 'مُفعَّل', className: 'bg-green-100 text-green-800' },
      pending: { label: 'قيد المراجعة', className: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'مرفوض', className: 'bg-red-100 text-red-800' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planMap = {
      basic: { label: 'أساسي', className: 'bg-blue-100 text-blue-800' },
      premium: { label: 'احترافي', className: 'bg-purple-100 text-purple-800' },
      enterprise: { label: 'مؤسسي', className: 'bg-gold-100 text-gold-800' }
    };

    const planInfo = planMap[plan as keyof typeof planMap] || { label: plan, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={planInfo.className}>
        {planInfo.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إدارة الاشتراكات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              إدارة جميع اشتراكات المستخدمين
            </p>
          </div>
          <Button onClick={fetchSubscriptions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الاشتراكات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">المستخدم</th>
                    <th className="text-right p-2">البريد الإلكتروني</th>
                    <th className="text-right p-2">العيادة</th>
                    <th className="text-right p-2">الخطة</th>
                    <th className="text-right p-2">الحالة</th>
                    <th className="text-right p-2">تاريخ الانتهاء</th>
                    <th className="text-right p-2">المبلغ (د.ع)</th>
                    <th className="text-right p-2">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b">
                      <td className="p-2">
                        {subscription.profiles?.[0]?.first_name} {subscription.profiles?.[0]?.last_name}
                      </td>
                      <td className="p-2">{subscription.profiles?.[0]?.email}</td>
                      <td className="p-2">{subscription.clinics?.name || 'لا توجد عيادة'}</td>
                      <td className="p-2">{getPlanBadge(subscription.plan)}</td>
                      <td className="p-2">{getStatusBadge(subscription.status)}</td>
                      <td className="p-2">
                        {subscription.current_period_end ? 
                          new Date(subscription.current_period_end).toLocaleDateString('ar-IQ') : 
                          'غير محدد'
                        }
                      </td>
                      <td className="p-2">{subscription.amount_iqd.toLocaleString()}</td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSubscription(subscription)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {subscriptions.length === 0 && !loading && (
                <div className="text-center p-8 text-gray-500">
                  لا توجد اشتراكات
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Subscription Dialog */}
        <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الاشتراك</DialogTitle>
              <DialogDescription>
                تعديل بيانات اشتراك {editingSubscription?.profiles?.[0]?.first_name} {editingSubscription?.profiles?.[0]?.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan">الخطة</Label>
                <Select value={editForm.plan} onValueChange={(value) => setEditForm(prev => ({ ...prev, plan: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">أساسي</SelectItem>
                    <SelectItem value="premium">احترافي</SelectItem>
                    <SelectItem value="enterprise">مؤسسي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">مُفعَّل</SelectItem>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="end_date">تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={editForm.current_period_end}
                  onChange={(e) => setEditForm(prev => ({ ...prev, current_period_end: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingSubscription(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpdateSubscription}>
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminSubscriptions;