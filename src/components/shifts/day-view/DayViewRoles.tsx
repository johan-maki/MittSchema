
import { Shift } from "@/types/shift";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";
import { ROLES, ROLE_COLORS } from "../schedule.constants";
import { DayViewShiftList } from "./DayViewShiftList";

interface DayViewRolesProps {
  date: Date;
  shifts: Array<Shift & { profiles: { first_name: string; last_name: string } }>;
  onShiftClick: (shift: Shift) => void;
  onAddClick: (date: Date, role: string) => void;
}

export const DayViewRoles = ({ date, shifts, onShiftClick, onAddClick }: DayViewRolesProps) => {
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

  const getShiftsForRole = (role: string) => {
    const roleToShiftType: { [key: string]: string } = {
      'Läkare': 'day',
      'Sjuksköterska': 'evening',
      'Undersköterska': 'night'
    };
    
    return shifts.filter(shift => {
      const shiftDate = parseISO(shift.start_time);
      const roleShiftType = roleToShiftType[role];
      return isSameDay(shiftDate, date) && shift.shift_type === roleShiftType;
    });
  };

  return (
    <div className="grid grid-cols-[200px,1fr]">
      {ROLES.map((role, index) => {
        const roleShifts = getShiftsForRole(role);
        return (
          <div key={role} className="grid grid-cols-subgrid col-span-2">
            <div 
              className={`border-b border-r border-gray-200 p-3 font-medium text-sm flex items-start gap-2 cursor-pointer hover:bg-gray-50 sticky left-0 bg-white ${!index ? 'bg-gray-50' : ''}`}
              onClick={() => toggleRole(role)}
            >
              {hiddenRoles.has(role) ? (
                <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 mt-0.5" />
              )}
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-purple-500' : 'bg-orange-500'}`} />
                <span>{role}</span>
              </div>
            </div>
            
            <div className={`${hiddenRoles.has(role) ? 'hidden' : ''}`}>
              <DayViewShiftList 
                shifts={roleShifts}
                onShiftClick={onShiftClick}
                onAddClick={() => onAddClick(date, role)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
