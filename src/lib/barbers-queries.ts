import { supabase } from './supabase';
import type { Barber, BarberAvailability, BarberService } from './supabase';

// ==================== BARBERS ====================

export async function getBarbersByBarbershop(barbershopId: string): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveBarbersByBarbershop(barbershopId: string): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getBarberById(barberId: string): Promise<Barber | null> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('id', barberId)
    .single();

  if (error) throw error;
  return data;
}

export async function createBarber(barber: Omit<Barber, 'id' | 'created_at' | 'updated_at'>): Promise<Barber> {
  const { data, error } = await supabase
    .from('barbers')
    .insert(barber)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBarber(barberId: string, updates: Partial<Barber>): Promise<Barber> {
  const { data, error } = await supabase
    .from('barbers')
    .update(updates)
    .eq('id', barberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBarber(barberId: string): Promise<void> {
  const { error } = await supabase
    .from('barbers')
    .delete()
    .eq('id', barberId);

  if (error) throw error;
}

export async function countActiveBarbers(barbershopId: string): Promise<number> {
  const { count, error } = await supabase
    .from('barbers')
    .select('*', { count: 'exact', head: true })
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true);

  if (error) throw error;
  return count || 0;
}

// ==================== BARBER AVAILABILITY ====================

export async function getBarberAvailability(barberId: string): Promise<BarberAvailability[]> {
  const { data, error } = await supabase
    .from('barber_availability')
    .select('*')
    .eq('barber_id', barberId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function setBarberAvailability(
  barberId: string,
  availability: Omit<BarberAvailability, 'id' | 'barber_id' | 'created_at'>[]
): Promise<void> {
  // Deletar disponibilidade existente
  await supabase
    .from('barber_availability')
    .delete()
    .eq('barber_id', barberId);

  // Inserir nova disponibilidade
  if (availability.length > 0) {
    const { error } = await supabase
      .from('barber_availability')
      .insert(
        availability.map(a => ({
          ...a,
          barber_id: barberId
        }))
      );

    if (error) throw error;
  }
}

// ==================== BARBER SERVICES ====================

export async function getBarberServices(barberId: string): Promise<BarberService[]> {
  const { data, error } = await supabase
    .from('barber_services')
    .select('*')
    .eq('barber_id', barberId);

  if (error) throw error;
  return data || [];
}

export async function getBarbersByService(serviceId: string, barbershopId: string): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barber_services')
    .select(`
      barber_id,
      barbers (*)
    `)
    .eq('service_id', serviceId)
    .eq('is_available', true)
    .eq('barbers.barbershop_id', barbershopId)
    .eq('barbers.is_active', true);

  if (error) throw error;
  
  return data?.map(item => (item as any).barbers).filter(Boolean) || [];
}

export async function setBarberServices(
  barberId: string,
  services: { service_id: string; is_available: boolean; custom_duration?: number }[]
): Promise<void> {
  // Deletar serviços existentes
  await supabase
    .from('barber_services')
    .delete()
    .eq('barber_id', barberId);

  // Inserir novos serviços
  if (services.length > 0) {
    const { error } = await supabase
      .from('barber_services')
      .insert(
        services.map(s => ({
          barber_id: barberId,
          ...s
        }))
      );

    if (error) throw error;
  }
}

export async function toggleBarberService(
  barberId: string,
  serviceId: string,
  isAvailable: boolean
): Promise<void> {
  const { error } = await supabase
    .from('barber_services')
    .upsert({
      barber_id: barberId,
      service_id: serviceId,
      is_available: isAvailable
    });

  if (error) throw error;
}


// ==================== AVAILABILITY & SCHEDULING ====================

/**
 * Busca horários disponíveis para um barbeiro específico em uma data
 * Considera: horários do barbeiro, agendamentos existentes, intervalo de almoço
 */
export async function getAvailableTimeSlotsForBarber(
  barbershopId: string,
  barberId: string,
  serviceId: string,
  date: string
): Promise<{ time: string; available: boolean }[]> {
  const { supabase } = await import('./supabase');
  
  // Calcular dia da semana no timezone brasileiro
  const dateWithTimezone = new Date(date + 'T12:00:00-03:00');
  const dayOfWeek = dateWithTimezone.getDay();

  // Buscar disponibilidade do barbeiro para este dia
  const { data: availability } = await supabase
    .from('barber_availability')
    .select('start_time, end_time')
    .eq('barber_id', barberId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .single();

  if (!availability) {
    return []; // Barbeiro não trabalha neste dia
  }

  // Buscar duração do serviço (pode ser customizada para este barbeiro)
  const { data: barberService } = await supabase
    .from('barber_services')
    .select('custom_duration, services(duration)')
    .eq('barber_id', barberId)
    .eq('service_id', serviceId)
    .eq('is_available', true)
    .single();

  if (!barberService) {
    return []; // Barbeiro não oferece este serviço
  }

  const serviceDuration = barberService.custom_duration || (barberService.services as any)?.duration || 30;

  // Buscar agendamentos existentes do barbeiro nesta data
  const { data: appointments } = await supabase
    .from('appointments')
    .select('scheduled_at, services(duration)')
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .gte('scheduled_at', new Date(date + 'T00:00:00-03:00').toISOString())
    .lte('scheduled_at', new Date(date + 'T23:59:59-03:00').toISOString())
    .neq('status', 'cancelled');

  // Buscar intervalo de almoço da barbearia
  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('lunch_break')
    .eq('id', barbershopId)
    .single();

  // Gerar slots disponíveis
  return generateTimeSlots({
    workStart: availability.start_time,
    workEnd: availability.end_time,
    serviceDuration,
    appointments: appointments || [],
    lunchBreak: barbershop?.lunch_break,
    date
  });
}

/**
 * Busca todos os barbeiros disponíveis para um serviço em uma data
 * Retorna barbeiros com informações de disponibilidade
 */
export async function getAvailableBarbersForService(
  barbershopId: string,
  serviceId: string,
  date: string
) {
  const { supabase } = await import('./supabase');
  
  const dateWithTimezone = new Date(date + 'T12:00:00-03:00');
  const dayOfWeek = dateWithTimezone.getDay();

  // Buscar barbeiros que oferecem este serviço e trabalham neste dia
  const { data: barbers } = await supabase
    .from('barbers')
    .select(`
      *,
      barber_services!inner(service_id, is_available, custom_duration),
      barber_availability!inner(day_of_week, start_time, end_time, is_active)
    `)
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true)
    .eq('barber_services.service_id', serviceId)
    .eq('barber_services.is_available', true)
    .eq('barber_availability.day_of_week', dayOfWeek)
    .eq('barber_availability.is_active', true)
    .order('display_order', { ascending: true });

  if (!barbers || barbers.length === 0) {
    return [];
  }

  // Para cada barbeiro, calcular próximo horário disponível
  const barbersWithAvailability = await Promise.all(
    barbers.map(async (barber) => {
      const slots = await getAvailableTimeSlotsForBarber(
        barbershopId,
        barber.id,
        serviceId,
        date
      );

      const availableSlots = slots.filter(s => s.available);
      const nextSlot = availableSlots[0]?.time;

      return {
        ...barber,
        nextAvailableSlot: nextSlot,
        availableSlotsCount: availableSlots.length
      };
    })
  );

  return barbersWithAvailability;
}

/**
 * Função auxiliar para gerar slots de tempo
 * Otimizada para performance com algoritmo eficiente
 */
function generateTimeSlots(config: {
  workStart: string;
  workEnd: string;
  serviceDuration: number;
  appointments: any[];
  lunchBreak?: any;
  date: string;
}): { time: string; available: boolean }[] {
  const { workStart, workEnd, serviceDuration, appointments, lunchBreak, date } = config;
  
  const slots: { time: string; available: boolean }[] = [];
  const breakTime = 5; // minutos entre atendimentos

  // Criar objetos Date para início e fim do expediente
  const startDate = new Date(`${date}T${workStart}-03:00`);
  const endDate = new Date(`${date}T${workEnd}-03:00`);

  // Criar períodos ocupados
  const busyPeriods: { start: Date; end: Date }[] = [];

  // Adicionar agendamentos
  appointments.forEach((apt) => {
    const aptStart = new Date(apt.scheduled_at);
    const aptDuration = (apt.services as any)?.duration || 30;
    const aptEnd = new Date(aptStart.getTime() + (aptDuration + breakTime) * 60000);
    busyPeriods.push({ start: aptStart, end: aptEnd });
  });

  // Adicionar intervalo de almoço se habilitado
  if (lunchBreak?.enabled) {
    const lunchStart = new Date(`${date}T${lunchBreak.start}-03:00`);
    const lunchEnd = new Date(`${date}T${lunchBreak.end}-03:00`);
    busyPeriods.push({ start: lunchStart, end: lunchEnd });
  }

  // Ordenar e mesclar períodos sobrepostos
  busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());
  const mergedBusyPeriods = mergePeriods(busyPeriods);

  // Obter hora atual no timezone brasileiro
  const now = new Date();
  const nowBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

  // Gerar slots
  let cursor = roundToNext5Minutes(new Date(startDate));
  const stepMs = (serviceDuration + breakTime) * 60000;

  while (new Date(cursor.getTime() + serviceDuration * 60000) <= endDate) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

    // Verificar se já passou
    const isPast = slotStart <= nowBrazil;

    // Verificar colisão com períodos ocupados
    let available = !isPast;
    
    if (available) {
      for (const busy of mergedBusyPeriods) {
        if (slotStart < busy.end && slotEnd > busy.start) {
          available = false;
          break;
        }
      }
    }

    // Formatar horário
    const timeStr = slotStart.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });

    slots.push({ time: timeStr, available });
    cursor = new Date(cursor.getTime() + stepMs);
  }

  return slots;
}

/**
 * Arredonda data para próximo múltiplo de 5 minutos
 */
function roundToNext5Minutes(date: Date): Date {
  const mins = date.getMinutes();
  const remainder = mins % 5;
  if (remainder !== 0) {
    date.setMinutes(mins + (5 - remainder));
  }
  date.setSeconds(0, 0);
  return date;
}

/**
 * Mescla períodos sobrepostos
 * Algoritmo O(n) após ordenação
 */
function mergePeriods(periods: { start: Date; end: Date }[]): { start: Date; end: Date }[] {
  if (periods.length === 0) return [];

  const merged: { start: Date; end: Date }[] = [];
  let current = { ...periods[0] };

  for (let i = 1; i < periods.length; i++) {
    const next = periods[i];
    if (next.start <= current.end) {
      current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()));
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  return merged;
}
