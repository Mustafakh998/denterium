import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionFeature {
  feature_name: string;
  is_enabled: boolean;
  feature_limit: number | null;
}

export interface SubscriptionLimits {
  maxPatients: number | null;
  maxAppointments: number | null;
  maxStaff: number | null;
  maxClinics: number;
  hasAdvancedAnalytics: boolean;
  hasMedicalImages: boolean;
  hasPrescriptionManagement: boolean;
  hasCommunicationFeatures: boolean;
  hasBackupRestore: boolean;
  hasAdvancedReports: boolean;
  hasPrioritySupport: boolean;
  hasAdvancedSecurity: boolean;
}

export const useSubscriptionFeatures = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [features, setFeatures] = useState<SubscriptionFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('basic');

  useEffect(() => {
    const fetchFeatures = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }
      
      try {
        let subscription = null;
        
        // If user has clinic_id, check subscription by clinic_id
        if (profile?.clinic_id) {
          const { data: clinicSub } = await supabase
            .from('subscriptions')
            .select('plan, status')
            .eq('clinic_id', profile.clinic_id)
            .eq('status', 'approved')
            .maybeSingle();
          subscription = clinicSub;
        } else {
          // If no clinic_id, check by user profile (for users who subscribed but haven't created clinic yet)
          const { data: userSub } = await supabase
            .from('subscriptions')
            .select('plan, status')
            .is('clinic_id', null)
            .eq('status', 'approved')
            .maybeSingle();
          
          // Also check manual payments for the current user
          const { data: manualPayment } = await supabase
            .from('manual_payments')
            .select('*')
            .eq('user_id', profile?.user_id)
            .eq('status', 'approved')
            .maybeSingle();
            
          subscription = userSub || (manualPayment ? { 
            plan: manualPayment.amount_iqd >= 30000 ? 'enterprise' : 
                  manualPayment.amount_iqd >= 20000 ? 'premium' : 'basic', 
            status: 'approved' 
          } : null);
        }

        const userPlan = subscription?.plan || 'basic';
        setSubscriptionPlan(userPlan);

        // Fetch features for user's plan
        const { data: planFeatures, error } = await supabase
          .from('subscription_features')
          .select('*')
          .eq('plan', userPlan);

        if (error) {
          console.error('Error fetching subscription features:', error);
          // Set default features for basic plan on error
          setFeatures([
            { feature_name: 'max_patients', is_enabled: true, feature_limit: 50 },
            { feature_name: 'max_staff', is_enabled: true, feature_limit: 2 },
            { feature_name: 'max_appointments_per_month', is_enabled: true, feature_limit: 100 }
          ]);
          return;
        }

        setFeatures(planFeatures || []);
      } catch (error) {
        console.error('Error in fetchFeatures:', error);
        // Set default features on error
        setFeatures([
          { feature_name: 'max_patients', is_enabled: true, feature_limit: 50 },
          { feature_name: 'max_staff', is_enabled: true, feature_limit: 2 },
          { feature_name: 'max_appointments_per_month', is_enabled: true, feature_limit: 100 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, [profile]);

  const getFeatureLimits = (): SubscriptionLimits => {
    const getFeature = (name: string) => features.find(f => f.feature_name === name);
    
    return {
      maxPatients: getFeature('max_patients')?.feature_limit || null,
      maxAppointments: getFeature('max_appointments_per_month')?.feature_limit || null,
      maxStaff: getFeature('max_staff')?.feature_limit || null,
      maxClinics: getFeature('max_clinics')?.feature_limit || 1,
      hasAdvancedAnalytics: getFeature('advanced_analytics')?.is_enabled || false,
      hasMedicalImages: getFeature('medical_images')?.is_enabled || false,
      hasPrescriptionManagement: getFeature('prescription_management')?.is_enabled || false,
      hasCommunicationFeatures: getFeature('communication_features')?.is_enabled || false,
      hasBackupRestore: getFeature('backup_restore')?.is_enabled || false,
      hasAdvancedReports: getFeature('advanced_reports')?.is_enabled || false,
      hasPrioritySupport: getFeature('priority_support')?.is_enabled || false,
      hasAdvancedSecurity: getFeature('advanced_security')?.is_enabled || false,
    };
  };

  const checkFeatureAccess = (featureName: string): boolean => {
    const feature = features.find(f => f.feature_name === featureName);
    return feature?.is_enabled || false;
  };

  const showUpgradeMessage = (featureName: string) => {
    const featureDisplayNames: Record<string, string> = {
      'advanced_analytics': 'التحليلات المتقدمة',
      'medical_images': 'الصور الطبية',
      'prescription_management': 'إدارة الوصفات الطبية',
      'communication_features': 'ميزات التواصل',
      'backup_restore': 'النسخ الاحتياطي والاستعادة',
      'advanced_reports': 'التقارير المتقدمة',
      'priority_support': 'الدعم المميز',
      'advanced_security': 'الأمان المتقدم'
    };

    const displayName = featureDisplayNames[featureName] || featureName;
    const upgradeTarget = subscriptionPlan === 'basic' ? 'Professional أو Enterprise' : 'Enterprise';

    toast({
      title: "ترقية الاشتراك مطلوبة",
      description: `لاستخدام ميزة ${displayName} يجب ترقية اشتراكك إلى ${upgradeTarget}`,
      variant: "destructive",
    });
  };

  const checkLimitReached = async (featureName: string, currentCount: number): Promise<boolean> => {
    const feature = features.find(f => f.feature_name === featureName);
    
    if (!feature || !feature.feature_limit) {
      return false; // Unlimited or feature not found
    }

    return currentCount >= feature.feature_limit;
  };

  const showLimitReachedMessage = (featureName: string, limit: number) => {
    const featureDisplayNames: Record<string, string> = {
      'max_patients': 'المرضى',
      'max_appointments_per_month': 'المواعيد الشهرية',
      'max_staff': 'أعضاء الفريق'
    };

    const displayName = featureDisplayNames[featureName] || featureName;

    toast({
      title: "تم الوصول للحد الأقصى",
      description: `لقد وصلت للحد الأقصى المسموح من ${displayName} (${limit}). يرجى ترقية اشتراكك للمزيد.`,
      variant: "destructive",
    });
  };

  return {
    features,
    loading,
    subscriptionPlan,
    limits: getFeatureLimits(),
    checkFeatureAccess,
    showUpgradeMessage,
    checkLimitReached,
    showLimitReachedMessage,
  };
};