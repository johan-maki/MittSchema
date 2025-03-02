
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shift } from "@/types/shift";
import { format, addMonths, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO, addMinutes } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  ClipboardList,
  BarChart
} from "lucide-react";
import { toast } from "sonner";

type CalendarView = 'day' | 'week' | 'month';

const BasicCalendar = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');

  // Function to get date range based on current view
  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;

    if (currentView === 'day') {
      startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (currentView === 'week') {
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      endDate = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday
    } else {
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
    }

    return { startDate, endDate };
  };

  // Fetch shifts from Supabase
  const { startDate, endDate } = getDateRange();
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('shifts')
          .select(`
            *,
            profiles:employee_id (
              first_name,
              last_name,
              role,
              experience_level
            )
          `)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());

        if (error) {
          toast.error(`Error fetching shifts: ${error.message}`);
          console.error('Error fetching shifts:', error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error('Unexpected error:', error);
        return [];
      }
    }
  });

  // Navigation functions
  const navigatePrevious = () => {
    if (currentView === 'day') {
      setCurrentDate(prev => addDays(prev, -1));
    } else if (currentView === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => addMonths(prev, -1));
    }
  };

  const navigateNext = () => {
    if (currentView === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (currentView === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Format the header title based on current view
  const formatHeaderTitle = () => {
    if (currentView === 'day') {
      return format(currentDate, 'EEEE d MMMM yyyy', { locale: sv });
    } else if (currentView === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'd MMM', { locale: sv })} - ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: sv });
    }
  };

  // Get shifts for a specific day
  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => {
      const shiftDate = parseISO(shift.start_time);
      return isSameDay(shiftDate, day);
    });
  };

  // Render day cell in month view
  const renderDayCell = (day: Date, isCurrentMonth: boolean) => {
    const dayShifts = getShiftsForDay(day);
    const isToday = isSameDay(day, new Date());
    
    return (
      <div 
        key={day.toString()} 
        className={`min-h-24 p-1 border border-gray-200 ${
          !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
        } ${isToday ? 'bg-blue-50' : ''}`}
      >
        <div className="font-medium text-sm mb-1">
          {format(day, 'd')}
        </div>
        <div className="space-y-1 overflow-y-auto max-h-20">
          {dayShifts.map(shift => (
            <div 
              key={shift.id} 
              className={`text-xs p-1 rounded ${
                shift.shift_type === 'day' ? 'bg-blue-100 text-blue-800' : 
                shift.shift_type === 'evening' ? 'bg-purple-100 text-purple-800' : 
                'bg-indigo-100 text-indigo-800'
              }`}
            >
              {format(parseISO(shift.start_time), 'HH:mm')} - 
              {format(parseISO(shift.end_time), 'HH:mm')}
              <div className="truncate">
                {shift.profiles?.first_name} {shift.profiles?.last_name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const dateFormat = 'eee';
    const rows = [];
    
    // Days of week header
    const days = [];
    let day = startDate;
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="text-center font-medium py-2 border-b border-gray-200">
          {format(day, dateFormat, { locale: sv })}
        </div>
      );
      day = addDays(day, 1);
    }
    
    // Date cells
    day = startDate;
    let formattedDate = '';
    while (day <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        week.push(renderDayCell(cloneDay, isSameMonth(day, monthStart)));
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {week}
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7">
          {days}
        </div>
        {rows}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Create the days of the week
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row with day names */}
          <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
            <div className="p-2 font-medium text-gray-500 text-center">Time</div>
            {days.map((day, idx) => (
              <div key={idx} className={`p-2 text-center font-medium ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}>
                {format(day, 'eee d/M', { locale: sv })}
              </div>
            ))}
          </div>
          
          {/* Time grid */}
          <div className="relative">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
                <div className="py-2 px-2 text-sm text-gray-500 text-right border-r">
                  {hour}:00
                </div>
                {days.map((day, dayIndex) => {
                  const hourDate = new Date(day);
                  hourDate.setHours(hour, 0, 0, 0);
                  
                  // Get shifts that overlap with this hour
                  const hourShifts = shifts.filter(shift => {
                    const shiftStart = parseISO(shift.start_time);
                    const shiftEnd = parseISO(shift.end_time);
                    const hourEnd = addMinutes(hourDate, 59);
                    
                    return (
                      isSameDay(shiftStart, day) &&
                      shiftStart <= hourEnd &&
                      shiftEnd >= hourDate
                    );
                  });
                  
                  return (
                    <div key={dayIndex} className="h-12 border-r relative">
                      {hourShifts.map(shift => {
                        const shiftStart = parseISO(shift.start_time);
                        const shiftStartHour = shiftStart.getHours();
                        const shiftStartMinute = shiftStart.getMinutes();
                        
                        // Only render the shift at its start hour
                        if (shiftStartHour === hour) {
                          const shiftEnd = parseISO(shift.end_time);
                          const durationHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
                          
                          // Calculate top position based on minutes
                          const topPosition = (shiftStartMinute / 60) * 100;
                          
                          // Calculate height based on duration (max to the end of the day)
                          const heightPercent = Math.min(durationHours * 100, (24 - shiftStartHour) * 100);
                          
                          return (
                            <div
                              key={shift.id}
                              className={`absolute text-xs p-1 overflow-hidden ${
                                shift.shift_type === 'day' ? 'bg-blue-100 text-blue-800' : 
                                shift.shift_type === 'evening' ? 'bg-purple-100 text-purple-800' : 
                                'bg-indigo-100 text-indigo-800'
                              }`}
                              style={{
                                top: `${topPosition}%`,
                                left: '0',
                                right: '0',
                                height: `${heightPercent}%`,
                                zIndex: 10,
                              }}
                            >
                              {format(shiftStart, 'HH:mm')} - {format(shiftEnd, 'HH:mm')}
                              <div className="truncate">
                                {shift.profiles?.first_name} {shift.profiles?.last_name}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayShifts = getShiftsForDay(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[600px]">
          {hours.map(hour => {
            const hourDate = new Date(currentDate);
            hourDate.setHours(hour, 0, 0, 0);
            
            // Get shifts that overlap with this hour
            const hourShifts = dayShifts.filter(shift => {
              const shiftStart = parseISO(shift.start_time);
              const shiftEnd = parseISO(shift.end_time);
              const hourEnd = addMinutes(hourDate, 59);
              
              return (
                shiftStart <= hourEnd &&
                shiftEnd >= hourDate
              );
            });
            
            return (
              <div key={hour} className="grid grid-cols-[100px_1fr] border-b">
                <div className="py-4 px-2 text-sm text-gray-500 text-right border-r">
                  {hour}:00
                </div>
                <div className="min-h-16 relative">
                  {hourShifts.map(shift => {
                    const shiftStart = parseISO(shift.start_time);
                    const shiftStartHour = shiftStart.getHours();
                    const shiftStartMinute = shiftStart.getMinutes();
                    
                    // Only render the shift at its start hour
                    if (shiftStartHour === hour) {
                      const shiftEnd = parseISO(shift.end_time);
                      const durationHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
                      
                      // Calculate top position based on minutes
                      const topPosition = (shiftStartMinute / 60) * 100;
                      
                      // Calculate height based on duration (max to the end of the day)
                      const heightPercent = Math.min(durationHours * 100, (24 - shiftStartHour) * 100);
                      
                      return (
                        <div
                          key={shift.id}
                          className={`absolute p-2 text-sm overflow-hidden rounded ${
                            shift.shift_type === 'day' ? 'bg-blue-100 text-blue-800' : 
                            shift.shift_type === 'evening' ? 'bg-purple-100 text-purple-800' : 
                            'bg-indigo-100 text-indigo-800'
                          }`}
                          style={{
                            top: `${topPosition}%`,
                            left: '4px',
                            right: '4px',
                            height: `${heightPercent}%`,
                            zIndex: 10,
                          }}
                        >
                          <div className="font-medium">
                            {format(shiftStart, 'HH:mm')} - {format(shiftEnd, 'HH:mm')}
                          </div>
                          <div>
                            {shift.profiles?.first_name} {shift.profiles?.last_name}
                          </div>
                          <div className="text-xs mt-1">
                            {shift.department}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render current view
  const renderCurrentView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (currentView) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="p-4 max-w-[100vw] overflow-hidden">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={navigatePrevious}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              onClick={navigateToday}
            >
              Today
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={navigateNext}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <h2 className="text-xl font-semibold px-4">
              {formatHeaderTitle()}
            </h2>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={currentView === 'day' ? 'default' : 'outline'}
              onClick={() => setCurrentView('day')}
              className="gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              Day
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'outline'}
              onClick={() => setCurrentView('week')}
              className="gap-2"
            >
              <BarChart className="h-4 w-4" />
              Week
            </Button>
            <Button
              variant={currentView === 'month' ? 'default' : 'outline'}
              onClick={() => setCurrentView('month')}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Month
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow overflow-hidden">
          {renderCurrentView()}
        </div>
      </div>
    </AppLayout>
  );
};

export default BasicCalendar;
