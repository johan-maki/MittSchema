
import { Shift } from "@/types/shift";
import { motion } from "framer-motion";
import { format, isSameDay } from "date-fns";
import { getWeekDays } from "@/utils/date";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeekViewProps {
  date: Date;
  shifts: Shift[];
}

export const WeekView = ({ date, shifts }: WeekViewProps) => {
  const weekDays = getWeekDays(date);
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());

  // Fetch profiles to get role and experience level information
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const toggleRole = (role: string) => {
    const newHiddenRoles = new Set(hiddenRoles);
    if (hiddenRoles.has(role)) {
      newHiddenRoles.delete(role);
    } else {
      newHiddenRoles.add(role);
    }
    setHiddenRoles(newHiddenRoles);
  };

  const getShiftsForRoleAndDay = (role: string, day: Date) => {
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      // Find the profile for this shift
      const profile = profiles?.find(p => p.id === shift.employee_id);
      return (
        isSameDay(shiftStart, day) &&
        profile?.role === role
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
      <div className="min-w-[1200px]">
        <div className="grid grid-cols-[200px,repeat(7,1fr)] gap-px bg-gray-200">
          <div className="bg-white p-4 font-medium text-gray-400 text-sm">Roll</div>
          {weekDays.map(({ dayName, dayNumber }) => (
            <div
              key={dayName}
              className="p-2 text-center bg-white"
            >
              <div className="text-xs sm:text-sm font-medium text-gray-600">
                {dayName}
              </div>
              <div className="text-sm sm:text-lg">{dayNumber}</div>
            </div>
          ))}
        </div>

        {ROLES.map((role) => (
          <div key={role} className="grid grid-cols-[200px,repeat(7,1fr)]">
            <div 
              className="p-4 flex items-center gap-2 border-b border-r cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRole(role)}
            >
              {hiddenRoles.has(role) ? (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
              <span className={ROLE_COLORS[role].text}>{role}</span>
            </div>
            
            <div className={`grid grid-cols-subgrid col-span-7 ${hiddenRoles.has(role) ? 'hidden' : ''}`}>
              {weekDays.map(({ date: dayDate }) => (
                <div key={dayDate.toISOString()} className="border-b border-r p-2 min-h-[120px] relative">
                  <div className="space-y-2">
                    {getShiftsForRoleAndDay(role, dayDate).map((shift) => {
                      // Find the full profile for this shift
                      const fullProfile = profiles?.find(p => p.id === shift.employee_id);
                      
                      return (
                        <motion.div
                          key={shift.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`${ROLE_COLORS[role].bg} ${ROLE_COLORS[role].border} rounded-md border p-2 text-sm`}
                        >
                          <div className="font-medium">
                            {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                          </div>
                          <div className="text-gray-600">
                            {shift.profiles?.first_name} {shift.profiles?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Exp: {fullProfile?.experience_level ?? '-'}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute bottom-2 right-2 h-6 w-6 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
