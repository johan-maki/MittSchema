
import type { Shift, ShiftType } from "@/types/shift";
import type { Profile } from "@/types/profile";
import { roleToShiftType, minStaffByShiftType } from "./shiftValidation";

/**
 * Ensures minimum staffing requirements are met for each shift type
 */
export const ensureMinimumStaffing = (shifts: Shift[], availableProfiles: Profile[]): Shift[] => {
  const shiftsByDay = new Map<string, Map<ShiftType, Shift[]>>();
  const result: Shift[] = [...shifts];
  
  shifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateStr = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
    
    if (!shiftsByDay.has(dateStr)) {
      shiftsByDay.set(dateStr, new Map<ShiftType, Shift[]>());
    }
    
    const dayShifts = shiftsByDay.get(dateStr)!;
    if (!dayShifts.has(shift.shift_type)) {
      dayShifts.set(shift.shift_type, []);
    }
    
    dayShifts.get(shift.shift_type)!.push(shift);
  });
  
  shiftsByDay.forEach((dayShifts, dateStr) => {
    for (const shiftType of ['day', 'evening', 'night'] as ShiftType[]) {
      const shiftsOfType = dayShifts.get(shiftType) || [];
      const neededStaff = minStaffByShiftType[shiftType] - shiftsOfType.length;
      
      if (neededStaff > 0) {
        console.log(`Need ${neededStaff} more staff for ${shiftType} shift on ${dateStr}`);
        
        const eligibleProfiles = availableProfiles.filter(profile => {
          const profileShiftType = roleToShiftType[profile.role];
          if (profileShiftType !== shiftType) return false;
          
          const isAlreadyAssigned = shiftsOfType.some(shift => 
            shift.employee_id === profile.id
          );
          
          const alreadyHasShiftOnDay = Array.from(dayShifts.values())
            .flat()
            .some(shift => shift.employee_id === profile.id);
          
          return !isAlreadyAssigned && !alreadyHasShiftOnDay;
        });
        
        for (let i = 0; i < Math.min(neededStaff, eligibleProfiles.length); i++) {
          const profile = eligibleProfiles[i];
          
          const shiftDate = new Date(dateStr);
          let startHour = 0, endHour = 0;
          
          switch(shiftType) {
            case 'day':
              startHour = 7;
              endHour = 15;
              break;
            case 'evening':
              startHour = 15;
              endHour = 23;
              break;
            case 'night':
              startHour = 23;
              endHour = 7;
              break;
          }
          
          const startTime = new Date(shiftDate);
          startTime.setHours(startHour, 0, 0);
          
          const endTime = new Date(shiftDate);
          if (shiftType === 'night') {
            endTime.setDate(endTime.getDate() + 1);
          }
          endTime.setHours(endHour, 0, 0);
          
          const newShift: Shift = {
            id: `generated-${dateStr}-${shiftType}-${profile.id}`,
            employee_id: profile.id,
            shift_type: shiftType,
            department: 'General',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
          };
          
          console.log(`Added ${profile.first_name} ${profile.last_name} to ${shiftType} shift on ${dateStr}`);
          result.push(newShift);
        }
      }
    }
  });
  
  return result;
};
