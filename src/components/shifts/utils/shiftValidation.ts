
import { format } from "date-fns";
import type { Shift } from "@/types/shift";

// Helper function to remove duplicate shifts (same employee, same day, same shift type)
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

// Validation function for logging purposes but we won't stop the application
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
  
  // Check if each day has the minimum required staff for each shift type
  const minStaffByShiftType = {
    'day': 3,
    'evening': 3,
    'night': 2
  };
  
  // Validate each day
  let isValid = true;
  shiftsByDay.forEach((dayShifts, dateStr) => {
    // Check each shift type
    for (const [shiftType, minStaff] of Object.entries(minStaffByShiftType)) {
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
