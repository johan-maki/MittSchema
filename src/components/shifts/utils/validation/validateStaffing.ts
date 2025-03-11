
import { format } from "date-fns";
import type { Shift } from "@/types/shift";
import { MIN_STAFF_BY_SHIFT_TYPE } from './constants';

/**
 * Validation function for checking minimum staffing requirements
 * Logs warnings but doesn't stop operation when requirements aren't met
 */
export const validateShiftConstraints = (shifts: Shift[]): boolean => {
  console.log("Running validation on shifts");
  // Group shifts by day and shift type
  const shiftsByDay = new Map<string, Map<string, Shift[]>>();
  
  shifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateStr = format(shiftDate, 'yyyy-MM-dd');
    
    if (!shiftsByDay.has(dateStr)) {
      shiftsByDay.set(dateStr, new Map<string, Shift[]>());
    }
    
    const dayShifts = shiftsByDay.get(dateStr)!;
    if (!dayShifts.has(shift.shift_type)) {
      dayShifts.set(shift.shift_type, []);
    }
    
    dayShifts.get(shift.shift_type)!.push(shift);
  });
  
  // Validate each day
  let isValid = true;
  shiftsByDay.forEach((dayShifts, dateStr) => {
    // Check each shift type
    for (const [shiftType, minStaff] of Object.entries(MIN_STAFF_BY_SHIFT_TYPE)) {
      const shiftsOfType = dayShifts.get(shiftType) || [];
      if (shiftsOfType.length < minStaff) {
        console.log(`Not enough staff for ${shiftType} shift on ${dateStr}: ${shiftsOfType.length}/${minStaff}`);
        isValid = false;
      }
    }
  });
  
  if (!isValid) {
    console.log("Some shifts do not meet minimum staffing requirements");
  }
  
  return isValid;
};
