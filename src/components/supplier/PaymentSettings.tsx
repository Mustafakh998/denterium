import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Smartphone, 
  Building2,
  Plus,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ensureSupplierExists } from '@/utils/supplier';

interface PaymentAccount {
  id: string;
  payment_method: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
}

export default function PaymentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    payment_method: '',
    account_number: '',
    account_name: '',
    is_active: true
  });

  useEffect(() => {
    if (user) {
      fetchSupplierData();
      fetchPaymentAccounts();
    }
  }, [user]);

  const fetchSupplierData = async () => {
    try {
      const supplierId = await ensureSupplierExists(supabase, user);
      if (!supplierId) return;
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .maybeSingle();

      if (error) throw error;
      setSupplier(data);
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    }
  };

  const fetchPaymentAccounts = async () => {
    try {
      const supplierId = await ensureSupplierExists(supabase, user);
      if (!supplierId) return;

      const { data, error } = await supabase
        .from('supplier_payment_accounts')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPaymentAccount = async () => {
    if (!newAccount.payment_method || !newAccount.account_number) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const supplierId = await ensureSupplierExists(supabase, user);
      if (!supplierId) throw new Error('Supplier not found');

      const { error } = await supabase
        .from('supplier_payment_accounts')
        .insert({
          supplier_id: supplierId,
          ...newAccount
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment account added successfully",
      });

      setNewAccount({
        payment_method: '',
        account_number: '',
        account_name: '',
        is_active: true
      });

      fetchPaymentAccounts();
    } catch (error: any) {
      console.error('Error adding payment account:', error);
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "Payment account for this method already exists"
          : "Failed to add payment account",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAccountStatus = async (accountId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('supplier_payment_accounts')
        .update({ is_active: isActive })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Payment account ${isActive ? 'activated' : 'deactivated'}`,
      });

      fetchPaymentAccounts();
    } catch (error) {
      console.error('Error updating account status:', error);
      toast({
        title: "Error",
        description: "Failed to update account status",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('supplier_payment_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment account deleted successfully",
      });

      fetchPaymentAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'zaincash':
        return <Smartphone className="h-5 w-5" />;
      case 'qi_card':
        return <CreditCard className="h-5 w-5" />;
      case 'fib':
        return <Building2 className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
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
        <h2 className="text-2xl font-bold">Payment Settings</h2>
        <p className="text-muted-foreground">
          Configure your payment accounts for receiving payments from dentists
        </p>
      </div>

      {/* Add New Payment Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Payment Account
          </CardTitle>
          <CardDescription>
            Add a new payment method for receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <select
                id="payment_method"
                value={newAccount.payment_method}
                onChange={(e) => setNewAccount(prev => ({ ...prev, payment_method: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select payment method</option>
                <option value="zaincash">ZainCash</option>
                <option value="qi_card">QI Card</option>
                <option value="fib">FIB</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={newAccount.account_number}
                onChange={(e) => setNewAccount(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="Enter account number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name (Optional)</Label>
              <Input
                id="account_name"
                value={newAccount.account_name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="Enter account holder name"
              />
            </div>
          </div>

          <Button 
            onClick={addPaymentAccount} 
            disabled={saving || !newAccount.payment_method || !newAccount.account_number}
          >
            {saving ? 'Adding...' : 'Add Payment Account'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Payment Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Accounts</CardTitle>
          <CardDescription>
            Manage your existing payment accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payment accounts configured</p>
              <p className="text-sm text-muted-foreground">
                Add payment accounts to receive payments from dentists
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account, index) => (
                <div key={account.id}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getPaymentMethodIcon(account.payment_method)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {getPaymentMethodName(account.payment_method)}
                          </h4>
                          <Badge variant={account.is_active ? "default" : "secondary"}>
                            {account.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Account: {account.account_number}</p>
                          {account.account_name && (
                            <p>Name: {account.account_name}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={account.is_active}
                        onCheckedChange={(checked) => updateAccountStatus(account.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAccount(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {index < accounts.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Understanding the payment process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Dentists Browse & Order</h4>
                <p className="text-sm text-muted-foreground">
                  Dentists can browse your products and place orders through the platform
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Payment Request</h4>
                <p className="text-sm text-muted-foreground">
                  You can send payment requests to dentists with your configured payment accounts
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Payment Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Dentists can pay using FIB, ZainCash, or QI Card to your configured accounts
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">Confirmation</h4>
                <p className="text-sm text-muted-foreground">
                  You receive payment notifications and can confirm payments in your dashboard
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
