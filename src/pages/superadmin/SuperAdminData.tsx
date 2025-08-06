import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, Download, Trash2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SuperAdminData() {
  const { toast } = useToast();
  const [exportingTable, setExportingTable] = useState<string | null>(null);

  const { data: systemStats } = useQuery({
    queryKey: ['super-admin-data-stats'],
    queryFn: async () => {
      const tables = [
        'clinics', 'profiles', 'patients', 'appointments', 
        'treatments', 'invoices', 'prescriptions', 'medical_images',
        'subscriptions', 'manual_payments', 'products', 'suppliers'
      ] as const;

      const stats = await Promise.all(
        tables.map(async (table) => {
          const { count, error } = await supabase
            .from(table as any)
            .select('*', { count: 'exact', head: true });
          
          return {
            table: table as string,
            count: error ? 0 : count || 0,
            error: error?.message
          };
        })
      );

      return stats;
    }
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['super-admin-recent-activity'],
    queryFn: async () => {
      const activities = [];

      // Recent clinics
      const { data: clinics } = await supabase
        .from('clinics')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Recent profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Recent patients
      const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (clinics) {
        activities.push(...clinics.map(c => ({
          type: 'عيادة جديدة',
          name: c.name,
          date: c.created_at,
          id: c.id
        })));
      }

      if (profiles) {
        activities.push(...profiles.map(p => ({
          type: 'مستخدم جديد',
          name: `${p.first_name} ${p.last_name}`,
          date: p.created_at,
          id: p.id
        })));
      }

      if (patients) {
        activities.push(...patients.map(p => ({
          type: 'مريض جديد',
          name: `${p.first_name} ${p.last_name}`,
          date: p.created_at,
          id: p.id
        })));
      }

      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }
  });

  const exportTableData = async (tableName: string) => {
    setExportingTable(tableName);
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*');

      if (error) throw error;

      const csvContent = convertToCSV(data);
      downloadCSV(csvContent, `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`);

      toast({
        title: "تم تصدير البيانات",
        description: `تم تصدير بيانات جدول ${tableName} بنجاح`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setExportingTable(null);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            إدارة البيانات
          </h1>
          <p className="text-blue-200 mt-2">
            عرض وإدارة جميع بيانات النظام
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="export">تصدير البيانات</TabsTrigger>
            <TabsTrigger value="activity">النشاط الأخير</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemStats?.map((stat) => (
                <Card key={stat.table} className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {stat.table}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {stat.count.toLocaleString()}
                    </div>
                    {stat.error && (
                      <p className="text-red-300 text-xs mt-1">خطأ: {stat.error}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-4">
              {systemStats?.map((stat) => (
                <Card key={stat.table} className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{stat.table}</h3>
                        <p className="text-blue-200 text-sm">{stat.count} سجل</p>
                      </div>
                      <Button
                        onClick={() => exportTableData(stat.table)}
                        disabled={exportingTable === stat.table || stat.count === 0}
                        className="bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30"
                      >
                        {exportingTable === stat.table ? (
                          <>
                            <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                            جاري التصدير...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 ml-2" />
                            تصدير CSV
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">النشاط الأخير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <span className="text-blue-200 text-sm">{activity.type}</span>
                        <p className="text-white">{activity.name}</p>
                      </div>
                      <span className="text-blue-200 text-sm">
                        {new Date(activity.date).toLocaleDateString('ar-IQ')}
                      </span>
                    </div>
                  ))}
                  
                  {!recentActivity || recentActivity.length === 0 && (
                    <p className="text-center text-blue-200 py-4">
                      لا يوجد نشاط حديث
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}