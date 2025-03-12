import { format, addDays, isSameDay, parseISO, differenceInDays } from "date-fns";
import type { Shift } from "@/types/shift";

/**
 * Helper function to remove duplicate shifts (same employee, same day, same shift type)
 * Also prevents the same employee from working different shifts on the same day
 * or having more than the maximum number of consecutive working days
 */
export const deduplicateShifts = (shifts: Shift[]): Shift[] => {
  console.log("Running deduplicateShifts on", shifts.length, "shifts");
  
  // First, create a Map to track shifts by employee and date to prevent
  // employees from being scheduled multiple times on the same day
  const employeeShiftsByDay = new Map<string, Map<string, Shift>>();
  
  // Sort shifts chronologically to ensure proper consecutive days check
  const sortedShifts = [...shifts].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  
  // First pass: Collect shifts by employee and date
  sortedShifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateStr = format(shiftDate, 'yyyy-MM-dd');
    const employeeId = shift.employee_id;
    
    if (!employeeShiftsByDay.has(employeeId)) {
      employeeShiftsByDay.set(employeeId, new Map<string, Shift>());
    }
    
    const employeeDays = employeeShiftsByDay.get(employeeId)!;
    
    // If this employee already has a shift on this day, skip this one
    // This ensures one shift per day per employee
    if (employeeDays.has(dateStr)) {
      console.log(`Skipping duplicate shift for employee ${employeeId} on ${dateStr} - already assigned`);
      return;
    }
    
    // Otherwise, record this shift
    employeeDays.set(dateStr, shift);
  });
  
  // Second pass: Check for consecutive working days and apply the constraint
  const finalShifts: Shift[] = [];
  const MAX_CONSECUTIVE_DAYS = 5;
  
  // Process each employee's shifts
  employeeShiftsByDay.forEach((employeeDays, employeeId) => {
    // Get all the dates this employee is scheduled to work, sorted
    const workDates = Array.from(employeeDays.keys())
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
    
    // Find consecutive sequences
    const continuousSequences: Date[][] = [];
    let currentSequence: Date[] = [];
    
    // Group consecutive days together
    for (let i = 0; i < workDates.length; i++) {
      if (i === 0) {
        currentSequence.push(workDates[i]);
      } else {
        const prevDate = workDates[i-1];
        const currDate = workDates[i];
        
        // Check if dates are consecutive
        if (differenceInDays(currDate, prevDate) === 1) {
          currentSequence.push(currDate);
        } else {
          // Start a new sequence
          if (currentSequence.length > 0) {
            continuousSequences.push([...currentSequence]);
          }
          currentSequence = [currDate];
        }
      }
    }
    
    // Add the last sequence if it exists
    if (currentSequence.length > 0) {
      continuousSequences.push(currentSequence);
    }
    
    // Process each sequence and keep only shifts within the constraints
    continuousSequences.forEach(sequence => {
      if (sequence.length > MAX_CONSECUTIVE_DAYS) {
        console.log(`Employee ${employeeId} has ${sequence.length} consecutive days - removing excess shifts`);
        
        // Keep only the first MAX_CONSECUTIVE_DAYS shifts in this sequence
        sequence = sequence.slice(0, MAX_CONSECUTIVE_DAYS);
      }
      
      // Add the allowed shifts to final result
      sequence.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const shift = employeeDays.get(dateStr);
        if (shift) {
          finalShifts.push(shift);
        }
      });
    });
  });
  
  console.log("After deduplication and consecutive day check, have", finalShifts.length, "shifts");
  return finalShifts;
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
