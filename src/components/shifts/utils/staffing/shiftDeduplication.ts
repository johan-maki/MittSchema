
import type { Shift } from "@/types/shift";
import { format, differenceInDays } from "date-fns";

/**
 * Removes duplicate shifts - ensures employees only have one shift per day
 * and don't work more than MAX_CONSECUTIVE_DAYS in a row
 */
export const removeDuplicateShifts = (shifts: Shift[]): Shift[] => {
  const MAX_CONSECUTIVE_DAYS = 5;
  
  // Map to track shifts by employee and date
  const employeeShiftsByDay = new Map<string, Map<string, Shift>>();
  
  // Sort shifts chronologically
  const sortedShifts = [...shifts].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  
  // First pass: Deduplicate based on employee and day
  for (const shift of sortedShifts) {
    const shiftDate = new Date(shift.start_time);
    const dateStr = format(shiftDate, 'yyyy-MM-dd');
    const employeeId = shift.employee_id;
    
    // Initialize employee map if needed
    if (!employeeShiftsByDay.has(employeeId)) {
      employeeShiftsByDay.set(employeeId, new Map<string, Shift>());
    }
    
    const employeeDays = employeeShiftsByDay.get(employeeId)!;
    
    // If employee already has a shift this day, skip
    if (!employeeDays.has(dateStr)) {
      employeeDays.set(dateStr, shift);
    }
  }
  
  // Second pass: Check for consecutive days
  const finalShifts: Shift[] = [];
  
  // Process each employee's shifts
  employeeShiftsByDay.forEach((dayMap, employeeId) => {
    // Get dates sorted chronologically
    const dates = Array.from(dayMap.keys())
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());
    
    // Find consecutive sequences
    const sequences: Date[][] = [];
    let currentSequence: Date[] = [];
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentSequence.push(dates[i]);
      } else {
        const prevDate = dates[i-1];
        const currDate = dates[i];
        
        // Check if consecutive (1 day apart)
        if (differenceInDays(currDate, prevDate) === 1) {
          currentSequence.push(currDate);
        } else {
          // End current sequence and start a new one
          if (currentSequence.length > 0) {
            sequences.push([...currentSequence]);
          }
          currentSequence = [currDate];
        }
      }
    }
    
    // Add the last sequence
    if (currentSequence.length > 0) {
      sequences.push(currentSequence);
    }
    
    // Apply max consecutive days constraint to each sequence
    sequences.forEach(sequence => {
      const allowedDates = sequence.length <= MAX_CONSECUTIVE_DAYS ? 
        sequence : 
        sequence.slice(0, MAX_CONSECUTIVE_DAYS);
      
      // Add allowed shifts to final result
      allowedDates.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const shift = dayMap.get(dateStr);
        if (shift) {
          finalShifts.push(shift);
        }
      });
    });
  });
  
  return finalShifts;
};
