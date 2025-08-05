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
      
      // Check by clinic_id if user has a clinic
      let query = supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      if (profile.clinic_id) {
        query = query.eq('clinic_id', profile.clinic_id);
      } else {
        query = query.is('clinic_id', null);
      }

      const { data: subscriptionData } = await query.maybeSingle();
      
      if (subscriptionData) {
        setSubscription(subscriptionData);
      } else {
        setSubscription(null);
      }
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

  return {
    subscription,
    loading,
    refetch: fetchSubscription,
    hasActiveSubscription: !!subscription,
  };
};