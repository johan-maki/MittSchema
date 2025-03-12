
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
  department?: string
): { shifts: Shift[], staffingIssues: StaffingIssue[] } {
  return buildSchedule(start, end, employees, department);
}
