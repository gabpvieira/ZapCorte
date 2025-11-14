import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, User, Phone, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, addWeeks, subWeeks, isToday as isTodayFn } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration: number;
}

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled";
  service?: Service;
}

interface WeeklyCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8h às 22h
const HALF_HOURS = Array.from({ length: 30 }, (_, i) => 8 + (i * 0.5)); // 8h às 22h em intervalos de 30min
const PIXELS_PER_HOUR = 48; // 48px por hora (compacto)

// Sistema de cores rico e saturado - ZapCorte Premium
const statusColors = {
  pending: {
    bg: "bg-[#4D3D1A]", // Amarelo escuro rico
    border: "border-l-[#FFC107]",
    borderStyle: "border-l-4 border-solid",
    text: "text-[#FFF9E6]",
    hover: "hover:bg-[#5C4920]"
  },
  confirmed: {
    bg: "bg-[#1A4D3C]", // Verde escuro rico
    border: "border-l-[#00C853]",
    borderStyle: "border-l-4 border-solid",
    text: "text-[#E8F5E9]",
    hover: "hover:bg-[#225542]"
  },
  cancelled: {
    bg: "bg-[#2A2A2A]", // Cinza escuro
    border: "border-l-[#666666]",
    borderStyle: "border-l-4 border-dashed", // Borda pontilhada para cancelado
    text: "text-[#999999]",
    hover: "hover:bg-[#333333]"
  },
};

// Função para extrair iniciais do nome
const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
};

// Função para calcular horário de término
const getEndTime = (startTime: string, duration: number) => {
  const start = parseISO(startTime);
  const end = new Date(start.getTime() + duration * 60000);
  return format(end, 'HH:mm');
};

export function WeeklyCalendar({ appointments, onAppointmentClick, onTimeSlotClick }: WeeklyCalendarProps) {
  const [selectedDayDate, setSelectedDayDate] = useState(new Date()); // Data selecionada
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);

  const weekDays = useMemo(() => {
    return [selectedDayDate]; // Sempre modo dia
  }, [selectedDayDate]);

  // Scroll automático para hora atual quando montar
  useMemo(() => {
    if (scrollContainerRef) {
      setTimeout(() => {
        const currentHour = new Date().getHours();
        const hourIndex = currentHour - 8; // 8h é o início
        if (hourIndex >= 0) {
          const scrollPosition = hourIndex * 48 - 100; // 48px por hora, -100px para centralizar
          scrollContainerRef.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });
        }
      }, 100);
    }
  }, [scrollContainerRef]);

  const goToPreviousDay = () => {
    setSelectedDayDate(prev => addDays(prev, -1));
  };

  const goToNextDay = () => {
    setSelectedDayDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDayDate(new Date());
  };

  // Obter todos os agendamentos de um dia específico
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.scheduled_at);
      return isSameDay(aptDate, day);
    });
  };

  // Detectar sobreposição de agendamentos e organizar em colunas (organograma)
  const organizeAppointmentsInColumns = (dayAppointments: Appointment[]) => {
    if (dayAppointments.length === 0) return [];

    // Ordenar por horário de início
    const sorted = [...dayAppointments].sort((a, b) => 
      parseISO(a.scheduled_at).getTime() - parseISO(b.scheduled_at).getTime()
    );

    // Calcular fim de cada agendamento
    const getEndTime = (apt: Appointment) => {
      const start = parseISO(apt.scheduled_at);
      const duration = apt.service?.duration || 30;
      return start.getTime() + duration * 60000;
    };

    // Organizar em colunas
    const columns: Appointment[][] = [];
    
    sorted.forEach(apt => {
      const aptStart = parseISO(apt.scheduled_at).getTime();
      const aptEnd = getEndTime(apt);
      
      // Encontrar primeira coluna disponível
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const lastInColumn = column[column.length - 1];
        const lastEnd = getEndTime(lastInColumn);
        
        // Se não há sobreposição, adicionar nesta coluna
        if (aptStart >= lastEnd) {
          column.push(apt);
          placed = true;
          break;
        }
      }
      
      // Se não encontrou coluna disponível, criar nova
      if (!placed) {
        columns.push([apt]);
      }
    });

    // Retornar agendamentos com informação de coluna
    const result: Array<{ appointment: Appointment; column: number; totalColumns: number }> = [];
    const totalColumns = columns.length;
    
    columns.forEach((column, columnIndex) => {
      column.forEach(apt => {
        result.push({
          appointment: apt,
          column: columnIndex,
          totalColumns: totalColumns
        });
      });
    });

    return result;
  };

  // Calcular posição absoluta do agendamento - estilo iOS Calendar
  const calculateAppointmentPosition = (appointment: Appointment, column: number, totalColumns: number) => {
    const aptDate = parseISO(appointment.scheduled_at);
    const hour = aptDate.getHours();
    const minutes = aptDate.getMinutes();
    const duration = appointment.service?.duration || 30;
    
    // Converter para decimal (ex: 14:30 = 14.5)
    const startTime = hour + (minutes / 60);
    const durationHours = duration / 60;
    
    // Calcular posição (8h = 0)
    const topPosition = (startTime - 8) * PIXELS_PER_HOUR;
    const cardHeight = durationHours * PIXELS_PER_HOUR;
    
    // Altura mínima de 50px para garantir que o conteúdo seja visível
    const MIN_HEIGHT = 50;
    const finalHeight = Math.max(cardHeight, MIN_HEIGHT);
    
    // Calcular largura e posição horizontal baseado nas colunas
    const columnWidth = 100 / totalColumns;
    const leftPercent = (column * columnWidth);
    const widthPercent = columnWidth;
    
    return {
      top: `${topPosition}px`,
      height: `${finalHeight}px`,
      left: `${leftPercent}%`,
      width: `calc(${widthPercent}% - 2px)`, // Gap de 2px entre cards
      actualDuration: duration, // Duração real para referência
    };
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border overflow-hidden">
      {/* Header - Navegação de Dia */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-card flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToPreviousDay}
            className="h-8 w-8 p-0 hover:bg-primary/10 text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col items-center">
            <h3 className="text-base font-bold text-foreground">
              {isTodayFn(selectedDayDate) ? 'Hoje' : format(selectedDayDate, "EEEE", { locale: ptBR })}
            </h3>
            <span className="text-sm text-muted-foreground">
              {format(selectedDayDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToNextDay}
            className="h-8 w-8 p-0 hover:bg-primary/10 text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Botão Hoje - apenas quando não está no dia atual */}
        {!isTodayFn(selectedDayDate) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="h-7 px-3 text-xs font-medium border-primary text-primary hover:bg-primary/10"
          >
            Voltar para Hoje
          </Button>
        )}
      </div>

      {/* Calendário - Design Apple */}
      <div 
        ref={setScrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-background scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        <div className="w-full">
          {/* Header do dia - Estilo minimalista */}
          <div className="grid sticky top-0 bg-card z-10 border-b border-border/50 grid-cols-[48px_1fr]">
            {/* Coluna vazia para horários */}
            <div className="border-r border-border/30" />
            
            {weekDays.map((day, index) => {
              const isToday = isTodayFn(day);
              return (
                <div
                  key={index}
                  className={cn(
                    "py-2 text-center",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {format(day, "EEE", { locale: ptBR }).substring(0, 3).toUpperCase()}
                  </div>
                  <div className={cn(
                    "text-xl font-semibold mx-auto",
                    isToday 
                      ? "bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center" 
                      : "text-foreground"
                  )}>
                    {format(day, "dd")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid de horários - Estilo iOS Calendar */}
          <div className="relative">
            {/* Grid de linhas a cada 30 minutos */}
            {HALF_HOURS.map((time, index) => {
              const hour = Math.floor(time);
              const isFullHour = time % 1 === 0;
              
              return (
                <div key={time} className="grid h-[24px] grid-cols-[48px_1fr]">
                  {/* Coluna de horário - ultra-compacta */}
                  <div className="pr-1.5 flex justify-end items-start pt-0.5">
                    {isFullHour && (
                      <span className="text-[10px] text-[#666666]/80 font-medium leading-none tabular-nums">
                        {String(hour).padStart(2, '0')}:00
                      </span>
                    )}
                  </div>

                  {/* Coluna do dia - apenas background */}
                  {weekDays.map((day, dayIndex) => {
                    const isToday = isTodayFn(day);
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "relative cursor-pointer hover:bg-white/5 transition-colors",
                          isToday && "bg-primary/5"
                        )}
                        style={{
                          borderTop: isFullHour ? '1px solid #333333' : '1px solid #27272A',
                        }}
                        onClick={() => {
                          const timeString = `${String(hour).padStart(2, '0')}:${isFullHour ? '00' : '30'}`;
                          onTimeSlotClick(day, timeString);
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Linha de hora atual - compacta */}
            {(() => {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinutes = now.getMinutes();
              
              if (currentHour >= 8 && currentHour < 22 && isTodayFn(selectedDayDate)) {
                const currentTime = currentHour + (currentMinutes / 60);
                const topPosition = (currentTime - 8) * PIXELS_PER_HOUR;
                
                return (
                  <motion.div 
                    className="absolute left-0 right-0 z-30 pointer-events-none" 
                    style={{ top: `${topPosition}px` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Círculo indicador menor */}
                    <div className="absolute left-[44px] -translate-y-1/2">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-md shadow-red-500/50"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    {/* Linha vermelha mais fina */}
                    <div className="absolute left-[48px] right-0 h-[1px] bg-red-500/80" />
                  </motion.div>
                );
              }
              return null;
            })()}

            {/* Agendamentos com design adaptativo por tamanho */}
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDay(day);
              const organizedAppointments = organizeAppointmentsInColumns(dayAppointments);

              return (
                <div
                  key={`appointments-${dayIndex}`}
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: "48px",
                    width: "calc(100% - 48px)",
                  }}
                >
                  {organizedAppointments.map(({ appointment: apt, column, totalColumns }) => {
                    const position = calculateAppointmentPosition(apt, column, totalColumns);
                    const colors = statusColors[apt.status];
                    
                    return (
                      <TooltipProvider key={apt.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.005 }}
                              className={cn(
                                "absolute rounded-md cursor-pointer transition-all border-l-4 pointer-events-auto shadow-sm",
                                colors.bg,
                                colors.border,
                                colors.text
                              )}
                              style={{
                                top: position.top,
                                height: position.height,
                                left: position.left,
                                width: position.width,
                                padding: '8px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                gap: '4px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAppointmentClick(apt);
                              }}
                            >
                              {/* Nome do cliente - SF Pro Text, 14px, weight 600 */}
                              <div 
                                className="text-sm font-semibold leading-snug"
                                style={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: '1.3',
                                }}
                              >
                                {apt.customer_name}
                              </div>
                              
                              {/* Serviço + Horário - SF Pro Text, 12px, weight 400 */}
                              <div 
                                className="text-xs leading-snug"
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  color: '#CCCCCC',
                                  lineHeight: '1.3',
                                }}
                              >
                                {apt.service?.name || 'Serviço'} • {format(parseISO(apt.scheduled_at), "HH:mm")}
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-card border-border">
                            <div className="space-y-2 p-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{apt.customer_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 text-primary" />
                                <span>{apt.customer_phone}</span>
                              </div>
                              {apt.service && (
                                <div className="text-sm text-muted-foreground">
                                  <strong className="text-foreground">Serviço:</strong> {apt.service.name} ({apt.service.duration} min)
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground">
                                <strong className="text-foreground">Horário:</strong> {format(parseISO(apt.scheduled_at), "HH:mm")}
                              </div>
                              <div className="flex items-center gap-2 pt-1 border-t border-border">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  apt.status === "confirmed" && "bg-primary",
                                  apt.status === "pending" && "bg-yellow-500",
                                  apt.status === "cancelled" && "bg-gray-500"
                                )} />
                                <span className="text-xs text-muted-foreground">
                                  {apt.status === "confirmed" ? "Confirmado" : apt.status === "pending" ? "Pendente" : "Cancelado"}
                                </span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legenda - Paleta ZapCorte */}
      <div className="flex items-center justify-center gap-6 py-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary shadow-sm" />
          <span className="text-xs text-muted-foreground font-medium">Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500 shadow-sm" />
          <span className="text-xs text-muted-foreground font-medium">Pendente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500 shadow-sm" />
          <span className="text-xs text-muted-foreground font-medium">Cancelado</span>
        </div>
      </div>
    </div>
  );
}
