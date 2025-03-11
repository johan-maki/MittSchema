
import { format, parseISO, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sun, Moon, Clock } from "lucide-react";
import { eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";
import type { StaffingIssue } from "../utils/staffingUtils";

interface ScheduleCalendarViewProps {
  shifts: Shift[];
  profiles: Profile[];
  staffingIssues: StaffingIssue[];
  currentDate: Date;
}

export const ScheduleCalendarView = ({ 
  shifts, 
  profiles,
  staffingIssues,
  currentDate
}: ScheduleCalendarViewProps) => {
  // Get all days in the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Group shifts by date for easier display
  const shiftsByDate: Record<string, Shift[]> = {};
  shifts.forEach(shift => {
    const date = format(parseISO(shift.start_time), 'yyyy-MM-dd');
    if (!shiftsByDate[date]) {
      shiftsByDate[date] = [];
    }
    shiftsByDate[date].push(shift);
  });
  
  // Group staffing issues by date for easier display
  const issuesByDate: Record<string, StaffingIssue[]> = {};
  staffingIssues.forEach(issue => {
    if (!issuesByDate[issue.date]) {
      issuesByDate[issue.date] = [];
    }
    issuesByDate[issue.date].push(issue);
  });
  
  // Get shift type display properties
  const getShiftTypeProps = (type: string) => {
    switch (type) {
      case 'day':
        return { 
          bgColor: 'bg-blue-50 text-blue-700 border-blue-200', 
          icon: <Sun className="h-3 w-3" /> 
        };
      case 'evening':
        return { 
          bgColor: 'bg-purple-50 text-purple-700 border-purple-200', 
          icon: <Clock className="h-3 w-3" /> 
        };
      case 'night':
        return { 
          bgColor: 'bg-orange-50 text-orange-700 border-orange-200', 
          icon: <Moon className="h-3 w-3" /> 
        };
      default:
        return { 
          bgColor: 'bg-gray-50 text-gray-700 border-gray-200', 
          icon: <Clock className="h-3 w-3" /> 
        };
    }
  };
  
  // Get shift type in Swedish
  const getShiftTypeInSwedish = (type: string) => {
    switch (type) {
      case 'day': return 'Dagpass';
      case 'evening': return 'Kvällspass';
      case 'night': return 'Nattpass';
      default: return type;
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {format(currentDate, 'MMMM yyyy', { locale: sv })}
      </h3>
      
      <div className="grid grid-cols-7 gap-2 text-center font-medium text-sm text-gray-600 pb-1">
        <div>Måndag</div>
        <div>Tisdag</div>
        <div>Onsdag</div>
        <div>Torsdag</div>
        <div>Fredag</div>
        <div className="text-blue-600">Lördag</div>
        <div className="text-blue-600">Söndag</div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {/* Add empty cells for the days before the month starts */}
        {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-28 bg-gray-50 rounded-md opacity-50"></div>
        ))}
        
        {/* Calendar days */}
        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayShifts = shiftsByDate[dateStr] || [];
          const dayIssues = issuesByDate[dateStr] || [];
          const hasIssues = dayIssues.length > 0;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          
          return (
            <Card 
              key={dateStr} 
              className={`h-28 overflow-hidden transition-all duration-200 hover:shadow-md
                ${hasIssues ? 'border-amber-500' : ''}
                ${isWeekend ? 'bg-gray-50' : ''}`}
            >
              <div className={`p-1 border-b flex justify-between items-center ${isWeekend ? 'bg-gray-100' : ''}`}>
                <div className={`font-medium text-sm ${isWeekend ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                {hasIssues && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {dayIssues.length}
                  </Badge>
                )}
              </div>
              <div className="p-1 space-y-1 text-xs overflow-y-auto h-[80px]">
                {dayShifts.length === 0 ? (
                  <div className="text-gray-400 italic text-center pt-2">Inga pass</div>
                ) : (
                  dayShifts.slice(0, 3).map((shift, idx) => {
                    const employee = profiles.find(p => p.id === shift.employee_id);
                    const { bgColor, icon } = getShiftTypeProps(shift.shift_type);
                    
                    return (
                      <div 
                        key={`${shift.id}-${idx}`} 
                        className={`flex items-center ${bgColor} rounded-sm px-1.5 py-0.5 border truncate`}
                      >
                        <span className="mr-1">{icon}</span>
                        <div className="truncate">
                          {employee?.first_name || 'Unknown'} - {getShiftTypeInSwedish(shift.shift_type)}
                        </div>
                      </div>
                    );
                  })
                )}
                {dayShifts.length > 3 && (
                  <div className="text-gray-500 text-xs text-center">+{dayShifts.length - 3} fler</div>
                )}
              </div>
            </Card>
          );
        })}
        
        {/* Add empty cells for the days after the month ends */}
        {Array.from({ length: monthEnd.getDay() === 0 ? 0 : 7 - monthEnd.getDay() }).map((_, index) => (
          <div key={`empty-end-${index}`} className="h-28 bg-gray-50 rounded-md opacity-50"></div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 text-sm pt-2 flex-wrap">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span className="text-gray-700">Dagpass</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
          <span className="text-gray-700">Kvällspass</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span className="text-gray-700">Nattpass</span>
        </div>
        <div className="flex items-center ml-auto">
          <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Bemanningsproblem</span>
          </div>
        </div>
      </div>
    </div>
  );
};
