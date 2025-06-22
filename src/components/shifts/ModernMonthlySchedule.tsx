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
    <div className="space-y-6 p-4 bg-gradient-to-br from-purple-50/30 to-blue-50/30 max-h-[calc(100vh-150px)] overflow-y-auto">
      {/* Enhanced Month Header */}
      <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-purple-100 sticky top-0 z-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent mb-2">
          {format(date, 'MMMM yyyy', { locale: sv })}
        </h1>
        <p className="text-lg text-gray-600 mb-3">Översikt för hela månaden</p>
        <div className="flex items-center justify-center space-x-4">
          <Badge variant="outline" className="flex items-center space-x-2 bg-white/80 border-purple-200">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="font-medium">{shifts.length} pass denna månad</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-2 bg-white/80 border-blue-200">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium">
              {new Set(shifts.filter(s => s.profiles).map(s => s.profiles.first_name + s.profiles.last_name)).size} medarbetare
            </span>
          </Badge>
        </div>
      </div>

      {/* Enhanced Calendar Grid */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Enhanced Weekday Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            {['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'].map((day, index) => (
              <div key={day} className={`p-4 text-center font-semibold border-r border-white/20 last:border-r-0 ${index >= 5 ? 'bg-black/10' : ''}`}>
                <div className="hidden sm:block">{day}</div>
                <div className="sm:hidden">{day.slice(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Enhanced Calendar Days */}
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
                    className={`min-h-[120px] p-2 border-r last:border-r-0 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${
                      !isCurrentMonthDay 
                        ? 'bg-gray-50 text-gray-400' 
                        : isTodayDate 
                        ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 shadow-md' 
                        : isWeekendDay 
                        ? 'bg-gradient-to-br from-purple-25 to-pink-25 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* Enhanced Day Number */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-sm font-bold ${
                          isTodayDate
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-sm'
                            : !isCurrentMonthDay
                            ? 'text-gray-400'
                            : isWeekendDay
                            ? 'text-purple-600 bg-purple-100 w-7 h-7 rounded-full flex items-center justify-center'
                            : 'text-gray-900 bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      
                      {dayShifts.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-bold ${
                            dayShifts.length > 3 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {dayShifts.length} pass
                        </Badge>
                      )}
                    </div>

                    {/* Enhanced Shifts Display */}
                    <div className="space-y-2">
                      {Object.entries(shiftsByType).map(([shiftType, shiftsOfType]) => {
                        if (shiftsOfType.length === 0) return null;
                        
                        const Icon = shiftTypeIcons[shiftType as keyof typeof shiftTypeIcons];
                        const colors = {
                          day: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200',
                          evening: 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border border-rose-200', 
                          night: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
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
                                className={`group flex items-center space-x-2 p-2 rounded-lg text-xs font-medium ${colors[shiftType as keyof typeof colors]} hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 relative ${
                                  shift.is_published 
                                    ? 'ring-1 ring-green-200' 
                                    : 'border border-dashed border-amber-300 bg-opacity-70'
                                }`}
                              >
                                {/* Publication status indicator */}
                                {shift.is_published && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
                                )}
                                
                                <div className="flex-shrink-0">
                                  <Icon className="h-3 w-3" />
                                </div>
                                <Avatar className="h-5 w-5 ring-1 ring-white">
                                  <AvatarFallback className={`text-xs bg-white/80 font-bold ${!shift.is_published ? 'opacity-80' : ''}`}>
                                    {getEmployeeInitials(shift)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={`truncate font-medium ${!shift.is_published ? 'text-amber-700' : ''}`}>
                                  {shift.profiles ? 
                                    `${shift.profiles.first_name}` : 
                                    'Okänd'
                                  }
                                  {!shift.is_published && <span className="ml-1 text-xs opacity-75">(utkast)</span>}
                                </span>
                              </div>
                            ))}
                            {shiftsOfType.length > 2 && (
                              <div className={`text-xs p-2 rounded-lg font-bold text-center ${colors[shiftType as keyof typeof colors]} opacity-75`}>
                                +{shiftsOfType.length - 2} till
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Enhanced Add shift button for empty days */}
                      {dayShifts.length === 0 && isCurrentMonthDay && (
                        <div className="flex items-center justify-center h-full min-h-[60px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50 border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-lg transition-all duration-200"
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
