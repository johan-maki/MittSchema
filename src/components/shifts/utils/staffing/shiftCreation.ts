
import type { Shift, ShiftType } from "@/types/shift";
import type { Profile } from "@/types/profile";
import { getShiftTimesForDate } from "./dateUtils";

/**
 * Creates a new shift based on the provided parameters
 */
export const createShift = (
  employee: Profile,
  shiftDate: Date,
  shiftType: ShiftType,
  dateStr: string
): Shift => {
  const { startTime, endTime } = getShiftTimesForDate(shiftDate, shiftType);
  
  return {
    id: `generated-${dateStr}-${shiftType}-${employee.id}`,
    employee_id: employee.id,
    shift_type: shiftType,
    department: employee.department || 'General',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString()
  };
};
