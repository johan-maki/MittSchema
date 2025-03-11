
import { 
  Shift, 
  Employee, 
  StaffingIssue 
} from "../utils/types.ts";
import { 
  generateId, 
  roleToShiftType, 
  isEmployeeAvailable, 
  getShiftTimes 
} from "../utils/helpers.ts";

// Define minimum staffing requirements
const staffingRequirements = {
  day: 3,
  evening: 3,
  night: 2
};

// Track staffing issues during schedule generation
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

// Generate schedule for the given date range
export function generateSchedule(
  start: Date, 
  end: Date, 
  employees: Employee[], 
  department?: string
): { shifts: Shift[], staffingIssues: StaffingIssue[] } {
  // Simple scheduling algorithm
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
      
      if (employeesWithRole.length === 0) {
        console.log(`No employees found for role ${role} on ${currentDay.toDateString()}`);
        
        // Record staffing issue
        const requiredStaff = staffingRequirements[shiftType] || 2;
        staffingIssues.push({
          date: currentDay.toISOString().split('T')[0],
          shiftType: shiftType,
          current: 0,
          required: requiredStaff
        });
        
        return; // Skip this role if no employees
      }
      
      // Sort employees by shift count (to distribute evenly) and then by experience (to prioritize more experienced)
      const sortedEmployees = [...employeesWithRole].sort((a, b) => {
        const countDiff = employeeShiftCounts[a.id] - employeeShiftCounts[b.id];
        if (countDiff !== 0) return countDiff;
        return b.experience_level - a.experience_level;
      });
      
      // Determine how many employees to schedule (with minimum requirements)
      const requiredStaff = staffingRequirements[shiftType] || 2;
      const employeesToSchedule = Math.min(
        sortedEmployees.length, 
        Math.max(requiredStaff, sortedEmployees.length >= 3 ? 3 : sortedEmployees.length)
      );
      
      // Schedule shifts for selected employees
      for (let i = 0; i < employeesToSchedule; i++) {
        const employee = sortedEmployees[i];
        const { start, end } = getShiftTimes(currentDay, shiftType);
        
        shifts.push({
          id: generateId(),
          employee_id: employee.id,
          shift_type: shiftType,
          start_time: start,
          end_time: end,
          department: department || 'General'
        });
        
        // Increment employee's shift count
        employeeShiftCounts[employee.id]++;
        
        console.log(`Scheduled ${employee.first_name} (${employee.role}) for ${shiftType} shift on ${currentDay.toDateString()}`);
      }
      
      // Check if we met the staffing requirements
      if (employeesToSchedule < requiredStaff) {
        staffingIssues.push({
          date: currentDay.toISOString().split('T')[0],
          shiftType: shiftType,
          current: employeesToSchedule,
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
