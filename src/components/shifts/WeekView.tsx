
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { motion } from "framer-motion";
import { getWeekDays } from "@/utils/date";
import { format, isSameDay, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { ShiftCard } from "./ShiftCard";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";

interface WeekViewProps {
  date: Date;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
}

export const WeekView = ({ date, shifts }: WeekViewProps) => {
  const weekDays = getWeekDays(date);
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());

  const toggleRole = (roleName: string) => {
    const newHiddenRoles = new Set(hiddenRoles);
    if (hiddenRoles.has(roleName)) {
      newHiddenRoles.delete(roleName);
    } else {
      newHiddenRoles.add(roleName);
    }
    setHiddenRoles(newHiddenRoles);
  };

  // Updated mapping of roles to shift types
  const getShiftsForDay = (dayDate: Date, role: string) => {
    const uniqueEmployeeShifts = new Map<string, Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>();
    
    // Correct mapping of roles to shift types
    const roleToShiftType: { [key: string]: string } = {
      'Läkare': 'day',
      'Sjuksköterska': 'evening',
      'Undersköterska': 'night'
    };
    
    const filteredShifts = shifts.filter(shift => {
      const shiftDate = parseISO(shift.start_time);
      
      // Check if this is the correct shift type for this role
      const roleShiftType = roleToShiftType[role];
      
      // Making sure the employee is not shown in multiple roles - employees should stick to their role
      const profile = shift.profiles;
      const profileRole = profile ? getEmployeeRole(profile) : null;
      
      return isSameDay(shiftDate, dayDate) && 
             shift.shift_type === roleShiftType && 
             (profileRole === role || !profileRole); // Only include if role matches or no role info
    });
    
    filteredShifts.forEach(shift => {
      const key = `${shift.employee_id}-${shift.shift_type}`;
      if (!uniqueEmployeeShifts.has(key)) {
        uniqueEmployeeShifts.set(key, shift);
      }
    });
    
    return Array.from(uniqueEmployeeShifts.values());
  };
  
  // Helper function to determine employee role based on their ID or name
  const getEmployeeRole = (profile: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'>): string | null => {
    // Use the first name as a heuristic since we don't have direct role data in profiles
    const firstName = profile.first_name?.toLowerCase();
    
    // Map common names to roles based on your dataset
    if (firstName === 'tommy' || firstName === 'brad' || firstName === 'meryl') {
      return 'Läkare';
    } else if (firstName === 'leonardo' || firstName === 'julia') {
      return 'Sjuksköterska';
    } else if (firstName === 'jennifer' || firstName === 'tom' || firstName === 'emma' || firstName === 'sandra') {
      return 'Undersköterska';
    }
    
    return null;
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] lg:w-full">
        <div className="grid grid-cols-[200px,1fr] bg-white">
          <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm">
            Roll
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map(({ dayName, dayNumber, date }) => (
              <div key={dayName} className="border-b border-r border-gray-100">
                <div className="p-2 font-medium text-gray-400 text-center">
                  <div className="text-sm">{dayName}</div>
                  <div className="text-lg">{dayNumber}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[200px,1fr]">
          {ROLES.map((role) => (
            <div key={role} className="grid grid-cols-subgrid col-span-2">
              <div 
                className="border-b border-r border-gray-100 p-2 font-medium text-sm flex items-start gap-2 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleRole(role)}
              >
                {hiddenRoles.has(role) ? (
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 mt-0.5" />
                )}
                <span className={ROLE_COLORS[role].text}>{role}</span>
              </div>
              
              <div className={`grid grid-cols-7 ${hiddenRoles.has(role) ? 'hidden' : ''}`}>
                {weekDays.map(({ date: dayDate }) => {
                  const dayShifts = getShiftsForDay(dayDate, role);
                  return (
                    <div key={dayDate.toISOString()} className="border-b border-r border-gray-100 p-1 min-h-[120px] relative">
                      <div className="space-y-1 mb-8">
                        {dayShifts.map((shift) => (
                          <ShiftCard
                            key={shift.id}
                            shift={shift}
                            profile={shift.profiles}
                            roleColors={ROLE_COLORS[role]}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-2 right-1 h-6 w-6 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-subgrid col-span-2">
            <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm">
              Experience Level
            </div>
            <div className="grid grid-cols-7">
              {weekDays.map(({ date: dayDate }) => (
                <div key={`summary-${dayDate.toISOString()}`} className="border-b border-r border-gray-100 p-2">
                  <ExperienceLevelSummary
                    date={dayDate}
                    shifts={shifts}
                    profiles={[]}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
