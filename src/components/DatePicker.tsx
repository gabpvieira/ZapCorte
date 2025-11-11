import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  disabledDates?: Date[];
  className?: string;
}

export function DatePicker({ 
  selectedDate, 
  onSelectDate, 
  minDate = new Date(),
  disabledDates = [],
  className 
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Preencher dias vazios no início
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, minDate) || isBefore(date, today)) return true;
    return disabledDates.some(disabledDate => isSameDay(date, disabledDate));
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className={cn("w-full bg-white dark:bg-zinc-900 rounded-xl border border-border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          type="button"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          type="button"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {daysInMonth.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isDisabled = isDateDisabled(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isDisabled && onSelectDate(day)}
              disabled={isDisabled}
              type="button"
              className={cn(
                "aspect-square rounded-lg text-sm font-medium transition-all",
                "hover:bg-muted hover:scale-105",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentDay && !isSelected && "border-2 border-primary",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                !isSelected && !isDisabled && "hover:bg-primary/10"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-primary" />
          <span>Hoje</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Selecionado</span>
        </div>
      </div>
    </div>
  );
}
