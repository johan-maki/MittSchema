
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "./ShiftForm";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayView = ({ date, shifts }: DayViewProps) => {
  const [hiddenRoles, setHiddenRoles] = useState<Set<string>>(new Set());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Add profiles property to shifts if missing
  const shiftsWithProfiles = shifts.map(shift => ({
    ...shift,
    profiles: shift.profiles || { first_name: '', last_name: '' }
  }));

  const toggleRole = (roleName: string) => {
    const newHiddenRoles = new Set(hiddenRoles);
    if (hiddenRoles.has(roleName)) {
      newHiddenRoles.delete(roleName);
    } else {
      newHiddenRoles.add(roleName);
    }
    setHiddenRoles(newHiddenRoles);
  };

  const getShiftsForRole = (role: string) => {
    return shiftsWithProfiles.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return (
        shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear() &&
        shift.shift_type === role
      );
    });
  };

  const calculateShiftPosition = (shift: Shift) => {
    const startTime = new Date(shift.start_time);
    const endTime = new Date(shift.end_time);
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    const startPercent = (startHour / 24) * 100;
    const widthPercent = ((endHour - startHour) / 24) * 100;
    
    return { startPercent, widthPercent };
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-w-[1000px]">
      <div className="grid grid-cols-[200px,1fr] bg-white">
        <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm">
          Roll
        </div>
        <div className="grid grid-cols-24 border-b border-r border-gray-100">
          {HOURS.map((hour) => (
            <div key={hour} className="text-center text-xs text-gray-400 py-2 border-r">
              {hour}:00
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
            
            <div className={`${hiddenRoles.has(role) ? 'hidden' : ''}`}>
              <div className="border-b border-r border-gray-100 h-24 relative">
                {getShiftsForRole(role).map((shift) => {
                  const { startPercent, widthPercent } = calculateShiftPosition(shift);
                  return (
                    <div
                      key={shift.id}
                      className={`absolute top-1 h-[calc(100%-8px)] rounded-md border cursor-pointer hover:brightness-95 ${ROLE_COLORS[role].bg} ${ROLE_COLORS[role].border}`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      onClick={() => handleShiftClick(shift)}
                    >
                      <div className="p-2 text-xs">
                        <div className="font-medium truncate">
                          {format(new Date(shift.start_time), 'HH:mm')} - 
                          {format(new Date(shift.end_time), 'HH:mm')}
                        </div>
                        <div className="truncate">
                          {shift.profiles.first_name} {shift.profiles.last_name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-subgrid col-span-2">
          <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm">
            Experience Level
          </div>
          <div className="border-b border-r border-gray-100">
            <ExperienceLevelSummary
              date={date}
              shifts={shiftsWithProfiles}
              profiles={[]}
            />
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          {selectedShift && (
            <ShiftForm
              isOpen={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
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

export default DayView;
