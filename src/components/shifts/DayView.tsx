
import { Shift } from "@/types/shift";
import { Profile } from "@/types/profile";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShiftForm } from "./ShiftForm";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ROLES, ROLE_COLORS } from "./schedule.constants";
import { format, isSameDay, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { ExperienceLevelSummary } from "./ExperienceLevelSummary";

interface DayViewProps {
  date: Date;
  shifts: Shift[];
}

// Create array of hours from 1 AM to 11 PM
const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);

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

  // Map role names to shift types
  const roleToShiftType: { [key: string]: string } = {
    'Läkare': 'day',
    'Undersköterska': 'evening',
    'Sjuksköterska': 'night'
  };

  const getShiftsForRole = (role: string) => {
    return shiftsWithProfiles.filter(shift => {
      const shiftDate = parseISO(shift.start_time);
      const roleShiftType = roleToShiftType[role];
      return isSameDay(shiftDate, date) && shift.shift_type === roleShiftType;
    });
  };

  const calculateShiftPosition = (shift: Shift) => {
    const startTime = new Date(shift.start_time);
    const endTime = new Date(shift.end_time);
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    // Calculate position and width based on 24-hour format
    const startPercent = (startHour / 24) * 100;
    const widthPercent = ((endHour - startHour) / 24) * 100;
    
    return { startPercent, widthPercent };
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px] max-w-full">
        {/* Time header */}
        <div className="grid grid-cols-[200px,1fr] bg-white">
          <div className="border-b border-r border-gray-100 p-2 font-medium text-gray-400 text-sm">
            Roll
          </div>
          <div className="grid grid-cols-[repeat(23,1fr)] border-b">
            {HOURS.map((hour) => (
              <div key={hour} className="text-center text-xs text-gray-400 py-2 border-r border-gray-100">
                {hour % 12 || 12}{hour >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>
        </div>

        {/* Role rows */}
        <div className="grid grid-cols-[200px,1fr]">
          {ROLES.map((role) => {
            const roleShifts = getShiftsForRole(role);
            return (
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
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${ROLE_COLORS[role].bg}`} />
                    <span>{role}</span>
                  </div>
                </div>
                
                <div className={`${hiddenRoles.has(role) ? 'hidden' : ''}`}>
                  <div className="border-b border-r border-gray-100 h-24 relative">
                    {roleShifts.map((shift) => {
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
                              {format(parseISO(shift.start_time), 'HH:mm')} - 
                              {format(parseISO(shift.end_time), 'HH:mm')}
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
            );
          })}

          {/* Experience Level Summary row */}
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

        {/* Edit Dialog */}
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
    </div>
  );
};

export default DayView;
