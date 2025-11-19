import { supabase } from './supabase';
import { startOfDay, endOfDay } from 'date-fns';

export interface BarberMetrics {
  barberId: string;
  barberName: string;
  barberPhoto: string | null;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  avgTicket: number;
  completionRate: number;
  topServices: Array<{ name: string; count: number; revenue: number }>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Obter métricas de todos os barbeiros de uma barbearia
 */
export async function getBarbersMetrics(
  barbershopId: string,
  dateRange: DateRange
): Promise<BarberMetrics[]> {
  try {
    // Buscar todos os barbeiros ativos
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, name, photo_url')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('display_order');

    if (barbersError) {
      console.error('Erro ao buscar barbeiros:', barbersError);
      throw barbersError;
    }
    
    if (!barbers || barbers.length === 0) {
      console.log('Nenhum barbeiro ativo encontrado');
      return [];
    }

    // Buscar agendamentos no período
    const startDateStr = startOfDay(dateRange.startDate).toISOString();
    const endDateStr = endOfDay(dateRange.endDate).toISOString();
    
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        scheduled_at,
        barber_id,
        service_id,
        services (
          id,
          name,
          price
        )
      `)
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDateStr)
      .lte('scheduled_at', endDateStr)
      .not('barber_id', 'is', null);

    if (appointmentsError) {
      console.error('Erro ao buscar agendamentos:', appointmentsError);
      throw appointmentsError;
    }

    const now = new Date();

    // Processar métricas por barbeiro
    const metrics: BarberMetrics[] = barbers.map(barber => {
      const barberAppointments = appointments?.filter(
        apt => apt.barber_id === barber.id
      ) || [];

      // Concluídos: agendamentos confirmados cujo horário já passou
      const completed = barberAppointments.filter(apt => {
        const scheduledTime = new Date(apt.scheduled_at);
        return apt.status === 'confirmed' && scheduledTime < now;
      });

      // Cancelados: agendamentos com status cancelled
      const cancelled = barberAppointments.filter(
        apt => apt.status === 'cancelled'
      );

      // Calcular faturamento (apenas agendamentos concluídos)
      const totalRevenue = completed.reduce((sum, apt) => {
        return sum + (apt.services?.price || 0);
      }, 0);

      // Calcular ticket médio (faturamento / agendamentos concluídos)
      const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

      // Taxa de conclusão (concluídos / total de agendamentos não cancelados)
      const nonCancelledAppointments = barberAppointments.filter(
        apt => apt.status !== 'cancelled'
      );
      const completionRate = nonCancelledAppointments.length > 0
        ? (completed.length / nonCancelledAppointments.length) * 100
        : 0;

      // Top serviços (baseado em agendamentos concluídos)
      const servicesMap = new Map<string, { count: number; revenue: number }>();
      completed.forEach(apt => {
        if (apt.services) {
          const current = servicesMap.get(apt.services.name) || { count: 0, revenue: 0 };
          servicesMap.set(apt.services.name, {
            count: current.count + 1,
            revenue: current.revenue + (apt.services.price || 0)
          });
        }
      });

      const topServices = Array.from(servicesMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        barberId: barber.id,
        barberName: barber.name,
        barberPhoto: barber.photo_url,
        totalAppointments: barberAppointments.length,
        completedAppointments: completed.length,
        cancelledAppointments: cancelled.length,
        totalRevenue,
        avgTicket,
        completionRate,
        topServices
      };
    });

    return metrics;
  } catch (error) {
    console.error('Erro ao buscar métricas dos barbeiros:', error);
    throw error;
  }
}

/**
 * Obter dados para gráfico temporal (evolução diária)
 */
export async function getBarberTimelineData(
  barbershopId: string,
  dateRange: DateRange
) {
  try {
    const startDateStr = startOfDay(dateRange.startDate).toISOString();
    const endDateStr = endOfDay(dateRange.endDate).toISOString();
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        barber_id,
        barbers (
          id,
          name
        ),
        services (
          price
        )
      `)
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDateStr)
      .lte('scheduled_at', endDateStr)
      .not('barber_id', 'is', null)
      .order('scheduled_at');

    if (error) {
      console.error('Erro ao buscar dados temporais:', error);
      throw error;
    }

    const now = new Date();

    // Agrupar por data e barbeiro
    const dataByDate = new Map<string, Map<string, { appointments: number; revenue: number }>>();

    appointments?.forEach(apt => {
      if (!apt.barbers) return;

      // Extrair apenas a data (YYYY-MM-DD) do timestamp
      const dateKey = apt.scheduled_at.split('T')[0];
      const barberName = apt.barbers.name;

      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, new Map());
      }

      const dateData = dataByDate.get(dateKey)!;
      const current = dateData.get(barberName) || { appointments: 0, revenue: 0 };

      // Considerar como concluído se for confirmed e o horário já passou
      const scheduledTime = new Date(apt.scheduled_at);
      const isCompleted = apt.status === 'confirmed' && scheduledTime < now;

      dateData.set(barberName, {
        appointments: current.appointments + 1,
        revenue: current.revenue + (isCompleted ? (apt.services?.price || 0) : 0)
      });
    });

    // Converter para array
    const timeline = Array.from(dataByDate.entries()).map(([date, barbersData]) => {
      const entry: any = { date };
      barbersData.forEach((data, barberName) => {
        entry[barberName] = data.appointments;
      });
      return entry;
    });

    return timeline;
  } catch (error) {
    console.error('Erro ao buscar dados temporais:', error);
    throw error;
  }
}

/**
 * Obter ranking de barbeiros
 */
export async function getBarbersRanking(
  barbershopId: string,
  dateRange: DateRange,
  sortBy: 'appointments' | 'revenue' | 'completion' = 'appointments'
) {
  const metrics = await getBarbersMetrics(barbershopId, dateRange);

  // Ordenar baseado no critério
  const sorted = [...metrics].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      case 'completion':
        return b.completionRate - a.completionRate;
      default:
        return b.totalAppointments - a.totalAppointments;
    }
  });

  return sorted;
}
