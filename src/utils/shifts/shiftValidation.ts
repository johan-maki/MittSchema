
import type { Shift, ShiftType } from "@/types/shift";
import type { Profile } from "@/types/profile";

/**
 * Removes duplicate shifts based on employee ID, day, and shift type
 */
export const removeDuplicateShifts = (shifts: Shift[]): Shift[] => {
  const uniqueShiftMap = new Map<string, Shift>();
  const employeeShiftsByDay = new Map<string, Map<string, ShiftType>>();
  
  shifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateKey = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
    const employeeId = shift.employee_id;
    const shiftType = shift.shift_type;
    
    if (!employeeShiftsByDay.has(dateKey)) {
      employeeShiftsByDay.set(dateKey, new Map<string, ShiftType>());
    }
    
    const dayEmployees = employeeShiftsByDay.get(dateKey)!;
    
    if (dayEmployees.has(employeeId) && dayEmployees.get(employeeId) !== shiftType) {
      console.log(`Employee ${employeeId} already has a different shift on ${dateKey}`);
      return;
    }
    
    dayEmployees.set(employeeId, shiftType);
    
    const uniqueKey = `${employeeId}-${dateKey}-${shiftType}`;
    
    if (!uniqueShiftMap.has(uniqueKey)) {
      uniqueShiftMap.set(uniqueKey, shift);
    }
  });
  
  return Array.from(uniqueShiftMap.values());
};

/**
 * Maps roles to shift types
 */
export const roleToShiftType: Record<string, ShiftType> = {
  'Läkare': 'day',
  'Sjuksköterska': 'evening',
  'Undersköterska': 'night'
};

/**
 * Minimum staff requirements by shift type
 */
export const minStaffByShiftType: Record<ShiftType, number> = {
  'day': 3,
  'evening': 3,
  'night': 2
};
