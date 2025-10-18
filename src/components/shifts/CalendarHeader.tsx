
import { Button } from "@/components/ui/button";
import { format, addWeeks, isToday, startOfWeek, addDays, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, ArrowUp, ArrowDown } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg bg-white hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 transition-all"
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
          <ChevronLeft className="h-4 w-4 text-gray-700" />
        </Button>

        <div className="min-w-[180px] sm:min-w-[220px] text-center px-3 sm:px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <span className="text-sm sm:text-base text-gray-900 font-semibold">
            {getFormattedDate()}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg bg-white hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 transition-all"
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
          <ChevronRight className="h-4 w-4 text-gray-700" />
        </Button>

        {/* Today button */}
        <Button 
          variant={isToday(currentDate) ? "secondary" : "ghost"} 
          size="sm"
          onClick={() => onDateChange(new Date())} 
          className={`ml-1 h-9 transition-all ${
            isToday(currentDate) 
              ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium' 
              : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50'
          }`}
          disabled={isToday(currentDate)}
        >
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Idag
        </Button>
      </div>

      {/* Modern View Toggle */}
      <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('day')}
          className={`h-8 px-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
            currentView === 'day'
              ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Dag
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('week')}
          className={`h-8 px-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
            currentView === 'week'
              ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ArrowUp className="w-3.5 h-3.5 mr-1.5 rotate-90" />
          Vecka
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('month')}
          className={`h-8 px-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
            currentView === 'month'
              ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ArrowDown className="w-3.5 h-3.5 mr-1.5" />
          Månad
        </Button>
      </div>
    </div>
  );
};
