
import { Shift, Employee, StaffingIssue } from "../../utils/types.ts";
import { roleToShiftType, isEmployeeAvailable } from "../../utils/helpers.ts";
import { staffingRequirements, checkStaffingRequirements } from "../staffing/staffingChecks.ts";
import { assignEmployeesToShifts } from "../assignment/shiftAssignment.ts";

/**
 * Core function to generate a full schedule for a given date range
 */
export function buildSchedule(
  start: Date, 
  end: Date, 
  employees: Employee[], 
  department?: string
): { shifts: Shift[], staffingIssues: StaffingIssue[] } {
  const shifts: Shift[] = [];
  const staffingIssues: StaffingIssue[] = [];
  const currentDay = new Date(start);
  
  // Map to track employee shift counts
  const employeeShiftCounts: Record<string, number> = {};
  
  // Initialize shift counts
  employees.forEach(emp => {
    employeeShiftCounts[emp.id] = 0;
  });
  
  // For each day in the range
  while (currentDay <= end) {
    // For each role, schedule employees
    Object.entries(roleToShiftType).forEach(([role, shiftType]) => {
      // Find employees with this role
      const employeesWithRole = employees.filter(emp => 
        emp.role === role && isEmployeeAvailable(emp, currentDay)
      );
      
      // Check if we should record a staffing issue
      const requiredStaff = staffingRequirements[shiftType] || 2;
      if (employeesWithRole.length === 0) {
        staffingIssues.push({
          date: currentDay.toISOString().split('T')[0],
          shiftType: shiftType,
          current: 0,
          required: requiredStaff
        });
        return; // Skip this role if no employees
      }
      
      // Assign employees to shifts
      const { shifts: newShifts, updatedCounts } = assignEmployeesToShifts(
        currentDay,
        employeesWithRole,
        role,
        shiftType,
        requiredStaff,
        employeeShiftCounts,
        department
      );
      
      // Update our tracking variables
      shifts.push(...newShifts);
      Object.assign(employeeShiftCounts, updatedCounts);
      
      // Check if we met the staffing requirements
      if (newShifts.length < requiredStaff) {
        staffingIssues.push({
          date: currentDay.toISOString().split('T')[0],
          shiftType: shiftType,
          current: newShifts.length,
          required: requiredStaff
        });
      }
    });
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  console.log(`Generated ${shifts.length} shifts for ${employees.length} employees`);
  console.log(`Found ${staffingIssues.length} staffing issues`);
  
  return { shifts, staffingIssues };
}
