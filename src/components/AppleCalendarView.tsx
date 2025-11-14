import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  customer_name: string;
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  service: {
    name: string;
    duration: number;
    price: number;
  } | null;
}

interface AppleCalendarViewProps {
  appointments: Appointment[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const AppleCalendarView: React.FC<AppleCalendarViewProps> = ({
  appointments,
  selectedDate = new Date(),
  onDateChange
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Altura reduzida para visualização compacta
  const HOUR_HEIGHT = 48; // Reduzido de 60px para 48px

  // Atualizar hora atual a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada 1 minuto

    return () => clearInterval(timer);
  }, []);

  // Scroll automático para hora atual (apenas uma vez)
  useEffect(() => {
    if (scrollContainerRef.current && !hasScrolled.current && isToday(currentDate)) {
      const currentHour = currentTime.getHours();
      if (currentHour >= 8 && currentHour <= 22) {
        setTimeout(() => {
          const hourIndex = currentHour - 8;
          const scrollPosition = hourIndex * HOUR_HEIGHT - 100; // Centralizar na tela
          scrollContainerRef.current?.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
          hasScrolled.current = true;
        }, 300);
      }
    }
  }, [currentDate, currentTime, HOUR_HEIGHT]);

  // Horários de 8h às 22h
  const hours = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => i + 8); // 8h até 22h
  }, []);

  // Filtrar agendamentos do dia selecionado
  const dayAppointments = useMemo(() => {
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.scheduled_at), currentDate)
    );
  }, [appointments, currentDate]);

  // Calcular posição do agendamento no grid (com altura reduzida)
  const getAppointmentStyle = (scheduledAt: string, duration: number) => {
    const date = parseISO(scheduledAt);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    
    // Posição vertical baseada na hora (usando HOUR_HEIGHT)
    const top = (hour - 8) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
    
    // Altura baseada na duração (usando HOUR_HEIGHT)
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return { top, height };
  };

  // Calcular posição da linha de hora atual (com altura reduzida)
  const getCurrentTimePosition = () => {
    if (!isToday(currentDate)) return null;
    
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    
    if (hour < 8 || hour >= 22) return null;
    
    return (hour - 8) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  const currentTimePosition = getCurrentTimePosition();

  const handlePreviousDay = () => {
    const newDate = addDays(currentDate, -1);
    setCurrentDate(newDate);
    hasScrolled.current = false;
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
    hasScrolled.current = false;
    onDateChange?.(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    hasScrolled.current = false;
    onDateChange?.(today);
  };

  // Sistema de cores rico e saturado para melhor identificação
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-[#1A4D3C]', // Verde escuro rico
          border: 'border-l-[#00C853]',
          text: 'text-[#E8F5E9]',
          hover: 'hover:bg-[#225542]',
          borderStyle: 'border-l-4 border-solid'
        };
      case 'pending':
        return {
          bg: 'bg-[#4D3D1A]', // Amarelo escuro rico
          border: 'border-l-[#FFC107]',
          text: 'text-[#FFF9E6]',
          hover: 'hover:bg-[#5C4920]',
          borderStyle: 'border-l-4 border-solid'
        };
      case 'cancelled':
        return {
          bg: 'bg-[#2A2A2A]', // Cinza escuro
          border: 'border-l-[#666666]',
          text: 'text-[#999999]',
          hover: 'hover:bg-[#333333]',
          borderStyle: 'border-l-4 border-dashed' // Borda pontilhada para cancelado
        };
      default:
        return {
          bg: 'bg-[#2A2A2A]',
          border: 'border-l-[#666666]',
          text: 'text-[#999999]',
          hover: 'hover:bg-[#333333]',
          borderStyle: 'border-l-4 border-solid'
        };
    }
  };

  // Extrair iniciais do nome (primeiras 2 letras)
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Calcular horário de término
  const getEndTime = (startTime: string, duration: number) => {
    const start = parseISO(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return format(end, 'HH:mm');
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C0C] rounded-2xl overflow-hidden border border-[#27272A]">
      {/* Header compacto estilo Apple */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#18181B]/80 backdrop-blur-sm border-b border-[#27272A]">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousDay}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#27272A]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-xs font-medium text-gray-300 hover:text-white hover:bg-[#27272A] px-2.5 h-7"
          >
            Hoje
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextDay}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#27272A]"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-sm font-semibold text-white capitalize leading-tight">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </h2>
          <p className="text-[11px] text-gray-400 leading-tight">
            {format(currentDate, 'd MMM yyyy', { locale: ptBR })}
          </p>
        </div>

        <div className="w-20" /> {/* Spacer para centralizar */}
      </div>

      {/* Grid de horários compacto estilo Apple */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#27272A] scrollbar-track-transparent"
      >
        <div className="relative">
          {/* Grid de horas - altura reduzida */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-[#27272A]/20"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              {/* Coluna de horários ultra-compacta */}
              <div className="w-11 flex-shrink-0 pr-1.5 pt-0.5">
                <span className="text-[10px] font-medium text-gray-500/80 leading-none tabular-nums">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>

              {/* Área de agendamentos */}
              <div className="flex-1 relative">
                {/* Linha divisória ultra-sutil */}
                <div className="absolute top-0 left-0 right-0 h-px bg-[#27272A]/20" />
              </div>
            </div>
          ))}

          {/* Agendamentos com design adaptativo por tamanho */}
          <div className="absolute top-0 left-11 right-0 bottom-0 pointer-events-none">
            <AnimatePresence>
              {dayAppointments.map((appointment) => {
                const { top, height } = getAppointmentStyle(
                  appointment.scheduled_at,
                  appointment.service?.duration || 30
                );
                const duration = appointment.service?.duration || 30;
                const styles = getStatusStyles(appointment.status);
                const startTime = format(parseISO(appointment.scheduled_at), 'HH:mm');
                const endTime = getEndTime(appointment.scheduled_at, duration);
                
                // Determinar tipo de card baseado na duração
                const isSmall = duration < 45; // < 45min
                const isMedium = duration >= 45 && duration <= 90; // 45min - 1h30
                const isLarge = duration > 90; // > 1h30

                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "absolute left-0.5 right-0.5 rounded-md pointer-events-auto cursor-pointer",
                      "transition-all duration-200 hover:shadow-lg hover:z-10 hover:-translate-y-0.5",
                      "font-['Inter','-apple-system','sans-serif']",
                      styles.bg,
                      styles.border,
                      styles.text,
                      styles.hover,
                      styles.borderStyle,
                      appointment.status === 'cancelled' && 'opacity-60'
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 32)}px`,
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Agendamento de ${appointment.customer_name}, ${appointment.service?.name || 'Serviço'}, às ${startTime}, status: ${appointment.status === 'confirmed' ? 'confirmado' : appointment.status === 'pending' ? 'pendente' : 'cancelado'}`}
                  >
                    {/* CARD PEQUENO (< 45min): Apenas iniciais + horário */}
                    {isSmall && (
                      <div className="h-full flex flex-col items-center justify-center px-2 py-1">
                        <p className="text-base font-bold leading-none tracking-tight">
                          {getInitials(appointment.customer_name)}
                        </p>
                        <p className="text-[10px] font-medium opacity-80 mt-1 tabular-nums">
                          {startTime}
                        </p>
                      </div>
                    )}

                    {/* CARD MÉDIO (45min - 1h30): Nome + Serviço + Horário */}
                    {isMedium && (
                      <div className="h-full flex flex-col justify-between px-1.5 py-1 overflow-hidden">
                        <div className="space-y-0.5">
                          <p 
                            className="text-xs font-semibold leading-tight truncate"
                            style={{ letterSpacing: '-0.01em' }}
                          >
                            {appointment.customer_name.split(' ')[0]}
                          </p>
                          {appointment.service && (
                            <p 
                              className="text-[10px] font-normal opacity-85 leading-tight truncate"
                            >
                              {appointment.service.name}
                            </p>
                          )}
                        </div>
                        <p className="text-[9px] font-medium opacity-70 tabular-nums">
                          {startTime}
                        </p>
                      </div>
                    )}

                    {/* CARD GRANDE (> 1h30): Nome completo + Ícone + Serviço + Duração */}
                    {isLarge && (
                      <div className="h-full flex flex-col justify-between px-2 py-1.5 overflow-hidden">
                        <div className="space-y-1">
                          <p 
                            className="text-xs font-semibold leading-tight"
                            style={{ letterSpacing: '-0.01em' }}
                          >
                            {appointment.customer_name}
                          </p>
                          {appointment.service && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px]">💈</span>
                              <p className="text-[11px] font-normal opacity-90 leading-tight truncate">
                                {appointment.service.name}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-medium opacity-80 tabular-nums">
                          {startTime} - {endTime}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Linha de hora atual compacta (estilo Apple) */}
          {currentTimePosition !== null && (
            <motion.div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Círculo indicador menor */}
              <div className="absolute left-[42px] -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-md shadow-red-500/50"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              
              {/* Linha vermelha mais fina */}
              <div className="absolute left-11 right-0 h-[1px] bg-red-500/80" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer com estatísticas visuais */}
      {dayAppointments.length > 0 && (
        <div className="px-3 py-1.5 bg-[#18181B]/80 backdrop-blur-sm border-t border-[#27272A]">
          <div className="flex items-center justify-center gap-2.5 text-[10px] text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-[#00C853]" />
              <span className="font-medium">{dayAppointments.filter(a => a.status === 'confirmed').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-[#FFC107]" />
              <span className="font-medium">{dayAppointments.filter(a => a.status === 'pending').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-[#666666] border border-dashed border-gray-500" />
              <span className="font-medium">{dayAppointments.filter(a => a.status === 'cancelled').length}</span>
            </div>
            <span className="text-gray-500 mx-0.5">•</span>
            <span className="font-semibold text-gray-300">{dayAppointments.length} total</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppleCalendarView;
