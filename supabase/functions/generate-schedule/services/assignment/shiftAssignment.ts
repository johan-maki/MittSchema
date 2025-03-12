
import { Shift, Employee } from "../../utils/types.ts";
import { generateId, roleToShiftType, isEmployeeAvailable, getShiftTimes } from "../../utils/helpers.ts";

/**
 * Creates shift assignments for employees with a specific role
 */
export function assignEmployeesToShifts(
  currentDay: Date,
  employeesWithRole: Employee[],
  role: string,
  shiftType: string,
  requiredStaff: number,
  employeeShiftCounts: Record<string, number>,
  department?: string
): { shifts: Shift[], updatedCounts: Record<string, number> } {
  // Return early if no employees found
  if (employeesWithRole.length === 0) {
    console.log(`No employees found for role ${role} on ${currentDay.toDateString()}`);
    return { shifts: [], updatedCounts: employeeShiftCounts };
  }
  
  const newShifts: Shift[] = [];
  const updatedCounts = { ...employeeShiftCounts };
  
  // Sort employees by shift count (to distribute evenly) and then by experience (to prioritize more experienced)
  const sortedEmployees = [...employeesWithRole].sort((a, b) => {
    const countDiff = employeeShiftCounts[a.id] - employeeShiftCounts[b.id];
    if (countDiff !== 0) return countDiff;
    return b.experience_level - a.experience_level;
  });
  
  // Determine how many employees to schedule (with minimum requirements)
  const employeesToSchedule = Math.min(
    sortedEmployees.length, 
    Math.max(requiredStaff, sortedEmployees.length >= 3 ? 3 : sortedEmployees.length)
  );
  
  // Schedule shifts for selected employees
  for (let i = 0; i < employeesToSchedule; i++) {
    const employee = sortedEmployees[i];
    const { start, end } = getShiftTimes(currentDay, shiftType);
    
    newShifts.push({
      id: generateId(),
      employee_id: employee.id,
      shift_type: shiftType,
      start_time: start,
      end_time: end,
      department: department || 'General'
    });
    
    // Increment employee's shift count
    updatedCounts[employee.id]++;
    
    console.log(`Scheduled ${employee.first_name} (${employee.role}) for ${shiftType} shift on ${currentDay.toDateString()}`);
  }
  
  return { shifts: newShifts, updatedCounts };
}
