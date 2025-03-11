
import { format, parseISO, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
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
      
      <div className="grid grid-cols-7 gap-2 text-center font-medium text-sm">
        <div>Måndag</div>
        <div>Tisdag</div>
        <div>Onsdag</div>
        <div>Torsdag</div>
        <div>Fredag</div>
        <div>Lördag</div>
        <div>Söndag</div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {/* Add empty cells for the days before the month starts */}
        {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-28 bg-gray-50 rounded-md"></div>
        ))}
        
        {/* Calendar days */}
        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayShifts = shiftsByDate[dateStr] || [];
          const dayIssues = issuesByDate[dateStr] || [];
          const hasIssues = dayIssues.length > 0;
          
          return (
            <Card key={dateStr} className={`h-28 overflow-hidden ${hasIssues ? 'border-amber-500' : ''}`}>
              <div className="p-1 border-b flex justify-between items-center">
                <div className="font-medium text-sm">{format(day, 'd')}</div>
                {hasIssues && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    {dayIssues.length} issues
                  </Badge>
                )}
              </div>
              <div className="p-1 space-y-1 text-xs overflow-y-auto h-[80px]">
                {dayShifts.length === 0 ? (
                  <div className="text-gray-400 italic">Inga pass</div>
                ) : (
                  dayShifts.slice(0, 3).map((shift, idx) => {
                    const employee = profiles.find(p => p.id === shift.employee_id);
                    const shiftColor = shift.shift_type === 'day' ? 'bg-blue-50 text-blue-700' : 
                                      shift.shift_type === 'evening' ? 'bg-purple-50 text-purple-700' : 
                                      'bg-orange-50 text-orange-700';
                    
                    return (
                      <div key={`${shift.id}-${idx}`} className={`flex items-center ${shiftColor} rounded-sm px-1 py-0.5`}>
                        <div className="truncate">
                          {employee?.first_name || 'Unknown'} - {getShiftTypeInSwedish(shift.shift_type)}
                        </div>
                      </div>
                    );
                  })
                )}
                {dayShifts.length > 3 && (
                  <div className="text-gray-500 text-xs">+{dayShifts.length - 3} more</div>
                )}
              </div>
            </Card>
          );
        })}
        
        {/* Add empty cells for the days after the month ends */}
        {Array.from({ length: monthEnd.getDay() === 0 ? 0 : 7 - monthEnd.getDay() }).map((_, index) => (
          <div key={`empty-end-${index}`} className="h-28 bg-gray-50 rounded-md"></div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Dagpass</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
          <span>Kvällspass</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span>Nattpass</span>
        </div>
      </div>
    </div>
  );
};
