
import { format } from "date-fns";
import type { Shift } from "@/types/shift";

/**
 * Helper function to remove duplicate shifts (same employee, same day, same shift type)
 * Also prevents the same employee from working different shifts on the same day
 */
export const deduplicateShifts = (shifts: Shift[]): Shift[] => {
  console.log("Running deduplicateShifts on", shifts.length, "shifts");
  const uniqueKeys = new Map<string, Shift>();
  const employeeAssignments = new Map<string, Map<string, string>>();
  
  shifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateStr = format(shiftDate, 'yyyy-MM-dd');
    const key = `${shift.employee_id}-${dateStr}-${shift.shift_type}`;
    
    // Track assignments by day - one person should only work one role per day
    if (!employeeAssignments.has(dateStr)) {
      employeeAssignments.set(dateStr, new Map<string, string>());
    }
    const dayAssignments = employeeAssignments.get(dateStr)!;
    
    // If this employee already has a shift on this day, but it's a different shift type,
    // don't add this shift (prevents same person from working different shifts same day)
    if (dayAssignments.has(shift.employee_id) && dayAssignments.get(shift.employee_id) !== shift.shift_type) {
      console.log(`Skipping duplicate shift for employee ${shift.employee_id} on ${dateStr} - already has ${dayAssignments.get(shift.employee_id)} shift`);
      return;
    }
    
    // Set this employee's shift for the day
    dayAssignments.set(shift.employee_id, shift.shift_type);
    
    // Only add this shift if we don't already have it
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, shift);
    }
  });
  
  const result = Array.from(uniqueKeys.values());
  console.log("After deduplication, have", result.length, "shifts");
  return result;
};
