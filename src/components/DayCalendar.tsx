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
const HOUR_HEIGHT = 80; // Altura de cada hora em pixels

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
      height: `${Math.max(height, 60)}px`, // Altura mínima de 60px
    };
  };

  // Cores por status - Verde (confirmado), Cinza (pendente), Vermelho (cancelado)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10',
          border: 'border-l-emerald-500',
          hover: 'hover:from-emerald-500/30 hover:to-emerald-600/20',
          text: 'text-emerald-100',
          badge: 'bg-emerald-500/30 text-emerald-100'
        };
      case 'pending':
        return {
          bg: 'bg-gradient-to-r from-slate-500/20 to-slate-600/10',
          border: 'border-l-slate-500',
          hover: 'hover:from-slate-500/30 hover:to-slate-600/20',
          text: 'text-slate-300',
          badge: 'bg-slate-500/30 text-slate-300'
        };
      case 'cancelled':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-red-600/10',
          border: 'border-l-red-500',
          hover: 'hover:from-red-500/30 hover:to-red-600/20',
          text: 'text-red-200',
          badge: 'bg-red-500/30 text-red-200'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10',
          border: 'border-l-blue-500',
          hover: 'hover:from-blue-500/30 hover:to-blue-600/20',
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

  // Filtrar agendamentos do dia selecionado
  const dayAppointments = appointments.filter(apt => 
    isSameDay(parseISO(apt.scheduled_at), selectedDate)
  );

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

          {/* Cards de Agendamentos - Design Premium */}
          <div className="absolute top-0 left-20 right-0 pointer-events-none">
            {dayAppointments.map((appointment) => {
              const style = getAppointmentStyle(appointment);
              const colors = getStatusColor(appointment.status);
              
              return (
                <div
                  key={appointment.id}
                  className={cn(
                    "absolute left-2 right-2 rounded-lg border-l-4 p-3 cursor-pointer pointer-events-auto transition-all backdrop-blur-sm",
                    colors.bg,
                    colors.border,
                    colors.hover,
                    "shadow-lg hover:shadow-xl"
                  )}
                  style={style}
                  onClick={() => onAppointmentClick(appointment)}
                >
                  <div className="flex flex-col gap-1.5">
                    {/* Nome do Cliente */}
                    <div className={cn("font-bold text-sm truncate", colors.text)}>
                      {appointment.customer_name}
                    </div>
                    
                    {/* Serviço e Horário */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        colors.badge
                      )}>
                        {appointment.service_name}
                      </span>
                      <span className={cn("text-xs font-medium", colors.text)}>
                        {format(parseISO(appointment.scheduled_at), 'HH:mm')}
                      </span>
                    </div>
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
