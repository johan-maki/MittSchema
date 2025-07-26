/**
 * Schedule validation utility to check for constraint violations
 * Temporary workaround until Gurobi backend is fixed
 */

import type { Shift } from '@/types/shift';
import type { Profile } from '@/types/profile';

interface ConstraintViolation {
  employeeId: string;
  employeeName: string;
  violationType: 'weekend_strict' | 'unavailable_day' | 'excluded_shift';
  shiftDate: string;
  shiftType: string;
  expectedDays?: string[];
  excludedShifts?: string[];
}

export const validateScheduleConstraints = (
  schedule: Shift[],
  profiles: Profile[]
): ConstraintViolation[] => {
  const violations: ConstraintViolation[] = [];
  
  console.log('🔍 Validating schedule against strict constraints...');
  
  for (const shift of schedule) {
    const profile = profiles.find(p => p.id === shift.employee_id);
    if (!profile?.work_preferences) continue;
    
    const prefs = profile.work_preferences;
    const shiftDate = new Date(shift.date);
    const dayOfWeek = shiftDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const shiftDayName = dayNames[dayOfWeek] as keyof typeof prefs.day_constraints;
    
    // 1. Check EXCLUDED SHIFTS (hard constraint)
    const shiftConstraint = prefs.shift_constraints[shift.shift_type as keyof typeof prefs.shift_constraints];
    if (shiftConstraint?.strict && !shiftConstraint.preferred) {
      // This is an excluded shift
      const excludedShifts = Object.entries(prefs.shift_constraints)
        .filter(([_, constraint]) => constraint.strict && !constraint.preferred)
        .map(([shift, _]) => shift);
      
      violations.push({
        employeeId: shift.employee_id,
        employeeName: `${profile.first_name} ${profile.last_name}`,
        violationType: 'excluded_shift',
        shiftDate: shift.date,
        shiftType: shift.shift_type,
        excludedShifts: excludedShifts
      });
      
      console.log(`🚨 EXCLUDED SHIFT VIOLATION: ${profile.first_name} ${profile.last_name} assigned ${shift.shift_type} shift on ${shift.date} but has excluded this shift type`);
    }
    
    // 2. Check if employee has strict day constraint for this specific day
    const dayConstraint = prefs.day_constraints[shiftDayName];
    
    if (dayConstraint?.strict && !dayConstraint.available) {
      const availableDays = Object.entries(prefs.day_constraints)
        .filter(([_, constraint]) => constraint.available)
        .map(([day, _]) => day);
      
      violations.push({
        employeeId: shift.employee_id,
        employeeName: `${profile.first_name} ${profile.last_name}`,
        violationType: shiftDayName === 'saturday' || shiftDayName === 'sunday' 
          ? 'weekend_strict' 
          : 'unavailable_day',
        shiftDate: shift.date,
        shiftType: shift.shift_type,
        expectedDays: availableDays
      });
      
      console.log(`🚨 CONSTRAINT VIOLATION: ${profile.first_name} ${profile.last_name} assigned ${shift.shift_type} on ${shiftDayName} (${shift.date}) but has strict constraint against this day`);
    }
  }
  
  return violations;
};

export const formatViolationMessage = (violations: ConstraintViolation[]): string => {
  if (violations.length === 0) return '';
  
  const groupedByEmployee = violations.reduce((acc, v) => {
    if (!acc[v.employeeName]) acc[v.employeeName] = [];
    acc[v.employeeName].push(v);
    return acc;
  }, {} as Record<string, ConstraintViolation[]>);
  
  let message = `⚠️ Följande anställda har fått pass som bryter mot deras strikta begränsningar:\n\n`;
  
  Object.entries(groupedByEmployee).forEach(([name, empViolations]) => {
    message += `👤 ${name}:\n`;
    empViolations.forEach(v => {
      const date = new Date(v.shiftDate).toLocaleDateString('sv-SE');
      if (v.violationType === 'excluded_shift') {
        message += `   • ${v.shiftType} ${date} (FÖRBJUDET SKIFT - hard constraint)\n`;
      } else {
        message += `   • ${v.shiftType} ${date} (förbjuden dag)\n`;
      }
    });
    
    const firstViolation = empViolations[0];
    if (firstViolation.expectedDays) {
      message += `   Tillåtna dagar: ${firstViolation.expectedDays.join(', ')}\n\n`;
    } else if (firstViolation.excludedShifts) {
      message += `   Förbjudna skift: ${firstViolation.excludedShifts.join(', ')}\n\n`;
    }
  });
  
  message += `Detta är ett känt problem med Gurobi backend som ignorerar "excluded_shifts" och "available_days_strict" constraints.`;
  
  return message;
};
