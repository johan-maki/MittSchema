
import type { Shift, ShiftType } from "@/types/shift";
import type { Profile } from "@/types/profile";
import { format } from "date-fns";

// Define a type for staffing issues
export type StaffingIssue = {
  date: string;
  shiftType: string;
  current: number;
  required: number;
};

// Check staffing requirements and identify issues
export const checkStaffingRequirements = (shifts: Shift[], settings: any): StaffingIssue[] => {
  if (!settings) return [];
  
  const issues: StaffingIssue[] = [];
  const shiftsByDay = new Map<string, Map<ShiftType, Shift[]>>();
  
  const shiftTypeToSettingsKey = {
    'day': 'morning_shift',
    'evening': 'afternoon_shift',
    'night': 'night_shift'
  };
  
  // Group shifts by date and type
  shifts.forEach(shift => {
    const date = format(new Date(shift.start_time), 'yyyy-MM-dd');
    
    if (!shiftsByDay.has(date)) {
      shiftsByDay.set(date, new Map<ShiftType, Shift[]>());
    }
    
    const dayShifts = shiftsByDay.get(date)!;
    if (!dayShifts.has(shift.shift_type)) {
      dayShifts.set(shift.shift_type, []);
    }
    
    dayShifts.get(shift.shift_type)!.push(shift);
  });
  
  // Check each day for staffing issues
  shiftsByDay.forEach((dayShifts, date) => {
    for (const shiftType of ['day', 'evening', 'night'] as ShiftType[]) {
      const settingsKey = shiftTypeToSettingsKey[shiftType];
      const requiredStaff = settings[settingsKey]?.min_staff || 3; // Default to 3 if not found
      
      const shiftsOfType = dayShifts.get(shiftType) || [];
      
      if (shiftsOfType.length < requiredStaff) {
        issues.push({
          date,
          shiftType,
          current: shiftsOfType.length,
          required: requiredStaff
        });
      }
    }
  });
  
  return issues;
};
