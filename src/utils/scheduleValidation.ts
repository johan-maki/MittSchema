/**
 * Schedule validation utility to check for constraint violations
 * Temporary workaround until Gurobi backend is fixed
 */

import type { Shift } from '@/types/shift';
import type { Profile } from '@/types/profile';

interface ConstraintViolation {
  employeeId: string;
  employeeName: string;
  violationType: 'weekend_strict' | 'unavailable_day';
  shiftDate: string;
  shiftType: string;
  expectedDays: string[];
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
    
    // Check if employee has strict day constraint for this specific day
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
      message += `   • ${v.shiftType} ${date} (förbjuden dag)\n`;
    });
    message += `   Tillåtna dagar: ${empViolations[0].expectedDays.join(', ')}\n\n`;
  });
  
  message += `Detta är ett känt problem med Gurobi backend som ignorerar "available_days_strict" constraints.`;
  
  return message;
};
