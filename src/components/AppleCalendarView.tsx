import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, startOfDay, addDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
          const scrollPosition = hourIndex * 60 - 120; // 60px por hora, centralizar
          scrollContainerRef.current?.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
          hasScrolled.current = true;
        }, 300);
      }
    }
  }, [currentDate, currentTime]);

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

  // Calcular posição do agendamento no grid
  const getAppointmentStyle = (scheduledAt: string, duration: number) => {
    const date = parseISO(scheduledAt);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    
    // Posição vertical baseada na hora
    const top = (hour - 8) * 60 + (minutes / 60) * 60;
    
    // Altura baseada na duração
    const height = (duration / 60) * 60;
    
    return { top, height };
  };

  // Calcular posição da linha de hora atual
  const getCurrentTimePosition = () => {
    if (!isToday(currentDate)) return null;
    
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    
    if (hour < 8 || hour >= 22) return null;
    
    return (hour - 8) * 60 + (minutes / 60) * 60;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500/90 border-blue-400';
      case 'pending':
        return 'bg-amber-500/90 border-amber-400';
      case 'cancelled':
        return 'bg-gray-500/90 border-gray-400';
      default:
        return 'bg-gray-500/90 border-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C0C] rounded-2xl overflow-hidden border border-[#27272A]">
      {/* Header estilo Apple */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#18181B]/80 backdrop-blur-sm border-b border-[#27272A]">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousDay}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#27272A]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-sm font-medium text-gray-300 hover:text-white hover:bg-[#27272A] px-3"
          >
            Hoje
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextDay}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#27272A]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </h2>
          <p className="text-sm text-gray-400">
            {format(currentDate, 'd MMMM yyyy', { locale: ptBR })}
          </p>
        </div>

        <div className="w-24" /> {/* Spacer para centralizar */}
      </div>

      {/* Grid de horários estilo Apple */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#27272A] scrollbar-track-transparent"
      >
        <div className="relative">
          {/* Grid de horas */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-[#27272A]/30"
              style={{ height: '60px' }}
            >
              {/* Coluna de horários (compacta, estilo Apple) */}
              <div className="w-14 flex-shrink-0 pr-2 pt-1">
                <span className="text-[11px] font-medium text-gray-500 leading-none">
                  {hour.toString().padStart(2, '0')}
                </span>
              </div>

              {/* Área de agendamentos */}
              <div className="flex-1 relative">
                {/* Linha divisória sutil */}
                <div className="absolute top-0 left-0 right-0 h-px bg-[#27272A]/30" />
              </div>
            </div>
          ))}

          {/* Agendamentos posicionados absolutamente */}
          <div className="absolute top-0 left-14 right-0 bottom-0 pointer-events-none">
            <AnimatePresence>
              {dayAppointments.map((appointment) => {
                const { top, height } = getAppointmentStyle(
                  appointment.scheduled_at,
                  appointment.service?.duration || 30
                );
                const statusColor = getStatusColor(appointment.status);

                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "absolute left-1 right-1 rounded-lg border-l-4 pointer-events-auto cursor-pointer",
                      "transition-all duration-200 hover:shadow-lg hover:z-10",
                      statusColor
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 30)}px`
                    }}
                  >
                    <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
                      <div>
                        <p className="text-xs font-semibold text-white leading-tight truncate">
                          {appointment.customer_name}
                        </p>
                        {appointment.service && (
                          <p className="text-[10px] text-white/80 leading-tight truncate">
                            {appointment.service.name}
                          </p>
                        )}
                      </div>
                      <p className="text-[10px] text-white/70 leading-none">
                        {format(parseISO(appointment.scheduled_at), 'HH:mm')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Linha de hora atual (estilo Apple) */}
          {currentTimePosition !== null && (
            <motion.div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Círculo indicador */}
              <div className="absolute left-[52px] -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              
              {/* Linha vermelha */}
              <div className="absolute left-14 right-0 h-[1px] bg-red-500" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer com contador de agendamentos */}
      {dayAppointments.length > 0 && (
        <div className="px-4 py-2 bg-[#18181B]/80 backdrop-blur-sm border-t border-[#27272A]">
          <p className="text-xs text-gray-400 text-center">
            {dayAppointments.length} agendamento{dayAppointments.length > 1 ? 's' : ''} hoje
          </p>
        </div>
      )}
    </div>
  );
};

export default AppleCalendarView;
