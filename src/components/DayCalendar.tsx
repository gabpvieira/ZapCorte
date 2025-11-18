import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, isToday, addDays, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled";
  service_name?: string;
  service_duration?: number;
}

interface DayCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onTimeSlotClick?: (time: string) => void;
  onDateChange?: (date: Date) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8h às 21h
const HOUR_HEIGHT = 80; // Altura base por hora
const MIN_CARD_HEIGHT = 44; // Altura mínima reduzida
const CARD_SPACING = 4; // Espaçamento entre cards

export function DayCalendar({ appointments, onAppointmentClick, onTimeSlotClick, onDateChange }: DayCalendarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Atualizar hora atual a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Calcular posição da linha vermelha (hora atual)
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours < 8 || hours >= 22) return null;
    
    const hoursSince8 = hours - 8;
    const minutesFraction = minutes / 60;
    const position = (hoursSince8 + minutesFraction) * HOUR_HEIGHT;
    
    return position;
  };

  // Calcular posição e altura do card de agendamento
  const getAppointmentStyle = (appointment: Appointment) => {
    const startTime = parseISO(appointment.scheduled_at);
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    const duration = appointment.service_duration || 30;
    
    const hoursSince8 = hours - 8;
    const minutesFraction = minutes / 60;
    const top = (hoursSince8 + minutesFraction) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return {
      top: `${top}px`,
      height: `${Math.max(height, MIN_CARD_HEIGHT)}px`, // Altura mínima para mostrar conteúdo
    };
  };

  // Cores por status - Design minimalista com hover claro
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-l-emerald-500',
          hover: 'hover:bg-emerald-900/70 hover:border-l-emerald-400',
          text: 'text-emerald-50',
          badge: 'bg-emerald-500/30 text-emerald-100'
        };
      case 'pending':
        return {
          bg: 'bg-slate-800/40',
          border: 'border-l-slate-400',
          hover: 'hover:bg-slate-700/70 hover:border-l-slate-300',
          text: 'text-slate-200',
          badge: 'bg-slate-500/30 text-slate-300'
        };
      case 'cancelled':
        return {
          bg: 'bg-red-950/30',
          border: 'border-l-red-500',
          hover: 'hover:bg-red-900/60 hover:border-l-red-400',
          text: 'text-red-200',
          badge: 'bg-red-500/30 text-red-200'
        };
      default:
        return {
          bg: 'bg-blue-950/40',
          border: 'border-l-blue-500',
          hover: 'hover:bg-blue-900/70 hover:border-l-blue-400',
          text: 'text-blue-100',
          badge: 'bg-blue-500/30 text-blue-100'
        };
    }
  };

  const currentTimePosition = getCurrentTimePosition();

  // Navegar para o dia anterior
  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // Navegar para o próximo dia
  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // Filtrar e ordenar agendamentos do dia selecionado
  const dayAppointments = appointments
    .filter(apt => isSameDay(parseISO(apt.scheduled_at), selectedDate))
    .sort((a, b) => parseISO(a.scheduled_at).getTime() - parseISO(b.scheduled_at).getTime());

  // Calcular posições ajustadas para evitar sobreposição (lista vertical simples)
  const appointmentsWithLayout = dayAppointments.map((apt, index) => {
    const start = parseISO(apt.scheduled_at);
    const duration = apt.service_duration || 30;
    const end = new Date(start.getTime() + duration * 60000);
    
    // Calcular posição base
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const hoursSince8 = hours - 8;
    const minutesFraction = minutes / 60;
    let baseTop = (hoursSince8 + minutesFraction) * HOUR_HEIGHT;
    
    // Verificar sobreposição com card anterior
    if (index > 0) {
      const prevApt = dayAppointments[index - 1];
      const prevStart = parseISO(prevApt.scheduled_at);
      const prevDuration = prevApt.service_duration || 30;
      const prevEnd = new Date(prevStart.getTime() + prevDuration * 60000);
      
      const prevHours = prevStart.getHours();
      const prevMinutes = prevStart.getMinutes();
      const prevHoursSince8 = prevHours - 8;
      const prevMinutesFraction = prevMinutes / 60;
      const prevTop = (prevHoursSince8 + prevMinutesFraction) * HOUR_HEIGHT;
      const prevHeight = Math.max((prevDuration / 60) * HOUR_HEIGHT, MIN_CARD_HEIGHT);
      const prevBottom = prevTop + prevHeight + CARD_SPACING;
      
      // Se houver sobreposição, ajustar posição
      if (baseTop < prevBottom) {
        baseTop = prevBottom;
      }
    }
    
    return {
      ...apt,
      startTime: start,
      endTime: end,
      adjustedTop: baseTop
    };
  });

  return (
    <div className="flex flex-col h-full bg-background rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={goToPreviousDay}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "EEEE", { locale: ptBR })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={goToNextDay}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Dia da Semana */}
      <div className="flex items-center justify-center py-3 border-b border-border">
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {format(selectedDate, "EEE", { locale: ptBR }).toUpperCase()}
          </div>
          <div className={cn(
            "text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-full",
            isToday(selectedDate) && "bg-primary text-primary-foreground"
          )}>
            {format(selectedDate, "dd")}
          </div>
        </div>
      </div>

      {/* Calendário com Timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {/* Grid de Horários */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-border/50"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              {/* Coluna de Horário */}
              <div className="w-20 flex-shrink-0 pr-3 pt-1 text-right">
                <span className="text-sm text-muted-foreground">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
              
              {/* Área de Agendamentos */}
              <div 
                className="flex-1 relative cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onTimeSlotClick?.(`${String(hour).padStart(2, '0')}:00`)}
              />
            </div>
          ))}

          {/* Linha da Hora Atual - Apenas se for hoje */}
          {currentTimePosition !== null && isToday(selectedDate) && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="flex items-center">
                <div className="w-20 flex items-center justify-end pr-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}

          {/* Cards de Agendamentos - Lista Vertical Simples */}
          <div className="absolute top-0 left-20 right-0 pointer-events-none">
            {appointmentsWithLayout.map((appointment) => {
              const colors = getStatusColor(appointment.status);
              const duration = appointment.service_duration || 30;
              const cardHeight = Math.max((duration / 60) * HOUR_HEIGHT, MIN_CARD_HEIGHT);
              
              return (
                <div
                  key={appointment.id}
                  className={cn(
                    "absolute left-2 right-2 rounded-lg border-l-4 cursor-pointer pointer-events-auto",
                    "transition-all duration-150",
                    colors.bg,
                    colors.border,
                    colors.hover,
                    "shadow-sm hover:shadow-md hover:z-10",
                    "px-2 py-1"
                  )}
                  style={{
                    top: `${appointment.adjustedTop}px`,
                    height: `${cardHeight}px`,
                  }}
                  onClick={() => onAppointmentClick(appointment)}
                >
                  {/* Layout Otimizado - Nome + Horário na mesma linha, Serviço abaixo */}
                  <div className="flex flex-col h-full justify-center gap-0.5">
                    {/* Linha 1: Nome + Horário */}
                    <div className="flex items-center justify-between gap-2">
                      <div className={cn(
                        "font-semibold text-xs leading-tight truncate flex-1",
                        colors.text
                      )}>
                        {appointment.customer_name}
                      </div>
                      <div className={cn(
                        "text-[10px] font-medium tabular-nums opacity-75 flex-shrink-0",
                        colors.text
                      )}>
                        {format(parseISO(appointment.scheduled_at), 'HH:mm')}
                      </div>
                    </div>
                    
                    {/* Linha 2: Serviço */}
                    {appointment.service_name && (
                      <div className={cn(
                        "text-[11px] leading-tight truncate opacity-85",
                        colors.text
                      )}>
                        {appointment.service_name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legenda - Design Moderno */}
      <div className="flex items-center justify-center gap-6 py-3 border-t border-border text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm" />
          <span className="text-muted-foreground font-medium">Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 shadow-sm" />
          <span className="text-muted-foreground font-medium">Pendente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-sm" />
          <span className="text-muted-foreground font-medium">Cancelado</span>
        </div>
      </div>
    </div>
  );
}
