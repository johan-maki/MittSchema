
import { Shift } from "@/types/shift";
import { motion } from "framer-motion";
import { format, getWeekDays } from "@/utils/date";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { ShiftCard } from "./ShiftCard";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";

interface WeekViewProps {
  date: Date;
  shifts: Shift[];
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

  const getShiftsForDay = (dayDate: Date, role: string) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return (
        shiftDate.getDate() === dayDate.getDate() &&
        shiftDate.getMonth() === dayDate.getMonth() &&
        shiftDate.getFullYear() === dayDate.getFullYear() &&
        shift.shift_type === role
      );
    });
  };

  return (
    <div className="min-w-[1000px]">
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
              {weekDays.map(({ date: dayDate }) => (
                <div key={dayDate.toISOString()} className="border-b border-r border-gray-100 p-1 min-h-[120px] relative">
                  <div className="space-y-1 mb-8">
                    {getShiftsForDay(dayDate, role).map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        profile={undefined}
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
              ))}
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
  );
};
