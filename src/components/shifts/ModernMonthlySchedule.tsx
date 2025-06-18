import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, parseISO, startOfWeek, endOfWeek, isToday, isWeekend } from "date-fns";
import { sv } from "date-fns/locale";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
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
  Moon
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

  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => {
      const shiftDate = parseISO(shift.start_time);
      return isSameDay(shiftDate, day);
    });
  };

  const getShiftsByType = (dayShifts: Shift[]) => {
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

  const chunks = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const weeks = chunks(calendarDays, 7);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 min-h-[calc(100vh-200px)]">
      {/* Month Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {format(date, 'MMMM yyyy', { locale: sv })}
        </h1>
        <div className="flex items-center justify-center space-x-4">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{shifts.length} pass denna månad</span>
          </Badge>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day) => (
              <div key={day} className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0">
                {day}
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

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] p-2 border-r last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !isCurrentMonthDay ? 'bg-gray-100 text-gray-400' : ''
                    } ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''} ${
                      isWeekendDay && isCurrentMonthDay ? 'bg-purple-25' : ''
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${
                          isTodayDate
                            ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                            : !isCurrentMonthDay
                            ? 'text-gray-400'
                            : isWeekendDay
                            ? 'text-purple-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      
                      {dayShifts.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayShifts.length}
                        </Badge>
                      )}
                    </div>

                    {/* Shifts */}
                    <div className="space-y-1">
                      {Object.entries(shiftsByType).map(([shiftType, shiftsOfType]) => {
                        if (shiftsOfType.length === 0) return null;
                        
                        const Icon = shiftTypeIcons[shiftType as keyof typeof shiftTypeIcons];
                        const colors = {
                          day: 'bg-yellow-100 text-yellow-800',
                          evening: 'bg-orange-100 text-orange-800', 
                          night: 'bg-blue-100 text-blue-800'
                        };

                        return (
                          <div key={shiftType} className="space-y-1">
                            {shiftsOfType.slice(0, 2).map((shift) => (
                              <div
                                key={shift.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftClick(shift);
                                }}
                                className={`flex items-center space-x-1 p-1 rounded text-xs ${colors[shiftType as keyof typeof colors]} hover:opacity-80 transition-opacity`}
                              >
                                <Icon className="h-3 w-3 flex-shrink-0" />
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-xs bg-white/50">
                                    {getEmployeeInitials(shift)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">
                                  {shift.profiles ? 
                                    `${shift.profiles.first_name}` : 
                                    'Okänd'
                                  }
                                </span>
                              </div>
                            ))}
                            {shiftsOfType.length > 2 && (
                              <div className={`text-xs p-1 rounded ${colors[shiftType as keyof typeof colors]}`}>
                                +{shiftsOfType.length - 2} till
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Add shift button for empty days */}
                      {dayShifts.length === 0 && isCurrentMonthDay && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-8 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDayClick(day);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Lägg till
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

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
