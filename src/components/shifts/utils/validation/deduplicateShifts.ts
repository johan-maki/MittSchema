
import { format, addDays, isSameDay, parseISO } from "date-fns";
import type { Shift } from "@/types/shift";

/**
 * Helper function to remove duplicate shifts (same employee, same day, same shift type)
 * Also prevents the same employee from working different shifts on the same day
 * or having more than the maximum number of consecutive working days
 */
export const deduplicateShifts = (shifts: Shift[]): Shift[] => {
  console.log("Running deduplicateShifts on", shifts.length, "shifts");
  const uniqueKeys = new Map<string, Shift>();
  const employeeAssignments = new Map<string, Map<string, string>>();
  
  // Sort shifts chronologically to ensure proper consecutive days check
  const sortedShifts = [...shifts].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  
  // Track consecutive working days for each employee
  const employeeWorkingDays = new Map<string, Set<string>>();
  const MAX_CONSECUTIVE_DAYS = 5;
  
  sortedShifts.forEach(shift => {
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
    
    // Track working days for each employee
    if (!employeeWorkingDays.has(shift.employee_id)) {
      employeeWorkingDays.set(shift.employee_id, new Set<string>());
    }
    
    // Check for consecutive days limit
    const employeeDays = employeeWorkingDays.get(shift.employee_id)!;
    employeeDays.add(dateStr);
    
    // Check for more than MAX_CONSECUTIVE_DAYS in a row
    const isExceedingConsecutiveDays = checkConsecutiveDays(employeeDays, dateStr, MAX_CONSECUTIVE_DAYS);
    if (isExceedingConsecutiveDays) {
      console.log(`Employee ${shift.employee_id} would exceed ${MAX_CONSECUTIVE_DAYS} consecutive working days with shift on ${dateStr}, skipping`);
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

/**
 * Check if adding this day would cause more than maxConsecutive days in a row
 */
function checkConsecutiveDays(employeeDays: Set<string>, newDateStr: string, maxConsecutive: number): boolean {
  // If we don't have enough days yet, no need to check
  if (employeeDays.size <= maxConsecutive) {
    return false;
  }
  
  // Convert all dates to Date objects and sort them
  const allDates = Array.from(employeeDays).map(dateStr => parseISO(dateStr));
  allDates.push(parseISO(newDateStr));
  allDates.sort((a, b) => a.getTime() - b.getTime());
  
  // Check for consecutive sequences
  let consecutiveCount = 1;
  let maxConsecutiveFound = 1;
  
  for (let i = 1; i < allDates.length; i++) {
    const prevDate = allDates[i-1];
    const currDate = allDates[i];
    
    // Check if dates are consecutive
    const nextDay = addDays(prevDate, 1);
    
    if (isSameDay(nextDay, currDate)) {
      consecutiveCount++;
    } else {
      consecutiveCount = 1;
    }
    
    maxConsecutiveFound = Math.max(maxConsecutiveFound, consecutiveCount);
    
    // If adding this day would exceed the limit, return true
    if (maxConsecutiveFound > maxConsecutive) {
      return true;
    }
  }
  
  return false;
}
