
import type { Shift, ShiftType } from "@/types/shift";
import type { Profile } from "@/types/profile";
import { ROLE_TO_SHIFT_TYPE, MIN_STAFF_BY_SHIFT_TYPE } from "./constants";
import { createDateFromString } from "./dateUtils";
import { createShift } from "./shiftCreation";

/**
 * Ensures minimum staffing levels for all shifts
 * Adds additional staff where needed based on role preferences and availability
 */
export const ensureMinimumStaffing = (shifts: Shift[], availableProfiles: Profile[]): Shift[] => {
  // Group shifts by day and type
  const shiftsByDay = new Map<string, Map<ShiftType, Shift[]>>();
  const result: Shift[] = [...shifts];
  
  // Organize shifts by day and type
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
  
  // Track assigned employees by day to prevent double bookings
  const assignedEmployeesByDay = new Map<string, Set<string>>();
  
  // Process each day and ensure minimum staffing requirements
  shiftsByDay.forEach((dayShifts, dateStr) => {
    if (!assignedEmployeesByDay.has(dateStr)) {
      assignedEmployeesByDay.set(dateStr, new Set());
    }
    
    // Add existing assignments to tracking set
    for (const [_, shiftsOfType] of dayShifts.entries()) {
      for (const shift of shiftsOfType) {
        assignedEmployeesByDay.get(dateStr)!.add(shift.employee_id);
      }
    }
    
    // For each shift type, check and fix staffing levels
    for (const shiftType of ['day', 'evening', 'night'] as ShiftType[]) {
      const shiftsOfType = dayShifts.get(shiftType) || [];
      const neededStaff = MIN_STAFF_BY_SHIFT_TYPE[shiftType] - shiftsOfType.length;
      
      if (neededStaff > 0) {
        console.log(`Need ${neededStaff} more staff for ${shiftType} shift on ${dateStr}`);
        
        // Prioritize employees whose role matches this shift type
        const primaryRoleProfiles = availableProfiles.filter(profile => 
          ROLE_TO_SHIFT_TYPE[profile.role] === shiftType
        );
        
        // Secondary options: employees with any role who aren't yet assigned
        const allEligibleProfiles = availableProfiles;
        
        // Try to fill from role-matched employees first, then any available if needed
        let addedCount = 0;
        
        // First try with primary role match
        addedCount = assignProfilesToShift(
          primaryRoleProfiles,
          neededStaff,
          dateStr,
          shiftType,
          assignedEmployeesByDay,
          result,
          addedCount
        );
        
        // If we still need staff, try with any eligible profile
        if (addedCount < neededStaff) {
          assignProfilesToShift(
            allEligibleProfiles,
            neededStaff - addedCount,
            dateStr,
            shiftType,
            assignedEmployeesByDay,
            result,
            addedCount
          );
        }
      }
    }
  });
  
  return result;
};

/**
 * Helper function to assign profiles to a shift type for a specific date
 */
const assignProfilesToShift = (
  profiles: Profile[],
  maxToAdd: number,
  dateStr: string,
  shiftType: ShiftType,
  assignedEmployeesByDay: Map<string, Set<string>>,
  result: Shift[],
  startCount: number
): number => {
  let addedCount = startCount;
  
  for (const profile of profiles) {
    if (addedCount >= maxToAdd + startCount) break;
    
    const isAlreadyAssigned = assignedEmployeesByDay.get(dateStr)!.has(profile.id);
    if (isAlreadyAssigned) continue;
    
    // Create a proper date from dateStr
    const shiftDate = createDateFromString(dateStr);
    
    // Create and add the new shift
    const newShift = createShift(profile, shiftDate, shiftType, dateStr);
    
    console.log(`Added ${profile.first_name} ${profile.last_name} to ${shiftType} shift on ${dateStr}`);
    result.push(newShift);
    
    // Mark this employee as assigned for this day
    assignedEmployeesByDay.get(dateStr)!.add(profile.id);
    addedCount++;
  }
  
  return addedCount;
};
