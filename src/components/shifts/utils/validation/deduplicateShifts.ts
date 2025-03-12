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
  
  // Map to track consecutive working days for each employee
  const employeeWorkingDays = new Map<string, Set<string>>();
  const MAX_CONSECUTIVE_DAYS = 5;
  
  // First pass: Deduplicate shifts and collect working days
  sortedShifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateStr = format(shiftDate, 'yyyy-MM-dd');
    const key = `${shift.employee_id}-${dateStr}`;
    
    // Track assignments by day - one person should only work one shift per day
    if (!employeeAssignments.has(dateStr)) {
      employeeAssignments.set(dateStr, new Map<string, string>());
    }
    const dayAssignments = employeeAssignments.get(dateStr)!;
    
    // If this employee already has a shift on this day, but it's a different shift type,
    // don't add this shift (prevents same person from working different shifts same day)
    if (dayAssignments.has(shift.employee_id)) {
      console.log(`Skipping duplicate shift for employee ${shift.employee_id} on ${dateStr} - already assigned`);
      return;
    }
    
    // Track working days for each employee
    if (!employeeWorkingDays.has(shift.employee_id)) {
      employeeWorkingDays.set(shift.employee_id, new Set<string>());
    }
    
    // Add this day to employee's working days
    const employeeDays = employeeWorkingDays.get(shift.employee_id)!;
    employeeDays.add(dateStr);
    
    // Set this employee's shift for the day and add to unique shifts
    dayAssignments.set(shift.employee_id, shift.shift_type);
    uniqueKeys.set(key, shift);
  });
  
  // Second pass: Check consecutive days constraint
  const finalShifts = new Map<string, Shift>();
  
  // For each employee, check if they have more than MAX_CONSECUTIVE_DAYS in a row
  employeeWorkingDays.forEach((days, employeeId) => {
    // Convert all dates to Date objects and sort them
    const sortedDates = Array.from(days)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
    
    // Find consecutive sequences
    const sequences: Date[][] = [];
    let currentSequence: Date[] = [];
    
    // Build sequences of consecutive days
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0 || isSameDay(addDays(sortedDates[i-1], 1), sortedDates[i])) {
        currentSequence.push(sortedDates[i]);
      } else {
        if (currentSequence.length > 0) {
          sequences.push([...currentSequence]);
        }
        currentSequence = [sortedDates[i]];
      }
    }
    
    // Add the last sequence
    if (currentSequence.length > 0) {
      sequences.push(currentSequence);
    }
    
    // Now check each sequence and remove days if it exceeds MAX_CONSECUTIVE_DAYS
    for (const sequence of sequences) {
      if (sequence.length > MAX_CONSECUTIVE_DAYS) {
        console.log(`Employee ${employeeId} has ${sequence.length} consecutive days - removing excess shifts`);
        
        // Keep only the first MAX_CONSECUTIVE_DAYS days in this sequence
        const daysToKeep = sequence.slice(0, MAX_CONSECUTIVE_DAYS);
        const daysToRemove = sequence.slice(MAX_CONSECUTIVE_DAYS);
        
        // Remove the excess days from our final shifts collection
        daysToRemove.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const key = `${employeeId}-${dateStr}`;
          
          if (uniqueKeys.has(key)) {
            console.log(`Removing excess consecutive shift for ${employeeId} on ${dateStr}`);
            uniqueKeys.delete(key);
          }
        });
      }
    }
  });
  
  // Convert our map of unique shifts back to an array
  const result = Array.from(uniqueKeys.values());
  console.log("After deduplication and consecutive day check, have", result.length, "shifts");
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
