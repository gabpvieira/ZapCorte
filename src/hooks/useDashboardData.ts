import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  todayAppointments: number;
  monthAppointments: number;
  totalServices: number;
  planType: string;
  planLimits: {
    maxAppointmentsPerDay: number;
    maxServices: number;
    currentAppointmentsToday: number;
    currentServices: number;
    canCreateAppointment: boolean;
    canCreateService: boolean;
  };
}

interface TodayAppointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled";
  service_id: string;
  service_name?: string;
  service_price?: number;
  service_duration?: number;
}

export function useDashboardData(barbershopId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    monthAppointments: 0,
    totalServices: 0,
    planType: "básico",
    planLimits: {
      maxAppointmentsPerDay: 5,
      maxServices: 4,
      currentAppointmentsToday: 0,
      currentServices: 0,
      canCreateAppointment: true,
      canCreateService: true,
    },
  });
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!barbershopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas - contar agendamentos e serviços
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('created_at, scheduled_at, status')
        .eq('barbershop_id', barbershopId);

      if (appointmentsError) throw appointmentsError;

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id')
        .eq('barbershop_id', barbershopId);

      if (servicesError) throw servicesError;

      // Buscar plano da barbearia
      const { data: barbershopData, error: barbershopError } = await supabase
        .from('barbershops')
        .select('plan_type')
        .eq('id', barbershopId)
        .single();

      if (barbershopError) throw barbershopError;

      // Calcular estatísticas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const todayAppointmentsCount = appointmentsData?.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate >= today && aptDate < tomorrow;
      }).length || 0;

      const monthAppointmentsCount = appointmentsData?.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate >= monthStart;
      }).length || 0;

      // Definir limites baseados no plano
      const planType = barbershopData?.plan_type || 'freemium';
      const maxAppointmentsPerDay = planType === 'freemium' ? 5 : 999;
      const maxServices = planType === 'freemium' ? 4 : 999;
      
      // Mapear nomes de exibição dos planos
      const planDisplayNames: Record<string, string> = {
        'freemium': 'Gratuito',
        'starter': 'Starter',
        'pro': 'PRO'
      };
      const displayPlanType = planDisplayNames[planType] || planType;
      
      setStats({
        todayAppointments: todayAppointmentsCount,
        monthAppointments: monthAppointmentsCount,
        totalServices: servicesData?.length || 0,
        planType: displayPlanType,
        planLimits: {
          maxAppointmentsPerDay,
          maxServices,
          currentAppointmentsToday: todayAppointmentsCount,
          currentServices: servicesData?.length || 0,
          canCreateAppointment: todayAppointmentsCount < maxAppointmentsPerDay,
          canCreateService: (servicesData?.length || 0) < maxServices,
        },
      });

      // Buscar agendamentos de hoje com detalhes
      const { data: todayAppointmentsData, error: todayAppointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services!inner(name, duration, price)
        `)
        .eq('barbershop_id', barbershopId)
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
        .order('scheduled_at', { ascending: true });

      if (todayAppointmentsError) throw todayAppointmentsError;

      // Formatar dados dos agendamentos
      const formattedAppointments = todayAppointmentsData?.map(apt => ({
        ...apt,
        service_name: apt.services?.name || apt.service_name || 'Serviço não encontrado',
        service_duration: apt.services?.duration || apt.service_duration || 0,
        service_price: apt.services?.price || apt.service_price || 0
      })) || [];

      setTodayAppointments(formattedAppointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!barbershopId || !mounted) return;
      await fetchDashboardData();
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [barbershopId, fetchDashboardData]);

  return {
    stats,
    todayAppointments,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}