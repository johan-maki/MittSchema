
import { Shift, Employee, StaffingIssue } from "../utils/types.ts";
import { buildSchedule } from "./builder/scheduleBuilder.ts";
import { checkStaffingRequirements } from "./staffing/staffingChecks.ts";

// Export the staffing check function for convenience
export { checkStaffingRequirements };

// Main function to generate schedule for the given date range
export function generateSchedule(
  start: Date, 
  end: Date, 
  employees: Employee[], 
  department?: string,
  constraints?: {
    max_consecutive_days?: number;
    min_rest_hours?: number;
    max_shifts_per_day?: number;
  }
): { shifts: Shift[], staffingIssues: StaffingIssue[] } {
  // Apply default constraints if not provided
  const finalConstraints = {
    max_consecutive_days: constraints?.max_consecutive_days || 5,
    min_rest_hours: constraints?.min_rest_hours || 11,
    max_shifts_per_day: constraints?.max_shifts_per_day || 1
  };
  
  return buildSchedule(start, end, employees, department, finalConstraints);
}
