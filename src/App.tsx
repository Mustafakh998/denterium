import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Treatments from "./pages/Treatments";
import MedicalImages from "./pages/MedicalImages";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import Features from "./pages/Features";
import Subscription from "./pages/Subscription";
import AdminPayments from "./pages/AdminPayments";
import AdminUsers from "./pages/AdminUsers";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Communication from "./pages/Communication";
import Inventory from "./pages/Inventory";
import Backup from "./pages/Backup";
import Training from "./pages/Training";
import SupplierDashboard from "./pages/SupplierDashboard";
import Suppliers from "./pages/Suppliers";
import InventoryManagement from "./components/supplier/InventoryManagement";
import OrderManagement from "./components/supplier/OrderManagement";
import PendingPayments from "./components/supplier/PendingPayments";
import PaymentSettings from "./components/supplier/PaymentSettings";
import CreateClinic from "./pages/CreateClinic";
import CreateSuperAdmin from "./pages/CreateSuperAdmin";
import SuperAdminSubscriptions from "./pages/SuperAdminSubscriptions";
import DevTools from "./pages/DevTools";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/images" element={<MedicalImages />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/features" element={<Features />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/training" element={<Training />} />
          <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
          <Route path="/supplier-inventory" element={<InventoryManagement />} />
          <Route path="/supplier-payments" element={<PendingPayments />} />
          <Route path="/supplier-settings" element={<PaymentSettings />} />
          <Route path="/supplier-orders" element={<OrderManagement />} />
           <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/create-clinic" element={<CreateClinic />} />
            <Route path="/create-super-admin" element={<CreateSuperAdmin />} />
            <Route path="/admin/subscriptions" element={<SuperAdminSubscriptions />} />
            <Route path="/dev-tools" element={<DevTools />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
           </BrowserRouter>
         </TooltipProvider>
       </AuthProvider>
     </ThemeProvider>
     </QueryClientProvider>
   </ErrorBoundary>
);

export default App;
