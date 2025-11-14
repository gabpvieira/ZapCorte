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
import ConfirmarEmail from "./pages/ConfirmarEmail";
import EmailConfirmado from "./pages/EmailConfirmado";
import AuthConfirm from "./pages/AuthConfirm";
import AuthCallback from "./pages/AuthCallback";
import AuthVerify from "./pages/AuthVerify";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useReminderScheduler } from "@/hooks/useReminderScheduler";
import ScrollToTop from "@/components/ScrollToTop";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

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

  // Registrar Service Worker para notificações
  useEffect(() => {
    if ('serviceWorker' in navigator && !isHomePage) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Erro silenciado
      });
    }
  }, [isHomePage]);

  return (
    <>
      <ScrollToTop />
      <PWAInstallPrompt />
      <Routes>
        {/* Rota inicial - Landing page para web, redireciona apenas no PWA */}
        <Route 
          path="/" 
          element={
            loading ? (
              <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              </div>
            ) : (() => {
              // Detectar se está rodando como PWA
              const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
              
              // Se for PWA, redirecionar para dashboard/login
              if (isPWA) {
                return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
              }
              
              // Se for web normal, mostrar landing page
              return <Home />;
            })()
          } 
        />
        
        {/* Landing page também acessível via /home */}
        <Route path="/home" element={<Home />} />
        
        {/* Rotas públicas - não precisam de autenticação */}
        <Route path="/barbershop/:slug" element={<Barbershop />} />
        <Route path="/booking/:slug/:serviceId" element={<Booking />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
        
        {/* Rotas de confirmação de email e redefinição de senha */}
        <Route path="/confirmar-email" element={<ConfirmarEmail />} />
        <Route path="/email-confirmado" element={<EmailConfirmado />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/verify" element={<AuthVerify />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        
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
