
import React, { useState } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useShiftData } from '@/hooks/useShiftData';
import { AppLayout } from '@/components/AppLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ROLES, ROLE_COLORS } from '@/components/shifts/schedule.constants';

const viewOptions = [
  { id: 'day', label: 'Dag' },
  { id: 'week', label: 'Vecka' },
  { id: 'month', label: 'Månad' },
];

const BasicCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const { data: shifts = [], isLoading } = useShiftData(currentDate, currentView);

  const nextDate = () => {
    if (currentView === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (currentView === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
      });
    }
  };

  const prevDate = () => {
    if (currentView === 'day') {
      setCurrentDate(prev => addDays(prev, -1));
    } else if (currentView === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() - 1);
        return newDate;
      });
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      days.push({
        date: day,
        dayName: format(day, 'EEEE', { locale: sv }),
        dayNumber: format(day, 'd'),
      });
    }
    return days;
  };

  const getMonthDays = () => {
    const startDay = startOfMonth(currentDate);
    const endDay = endOfMonth(currentDate);
    const startWeek = startOfWeek(startDay, { weekStartsOn: 1 });

    const days = [];
    let day = startWeek;

    while (day <= endDay || days.length % 7 !== 0) {
      days.push({
        date: new Date(day),
        dayName: format(day, 'EEE', { locale: sv }),
        dayNumber: format(day, 'd'),
        inMonth: isSameMonth(day, currentDate),
      });
      day = addDays(day, 1);

      // Stop after 6 weeks to prevent endless loop
      if (days.length >= 42) break;
    }

    return days;
  };

  const getShiftsForDay = (date: Date, role: string) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return (
        isSameDay(shiftDate, date) &&
        ((role === 'Läkare' && shift.shift_type === 'day') ||
          (role === 'Sjuksköterska' && shift.shift_type === 'evening') ||
          (role === 'Undersköterska' && shift.shift_type === 'night'))
      );
    });
  };

  const renderShift = (shift: any) => {
    const startTime = new Date(shift.start_time);
    const endTime = new Date(shift.end_time);
    
    return (
      <div 
        key={shift.id}
        className={`p-2 mb-1 text-sm rounded ${
          shift.shift_type === 'day' 
            ? 'bg-blue-50 border border-blue-200'
            : shift.shift_type === 'evening' 
              ? 'bg-green-50 border border-green-200'
              : 'bg-purple-50 border border-purple-200'
        }`}
      >
        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
        <div className="font-medium">
          {shift.profiles?.first_name} {shift.profiles?.last_name}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="grid grid-cols-[200px,1fr] bg-white border rounded-md">
        <div className="border-b border-r p-2 font-medium text-gray-400">
          Roll
        </div>
        <div className="border-b p-4 text-center">
          <div className="font-semibold">{format(currentDate, 'EEEE', { locale: sv })}</div>
          <div className="text-lg">{format(currentDate, 'd')}</div>
        </div>

        {ROLES.map(role => (
          <React.Fragment key={role}>
            <div className="border-b border-r p-2 font-medium">
              <span className={ROLE_COLORS[role].text}>{role}</span>
            </div>
            <div className="border-b p-2 min-h-[100px]">
              {getShiftsForDay(currentDate, role).map(renderShift)}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[200px,1fr] bg-white border rounded-md">
            <div className="border-b border-r p-2 font-medium text-gray-400">
              Roll
            </div>
            <div className="grid grid-cols-7">
              {weekDays.map(({ dayName, dayNumber }) => (
                <div key={dayName} className="border-b border-r p-2 text-center">
                  <div className="text-sm font-medium text-gray-400">{dayName}</div>
                  <div className="text-lg">{dayNumber}</div>
                </div>
              ))}
            </div>

            {ROLES.map(role => (
              <React.Fragment key={role}>
                <div className="border-b border-r p-2 font-medium">
                  <span className={ROLE_COLORS[role].text}>{role}</span>
                </div>
                <div className="grid grid-cols-7">
                  {weekDays.map(({ date }) => (
                    <div key={date.toISOString()} className="border-b border-r p-1 min-h-[100px]">
                      {getShiftsForDay(date, role).map(renderShift)}
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays();
    
    return (
      <div className="bg-white border rounded-md">
        <div className="grid grid-cols-7">
          {['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'].map(day => (
            <div key={day} className="border-b p-2 text-center font-medium text-gray-400">
              {day}
            </div>
          ))}
          
          {monthDays.map(({ date, dayNumber, inMonth }) => (
            <div 
              key={date.toISOString()} 
              className={`border p-1 h-32 overflow-auto ${inMonth ? '' : 'bg-gray-50 text-gray-400'}`}
            >
              <div className="text-right mb-1">{dayNumber}</div>
              <div className="space-y-1">
                {ROLES.map(role => (
                  <React.Fragment key={`${date}-${role}`}>
                    {getShiftsForDay(date, role).map(shift => {
                      const startTime = new Date(shift.start_time);
                      const endTime = new Date(shift.end_time);
                      
                      return (
                        <div 
                          key={shift.id}
                          className={`p-1 text-xs rounded ${
                            role === 'Läkare' 
                              ? 'bg-blue-50 border border-blue-200' 
                              : role === 'Sjuksköterska' 
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-purple-50 border border-purple-200'
                          }`}
                        >
                          <div className="truncate">
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </div>
                          <div className="truncate font-medium">
                            {shift.profiles?.first_name} {shift.profiles?.last_name}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Basic Calendar</h1>
            
            <div className="flex space-x-2">
              {viewOptions.map(option => (
                <Button
                  key={option.id}
                  variant={currentView === option.id ? "default" : "outline"}
                  onClick={() => setCurrentView(option.id as 'day' | 'week' | 'month')}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={prevDate}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-medium">
                {currentView === 'day' && format(currentDate, 'd MMMM yyyy', { locale: sv })}
                {currentView === 'week' && (
                  `${format(getWeekDays()[0].date, 'd MMMM', { locale: sv })} – ${format(getWeekDays()[6].date, 'd MMMM yyyy', { locale: sv })}`
                )}
                {currentView === 'month' && format(currentDate, 'MMMM yyyy', { locale: sv })}
              </div>
              
              <Button variant="outline" size="sm" onClick={nextDate}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-gray-500">Laddar schema...</div>
            </div>
          ) : (
            <div>
              {currentView === 'day' && renderDayView()}
              {currentView === 'week' && renderWeekView()}
              {currentView === 'month' && renderMonthView()}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BasicCalendar;
