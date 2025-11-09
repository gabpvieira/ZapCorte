import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Barbershop from "./pages/Barbershop";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import BarbershopSettings from "./pages/BarbershopSettings";
import Plan from "./pages/Plan";
import MyAppointments from "./pages/MyAppointments";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    OneSignal: any;
  }
}

const queryClient = new QueryClient();

// Componente de fallback visual para autenticação
const AuthFallback = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuário...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Usuário não autenticado</p>
          <a href="/login" className="text-primary hover:underline">Fazer login</a>
        </div>
      </div>
    );
  }
  
  return null;
};

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // Show navbar only on landing page (home)
  const isHomePage = location.pathname === "/";

  // Initialize OneSignal and persist player_id for logged barber
  useEffect(() => {
    if (!user || loading) return;
    
    // OneSignal v16+ initialization via Deferred
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        notifyButton: { enable: false },
      });
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
  }, [user, loading]);

  // Mostrar fallback visual se estiver carregando ou usuário não autenticado
  if (loading || !user) {
    return <AuthFallback />;
  }

  return (
    <>
      {isHomePage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/barbershop/:slug" element={<Barbershop />} />
        <Route path="/booking/:slug/:serviceId" element={<Booking />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        {/* Dashboard and nested sections */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/services" element={<Services />} />
        <Route path="/dashboard/appointments" element={<Appointments />} />
        <Route path="/dashboard/barbershop" element={<BarbershopSettings />} />
        <Route path="/dashboard/plan" element={<Plan />} />

        {/* Legacy paths (optional) */}
        <Route path="/services" element={<Services />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
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
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
