import React from 'react';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureProtectionProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureProtection: React.FC<FeatureProtectionProps> = ({
  feature,
  children,
  fallback
}) => {
  const { checkFeatureAccess, showUpgradeMessage, subscriptionPlan, loading } = useSubscriptionFeatures();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  const hasAccess = checkFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getUpgradeInfo = () => {
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

    const displayName = featureDisplayNames[feature] || feature;
    const currentPlan = subscriptionPlan === 'basic' ? 'Basic' : subscriptionPlan === 'premium' ? 'Professional' : 'Enterprise';
    const recommendedPlan = subscriptionPlan === 'basic' ? 'Professional' : 'Enterprise';
    
    return { displayName, currentPlan, recommendedPlan };
  };

  const { displayName, currentPlan, recommendedPlan } = getUpgradeInfo();

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4">
          {recommendedPlan === 'Professional' ? (
            <Crown className="h-12 w-12 text-yellow-500" />
          ) : (
            <Zap className="h-12 w-12 text-purple-500" />
          )}
        </div>
        <div className="mb-4">
          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ميزة محظورة
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            تحتاج إلى ترقية اشتراكك لاستخدام <strong>{displayName}</strong>
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              الخطة الحالية: <span className="font-medium">{currentPlan}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              الخطة المطلوبة: <span className="font-medium text-green-600">{recommendedPlan}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button
            onClick={() => navigate('/subscription')}
            className="flex-1"
          >
            ترقية الاشتراك
          </Button>
          <Button
            variant="outline"
            onClick={() => showUpgradeMessage(feature)}
            className="flex-1"
          >
            تفاصيل أكثر
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface LimitProtectionProps {
  featureName: string;
  currentCount: number;
  children: React.ReactNode;
}

export const LimitProtection: React.FC<LimitProtectionProps> = ({
  featureName,
  currentCount,
  children
}) => {
  const { limits, showLimitReachedMessage, subscriptionPlan } = useSubscriptionFeatures();
  const navigate = useNavigate();

  const getLimit = () => {
    switch (featureName) {
      case 'max_patients':
        return limits.maxPatients;
      case 'max_appointments_per_month':
        return limits.maxAppointments;
      case 'max_staff':
        return limits.maxStaff;
      default:
        return null;
    }
  };

  const limit = getLimit();
  
  // If unlimited (null) or under limit, allow access
  if (!limit || currentCount < limit) {
    return <>{children}</>;
  }

  const featureDisplayNames: Record<string, string> = {
    'max_patients': 'المرضى',
    'max_appointments_per_month': 'المواعيد الشهرية',
    'max_staff': 'أعضاء الفريق'
  };

  const displayName = featureDisplayNames[featureName] || featureName;

  return (
    <Card className="border-2 border-dashed border-orange-300 dark:border-orange-600">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4">
          <div className="relative">
            <Lock className="h-12 w-12 text-orange-500" />
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              !
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            تم الوصول للحد الأقصى
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            لقد وصلت للحد الأقصى المسموح من {displayName}
          </p>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-700 dark:text-orange-400">
              الحد الحالي: <span className="font-bold">{currentCount} / {limit}</span>
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              الخطة الحالية: <span className="font-medium">{subscriptionPlan}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button
            onClick={() => navigate('/subscription')}
            className="flex-1"
          >
            ترقية الاشتراك
          </Button>
          <Button
            variant="outline"
            onClick={() => showLimitReachedMessage(featureName, limit)}
            className="flex-1"
          >
            تفاصيل أكثر
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};