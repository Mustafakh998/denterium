import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2, Smartphone, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentAccount {
  id: string;
  payment_method: string;
  account_number: string;
  account_name: string;
}

interface SupplierPaymentDialogProps {
  supplierId: string;
  supplierName: string;
  orderId?: string;
  amount: number;
  description?: string;
}

export function SupplierPaymentDialog({ 
  supplierId, 
  supplierName, 
  orderId, 
  amount, 
  description = "Payment to supplier" 
}: SupplierPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchPaymentAccounts();
    }
  }, [isOpen, supplierId]);

  const fetchPaymentAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_payment_accounts')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('is_active', true);

      if (error) throw error;
      setPaymentAccounts(data || []);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedAccount) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) throw new Error('User profile not found');

      // For FIB payments, use the existing FIB payment system
      if (selectedAccount.payment_method === 'fib') {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          toast({
            title: "Authentication Error",
            description: "Please log in again",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase.functions.invoke('fib-payment', {
          body: {
            amount: amount,
            description: `${description} - ${supplierName}`,
            supplier_id: supplierId,
            order_id: orderId
          },
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

        if (error) throw error;

        if (data?.success) {
          // Create pending payment record
          await createPendingPayment('fib', data);
          
          toast({
            title: "FIB Payment Initiated",
            description: "Please complete the payment using FIB app",
          });
          
          // You could open FIB payment interface here
          // For now, just show success
          setIsOpen(false);
        }
      } else {
        // For other payment methods, create a pending payment record
        await createPendingPayment(selectedAccount.payment_method);
        
        toast({
          title: "Payment Request Created",
          description: `Please pay ${amount} IQD to ${selectedAccount.account_number} (${getPaymentMethodName(selectedAccount.payment_method)})`,
        });
        
        setIsOpen(false);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPendingPayment = async (paymentMethod: string, fibData?: any) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (!profile) throw new Error('User profile not found');

    const paymentData = {
      supplier_id: supplierId,
      dentist_id: profile.id,
      order_id: orderId,
      amount: amount,
      currency: 'IQD',
      payment_method: paymentMethod,
      payment_account_details: {
        account_number: selectedAccount?.account_number,
        account_name: selectedAccount?.account_name,
        payment_method: paymentMethod,
        fib_data: fibData
      },
      status: 'pending',
      payment_reference: paymentReference,
      description: description,
      notes: notes
    };

    const { error } = await supabase
      .from('supplier_pending_payments')
      .insert(paymentData);

    if (error) throw error;
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'zaincash':
        return 'ZainCash';
      case 'qi_card':
        return 'QI Card';
      case 'fib':
        return 'FIB';
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'zaincash':
        return <Smartphone className="h-4 w-4" />;
      case 'qi_card':
        return <CreditCard className="h-4 w-4" />;
      case 'fib':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <CreditCard className="h-4 w-4 mr-2" />
          Pay Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay {supplierName}</DialogTitle>
          <DialogDescription>
            Choose a payment method and complete your payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount:</span>
              <span className="text-lg font-bold">{amount.toLocaleString()} IQD</span>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {paymentAccounts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                This supplier hasn't configured any payment methods yet.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={selectedAccount?.id || ''}
                  onValueChange={(value) => {
                    const account = paymentAccounts.find(acc => acc.id === value);
                    setSelectedAccount(account || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(account.payment_method)}
                          <span>{getPaymentMethodName(account.payment_method)}</span>
                          <span className="text-muted-foreground">
                            ({account.account_number})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAccount && selectedAccount.payment_method !== 'fib' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Payment Instructions:</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Send {amount.toLocaleString()} IQD to {selectedAccount.account_number} using {getPaymentMethodName(selectedAccount.payment_method)}
                    {selectedAccount.account_name && ` (${selectedAccount.account_name})`}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Payment Reference (Optional)</Label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter payment reference"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this payment"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handlePayment} 
                disabled={isLoading || !selectedAccount}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {selectedAccount && getPaymentMethodIcon(selectedAccount.payment_method)}
                    <span className="ml-2">
                      {selectedAccount?.payment_method === 'fib' 
                        ? 'Pay with FIB' 
                        : 'Create Payment Request'
                      }
                    </span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}