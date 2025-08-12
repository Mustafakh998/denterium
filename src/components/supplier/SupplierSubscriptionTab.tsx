import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ensureSupplierExists } from "@/utils/supplier";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Crown, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FibPaymentDialog } from "@/components/billing/FibPaymentDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SupplierSubscriptionRow {
  id: string;
  supplier_id: string | null;
  plan: "basic" | "premium" | "enterprise" | string;
  status: string;
  amount_iqd: number;
  amount_usd: number;
  payment_method: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

const supplierPrices = {
  basic: 20000,
  premium: 40000,
  enterprise: 60000,
} as const;

const getPlanDisplayName = (plan: string) => {
  const map: Record<string, string> = {
    basic: "Basic",
    premium: "Premium",
    enterprise: "Enterprise",
  };
  return map[plan] || plan;
};

const getUpgradePrice = (currentPlan: string | null, targetPlan: keyof typeof supplierPrices) => {
  if (!currentPlan || !(currentPlan in supplierPrices)) return supplierPrices[targetPlan];
  const current = supplierPrices[currentPlan as keyof typeof supplierPrices] || 0;
  const target = supplierPrices[targetPlan];
  return Math.max(0, target - current);
};

export default function SupplierSubscriptionTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SupplierSubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const plans = useMemo(() => ([
    {
      id: "basic",
      name: "Basic",
      price: `${supplierPrices.basic.toLocaleString()} IQD`,
      features: [
        "List up to 20 products",
        "Basic supplier dashboard",
        "Order messaging",
      ],
      notIncluded: [
        "Advanced analytics",
        "Priority listing",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: `${supplierPrices.premium.toLocaleString()} IQD`,
      badge: "Most popular",
      features: [
        "Up to 200 products",
        "Analytics",
        "Priority listing",
        "Bulk inventory tools",
      ],
      notIncluded: [
        "Dedicated support",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: `${supplierPrices.enterprise.toLocaleString()} IQD`,
      badge: "Best value",
      features: [
        "Unlimited products",
        "All premium features",
        "Dedicated support",
      ],
      notIncluded: [],
    },
  ]), []);

  const fetchSubscription = async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const id = await ensureSupplierExists(supabase, user);
      setSupplierId(id);
      if (!id) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('supplier_id', id)
        .neq('status', 'pending')
        .neq('status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching supplier subscription:', error);
        setSubscription(null);
        return;
      }

      setSubscription((data as SupplierSubscriptionRow) || null);
    } catch (e) {
      console.error('Error fetching supplier subscription', e);
      setSubscription(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const getStatusBadge = () => {
    if (!subscription) return <Badge variant="outline">Not active</Badge>;
    return (
      <Badge className="bg-green-500/20 text-green-900 dark:text-green-200 border-green-500/30">
        <Crown className="h-3 w-3 mr-1" /> Active
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Subscription</h1>
          <p className="text-muted-foreground">Manage your supplier plan and payments</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={fetchSubscription} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {getStatusBadge()}
        </div>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Your active subscription
            </CardTitle>
            <CardDescription>Plan and billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <p className="font-semibold text-lg">{getPlanDisplayName(subscription.plan)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount paid</p>
                <p className="font-semibold text-lg">{subscription.amount_iqd?.toLocaleString()} IQD</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment method</p>
                <p className="font-medium">{subscription.payment_method?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires on</p>
                <p className="font-medium">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4">
              <p className="text-sm text-muted-foreground">Subscribed on: {new Date(subscription.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan === plan.id;
          const canUpgrade = subscription && !isCurrent && (Object.keys(supplierPrices).indexOf(subscription.plan) < Object.keys(supplierPrices).indexOf(plan.id));
          const upgradeAmount = subscription ? getUpgradePrice(subscription.plan, plan.id as keyof typeof supplierPrices) : 0;

          return (
            <Card key={plan.id} className={`relative ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
              {isCurrent && (
                <Badge className="absolute -top-2 right-4 bg-primary">Current plan</Badge>
              )}
              {plan.badge && !isCurrent && (
                <Badge className="absolute -top-2 right-4">{plan.badge}</Badge>
              )}
              <CardHeader>
                <CardTitle className="text-center">{plan.name}</CardTitle>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{plan.price}</div>
                  {canUpgrade && upgradeAmount > 0 && (
                    <div className="text-sm text-orange-600 font-medium mt-1">
                      Upgrade for {upgradeAmount.toLocaleString()} IQD only
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f, i) => (
                    <li key={`not-${i}`} className="flex items-center gap-2 opacity-60">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <p className="text-green-700 dark:text-green-300 font-medium">This is your current plan</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FibPaymentDialog
                      planId={plan.id}
                      planName={plan.name}
                      price={canUpgrade ? upgradeAmount : supplierPrices[plan.id as keyof typeof supplierPrices]}
                      isUpgrade={canUpgrade}
                    />
                    <SupplierManualPaymentDialog
                      planId={plan.id}
                      planName={plan.name}
                      price={(canUpgrade ? upgradeAmount : supplierPrices[plan.id as keyof typeof supplierPrices]).toLocaleString() + ' IQD'}
                      supplierId={supplierId}
                    />
                    <div className="mt-4 p-3 bg-muted rounded-md text-center">
                      <p className="text-sm font-medium mb-1">Available payment methods</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>🏛️ First Iraqi Bank (FIB)</p>
                        <p>🟢 Qi Card</p>
                        <p>🟡 Zain Cash</p>
                        <p>🏦 Bank transfer</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SupplierManualPaymentDialog({ planId, planName, price, supplierId }: { planId: string; planName: string; price: string; supplierId: string | null }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qi_card' | 'zain_cash' | 'bank_transfer'>('qi_card');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleManualPayment = async () => {
    if (!user) {
      toast({ title: 'Login required', description: 'Please sign in first', variant: 'destructive' });
      return;
    }
    if (!senderName || !senderPhone || !screenshot) {
      toast({ title: 'Missing information', description: 'Fill all required fields and attach receipt image', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('payment-screenshots').upload(fileName, screenshot);
      if (uploadError) throw uploadError;

      // Create manual payment record
      const numericPrice = parseInt(price.replace(/[^\d]/g, ''));
      const { error: paymentError } = await supabase.from('manual_payments').insert({
        user_id: user.id,
        payment_method: paymentMethod,
        amount_iqd: numericPrice,
        screenshot_url: fileName,
        transaction_reference: transactionRef,
        sender_name: senderName,
        sender_phone: senderPhone,
        notes: notes,
        status: 'pending',
      });
      if (paymentError) throw paymentError;

      // Create a pending subscription tied to supplier to reflect intent immediately
      if (supplierId) {
        await supabase.from('subscriptions').insert({
          supplier_id: supplierId,
          plan: planId as any,
          status: 'pending',
          amount_iqd: numericPrice,
          amount_usd: Math.round(numericPrice / 1316),
          payment_method: paymentMethod,
        });
      }

      toast({ title: 'Payment submitted', description: 'We will review and approve within 24 hours.' });
      setOpen(false);
      setSenderName('');
      setSenderPhone('');
      setTransactionRef('');
      setNotes('');
      setScreenshot(null);
    } catch (e) {
      console.error('Manual supplier payment error', e);
      toast({ title: 'Submission failed', description: 'Could not submit payment', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">Local payment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Local payment - {planName}</DialogTitle>
          <DialogDescription>Price: {price} per month</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Payment method</Label>
            <Select value={paymentMethod} onValueChange={(v: 'qi_card' | 'zain_cash' | 'bank_transfer') => setPaymentMethod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qi_card">Qi Card</SelectItem>
                <SelectItem value="zain_cash">Zain Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sender-name">Sender name</Label>
            <Input id="sender-name" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Full name" />
          </div>

          <div>
            <Label htmlFor="sender-phone">Phone number</Label>
            <Input id="sender-phone" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="07xxxxxxxxx" />
          </div>

          <div>
            <Label htmlFor="transaction-ref">Transaction reference (optional)</Label>
            <Input id="transaction-ref" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="Receipt or reference number" />
          </div>

          <div>
            <Label htmlFor="screenshot">Receipt screenshot</Label>
            <Input id="screenshot" type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <Button onClick={handleManualPayment} disabled={!screenshot || !senderName || !senderPhone || uploading} className="w-full">
            {uploading ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Submitting...</>) : 'Submit payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
