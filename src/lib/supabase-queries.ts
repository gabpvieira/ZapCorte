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
    console.error('Error fetching barbershop:', error)
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
    console.error('Error fetching services:', error)
    return []
  }

  return data as Service[]
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
    console.error('Error creating appointment:', error)
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
      console.warn('Erro ao enviar notificações ou criar lembretes:', notifyError);
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
    console.error('Error fetching appointments:', error)
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
    console.error('Error fetching availability:', error)
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
  const dayOfWeek = new Date(date).getDay();

  const [{ data: availability, error: availabilityError }, { data: service, error: serviceError }, { data: appointments, error: appointmentsError }] = await Promise.all([
    supabase
      .from('availability')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single(),
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
  ]);

  if (availabilityError || !availability || serviceError || !service) {
    console.error('Error fetching availability or service:', availabilityError, serviceError);
    return [];
  }
  if (appointmentsError) {
    console.error('Error fetching appointments:', appointmentsError);
    return [];
  }

  // 2. Definir durações e horários de trabalho
  const serviceDuration = service.duration; // minutos
  const breakTime = 5; // 5 minutos de intervalo
  const workStart = new Date(`${date}T${availability.start_time}-03:00`);
  const workEnd = new Date(`${date}T${availability.end_time}-03:00`);

  // 3. Construir períodos ocupados (agendamento + pausa)
  const busyPeriods: { start: Date; end: Date }[] = [];

  appointments?.forEach((apt) => {
    const aptStart = new Date(apt.scheduled_at);
    const aptServiceDuration = (apt.services as any)?.duration || 30;
    const aptEnd = new Date(aptStart.getTime() + aptServiceDuration * 60000);
    const aptEndWithBreak = new Date(aptEnd.getTime() + breakTime * 60000);
    busyPeriods.push({ start: aptStart, end: aptEndWithBreak });
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

  while (new Date(cursor.getTime() + serviceDuration * 60000) <= workEnd) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

    // Verificar colisão com períodos ocupados (agendamento + pausa no atendimento existente)
    let available = true;
    for (const busy of mergedBusyPeriods) {
      // Se a janela do serviço atual colide com o período ocupado (agendamento + 5min de pausa)
      if (slotStart < busy.end && slotEnd > busy.start) {
        available = false;
        break;
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
    console.error('Error fetching user profile:', error)
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
    console.error('Error fetching user barbershop:', error)
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
    console.error('Error updating barbershop:', error)
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
    console.error('Error checking slug availability:', error)
    return false
  }

  // Se encontrou um registro, slug não está disponível
  return !data
}

