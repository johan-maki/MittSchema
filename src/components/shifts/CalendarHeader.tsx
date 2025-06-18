
import { Button } from "@/components/ui/button";
import { format, addWeeks, isToday, startOfWeek, addDays, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  currentView: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
}

export const CalendarHeader = ({
  currentDate,
  onDateChange,
  currentView,
  onViewChange,
}: CalendarHeaderProps) => {
  const getFormattedDate = () => {
    if (currentView === 'day') {
      return format(currentDate, 'EEEE d MMMM yyyy', { locale: sv });
    } else if (currentView === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'd MMM', { locale: sv })} – ${format(weekEnd, 'd MMM', { locale: sv })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: sv });
  };

  const getViewLabel = () => {
    switch (currentView) {
      case 'day':
        return 'Dag';
      case 'week':
        return 'Vecka';
      case 'month':
        return 'Månad';
      default:
        return 'Visa';
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-lg bg-purple-50 hover:bg-purple-100 border-purple-100"
          onClick={() => {
            if (currentView === 'day') {
              onDateChange(subDays(currentDate, 1));
            } else if (currentView === 'week') {
              onDateChange(subWeeks(currentDate, 1));
            } else {
              onDateChange(subMonths(currentDate, 1));
            }
          }}
        >
          <ChevronLeft className="h-4 w-4 text-purple-700" />
        </Button>

        <div className="min-w-[200px] text-center px-4 py-2 bg-purple-50 rounded-lg">
          <span className="text-lg text-purple-700 font-medium">
            {getFormattedDate()}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-lg bg-purple-50 hover:bg-purple-100 border-purple-100"
          onClick={() => {
            if (currentView === 'day') {
              onDateChange(addDays(currentDate, 1));
            } else if (currentView === 'week') {
              onDateChange(addWeeks(currentDate, 1));
            } else {
              onDateChange(addMonths(currentDate, 1));
            }
          }}
        >
          <ChevronRight className="h-4 w-4 text-purple-700" />
        </Button>

        {/* Idag button */}
        <Button 
          variant={isToday(currentDate) ? "outline" : "ghost"} 
          size="sm"
          onClick={() => onDateChange(new Date())} 
          className={`ml-2 ${isToday(currentDate) ? 'bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-700' : 'text-muted-foreground hover:text-purple-700'}`}
          disabled={isToday(currentDate)}
        >
          {isToday(currentDate) ? 'Idag' : 'Gå till idag'}
        </Button>
      </div>

      {/* View Toggle Buttons */}
      <div className="flex items-center bg-purple-50 rounded-lg p-1 border border-purple-100">
        <button
          onClick={() => onViewChange('day')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            currentView === 'day'
              ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
              : 'text-purple-600 hover:text-purple-700 hover:bg-purple-100'
          }`}
        >
          Dag
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            currentView === 'week'
              ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
              : 'text-purple-600 hover:text-purple-700 hover:bg-purple-100'
          }`}
        >
          Vecka
        </button>
        <button
          onClick={() => onViewChange('month')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            currentView === 'month'
              ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
              : 'text-purple-600 hover:text-purple-700 hover:bg-purple-100'
          }`}
        >
          Månad
        </button>
      </div>
    </div>
  );
};
