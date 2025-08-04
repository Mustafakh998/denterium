import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoonFeatures from "@/components/features/ComingSoonFeatures";

export default function Features() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            الميزات والتطويرات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            استكشف الميزات الجديدة القادمة لنظام إدارة العيادة
          </p>
        </div>
        
        <ComingSoonFeatures />
      </div>
    </DashboardLayout>
  );
}