import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DevTools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            أدوات المطور
          </CardTitle>
          <CardDescription>
            أدوات لإدارة النظام والمستخدمين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/create-super-admin')}
              className="h-20 flex flex-col gap-2 bg-red-600 hover:bg-red-700"
            >
              <Shield className="h-6 w-6" />
              إنشاء مدير عام
            </Button>
            
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="h-20 flex flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              تسجيل الدخول
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="h-20 flex flex-col gap-2"
            >
              <Database className="h-6 w-6" />
              لوحة التحكم
            </Button>
            
            <div className="h-20 flex flex-col justify-center text-center text-sm text-muted-foreground border border-dashed rounded-lg">
              <p>أدوات أخرى</p>
              <p>قريباً...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}