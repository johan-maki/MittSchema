
import { Shift, Employee, StaffingIssue } from "../../utils/types.ts";

// Constants moved from the original file
export const staffingRequirements = {
  day: 3,
  evening: 3,
  night: 2
};

/**
 * Checks whether staffing requirements are met for a specific date and shift type
 * Returns a staffing issue if requirements aren't met
 */
export function checkStaffingRequirements(
  shifts: Shift[], 
  employees: Employee[], 
  date: Date, 
  shiftType: string, 
  minStaff: number
): StaffingIssue | null {
  
  const shiftsForDateAndType = shifts.filter(shift => {
    const shiftDate = new Date(shift.start_time);
    return shiftDate.toDateString() === date.toDateString() && shift.shift_type === shiftType;
  });
  
  const currentStaff = shiftsForDateAndType.length;
  
  if (currentStaff < minStaff) {
    return {
      date: date.toISOString().split('T')[0],
      shiftType: shiftType,
      current: currentStaff,
      required: minStaff
    };
  }
  
  return null;
}
