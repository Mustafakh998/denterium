import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  amount_iqd: number;
  amount_usd: number;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_method: string;
  created_at: string;
}

export const useSubscription = () => {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      let subscriptionData = null;

      // Check by clinic_id if user has a clinic
      if (profile.clinic_id) {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('clinic_id', profile.clinic_id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        subscriptionData = data;
      } 
      
      if (!subscriptionData) {
        // Check if user has approved subscription via manual payment
        const { data: subscriptionViaPayment } = await supabase
          .from('subscriptions')
          .select('*, manual_payments!inner(user_id)')
          .eq('manual_payments.user_id', profile.user_id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        subscriptionData = subscriptionViaPayment;

        // If still no subscription found, check manual payments directly
        if (!subscriptionData) {
          const { data: manualPayment } = await supabase
            .from('manual_payments')
            .select('*')
            .eq('user_id', profile.user_id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (manualPayment) {
            // Convert manual payment to subscription format
            subscriptionData = {
              id: manualPayment.id,
              plan: manualPayment.amount_iqd >= 30000 ? 'enterprise' : 
                    manualPayment.amount_iqd >= 20000 ? 'premium' : 'basic',
              status: 'approved',
              amount_iqd: manualPayment.amount_iqd,
              amount_usd: Math.round(manualPayment.amount_iqd / 1316),
              current_period_start: manualPayment.created_at,
              current_period_end: null,
              payment_method: manualPayment.payment_method,
              created_at: manualPayment.created_at,
              clinic_id: manualPayment.clinic_id
            };
          }
        }
      }
      
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [profile]);

  // Set up real-time subscription for payment status changes
  useEffect(() => {
    if (!profile?.user_id) return;

    const channel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manual_payments',
          filter: `user_id=eq.${profile.user_id}`
        },
        (payload) => {
          console.log('Manual payment updated:', payload);
          // Refetch subscription when payment status changes
          fetchSubscription();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions'
        },
        (payload) => {
          console.log('Subscription updated:', payload);
          // Check if this subscription affects current user
          const newData = payload.new as any;
          if (newData?.clinic_id === profile.clinic_id) {
            fetchSubscription();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id, profile?.clinic_id, fetchSubscription]);

  return {
    subscription,
    loading,
    refetch: fetchSubscription,
    hasActiveSubscription: !!subscription,
  };
};