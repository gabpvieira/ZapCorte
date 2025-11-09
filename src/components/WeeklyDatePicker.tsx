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
    <div className="w-full">
      {/* Week Navigation Header */}
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousWeek}
          className="p-2 h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="text-white font-semibold text-sm md:text-base">
          Semana de {formatWeekRange()}
        </h3>
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextWeek}
          className="p-2 h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days List - Vertical */}
      <div className="space-y-2">
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
                w-full p-4 rounded-lg text-sm font-medium transition-all duration-200
                flex items-center justify-between
                ${isSelected 
                  ? 'bg-green-600 text-white shadow-md' 
                  : isTodayDate
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : isDisabled
                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
                  : 'bg-zinc-800 text-white hover:bg-green-600 border border-zinc-700'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold min-w-[2rem]">
                  {format(date, 'd')}
                </span>
                <span className="text-base">
                  {format(date, 'EEEE', { locale: ptBR })}
                </span>
              </div>
              <span className="text-sm opacity-70">
                {format(date, 'dd/MM', { locale: ptBR })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile scroll hint */}
      <div className="md:hidden text-center mt-2">
        <p className="text-xs text-zinc-400">
          Deslize horizontalmente para ver mais opções
        </p>
      </div>
    </div>
  );
};

export default WeeklyDatePicker;