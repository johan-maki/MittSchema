
import type { Shift } from "@/types/shift";

/**
 * Removes duplicate shifts - ensures employees only have one shift per day
 */
export const removeDuplicateShifts = (shifts: Shift[]): Shift[] => {
  const uniqueShiftMap = new Map<string, Shift>();
  const employeeShiftsByDay = new Map<string, Map<string, string>>();
  
  shifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateKey = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
    const employeeId = shift.employee_id;
    const shiftType = shift.shift_type;
    
    if (!employeeShiftsByDay.has(dateKey)) {
      employeeShiftsByDay.set(dateKey, new Map<string, string>());
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
