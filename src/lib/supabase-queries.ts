import { supabase, Barbershop, Service, Appointment, Availability } from './supabase'

// Funções para Barbershops
export async function getBarbershopBySlug(slug: string) {
  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    return null
  }

  return data as Barbershop
}

export async function getBarbershopServices(barbershopId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    return []
  }

  return data as Service[]
}

/**
 * Busca serviço por slug (URL amigável) - SLUG É ÚNICO GLOBALMENTE
 */
export async function getServiceBySlug(slug: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('[getServiceBySlug] Erro:', error);
    return null
  }

  return data as Service
}

/**
 * Verifica se um slug de serviço já existe GLOBALMENTE
 */
export async function checkServiceSlugAvailability(
  slug: string,
  excludeServiceId?: string
): Promise<boolean> {
  let query = supabase
    .from('services')
    .select('id')
    .eq('slug', slug)

  if (excludeServiceId) {
    query = query.neq('id', excludeServiceId)
  }

  const { data, error } = await query.single()

  if (error && error.code === 'PGRST116') {
    // Nenhum registro encontrado, slug está disponível
    return true
  }

  if (error) {
    return false
  }

  // Se encontrou um registro, slug não está disponível
  return !data
}

// Funções para Appointments
export async function createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointment])
    .select(`
      *,
      service:services(id, name, duration, price),
      barbershop:barbershops(id, name, user_id)
    `)
    .single()

  if (error) {
    throw error
  }

  // Enviar notificação OneSignal e WhatsApp + Criar lembretes
  if (data) {
    try {
      // Buscar player_id do barbeiro para OneSignal
      const { data: barberData } = await supabase
        .from('barbershops')
        .select('player_id')
        .eq('id', appointment.barbershop_id)
        .single();

      if (barberData?.player_id) {
        await (await import('@/lib/notifications')).notificarNovoAgendamento({
          playerId: barberData.player_id,
          customerName: appointment.customer_name,
          scheduledAt: appointment.scheduled_at,
          customerPhone: appointment.customer_phone,
          serviceName: data.service?.name,
          barbershopId: appointment.barbershop_id,
        });
      }

      // Criar lembretes automáticos
      const reminderModule = await import('@/lib/reminderScheduler');
      await reminderModule.ReminderScheduler.createRemindersForAppointment(data.id);
    } catch (notifyError) {
      // Não falhar a criação do agendamento por causa da notificação
    }
  }

  return data as Appointment
}

export async function getBarbershopAppointments(barbershopId: string, date?: string) {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      services (
        name,
        price,
        duration
      )
    `)
    .eq('barbershop_id', barbershopId)
    .order('scheduled_at')

  if (date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    query = query
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
  }

  const { data, error } = await query

  if (error) {
    return []
  }

  return data
}

// Funções para Availability
export async function getBarbershopAvailability(barbershopId: string) {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true)
    .order('day_of_week')

  if (error) {
    return []
  }

  return data as Availability[]
}

// Função para verificar horários disponíveis com cálculo dinâmico baseado na duração do serviço
export async function getAvailableTimeSlots(
  barbershopId: string,
  serviceId: string,
  date: string
): Promise<{ time: string; available: boolean }[]> {
  // 1. Buscar dados essenciais
  // IMPORTANTE: Usar timezone brasileiro para calcular o dia da semana corretamente
  const dateWithTimezone = new Date(date + 'T12:00:00-03:00');
  const dayOfWeek = dateWithTimezone.getDay();

  // Primeiro, buscar a barbearia para verificar opening_hours e lunch_break
  const { data: barbershop, error: barbershopError } = await supabase
    .from('barbershops')
    .select('opening_hours, lunch_break')
    .eq('id', barbershopId)
    .single();

  if (barbershopError || !barbershop) {
    return [];
  }

  // Verificar se o dia está fechado no opening_hours
  const dayKey = dayOfWeek.toString();
  const daySchedule = barbershop.opening_hours?.[dayKey];

  console.log('[getAvailableTimeSlots] Horário do dia:', {
    dayKey,
    daySchedule,
    allOpeningHours: barbershop.opening_hours
  });

  // Se o dia está marcado como null (fechado) ou não existe, retornar vazio
  if (!daySchedule || daySchedule === null) {
    console.log('[getAvailableTimeSlots] Dia fechado, retornando vazio');
    return [];
  }

  // Buscar serviço, agendamentos normais e agendamentos recorrentes
  const [
    { data: service, error: serviceError }, 
    { data: appointments, error: appointmentsError },
    { data: recurringAppointments, error: recurringError }
  ] = await Promise.all([
    supabase
      .from('services')
      .select('duration')
      .eq('id', serviceId)
      .single(),
    supabase
      .from('appointments')
      .select('scheduled_at, services(duration)')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', new Date(date + 'T00:00:00-03:00').toISOString())
      .lte('scheduled_at', new Date(date + 'T23:59:59-03:00').toISOString())
      .neq('status', 'cancelled'),
    supabase
      .from('recurring_appointments')
      .select('time_of_day, day_of_week, services(duration)')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .eq('day_of_week', dayOfWeek)
      .lte('start_date', date)
      .or(`end_date.is.null,end_date.gte.${date}`)
  ]);

  if (serviceError || !service) {
    return [];
  }
  if (appointmentsError) {
    return [];
  }
  if (recurringError) {
    console.error('[getAvailableTimeSlots] Erro ao buscar agendamentos recorrentes:', recurringError);
  }

  // 2. Definir durações e horários de trabalho
  const serviceDuration = service.duration; // minutos
  const breakTime = 5; // 5 minutos de intervalo
  const workStart = new Date(`${date}T${daySchedule.start}-03:00`);
  const workEnd = new Date(`${date}T${daySchedule.end}-03:00`);

  // 3. Construir períodos ocupados (agendamento + pausa)
  const busyPeriods: { start: Date; end: Date }[] = [];

  // 3.1. Adicionar agendamentos normais
  appointments?.forEach((apt) => {
    const aptStart = new Date(apt.scheduled_at);
    const aptServiceDuration = (apt.services as any)?.duration || 30;
    const aptEnd = new Date(aptStart.getTime() + aptServiceDuration * 60000);
    const aptEndWithBreak = new Date(aptEnd.getTime() + breakTime * 60000);
    busyPeriods.push({ start: aptStart, end: aptEndWithBreak });
  });

  // 3.2. Adicionar agendamentos recorrentes (que reservam o horário fixo)
  recurringAppointments?.forEach((recurring: any) => {
    // Criar data/hora completa do agendamento recorrente
    const recurringStart = new Date(`${date}T${recurring.time_of_day}-03:00`);
    const recurringServiceDuration = recurring.services?.duration || 30;
    const recurringEnd = new Date(recurringStart.getTime() + recurringServiceDuration * 60000);
    const recurringEndWithBreak = new Date(recurringEnd.getTime() + breakTime * 60000);
    
    busyPeriods.push({ start: recurringStart, end: recurringEndWithBreak });
    
    console.log('[getAvailableTimeSlots] Agendamento recorrente bloqueado:', {
      time: recurring.time_of_day,
      duration: recurringServiceDuration,
      date
    });
  });

  // 4. Ordenar e mesclar períodos sobrepostos
  busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());
  const mergedBusyPeriods: { start: Date; end: Date }[] = [];
  if (busyPeriods.length > 0) {
    let current = { ...busyPeriods[0] };
    for (let i = 1; i < busyPeriods.length; i++) {
      const next = busyPeriods[i];
      if (next.start <= current.end) {
        current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()));
      } else {
        mergedBusyPeriods.push(current);
        current = { ...next };
      }
    }
    mergedBusyPeriods.push(current);
  }

  // Helper para arredondar o horário para o próximo múltiplo de 5 minutos
  const roundToNext5 = (d: Date) => {
    const mins = d.getMinutes();
    const remainder = mins % 5;
    if (remainder !== 0) {
      d.setMinutes(mins + (5 - remainder));
    }
    d.setSeconds(0, 0);
    return d;
  };

  // 5. Gerar timeline com passo dinâmico: (serviço + pausa)
  const slots: { time: string; available: boolean }[] = [];
  let cursor = roundToNext5(new Date(workStart));

  const stepMs = (serviceDuration + breakTime) * 60000;
  
  // Obter hora atual no timezone brasileiro
  const now = new Date();
  const nowBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

  while (new Date(cursor.getTime() + serviceDuration * 60000) <= workEnd) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

    // Verificar se o horário já passou (não permitir agendamento no passado)
    const isPastTime = slotStart <= nowBrazil;

    // Verificar colisão com períodos ocupados (agendamento + pausa no atendimento existente)
    let available = true;
    
    // Se o horário já passou, marcar como indisponível
    if (isPastTime) {
      available = false;
    } else {
      // Verificar colisão com períodos ocupados
      for (const busy of mergedBusyPeriods) {
        // Se a janela do serviço atual colide com o período ocupado (agendamento + 5min de pausa)
        if (slotStart < busy.end && slotEnd > busy.start) {
          available = false;
          break;
        }
      }

      // Verificar se o horário colide com o intervalo de almoço
      if (available && barbershop.lunch_break?.enabled) {
        const lunchStart = new Date(`${date}T${barbershop.lunch_break.start}-03:00`);
        const lunchEnd = new Date(`${date}T${barbershop.lunch_break.end}-03:00`);
        
        // Se o serviço começa antes do fim do almoço E termina depois do início do almoço
        if (slotStart < lunchEnd && slotEnd > lunchStart) {
          available = false;
        }
      }
    }

    slots.push({ time: slotStart.toTimeString().slice(0, 5), available });

    // Avançar pelo passo total (serviço + pausa)
    cursor = new Date(cursor.getTime() + stepMs);
    cursor = roundToNext5(cursor);
  }

  return slots;
}

// Funções para dados do usuário logado
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Apenas logar em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('Erro ao buscar perfil:', error);
    }
    // Se o erro for PGRST116, significa que não encontrou nenhum registro
    if (error.code === 'PGRST116') {
      if (import.meta.env.DEV) {
        console.log('Perfil não encontrado para o usuário:', userId);
      }
    }
    return null
  }

  return data
}

export async function getUserBarbershop(userId: string) {
  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error) {
    return null
  }

  return data as Barbershop
}

export async function getUserBarbershopServices(userId: string) {
  // Primeiro buscar a barbearia do usuário
  const barbershop = await getUserBarbershop(userId)
  if (!barbershop) return []

  // Depois buscar os serviços da barbearia
  return getBarbershopServices(barbershop.id)
}

// Funções para atualizar barbearia
export async function updateBarbershop(barbershopId: string, updates: Partial<Barbershop>) {
  const { data, error } = await supabase
    .from('barbershops')
    .update(updates)
    .eq('id', barbershopId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Barbershop
}

// Função para verificar se um slug já existe
export async function checkSlugAvailability(slug: string, excludeBarbershopId?: string): Promise<boolean> {
  let query = supabase
    .from('barbershops')
    .select('id')
    .eq('slug', slug)

  if (excludeBarbershopId) {
    query = query.neq('id', excludeBarbershopId)
  }

  const { data, error } = await query.single()

  if (error && error.code === 'PGRST116') {
    // Nenhum registro encontrado, slug está disponível
    return true
  }

  if (error) {
    return false
  }

  // Se encontrou um registro, slug não está disponível
  return !data
}


// ============================================================================
// PLANO PRO: Funções para Múltiplos Barbeiros
// ============================================================================

/**
 * Interface para horários disponíveis com informações do barbeiro
 */
export interface BarberTimeSlot {
  time: string;
  available: boolean;
  barberId?: string;
  barberName?: string;
}

/**
 * Busca barbeiros ativos de uma barbearia (Plano PRO)
 */
export async function getActiveBarbersForService(
  barbershopId: string,
  serviceId: string
): Promise<Array<{ id: string; name: string; photo_url: string | null; specialties: string[] | null }>> {
  try {
    // Buscar barbeiros que oferecem este serviço
    const { data: barberServices, error: barberServicesError } = await supabase
      .from('barber_services')
      .select(`
        barber_id,
        barbers!inner(
          id,
          name,
          photo_url,
          specialties,
          is_active
        )
      `)
      .eq('service_id', serviceId)
      .eq('is_available', true);

    if (barberServicesError) {
      console.error('[getActiveBarbersForService] Erro:', barberServicesError);
      return [];
    }

    // Filtrar apenas barbeiros ativos e extrair dados
    const activeBarbers = barberServices
      ?.filter((bs: any) => bs.barbers?.is_active === true)
      .map((bs: any) => ({
        id: bs.barbers.id,
        name: bs.barbers.name,
        photo_url: bs.barbers.photo_url,
        specialties: bs.barbers.specialties
      })) || [];

    return activeBarbers;
  } catch (error) {
    console.error('[getActiveBarbersForService] Erro inesperado:', error);
    return [];
  }
}

/**
 * Busca horários disponíveis para um barbeiro específico (Plano PRO)
 * IMPORTANTE: Ignora completamente os horários da barbearia, usa apenas horários do barbeiro
 */
export async function getBarberAvailableTimeSlots(
  barbershopId: string,
  barberId: string,
  serviceId: string,
  date: string
): Promise<{ time: string; available: boolean }[]> {
  try {
    // 1. Calcular dia da semana no timezone brasileiro
    const dateWithTimezone = new Date(date + 'T12:00:00-03:00');
    const dayOfWeek = dateWithTimezone.getDay();

    console.log('[getBarberAvailableTimeSlots] Iniciando busca:', {
      barberId,
      date,
      dayOfWeek
    });

    // 2. Buscar disponibilidade do barbeiro para este dia
    const { data: barberAvailability, error: availabilityError } = await supabase
      .from('barber_availability')
      .select('start_time, end_time, is_active')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .maybeSingle();

    if (availabilityError) {
      console.error('[getBarberAvailableTimeSlots] Erro ao buscar disponibilidade:', availabilityError);
      return [];
    }

    // Se barbeiro não tem horário configurado para este dia, retornar vazio
    if (!barberAvailability) {
      console.log('[getBarberAvailableTimeSlots] Barbeiro sem horário configurado para este dia');
      return [];
    }

    console.log('[getBarberAvailableTimeSlots] Horário do barbeiro:', barberAvailability);

    // 3. Buscar duração do serviço
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      console.error('[getBarberAvailableTimeSlots] Erro ao buscar serviço:', serviceError);
      return [];
    }

    // 4. Buscar agendamentos do barbeiro para este dia
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('scheduled_at, services(duration)')
      .eq('barbershop_id', barbershopId)
      .eq('barber_id', barberId)
      .gte('scheduled_at', new Date(date + 'T00:00:00-03:00').toISOString())
      .lte('scheduled_at', new Date(date + 'T23:59:59-03:00').toISOString())
      .neq('status', 'cancelled');

    if (appointmentsError) {
      console.error('[getBarberAvailableTimeSlots] Erro ao buscar agendamentos:', appointmentsError);
      return [];
    }

    console.log('[getBarberAvailableTimeSlots] Agendamentos encontrados:', appointments?.length || 0);

    // 5. Definir parâmetros
    const serviceDuration = service.duration; // minutos
    const breakTime = 5; // 5 minutos de intervalo entre atendimentos
    const workStart = new Date(`${date}T${barberAvailability.start_time}-03:00`);
    const workEnd = new Date(`${date}T${barberAvailability.end_time}-03:00`);

    // 6. Construir períodos ocupados
    const busyPeriods: { start: Date; end: Date }[] = [];

    appointments?.forEach((apt) => {
      const aptStart = new Date(apt.scheduled_at);
      const aptServiceDuration = (apt.services as any)?.duration || 30;
      const aptEnd = new Date(aptStart.getTime() + aptServiceDuration * 60000);
      const aptEndWithBreak = new Date(aptEnd.getTime() + breakTime * 60000);
      busyPeriods.push({ start: aptStart, end: aptEndWithBreak });
    });

    // 7. Ordenar e mesclar períodos sobrepostos
    busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());
    const mergedBusyPeriods: { start: Date; end: Date }[] = [];
    
    if (busyPeriods.length > 0) {
      let current = { ...busyPeriods[0] };
      for (let i = 1; i < busyPeriods.length; i++) {
        const next = busyPeriods[i];
        if (next.start <= current.end) {
          current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()));
        } else {
          mergedBusyPeriods.push(current);
          current = { ...next };
        }
      }
      mergedBusyPeriods.push(current);
    }

    // 8. Helper para arredondar para múltiplo de 5 minutos
    const roundToNext5 = (d: Date) => {
      const mins = d.getMinutes();
      const remainder = mins % 5;
      if (remainder !== 0) {
        d.setMinutes(mins + (5 - remainder));
      }
      d.setSeconds(0, 0);
      return d;
    };

    // 9. Gerar slots disponíveis
    const slots: { time: string; available: boolean }[] = [];
    let cursor = roundToNext5(new Date(workStart));
    const stepMs = (serviceDuration + breakTime) * 60000;

    // Obter hora atual no timezone brasileiro
    const now = new Date();
    const nowBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

    while (new Date(cursor.getTime() + serviceDuration * 60000) <= workEnd) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      // Verificar se o horário já passou
      const isPastTime = slotStart <= nowBrazil;

      let available = true;

      if (isPastTime) {
        available = false;
      } else {
        // Verificar colisão com períodos ocupados
        for (const busy of mergedBusyPeriods) {
          if (slotStart < busy.end && slotEnd > busy.start) {
            available = false;
            break;
          }
        }
      }

      slots.push({ 
        time: slotStart.toTimeString().slice(0, 5), 
        available 
      });

      cursor = new Date(cursor.getTime() + stepMs);
      cursor = roundToNext5(cursor);
    }

    console.log('[getBarberAvailableTimeSlots] Slots gerados:', slots.length);
    return slots;

  } catch (error) {
    console.error('[getBarberAvailableTimeSlots] Erro inesperado:', error);
    return [];
  }
}

/**
 * Busca horários disponíveis combinando TODOS os barbeiros (Plano PRO - Atribuição Automática)
 * Retorna todos os horários onde PELO MENOS UM barbeiro está disponível
 */
export async function getAllBarbersAvailableTimeSlots(
  barbershopId: string,
  serviceId: string,
  date: string
): Promise<{ time: string; available: boolean; availableBarbers?: string[] }[]> {
  try {
    console.log('[getAllBarbersAvailableTimeSlots] 🔍 Iniciando busca de horários combinados');
    console.log('[getAllBarbersAvailableTimeSlots] Params:', { barbershopId, serviceId, date });

    // 1. Buscar todos os barbeiros ativos que oferecem este serviço
    const activeBarbers = await getActiveBarbersForService(barbershopId, serviceId);
    
    if (activeBarbers.length === 0) {
      console.log('[getAllBarbersAvailableTimeSlots] ❌ Nenhum barbeiro disponível para este serviço');
      return [];
    }

    console.log('[getAllBarbersAvailableTimeSlots] ✅ Barbeiros encontrados:', activeBarbers.length);
    console.log('[getAllBarbersAvailableTimeSlots] Barbeiros:', activeBarbers.map(b => ({ id: b.id, name: b.name })));

    // 2. Buscar horários disponíveis de cada barbeiro
    console.log('[getAllBarbersAvailableTimeSlots] 📅 Buscando horários de cada barbeiro...');
    const allBarberSlots = await Promise.all(
      activeBarbers.map(async (barber) => {
        console.log(`[getAllBarbersAvailableTimeSlots] Buscando horários de ${barber.name}...`);
        const slots = await getBarberAvailableTimeSlots(
          barbershopId,
          barber.id,
          serviceId,
          date
        );
        console.log(`[getAllBarbersAvailableTimeSlots] ${barber.name}: ${slots.length} slots (${slots.filter(s => s.available).length} disponíveis)`);
        return { barberId: barber.id, barberName: barber.name, slots };
      })
    );

    // 3. Criar um mapa de horários combinados
    const timeSlotMap = new Map<string, { available: boolean; availableBarbers: string[] }>();

    // Adicionar todos os horários de todos os barbeiros
    allBarberSlots.forEach(({ barberId, barberName, slots }) => {
      slots.forEach(slot => {
        if (!timeSlotMap.has(slot.time)) {
          timeSlotMap.set(slot.time, { available: false, availableBarbers: [] });
        }
        
        const current = timeSlotMap.get(slot.time)!;
        
        // Se este barbeiro está disponível neste horário, adicionar à lista
        if (slot.available) {
          current.available = true;
          current.availableBarbers.push(barberId);
        }
      });
    });

    // 4. Converter mapa para array e ordenar por horário
    const combinedSlots = Array.from(timeSlotMap.entries())
      .map(([time, data]) => ({
        time,
        available: data.available,
        availableBarbers: data.availableBarbers
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    const availableCount = combinedSlots.filter(s => s.available).length;
    console.log('[getAllBarbersAvailableTimeSlots] ✅ Slots combinados:', combinedSlots.length, `(${availableCount} disponíveis)`);
    console.log('[getAllBarbersAvailableTimeSlots] Horários disponíveis:', combinedSlots.filter(s => s.available).map(s => s.time).join(', '));
    
    return combinedSlots;

  } catch (error) {
    console.error('[getAllBarbersAvailableTimeSlots] Erro inesperado:', error);
    return [];
  }
}

/**
 * Função inteligente que decide qual lógica usar baseado no plano
 * - Plano PRO + barberId específico: usa horários do barbeiro
 * - Plano PRO + sem barberId (atribuição automática): combina horários de todos os barbeiros
 * - Outros casos: usa horários da barbearia
 */
export async function getAvailableTimeSlotsV2(
  barbershopId: string,
  serviceId: string,
  date: string,
  barberId?: string
): Promise<{ time: string; available: boolean; availableBarbers?: string[] }[]> {
  try {
    // 1. Buscar plano da barbearia
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('plan_type')
      .eq('id', barbershopId)
      .single();

    if (barbershopError || !barbershop) {
      console.error('[getAvailableTimeSlotsV2] Erro ao buscar barbearia:', barbershopError);
      return [];
    }

    const planType = barbershop.plan_type;
    const isPro = planType === 'pro';

    console.log('[getAvailableTimeSlotsV2] Plano detectado:', planType, 'barberId:', barberId);

    // 2. Decidir qual lógica usar
    if (isPro) {
      if (barberId) {
        // ✅ PLANO PRO + BARBEIRO ESPECÍFICO: Usar horários do barbeiro selecionado
        console.log('[getAvailableTimeSlotsV2] Usando horários do barbeiro específico (PRO)');
        return await getBarberAvailableTimeSlots(barbershopId, barberId, serviceId, date);
      } else {
        // ✅ PLANO PRO + ATRIBUIÇÃO AUTOMÁTICA: Combinar horários de todos os barbeiros
        console.log('[getAvailableTimeSlotsV2] Usando horários combinados de todos os barbeiros (PRO - Auto)');
        return await getAllBarbersAvailableTimeSlots(barbershopId, serviceId, date);
      }
    } else {
      // ✅ PLANO STARTER/FREEMIUM: Usar horários da barbearia
      console.log('[getAvailableTimeSlotsV2] Usando horários da barbearia (Starter/Freemium)');
      return await getAvailableTimeSlots(barbershopId, serviceId, date);
    }

  } catch (error) {
    console.error('[getAvailableTimeSlotsV2] Erro inesperado:', error);
    return [];
  }
}

/**
 * Valida se um horário específico está disponível para um barbeiro
 * Útil para validação antes de criar agendamento
 */
export async function validateBarberTimeSlot(
  barbershopId: string,
  barberId: string,
  serviceId: string,
  scheduledAt: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const date = scheduledAt.split('T')[0];
    const time = scheduledAt.split('T')[1].slice(0, 5);

    // Buscar slots disponíveis
    const slots = await getBarberAvailableTimeSlots(barbershopId, barberId, serviceId, date);

    // Verificar se o horário solicitado está disponível
    const requestedSlot = slots.find(slot => slot.time === time);

    if (!requestedSlot) {
      return {
        valid: false,
        reason: 'Horário fora do expediente do barbeiro'
      };
    }

    if (!requestedSlot.available) {
      return {
        valid: false,
        reason: 'Horário já ocupado'
      };
    }

    return { valid: true };

  } catch (error) {
    console.error('[validateBarberTimeSlot] Erro:', error);
    return {
      valid: false,
      reason: 'Erro ao validar horário'
    };
  }
}
