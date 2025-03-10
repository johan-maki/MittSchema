
import React, { useState } from 'react';
import { format, addMonths, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCalendarDays } from '@/utils/calendarUtils';

// Define a proper type for the calendar day
interface CalendarDay {
  date: Date;
  day: number;
  month: number;
  isCurrentMonth: boolean;
}

export const MonthView = () => {
  const [month, setMonth] = useState<Date>(new Date(2025, 0, 1));

  // Get days for the current month view
  const days: CalendarDay[] = getCalendarDays(month).map(date => ({
    date,
    day: date.getDate(),
    month: date.getMonth(),
    isCurrentMonth: date.getMonth() === month.getMonth()
  }));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold capitalize">
          {format(month, 'MMMM yyyy', { locale: sv })}
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(prev => addMonths(prev, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(prev => addMonths(prev, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day, i) => (
          <div
            key={i}
            className="h-8 flex items-center justify-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((calendarDay, i) => {
          return (
            <div
              key={i}
              className={cn(
                'h-24 border p-1 overflow-hidden',
                calendarDay.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              )}
            >
              <div className="text-right text-sm">{calendarDay.day}</div>
              <div className="mt-1 space-y-1">
                {/* Shift indicators would go here */}
                {calendarDay.isCurrentMonth && calendarDay.day % 3 === 0 && (
                  <div className="text-xs bg-blue-100 rounded px-1 py-0.5 truncate">
                    {calendarDay.day % 2 === 0 ? 'Dagpass' : 'Kvällspass'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
