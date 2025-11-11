import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  addWeeks, 
  subWeeks, 
  isSameDay, 
  isToday, 
  isBefore, 
  startOfDay 
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeeklyDatePickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
}

const WeeklyDatePicker = ({ selectedDate, onDateSelect, minDate }: WeeklyDatePickerProps) => {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());

  // Calculate week start (Sunday) and end (Saturday)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // 0 = Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  
  // Get all days of the current week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  // Check if a date is disabled (before minDate)
  const isDateDisabled = (date: Date) => {
    if (!minDate) return false;
    return isBefore(startOfDay(date), startOfDay(minDate));
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onDateSelect(date);
  };

  // Get CSS classes for a day button
  const getDayButtonClasses = (date: Date) => {
    const baseClasses = "flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 min-h-[70px] cursor-pointer";
    
    if (isDateDisabled(date)) {
      return `${baseClasses} bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50`;
    }
    
    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-green-600 text-white shadow-lg transform scale-105`;
    }
    
    if (isToday(date)) {
      return `${baseClasses} bg-zinc-700 text-white border-2 border-green-500 hover:bg-green-600`;
    }
    
    return `${baseClasses} bg-zinc-800 text-white hover:bg-green-600 hover:transform hover:scale-105`;
  };

  // Format week range for header
  const formatWeekRange = () => {
    const startFormatted = format(weekStart, "dd/MM", { locale: ptBR });
    const endFormatted = format(weekEnd, "dd/MM", { locale: ptBR });
    return `${startFormatted} a ${endFormatted}`;
  };

  return (
    <div className="w-full p-4">
      {/* Week Navigation Header - Premium */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousWeek}
          className="h-10 w-10 rounded-full hover:bg-primary/10 hover:scale-110 transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <h3 className="font-semibold text-base">
            {format(currentWeek, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatWeekRange()}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextWeek}
          className="h-10 w-10 rounded-full hover:bg-primary/10 hover:scale-110 transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Days List - Premium Design */}
      <div className="space-y-2.5">
        {weekDays.map((date, index) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const isDisabled = isDateDisabled(date);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={`
                w-full p-4 rounded-xl text-sm font-medium transition-all duration-300
                flex items-center justify-between group relative overflow-hidden
                ${isSelected 
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]' 
                  : isTodayDate
                  ? 'bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20'
                  : isDisabled
                  ? 'bg-muted/30 text-muted-foreground cursor-not-allowed opacity-40'
                  : 'bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]'
                }
              `}
            >
              {/* Hover Effect Background */}
              {!isDisabled && !isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              )}
              
              <div className="flex items-center gap-4 relative z-10">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg
                  ${isSelected 
                    ? 'bg-white/20' 
                    : isTodayDate 
                    ? 'bg-primary/20' 
                    : 'bg-muted/50'
                  }
                `}>
                  {format(date, 'd')}
                </div>
                <div className="text-left">
                  <div className="font-semibold capitalize">
                    {format(date, 'EEEE', { locale: ptBR })}
                  </div>
                  <div className={`text-xs ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>
                    {format(date, "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                </div>
              </div>
              
              {/* Badge: Mostra "Hoje" apenas no dia atual quando NÃO está selecionado */}
              {isTodayDate && !isSelected && (
                <span className="relative z-10 text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-semibold">
                  Hoje
                </span>
              )}
              
              {/* Badge: Mostra "Selecionado" quando está selecionado (mesmo se for hoje) */}
              {isSelected && (
                <span className="relative z-10 text-xs px-2 py-1 rounded-full bg-white/20 font-semibold">
                  {isTodayDate ? '✓ Hoje' : '✓ Selecionado'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Info Footer - Legenda */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          {/* Primeiro badge: Mostra "Hoje" ou a data selecionada */}
          {selectedDate && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary" />
              <span>
                {isToday(selectedDate) 
                  ? 'Hoje' 
                  : format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                }
              </span>
            </div>
          )}
          
          {/* Segundo badge: Sempre "Selecionado" quando há seleção */}
          {selectedDate && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-primary to-primary/80" />
              <span>Selecionado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyDatePicker;