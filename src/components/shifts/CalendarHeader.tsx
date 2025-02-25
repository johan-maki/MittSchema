
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, addWeeks } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

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
      const endDate = addWeeks(currentDate, 1);
      return `${format(currentDate, 'd MMM', { locale: sv })} – ${format(endDate, 'd MMM', { locale: sv })}`;
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
            const newDate = new Date(currentDate);
            if (currentView === 'day') {
              newDate.setDate(newDate.getDate() - 1);
            } else if (currentView === 'week') {
              newDate.setDate(newDate.getDate() - 7);
            } else {
              newDate.setMonth(newDate.getMonth() - 1);
            }
            onDateChange(newDate);
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
            const newDate = new Date(currentDate);
            if (currentView === 'day') {
              newDate.setDate(newDate.getDate() + 1);
            } else if (currentView === 'week') {
              newDate.setDate(newDate.getDate() + 7);
            } else {
              newDate.setMonth(newDate.getMonth() + 1);
            }
            onDateChange(newDate);
          }}
        >
          <ChevronRight className="h-4 w-4 text-purple-700" />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="min-w-[160px] bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-700"
          >
            {getViewLabel()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem 
            className={`${currentView === 'day' ? 'bg-purple-50 text-purple-700' : ''}`}
            onClick={() => onViewChange('day')}
          >
            Dag
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={`${currentView === 'week' ? 'bg-purple-50 text-purple-700' : ''}`}
            onClick={() => onViewChange('week')}
          >
            Vecka
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={`${currentView === 'month' ? 'bg-purple-50 text-purple-700' : ''}`}
            onClick={() => onViewChange('month')}
          >
            Månad
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
