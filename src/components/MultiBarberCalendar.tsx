import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, isToday, addDays, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getActiveBarbersByBarbershop } from "@/lib/barbers-queries";

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled";
  service_name?: string;
  service_duration?: number;
  barber_id?: string;
  barber_name?: string;
}

interface Barber {
  id: string;
  name: string;
  photo_url?: string;
}

interface MultiBarberCalendarProps {
  appointments: Appointment[];
  barbershopId: string;
  onAppointmentClick: (appointment: Appointment) => void;
  onTimeSlotClick?: (time: string, barberId?: string) => void;
  onDateChange?: (date: Date) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8h às 21h
const HOUR_HEIGHT = 80;
const MIN_CARD_HEIGHT = 44;
const CARD_SPACING = 4;

export function MultiBarberCalendar({ 
  appointments, 
  barbershopId,
  onAppointmentClick, 
  onTimeSlotClick, 
  onDateChange 
}: MultiBarberCalendarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar barbeiros ativos
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        setLoading(true);
        const activeBarbers = await getActiveBarbersByBarbershop(barbershopId);
        setBarbers(activeBarbers);
        if (activeBarbers.length > 0 && !selectedBarberId) {
          setSelectedBarberId(activeBarbers[0].id);
        }
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
      } finally {
        setLoading(false);
      }
    };

    if (barbershopId) {
      fetchBarbers();
    }
  }, [barbershopId]);

  // Atualizar hora atual a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Filtrar agendamentos do dia selecionado
  const dayAppointments = useMemo(() => {
    return appointments
      .filter(apt => isSameDay(parseISO(apt.scheduled_at), selectedDate))
      .sort((a, b) => parseISO(a.scheduled_at).getTime() - parseISO(b.scheduled_at).getTime());
  }, [appointments, selectedDate]);

  // Agrupar agendamentos por barbeiro
  const appointmentsByBarber = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    
    barbers.forEach(barber => {
      const barberAppointments = dayAppointments.filter(
        apt => apt.barber_id === barber.id
      );
      grouped.set(barber.id, barberAppointments);
    });
    
    return grouped;
  }, [dayAppointments, barbers]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-l-emerald-500',
          hover: 'hover:bg-emerald-900/70',
          text: 'text-emerald-50',
        };
      case 'pending':
        return {
          bg: 'bg-slate-800/40',
          border: 'border-l-slate-400',
          hover: 'hover:bg-slate-700/70',
          text: 'text-slate-200',
        };
      case 'cancelled':
        return {
          bg: 'bg-red-950/30',
          border: 'border-l-red-500',
          hover: 'hover:bg-red-900/60',
          text: 'text-red-200',
        };
      default:
        return {
          bg: 'bg-blue-950/40',
          border: 'border-l-blue-500',
          hover: 'hover:bg-blue-900/70',
          text: 'text-blue-100',
        };
    }
  };

  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const currentTimePosition = getCurrentTimePosition();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando barbeiros...</p>
        </div>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Nenhum barbeiro cadastrado</p>
        </div>
      </div>
    );
  }

  const renderBarberColumn = (barber: Barber) => {
    const barberAppointments = appointmentsByBarber.get(barber.id) || [];
    
    return (
      <div key={barber.id} className="flex-1 min-w-0">
        {/* Header do Barbeiro */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{barber.name}</p>
              <p className="text-xs text-muted-foreground">
                {barberAppointments.length} agendamento{barberAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline do Barbeiro */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="border-b border-border/50"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              <div 
                className="h-full cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onTimeSlotClick?.(`${String(hour).padStart(2, '0')}:00`, barber.id)}
              />
            </div>
          ))}

          {/* Agendamentos */}
          <div className="absolute top-0 left-0 right-0 px-2">
            {barberAppointments.map((appointment) => {
              const start = parseISO(appointment.scheduled_at);
              const hours = start.getHours();
              const minutes = start.getMinutes();
              const hoursSince8 = hours - 8;
              const minutesFraction = minutes / 60;
              const top = (hoursSince8 + minutesFraction) * HOUR_HEIGHT;
              const duration = appointment.service_duration || 30;
              const height = Math.max((duration / 60) * HOUR_HEIGHT, MIN_CARD_HEIGHT);
              
              const colors = getStatusColor(appointment.status);
              
              return (
                <div
                  key={appointment.id}
                  className={cn(
                    "absolute left-2 right-2 rounded-lg border-l-4 cursor-pointer",
                    "transition-all duration-150",
                    colors.bg,
                    colors.border,
                    colors.hover,
                    "shadow-sm hover:shadow-md hover:z-10",
                    "px-2 py-1"
                  )}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                  }}
                  onClick={() => onAppointmentClick(appointment)}
                >
                  <div className="flex flex-col h-full justify-center gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className={cn("font-semibold text-xs leading-tight truncate flex-1", colors.text)}>
                        {appointment.customer_name}
                      </div>
                      <div className={cn("text-[10px] font-medium tabular-nums opacity-75 flex-shrink-0", colors.text)}>
                        {format(start, 'HH:mm')} - {format(new Date(start.getTime() + duration * 60000), 'HH:mm')}
                      </div>
                    </div>
                    {appointment.service_name && (
                      <div className={cn("text-[11px] leading-tight truncate opacity-85", colors.text)}>
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
    );
  };

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

      {/* Seletor de Barbeiro (Mobile) */}
      <div className="md:hidden border-b border-border p-3">
        <div className="flex gap-2 overflow-x-auto">
          {barbers.map((barber) => (
            <Button
              key={barber.id}
              variant={selectedBarberId === barber.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBarberId(barber.id)}
              className="flex-shrink-0"
            >
              <User className="h-4 w-4 mr-2" />
              {barber.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendário */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full">
          {/* Coluna de Horários */}
          <div className="w-20 flex-shrink-0 border-r border-border">
            <div className="h-[52px] border-b border-border" /> {/* Espaço para header */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-border/50 pr-3 pt-1 text-right"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="text-sm text-muted-foreground">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Colunas dos Barbeiros */}
          <div className="flex-1 flex relative">
            {/* Desktop: Todas as colunas */}
            <div className="hidden md:flex flex-1">
              {barbers.map((barber, index) => (
                <div key={barber.id} className={cn("flex-1", index > 0 && "border-l border-border")}>
                  {renderBarberColumn(barber)}
                </div>
              ))}
            </div>

            {/* Mobile: Coluna selecionada */}
            <div className="md:hidden flex-1">
              {selectedBarberId && barbers.find(b => b.id === selectedBarberId) && 
                renderBarberColumn(barbers.find(b => b.id === selectedBarberId)!)
              }
            </div>

            {/* Linha da Hora Atual */}
            {currentTimePosition !== null && isToday(selectedDate) && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${currentTimePosition + 52}px` }}
              >
                <div className="h-0.5 bg-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
