import type { Barbershop } from './supabase';

export function isBarbershopOpen(openingHours: Barbershop['opening_hours']): boolean {
  if (!openingHours) return false;
  
  // Usar timezone brasileiro automaticamente
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  const day = brazilTime.getDay(); // 0=Dom, 1=Seg, 2=Ter, etc.
  const hour = brazilTime.getHours();
  const minute = brazilTime.getMinutes();
  const currentMinutes = hour * 60 + minute;

  const today = openingHours[day.toString()];
  if (!today || !today.start || !today.end) return false;

  try {
    const [startH, startM] = today.start.split(':').map(Number);
    const [endH, endM] = today.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch (error) {
    console.error('Erro ao processar horários:', error);
    return false;
  }
}

export function formatOpeningHours(openingHours: Barbershop['opening_hours']): string {
  if (!openingHours) return 'Horários não informados';

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const schedule: string[] = [];

  for (let i = 0; i < 7; i++) {
    const daySchedule = openingHours[i.toString()];
    if (daySchedule) {
      schedule.push(`${dayNames[i]}: ${daySchedule.start}-${daySchedule.end}`);
    } else {
      schedule.push(`${dayNames[i]}: Fechado`);
    }
  }

  return schedule.join(' • ');
}

export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}