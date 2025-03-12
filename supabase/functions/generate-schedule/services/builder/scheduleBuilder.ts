
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
  department?: string,
  constraints?: {
    max_consecutive_days: number;
    min_rest_hours: number;
    max_shifts_per_day: number;
  }
): { shifts: Shift[], staffingIssues: StaffingIssue[] } {
  const shifts: Shift[] = [];
  const staffingIssues: StaffingIssue[] = [];
  const currentDay = new Date(start);
  
  // Set default constraints if not provided
  const finalConstraints = constraints || {
    max_consecutive_days: 5,
    min_rest_hours: 11,
    max_shifts_per_day: 1
  };
  
  // Map to track employee shift counts and consecutive days
  const employeeShiftCounts: Record<string, number> = {};
  const employeeLastWorkDay: Record<string, Date | null> = {};
  const employeeConsecutiveDays: Record<string, number> = {};
  
  // Initialize tracking maps
  employees.forEach(emp => {
    employeeShiftCounts[emp.id] = 0;
    employeeLastWorkDay[emp.id] = null;
    employeeConsecutiveDays[emp.id] = 0;
  });
  
  // Track employees already assigned per day
  const assignedEmployeesByDay: Record<string, Set<string>> = {};
  
  // For each day in the range
  while (currentDay <= end) {
    const dateStr = currentDay.toISOString().split('T')[0];
    assignedEmployeesByDay[dateStr] = new Set();
    
    // For each role, schedule employees
    Object.entries(roleToShiftType).forEach(([role, shiftType]) => {
      // Find employees with this role who aren't at their consecutive day limit
      const eligibleEmployees = employees.filter(emp => {
        // Basic availability check
        if (emp.role !== role || !isEmployeeAvailable(emp, currentDay)) {
          return false;
        }
        
        // Check if already assigned today
        if (assignedEmployeesByDay[dateStr].has(emp.id)) {
          return false;
        }
        
        // Check consecutive days constraint
        if (employeeConsecutiveDays[emp.id] >= finalConstraints.max_consecutive_days) {
          return false;
        }
        
        // Check minimum rest hours constraint
        if (employeeLastWorkDay[emp.id]) {
          const lastDay = employeeLastWorkDay[emp.id]!;
          const hoursSinceLastShift = (currentDay.getTime() - lastDay.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastShift < finalConstraints.min_rest_hours) {
            return false;
          }
        }
        
        return true;
      });
      
      // Check if we should record a staffing issue
      const requiredStaff = staffingRequirements[shiftType] || 2;
      if (eligibleEmployees.length === 0) {
        staffingIssues.push({
          date: dateStr,
          shiftType: shiftType,
          current: 0,
          required: requiredStaff
        });
        return; // Skip this role if no eligible employees
      }
      
      // Assign employees to shifts
      const { shifts: newShifts, updatedCounts } = assignEmployeesToShifts(
        currentDay,
        eligibleEmployees,
        role,
        shiftType,
        requiredStaff,
        employeeShiftCounts,
        department
      );
      
      // Update our tracking variables
      shifts.push(...newShifts);
      Object.assign(employeeShiftCounts, updatedCounts);
      
      // Update consecutive days and last work day tracking
      newShifts.forEach(shift => {
        const empId = shift.employee_id;
        assignedEmployeesByDay[dateStr].add(empId);
        
        // Update last work day
        employeeLastWorkDay[empId] = new Date(currentDay);
        
        // Check if this is consecutive with last work day
        if (employeeLastWorkDay[empId]) {
          const lastDay = employeeLastWorkDay[empId]!;
          const dayDiff = Math.round((currentDay.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            // Consecutive day
            employeeConsecutiveDays[empId]++;
          } else {
            // Not consecutive, reset counter
            employeeConsecutiveDays[empId] = 1;
          }
        } else {
          // First day
          employeeConsecutiveDays[empId] = 1;
        }
      });
      
      // Check if we met the staffing requirements
      if (newShifts.length < requiredStaff) {
        staffingIssues.push({
          date: dateStr,
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
