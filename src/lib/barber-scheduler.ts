/**
 * Barber Scheduler - Sistema Inteligente de Alocação de Barbeiros
 * 
 * Este módulo implementa algoritmos para distribuir agendamentos
 * de forma otimizada entre os barbeiros disponíveis.
 */

import { supabase } from './supabase';
import { format } from 'date-fns';

interface BarberWorkload {
  barberId: string;
  barberName: string;
  appointmentCount: number;
  totalMinutes: number;
  availabilityScore: number;
}

interface BarberAvailabilitySlot {
  barberId: string;
  barberName: string;
  isAvailable: boolean;
  currentLoad: number;
  hasConflict: boolean;
}

/**
 * Encontra o melhor barbeiro disponível para um horário específico
 * Critérios de seleção (em ordem de prioridade):
 * 1. Barbeiro disponível no horário (sem conflitos)
 * 2. Menor carga de trabalho no dia
 * 3. Distribuição equilibrada de agendamentos
 */
export async function findBestAvailableBarber(
  barbershopId: string,
  serviceId: string,
  scheduledAt: string,
  serviceDuration: number
): Promise<string | null> {
  try {
    // 1. Buscar todos os barbeiros ativos
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, name')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (barbersError || !barbers || barbers.length === 0) {
      console.log('[findBestAvailableBarber] Nenhum barbeiro encontrado');
      return null;
    }

    // Se houver apenas um barbeiro, retornar diretamente
    if (barbers.length === 1) {
      return barbers[0].id;
    }

    // 2. Calcular disponibilidade de cada barbeiro
    const scheduledDate = new Date(scheduledAt);
    const serviceEndTime = new Date(scheduledDate.getTime() + serviceDuration * 60000);
    const dateString = format(scheduledDate, 'yyyy-MM-dd');

    // Buscar agendamentos do dia para todos os barbeiros
    const startOfDay = new Date(dateString + 'T00:00:00-03:00');
    const endOfDay = new Date(dateString + 'T23:59:59-03:00');

    const { data: dayAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        barber_id,
        scheduled_at,
        services (duration)
      `)
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .neq('status', 'cancelled');

    if (appointmentsError) {
      console.error('[findBestAvailableBarber] Erro ao buscar agendamentos:', appointmentsError);
      return barbers[0].id; // Fallback para o primeiro barbeiro
    }

    // 3. Calcular carga de trabalho e disponibilidade de cada barbeiro
    const barberWorkloads: BarberWorkload[] = barbers.map(barber => {
      const barberAppointments = dayAppointments?.filter(apt => apt.barber_id === barber.id) || [];
      
      // Verificar se há conflito de horário
      const hasConflict = barberAppointments.some(apt => {
        const aptStart = new Date(apt.scheduled_at);
        const aptDuration = (apt.services as any)?.duration || 30;
        const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);
        
        // Verifica sobreposição de horários
        return (
          (scheduledDate >= aptStart && scheduledDate < aptEnd) ||
          (serviceEndTime > aptStart && serviceEndTime <= aptEnd) ||
          (scheduledDate <= aptStart && serviceEndTime >= aptEnd)
        );
      });

      // Calcular carga total de trabalho
      const totalMinutes = barberAppointments.reduce((sum, apt) => {
        const duration = (apt.services as any)?.duration || 30;
        return sum + duration;
      }, 0);

      // Score de disponibilidade (quanto menor, melhor)
      // Penaliza conflitos e alta carga de trabalho
      const availabilityScore = hasConflict 
        ? 10000 // Penalidade alta para conflitos
        : barberAppointments.length * 100 + totalMinutes;

      return {
        barberId: barber.id,
        barberName: barber.name,
        appointmentCount: barberAppointments.length,
        totalMinutes,
        availabilityScore
      };
    });

    // 4. Ordenar por score de disponibilidade (menor = melhor)
    barberWorkloads.sort((a, b) => a.availabilityScore - b.availabilityScore);

    // 5. Retornar o barbeiro com melhor disponibilidade
    const bestBarber = barberWorkloads[0];
    
    console.log('[findBestAvailableBarber] Análise de barbeiros:', {
      scheduledAt,
      serviceDuration,
      workloads: barberWorkloads.map(b => ({
        name: b.barberName,
        appointments: b.appointmentCount,
        minutes: b.totalMinutes,
        score: b.availabilityScore
      })),
      selected: bestBarber.barberName
    });

    // Se o melhor barbeiro tem conflito (score >= 10000), retornar null
    if (bestBarber.availabilityScore >= 10000) {
      console.log('[findBestAvailableBarber] Todos os barbeiros têm conflito no horário');
      return null;
    }

    return bestBarber.barberId;

  } catch (error) {
    console.error('[findBestAvailableBarber] Erro:', error);
    return null;
  }
}

/**
 * Obtém estatísticas de carga de trabalho dos barbeiros em um período
 */
export async function getBarberWorkloadStats(
  barbershopId: string,
  startDate: string,
  endDate: string
): Promise<BarberWorkload[]> {
  try {
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, name')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true);

    if (barbersError || !barbers) {
      return [];
    }

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        barber_id,
        services (duration)
      `)
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      return [];
    }

    return barbers.map(barber => {
      const barberAppointments = appointments?.filter(apt => apt.barber_id === barber.id) || [];
      const totalMinutes = barberAppointments.reduce((sum, apt) => {
        const duration = (apt.services as any)?.duration || 30;
        return sum + duration;
      }, 0);

      return {
        barberId: barber.id,
        barberName: barber.name,
        appointmentCount: barberAppointments.length,
        totalMinutes,
        availabilityScore: barberAppointments.length * 100 + totalMinutes
      };
    });

  } catch (error) {
    console.error('[getBarberWorkloadStats] Erro:', error);
    return [];
  }
}

/**
 * Verifica se um barbeiro específico está disponível em um horário
 */
export async function isBarberAvailable(
  barberId: string,
  scheduledAt: string,
  serviceDuration: number
): Promise<boolean> {
  try {
    const scheduledDate = new Date(scheduledAt);
    const serviceEndTime = new Date(scheduledDate.getTime() + serviceDuration * 60000);

    const { data: conflicts, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        services (duration)
      `)
      .eq('barber_id', barberId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', new Date(scheduledDate.getTime() - 4 * 60 * 60000).toISOString())
      .lte('scheduled_at', new Date(scheduledDate.getTime() + 4 * 60 * 60000).toISOString());

    if (error) {
      console.error('[isBarberAvailable] Erro:', error);
      return false;
    }

    // Verificar conflitos
    const hasConflict = conflicts?.some(apt => {
      const aptStart = new Date(apt.scheduled_at);
      const aptDuration = (apt.services as any)?.duration || 30;
      const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);
      
      return (
        (scheduledDate >= aptStart && scheduledDate < aptEnd) ||
        (serviceEndTime > aptStart && serviceEndTime <= aptEnd) ||
        (scheduledDate <= aptStart && serviceEndTime >= aptEnd)
      );
    });

    return !hasConflict;

  } catch (error) {
    console.error('[isBarberAvailable] Erro:', error);
    return false;
  }
}
