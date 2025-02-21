
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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
      // Format: "6 februari 2025" (date + month + year)
      return format(currentDate, 'd MMMM yyyy', { locale: sv });
    }
    // For week and month views, just show "februari 2025" (month + year)
    return format(currentDate, 'MMMM yyyy', { locale: sv });
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
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
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-lg font-semibold">
          {getFormattedDate()}
        </div>
        <Button
          variant="outline"
          size="icon"
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
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={currentView === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('day')}
        >
          Dag
        </Button>
        <Button
          variant={currentView === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('week')}
        >
          Vecka
        </Button>
        <Button
          variant={currentView === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('month')}
        >
          Månad
        </Button>
      </div>
    </div>
  );
};
