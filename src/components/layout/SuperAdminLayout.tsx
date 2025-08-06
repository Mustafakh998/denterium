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
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Building,
  CreditCard,
  Settings,
  LogOut,
  BarChart3,
  Activity,
  Database,
  UserCheck,
  DollarSign,
} from "lucide-react";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const menuItems = [
    { icon: Activity, label: "لوحة التحكم", href: "/super-admin-dashboard" },
    { icon: Users, label: "إدارة المستخدمين", href: "/super-admin/users" },
    { icon: Building, label: "إدارة العيادات", href: "/super-admin/clinics" },
    { icon: CreditCard, label: "إدارة المدفوعات", href: "/super-admin/payments" },
    { icon: DollarSign, label: "إدارة الاشتراكات", href: "/super-admin/subscriptions" },
    { icon: BarChart3, label: "التقارير والإحصائيات", href: "/super-admin/reports" },
    { icon: Database, label: "إدارة البيانات", href: "/super-admin/data" },
    { icon: Settings, label: "إعدادات النظام", href: "/super-admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">
                لوحة الإدارة العامة - دنتال برو
              </h1>
            </div>
            
            <div className="flex items-center space-x-reverse space-x-4">
              <Badge className="bg-red-500/20 text-red-200 border-red-400/30">
                مدير عام
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full text-white hover:bg-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white">
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
                  <DropdownMenuItem onClick={() => navigate('/super-admin/settings')}>
                    <Settings className="ml-2 h-4 w-4" />
                    <span>إعدادات النظام</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    <UserCheck className="ml-2 h-4 w-4" />
                    <span>الموقع الرئيسي</span>
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
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-reverse space-x-8 overflow-x-auto">
            {menuItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-reverse space-x-2 whitespace-nowrap py-4 px-3 text-white hover:bg-white/10 ${
                    location.pathname === item.href ? 'bg-white/20 text-blue-200' : ''
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