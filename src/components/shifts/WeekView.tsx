
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { motion } from "framer-motion";
import { getWeekDays } from "@/utils/date";
import { format, isSameDay, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { ShiftCard } from "./ShiftCard";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "./ShiftForm";

interface WeekViewProps {
  date: Date;
  shifts: Array<Shift & { profiles: Pick<Profile, 'first_name' | 'last_name' | 'experience_level'> }>;
}

export const WeekView = ({ date, shifts }: WeekViewProps) => {
  const weekDays = getWeekDays(date);
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newShiftParams, setNewShiftParams] = useState<{day: Date, role: string} | null>(null);

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
    // Correct mapping of roles to shift types
    const roleToShiftType: { [key: string]: string } = {
      'Läkare': 'day',
      'Sjuksköterska': 'evening',
      'Undersköterska': 'night'
    };
    
    const dayShifts = shifts.filter(shift => {
      const shiftDate = parseISO(shift.start_time);
      return isSameDay(shiftDate, dayDate) && 
             shift.shift_type === roleToShiftType[role];
    });
    
    return dayShifts;
  };

  const handleAddShift = (dayDate: Date, role: string) => {
    setNewShiftParams({ day: dayDate, role });
    setIsCreateDialogOpen(true);
  };

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="min-w-[800px] lg:w-full">
        <div className="grid grid-cols-[200px,1fr] bg-white sticky top-0 z-10">
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
          {ROLES.map((role, index) => (
            <div key={role} className="grid grid-cols-subgrid col-span-2">
              <div 
                className="border-b border-r border-gray-100 p-2 font-medium text-sm flex items-start gap-2 cursor-pointer hover:bg-gray-50 sticky left-0 bg-white"
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
                    <div 
                      key={dayDate.toISOString()} 
                      className="border-b border-r border-gray-100 p-1 min-h-[160px] relative"
                      onDoubleClick={() => handleAddShift(dayDate, role)}
                    >
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
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-subgrid col-span-2">
            <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm sticky left-0 bg-white">
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          {newShiftParams && (
            <ShiftForm
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              defaultValues={{
                start_time: `${newShiftParams.day.toISOString().slice(0, 10)}T09:00`,
                end_time: `${newShiftParams.day.toISOString().slice(0, 10)}T16:00`,
                shift_type: newShiftParams.role === 'Läkare' ? 'day' : 
                           newShiftParams.role === 'Sjuksköterska' ? 'evening' : 'night'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};
