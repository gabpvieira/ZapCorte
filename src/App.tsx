import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/HomeNew";
import Barbershop from "./pages/Barbershop";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import Customers from "./pages/Customers";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import BarbershopSettings from "./pages/BarbershopSettings";
import Plan from "./pages/Plan";
import MyAppointments from "./pages/MyAppointments";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useReminderScheduler } from "@/hooks/useReminderScheduler";
import ScrollToTop from "@/components/ScrollToTop";

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
    __ONESIGNAL_INIT_DONE?: boolean;
  }
}

const queryClient = new QueryClient();

// Componente para proteger rotas privadas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // Inicializar o scheduler de lembretes
  useReminderScheduler();
  
  // Show navbar only on landing page (home)
  const isHomePage = location.pathname === "/";

  // Initialize OneSignal and persist player_id for logged barber
  useEffect(() => {
    // Evita inicializar na Landing Page
    if (isHomePage) return;
    if (!user || loading) return;
    
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    if (!appId) {
      console.warn('[OneSignal v16] VITE_ONESIGNAL_APP_ID ausente. Pulando inicialização.');
      return;
    }

    // Evita múltiplas inicializações em navegadores, HMR ou re-renders
    if (window.__ONESIGNAL_INIT_DONE) {
      console.log('[OneSignal v16] Já inicializado, não repetindo.');
      return;
    }

    // OneSignal v16+ initialization via Deferred
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      if (window.__ONESIGNAL_INIT_DONE) return;

      await OneSignal.init({
        appId: appId,
        notifyButton: { enable: false },
      });
      window.__ONESIGNAL_INIT_DONE = true;
      console.log('[OneSignal v16] Initialized');

      // Listen for subscription changes
      OneSignal.Notifications.addEventListener('change', async (subscription: any) => {
        if (subscription.token) {
          try {
            const playerId = await OneSignal.User.getId();
            console.log('[OneSignal v16] Player ID:', playerId);

            // Update barbershop with player_id
            const { error } = await supabase
              .from('barbershops')
              .update({ player_id: playerId })
              .eq('id', '54f0a086-a7f7-46b9-bf96-f658940c8ae8'); // Gabriel Barbeiro

            if (error) {
              console.error('[OneSignal v16] Error updating barbershop:', error);
            } else {
              console.log('[OneSignal v16] Player ID saved to barbershop');
            }
          } catch (err) {
            console.error('[OneSignal v16] Error getting player ID:', err);
          }
        }
      });
    });
  }, [user, loading, isHomePage]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Rotas públicas - não precisam de autenticação */}
        <Route path="/" element={<Home />} />
        <Route path="/barbershop/:slug" element={<Barbershop />} />
        <Route path="/booking/:slug/:serviceId" element={<Booking />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rotas protegidas - precisam de autenticação */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/services" 
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/appointments" 
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/customers" 
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/barbershop" 
          element={
            <ProtectedRoute>
              <BarbershopSettings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/whatsapp" 
          element={
            <ProtectedRoute>
              <WhatsAppSettings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/plan" 
          element={
            <ProtectedRoute>
              <Plan />
            </ProtectedRoute>
          } 
        />

        {/* Legacy paths - protegidas */}
        <Route 
          path="/services" 
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirects for common mistyped URLs */}
        <Route path="/plan" element={<Navigate to="/dashboard/plan" replace />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <div className="w-full max-w-full overflow-x-hidden">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
