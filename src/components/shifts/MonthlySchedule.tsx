
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { Profile } from "@/types/profile";
import { Shift } from "@/types/shift";
import { Calendar, Clock, Sun, Moon, Sunset } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MonthlyScheduleProps {
  date: Date;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }>;
  profiles: Profile[];
}

export const MonthlySchedule = ({ date, shifts, profiles }: MonthlyScheduleProps) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getShiftForEmployeeAndDay = (employeeId: string, day: Date) => {
    return shifts.find(shift => 
      shift.employee_id === employeeId && 
      isSameDay(new Date(shift.start_time), day)
    );
  };

  const getShiftTypeIcon = (shiftType: 'day' | 'evening' | 'night') => {
    switch (shiftType) {
      case 'day':
        return <Sun className="h-4 w-4 text-blue-500" />;
      case 'evening':
        return <Sunset className="h-4 w-4 text-orange-500" />;
      case 'night':
        return <Moon className="h-4 w-4 text-purple-500" />;
    }
  };

  const getShiftTypeColor = (shiftType: 'day' | 'evening' | 'night') => {
    switch (shiftType) {
      case 'day':
        return 'bg-blue-50 border-blue-200';
      case 'evening':
        return 'bg-orange-50 border-orange-200';
      case 'night':
        return 'bg-purple-50 border-purple-200';
    }
  };

  return (
    <div className="min-w-[1000px]">
      <div className="grid grid-cols-[200px,1fr]">
        <div className="border-b border-r border-gray-200 p-2 font-medium text-gray-500">
          Anställd
        </div>
        <div className="grid grid-cols-[repeat(31,minmax(100px,1fr))]">
          {daysInMonth.map((day) => (
            <div
              key={day.toISOString()}
              className="border-b border-r border-gray-200 p-2 font-medium text-gray-500 text-center"
            >
              {format(day, 'd EEE', { locale: sv })}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[200px,1fr]">
        {profiles.map((profile) => (
          <div key={profile.id} className="contents">
            <div className="border-b border-r border-gray-200 p-2 font-medium">
              {profile.first_name} {profile.last_name}
            </div>
            <div className="grid grid-cols-[repeat(31,minmax(100px,1fr))]">
              {daysInMonth.map((day) => {
                const shift = getShiftForEmployeeAndDay(profile.id, day);
                return (
                  <div
                    key={`${profile.id}-${day.toISOString()}`}
                    className="border-b border-r border-gray-200 p-1"
                  >
                    {shift && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                rounded-md p-1 text-xs border
                                ${getShiftTypeColor(shift.shift_type)}
                                cursor-pointer transition-colors
                              `}
                            >
                              <div className="flex items-center gap-1">
                                {getShiftTypeIcon(shift.shift_type)}
                                <span>
                                  {format(new Date(shift.start_time), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {format(new Date(shift.start_time), 'HH:mm')} - 
                                {format(new Date(shift.end_time), 'HH:mm')}
                              </div>
                              {shift.notes && (
                                <div className="text-sm text-gray-500">
                                  {shift.notes}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
