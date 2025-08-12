import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Heart,
  DollarSign,
  Camera,
  Activity,
  UserCheck,
  Clock,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Network,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut, profile, profileLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRefreshProfile = async () => {
    try {
      await refreshProfile();
    } catch (error) {
      console.error('Error refreshing profile:', error);
      console.error('Error refreshing profile:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const menuItems = [
    { icon: Activity, label: "لوحة التحكم", href: "/" },
    { icon: Calendar, label: "المواعيد", href: "/appointments" },
    { icon: Users, label: "المرضى", href: "/patients" },
    { icon: FileText, label: "العلاجات", href: "/treatments" },
    { icon: Camera, label: "الصور الطبية", href: "/images" },
    { icon: DollarSign, label: "الفواتير", href: "/billing" },
    { icon: UserCheck, label: "الموظفين", href: "/staff" },
    { icon: TrendingUp, label: "التقارير", href: "/reports" },
    { icon: Heart, label: "التواصل", href: "/communication" },
    { icon: ShieldCheck, label: "الموردين", href: "/suppliers" },
    { icon: CreditCard, label: "الاشتراك", href: "/subscription" },
    { icon: Network, label: "المخطط العام", href: "/blueprint" },
    { icon: Settings, label: "الإعدادات", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                دنتال برو 
              </h1>
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
            
            <div className="flex items-center space-x-reverse space-x-4">
              <Badge variant="outline" className="capitalize">
                {profileLoading ? "جاري التحميل..." :
                 profile?.role === 'dentist' ? 'طبيب أسنان' :
                 profile?.role === 'assistant' ? 'مساعد' :
                 profile?.role === 'receptionist' ? 'موظف استقبال' :
                 profile?.role === 'admin' ? 'مدير' :
                 profile?.role === 'supplier' ? 'مورد' :
                 profile?.role || "مستخدم"}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {getInitials(profile?.first_name, profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => navigate('/settings')}>
                     <Settings className="ml-2 h-4 w-4" />
                     <span>الإعدادات</span>
                   </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-reverse space-x-8 overflow-x-auto">
            {menuItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-reverse space-x-2 whitespace-nowrap py-4 px-3 ${
                    location.pathname === item.href ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <span>{item.label}</span>
                  <item.icon className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}