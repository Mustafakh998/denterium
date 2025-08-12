import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PendingPayment {
  id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  status: string;
  payment_reference: string | null;
  due_date: string | null;
  description: string | null;
  created_at: string;
  dentist: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  order: {
    order_number: string | null;
    total_amount: number;
  } | null;
}

export default function PendingPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPendingPayments();
    }
  }, [user]);

  const fetchPendingPayments = async () => {
    try {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!supplierData) return;

      const { data, error } = await supabase
        .from('supplier_pending_payments')
        .select(`
          *,
          dentist:profiles!dentist_id(first_name, last_name, email),
          order:supplier_orders(order_number, total_amount)
        `)
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data as unknown as PendingPayment[]) || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      setUpdating(true);
      
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.paid_at = new Date().toISOString();
        updateData.payment_reference = paymentReference;
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('supplier_pending_payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Payment status updated to ${status}`,
      });

      fetchPendingPayments();
      setSelectedPayment(null);
      setPaymentReference('');
      setNotes('');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary' as const;
      case 'processing':
        return 'default' as const;
      case 'completed':
        return 'default' as const;
      case 'failed':
      case 'cancelled':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalProcessing = payments
    .filter(p => p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pending Payments</h2>
        <p className="text-muted-foreground">Track payments from dentists and customers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending.toLocaleString()} IQD</div>
            <p className="text-xs text-muted-foreground">
              {payments.filter(p => p.status === 'pending').length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcessing.toLocaleString()} IQD</div>
            <p className="text-xs text-muted-foreground">
              {payments.filter(p => p.status === 'processing').length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Requests
          </CardTitle>
          <CardDescription>Manage incoming payment requests from dentists</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending payments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dentist</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.dentist?.first_name} {payment.dentist?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.dentist?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {payment.amount.toLocaleString()} {payment.currency}
                      </div>
                      {payment.payment_method && (
                        <div className="text-sm text-muted-foreground">
                          via {payment.payment_method}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.order ? (
                        <div>
                          <p className="font-medium">{payment.order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.order.total_amount.toLocaleString()} IQD
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.due_date ? (
                        new Date(payment.due_date).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(payment.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Payment Details</DialogTitle>
                            <DialogDescription>
                              Manage payment from {payment.dentist?.first_name} {payment.dentist?.last_name}
                            </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Payment Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Amount:</span>
                                    <span className="font-medium">
                                      {payment.amount.toLocaleString()} {payment.currency}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Status:</span>
                                    <Badge variant={getStatusVariant(payment.status)}>
                                      {payment.status}
                                    </Badge>
                                  </div>
                                  {payment.description && (
                                    <div>
                                      <span className="block mb-1">Description:</span>
                                      <p className="text-muted-foreground">{payment.description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {payment.status === 'pending' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Payment Reference (Optional)</label>
                                    <Input
                                      value={paymentReference}
                                      onChange={(e) => setPaymentReference(e.target.value)}
                                      placeholder="Enter payment reference"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Notes (Optional)</label>
                                    <Textarea
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Add notes about this payment"
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => updatePaymentStatus(payment.id, 'processing')}
                                      disabled={updating}
                                      variant="outline"
                                      size="sm"
                                    >
                                      Mark as Processing
                                    </Button>
                                    <Button
                                      onClick={() => updatePaymentStatus(payment.id, 'completed')}
                                      disabled={updating}
                                      size="sm"
                                    >
                                      Mark as Paid
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {payment.status === 'processing' && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => updatePaymentStatus(payment.id, 'completed')}
                                    disabled={updating}
                                    size="sm"
                                  >
                                    Mark as Completed
                                  </Button>
                                  <Button
                                    onClick={() => updatePaymentStatus(payment.id, 'failed')}
                                    disabled={updating}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    Mark as Failed
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}