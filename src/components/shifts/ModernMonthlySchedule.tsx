import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, parseISO, startOfWeek, endOfWeek, isToday, isWeekend } from "date-fns";
import { sv } from "date-fns/locale";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { isSwedishHoliday } from "@/utils/holidays";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { ShiftForm } from "./ShiftForm";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Users, 
  Calendar,
  Clock,
  Sun,
  Sunset,
  Moon,
  DollarSign
} from "lucide-react";

interface ModernMonthlyScheduleProps {
  date: Date;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
  profiles: Profile[];
}

export const ModernMonthlySchedule = ({ date, shifts, profiles }: ModernMonthlyScheduleProps) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  // Get full weeks that overlap with the month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddShiftDialogOpen, setIsAddShiftDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditShiftDialogOpen, setIsEditShiftDialogOpen] = useState(false);
  const { toast } = useToast();

  const getShiftsForDay = (day: Date): Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }> => {
    const dayShifts = shifts.filter((shift) => {
      // Use UTC date components to avoid timezone conversion issues
      const shiftDate = new Date(shift.start_time);
      const dayYear = day.getFullYear();
      const dayMonth = day.getMonth();
      const dayDate = day.getDate();
      
      // Use UTC methods to get the actual date components from the shift timestamp
      const shiftYear = shiftDate.getUTCFullYear();
      const shiftMonth = shiftDate.getUTCMonth();
      const shiftDateNum = shiftDate.getUTCDate();
      
      const isMatch = (dayYear === shiftYear && dayMonth === shiftMonth && dayDate === shiftDateNum);
      
      return isMatch;
    });
    
    return dayShifts;
  };  const getShiftsByType = (dayShifts: Shift[]) => {
    return {
      day: dayShifts.filter(s => s.shift_type === 'day'),
      evening: dayShifts.filter(s => s.shift_type === 'evening'),
      night: dayShifts.filter(s => s.shift_type === 'night')
    };
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsAddShiftDialogOpen(true);
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditShiftDialogOpen(true);
  };

  const getEmployeeInitials = (shift: Shift) => {
    if (shift.profiles) {
      return `${shift.profiles.first_name[0]}${shift.profiles.last_name[0]}`;
    }
    return '??';
  };

  const shiftTypeIcons = {
    day: Sun,
    evening: Sunset,
    night: Moon
  };

  const isCurrentMonth = (day: Date) => {
    return day >= monthStart && day <= monthEnd;
  };

  const chunks = <T,>(array: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  // Calculate total cost for the month
  const totalCost = shifts.reduce((sum, shift) => {
    if (shift.profiles) {
      const hours = 8; // All shifts are 8 hours
      const hourlyRate = 1000; // Default 1000 SEK (removed dynamic rate for now)
      return sum + (hours * hourlyRate);
    }
    return sum;
  }, 0);

  const weeks = chunks(calendarDays, 7);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Streamlined Month Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {format(date, 'MMMM yyyy', { locale: sv })}
            </h1>
            <p className="text-indigo-100 text-sm">Översikt för hela månaden</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-colors">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium text-sm">{shifts.length} pass</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-colors">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium text-sm">
                {new Set(shifts.filter(s => s.profiles).map(s => s.profiles.first_name + s.profiles.last_name)).size} medarbetare
              </span>
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-colors">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="font-medium text-sm">{totalCost.toLocaleString('sv-SE')} SEK</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Streamlined Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 sticky top-0 z-10">
            {['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'].map((day, index) => (
              <div key={day} className={`py-3 px-2 text-center font-semibold text-sm border-r border-gray-200 last:border-r-0 ${index >= 5 ? 'bg-slate-100' : 'bg-white'}`}>
                <div className="hidden sm:block text-gray-700">{day}</div>
                <div className="sm:hidden text-gray-700">{day.slice(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day) => {
                const dayShifts = getShiftsForDay(day);
                const shiftsByType = getShiftsByType(dayShifts);
                const isCurrentMonthDay = isCurrentMonth(day);
                const isTodayDate = isToday(day);
                const isWeekendDay = isWeekend(day);
                const holiday = isSwedishHoliday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`relative min-h-[110px] p-2 border-r last:border-r-0 cursor-pointer transition-all duration-150 ${
                      !isCurrentMonthDay 
                        ? 'bg-slate-50 text-slate-400' 
                        : isTodayDate 
                        ? 'bg-indigo-50 border-2 border-indigo-400 -m-px' 
                        : holiday
                        ? 'bg-red-50 hover:bg-red-100'
                        : isWeekendDay 
                        ? 'bg-slate-50 hover:bg-slate-100' 
                        : 'bg-white hover:bg-slate-50'
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* Refined Day Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-semibold ${
                          isTodayDate
                            ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                            : !isCurrentMonthDay
                            ? 'text-slate-400'
                            : holiday
                            ? 'text-red-700 bg-red-200 w-6 h-6 rounded-full flex items-center justify-center'
                            : isWeekendDay
                            ? 'text-slate-600 bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center'
                            : 'text-slate-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      
                      {/* Holiday indicator */}
                      {holiday && isCurrentMonthDay && (
                        <div className="absolute top-1 right-1 group/holiday">
                          <div className="w-2 h-2 bg-red-600 rounded-full" />
                          <div className="absolute right-0 top-6 hidden group-hover/holiday:block bg-red-700 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                            {holiday.name}
                          </div>
                        </div>
                      )}
                      
                      {dayShifts.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] h-5 px-1.5 font-semibold ${
                            dayShifts.length >= 4 
                              ? 'bg-red-100 text-red-700 border-red-200' 
                              : dayShifts.length >= 2
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {dayShifts.length}
                        </Badge>
                      )}
                    </div>

                    {/* Compact Shifts Display */}
                    <div className="space-y-1">
                      {Object.entries(shiftsByType).map(([shiftType, shiftsOfType]) => {
                        if (shiftsOfType.length === 0) return null;
                        
                        const Icon = shiftTypeIcons[shiftType as keyof typeof shiftTypeIcons];
                        const colors = {
                          day: 'bg-amber-50 text-amber-800 border-amber-200',
                          evening: 'bg-rose-50 text-rose-800 border-rose-200', 
                          night: 'bg-blue-50 text-blue-800 border-blue-200'
                        };

                        return (
                          <div key={shiftType} className="space-y-0.5">
                            {shiftsOfType.slice(0, 2).map((shift) => (
                              <div
                                key={shift.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftClick(shift);
                                }}
                                className={`group flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium border ${colors[shiftType as keyof typeof colors]} hover:shadow-sm transition-all cursor-pointer ${
                                  shift.is_published 
                                    ? 'opacity-100' 
                                    : 'opacity-75 border-dashed'
                                }`}
                              >
                                {shift.is_published && (
                                  <div className="w-1 h-1 bg-emerald-500 rounded-full flex-shrink-0" />
                                )}
                                
                                <Icon className="h-3 w-3 flex-shrink-0" />
                                <Avatar className="h-5 w-5 flex-shrink-0">
                                  <AvatarFallback className="text-[10px] bg-white/80 font-bold">
                                    {getEmployeeInitials(shift)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate flex-1 font-semibold">
                                  {shift.profiles ? shift.profiles.first_name : 'Okänd'}
                                </span>
                              </div>
                            ))}
                            {shiftsOfType.length > 2 && (
                              <div className={`text-[10px] px-1.5 py-0.5 rounded text-center font-semibold ${colors[shiftType as keyof typeof colors]} opacity-60`}>
                                +{shiftsOfType.length - 2}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Refined Add shift button */}
                      {dayShifts.length === 0 && isCurrentMonthDay && (
                        <div className="flex items-center justify-center h-full min-h-[50px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-[11px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-200 hover:border-indigo-300 rounded transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDayClick(day);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Lägg till
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add Shift Dialog */}
      <Dialog open={isAddShiftDialogOpen} onOpenChange={setIsAddShiftDialogOpen}>
        <DialogContent>
          {selectedDate && (
            <ShiftForm
              isOpen={isAddShiftDialogOpen}
              onOpenChange={setIsAddShiftDialogOpen}
              defaultValues={{
                start_time: `${format(selectedDate, 'yyyy-MM-dd')}T09:00`,
                end_time: `${format(selectedDate, 'yyyy-MM-dd')}T17:00`,
                shift_type: 'day'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={isEditShiftDialogOpen} onOpenChange={setIsEditShiftDialogOpen}>
        <DialogContent>
          {selectedShift && (
            <ShiftForm
              isOpen={isEditShiftDialogOpen}
              onOpenChange={setIsEditShiftDialogOpen}
              defaultValues={{
                start_time: selectedShift.start_time.slice(0, 16),
                end_time: selectedShift.end_time.slice(0, 16),
                department: selectedShift.department || "",
                notes: selectedShift.notes || "",
                employee_id: selectedShift.employee_id || "",
                shift_type: selectedShift.shift_type
              }}
              editMode
              shiftId={selectedShift.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
