
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
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";
import { Profile } from "@/types/profile";

interface WeekViewProps {
  date: Date;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name'> }>;
}

export const WeekView = ({ date, shifts }: WeekViewProps) => {
  const weekDays = getWeekDays(date);
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());

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
      const profile = profiles?.find(p => p.id === shift.employee_id);
      return isSameDay(shiftStart, day) && profile?.role === role;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="grid grid-cols-[240px,repeat(7,1fr)] border-b">
          <div className="p-4 font-medium text-gray-500 text-sm border-r">Roll</div>
          {weekDays.map(({ dayName, dayNumber }) => (
            <div
              key={dayName}
              className="p-3 text-center border-r last:border-r-0"
            >
              <div className="text-sm font-medium text-gray-600">
                {dayName}
              </div>
              <div className="text-2xl font-semibold text-gray-900">{dayNumber}</div>
            </div>
          ))}
        </div>

        {/* Role Rows */}
        {ROLES.map((role) => (
          <div key={role} className="grid grid-cols-[240px,repeat(7,1fr)] group">
            <div 
              className="p-4 flex items-center gap-2 border-r border-b cursor-pointer hover:bg-gray-50 group"
              onClick={() => toggleRole(role)}
            >
              <div className="flex items-center gap-3">
                {hiddenRoles.has(role) ? (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ROLE_COLORS[role].bg.replace('bg-', 'bg-')}`} />
                  <span className="font-medium text-gray-900">{role}</span>
                </div>
              </div>
            </div>
            
            <div className={`grid grid-cols-subgrid col-span-7 ${hiddenRoles.has(role) ? 'hidden' : ''}`}>
              {weekDays.map(({ date: dayDate }) => (
                <div 
                  key={dayDate.toISOString()} 
                  className="relative border-b border-r last:border-r-0 min-h-[140px] group"
                >
                  <div className="p-2 space-y-2">
                    {getShiftsForRoleAndDay(role, dayDate).map((shift) => {
                      const fullProfile = profiles?.find(p => p.id === shift.employee_id);
                      
                      return (
                        <motion.div
                          key={shift.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border bg-white shadow-sm p-2 hover:shadow-md transition-shadow"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(shift.start_time), 'HH:mm')} – {format(new Date(shift.end_time), 'HH:mm')}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {shift.profiles?.first_name} {shift.profiles?.last_name}
                          </div>
                          {fullProfile?.experience_level && (
                            <div className="text-xs text-gray-500 mt-1">
                              Experience: {fullProfile.experience_level}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Experience Level Summary Row */}
        <div className="grid grid-cols-[240px,repeat(7,1fr)] bg-gray-50">
          <div className="p-4 font-medium text-gray-500 text-sm border-r">
            Experience Level
          </div>
          <div className="grid grid-cols-subgrid col-span-7">
            {weekDays.map(({ date: dayDate }) => (
              <div key={`summary-${dayDate.toISOString()}`} className="border-r last:border-r-0">
                <ExperienceLevelSummary
                  date={dayDate}
                  shifts={shifts}
                  profiles={profiles || []}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
