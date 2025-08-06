import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Shield, AlertTriangle } from "lucide-react";

export default function SuperAdminUserCleanup() {
  const { toast } = useToast();
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const cleanupUsers = async () => {
    setCleaning(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-non-superadmin-users');
      
      if (error) throw error;
      
      setResult(data);
      toast({
        title: "تم تنظيف المستخدمين",
        description: `تم حذف ${data.deleted} مستخدم والحفاظ على ${data.preserved} حساب سوبر أدمن`,
      });
    } catch (error) {
      console.error('Error cleaning users:', error);
      toast({
        title: "خطأ في التنظيف",
        description: "حدث خطأ أثناء تنظيف المستخدمين",
        variant: "destructive",
      });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            تنظيف المستخدمين
          </h1>
          <p className="text-blue-200 mt-2">
            حذف جميع المستخدمين من نظام المصادقة مع الحفاظ على حسابات السوبر أدمن
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              تحذير: عملية خطيرة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <p className="text-yellow-200">
                هذه العملية ستحذف جميع المستخدمين من نظام المصادقة في Supabase عدا حسابات السوبر أدمن.
                هذه العملية لا يمكن التراجع عنها!
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={cleanupUsers}
                disabled={cleaning}
                className="bg-red-500/20 text-red-200 border-red-400/30 hover:bg-red-500/30"
              >
                {cleaning ? (
                  <>
                    <Shield className="h-4 w-4 ml-2 animate-spin" />
                    جاري التنظيف...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 ml-2" />
                    تنظيف المستخدمين
                  </>
                )}
              </Button>
            </div>

            {result && (
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">نتيجة التنظيف:</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-green-200">تم حذف: {result.deleted} مستخدم</p>
                  <p className="text-blue-200">تم الحفاظ على: {result.preserved} سوبر أدمن</p>
                  {result.superAdmins && result.superAdmins.length > 0 && (
                    <div>
                      <p className="text-blue-200 mb-1">حسابات السوبر أدمن المحفوظة:</p>
                      <ul className="list-disc list-inside text-white/80">
                        {result.superAdmins.map((admin: any, index: number) => (
                          <li key={index}>{admin.email}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}