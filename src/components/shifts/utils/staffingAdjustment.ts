
import type { Shift, ShiftType } from "@/types/shift";
import type { Profile } from "@/types/profile";

export const ensureMinimumStaffing = (shifts: Shift[], availableProfiles: Profile[]): Shift[] => {
  const shiftsByDay = new Map<string, Map<ShiftType, Shift[]>>();
  const result: Shift[] = [...shifts];
  
  const roleToShiftType: Record<string, ShiftType> = {
    'Läkare': 'day',
    'Sjuksköterska': 'evening',
    'Undersköterska': 'night'
  };
  
  const minStaffByShiftType: Record<ShiftType, number> = {
    'day': 3,
    'evening': 3,
    'night': 2
  };
  
  shifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateStr = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
    
    if (!shiftsByDay.has(dateStr)) {
      shiftsByDay.set(dateStr, new Map<ShiftType, Shift[]>());
    }
    
    const dayShifts = shiftsByDay.get(dateStr)!;
    if (!dayShifts.has(shift.shift_type)) {
      dayShifts.set(shift.shift_type, []);
    }
    
    dayShifts.get(shift.shift_type)!.push(shift);
  });
  
  shiftsByDay.forEach((dayShifts, dateStr) => {
    for (const shiftType of ['day', 'evening', 'night'] as ShiftType[]) {
      const shiftsOfType = dayShifts.get(shiftType) || [];
      const neededStaff = minStaffByShiftType[shiftType] - shiftsOfType.length;
      
      if (neededStaff > 0) {
        console.log(`Need ${neededStaff} more staff for ${shiftType} shift on ${dateStr}`);
        
        const eligibleProfiles = availableProfiles.filter(profile => {
          const profileShiftType = roleToShiftType[profile.role];
          if (profileShiftType !== shiftType) return false;
          
          const isAlreadyAssigned = shiftsOfType.some(shift => 
            shift.employee_id === profile.id
          );
          
          const alreadyHasShiftOnDay = Array.from(dayShifts.values())
            .flat()
            .some(shift => shift.employee_id === profile.id);
          
          return !isAlreadyAssigned && !alreadyHasShiftOnDay;
        });
        
        for (let i = 0; i < Math.min(neededStaff, eligibleProfiles.length); i++) {
          const profile = eligibleProfiles[i];
          
          const shiftDate = new Date(dateStr);
          let startHour = 0, endHour = 0;
          
          switch(shiftType) {
            case 'day':
              startHour = 7;
              endHour = 15;
              break;
            case 'evening':
              startHour = 15;
              endHour = 23;
              break;
            case 'night':
              startHour = 23;
              endHour = 7;
              break;
          }
          
          const startTime = new Date(shiftDate);
          startTime.setHours(startHour, 0, 0);
          
          const endTime = new Date(shiftDate);
          if (shiftType === 'night') {
            endTime.setDate(endTime.getDate() + 1);
          }
          endTime.setHours(endHour, 0, 0);
          
          const newShift: Shift = {
            id: `generated-${dateStr}-${shiftType}-${profile.id}`,
            employee_id: profile.id,
            shift_type: shiftType,
            department: 'General',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
          };
          
          console.log(`Added ${profile.first_name} ${profile.last_name} to ${shiftType} shift on ${dateStr}`);
          result.push(newShift);
        }
      }
    }
  });
  
  return result;
};

export const removeDuplicateShifts = (shifts: Shift[]): Shift[] => {
  const uniqueShiftMap = new Map<string, Shift>();
  const employeeShiftsByDay = new Map<string, Map<string, ShiftType>>();
  
  shifts.forEach(shift => {
    const shiftDate = new Date(shift.start_time);
    const dateKey = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
    const employeeId = shift.employee_id;
    const shiftType = shift.shift_type;
    
    if (!employeeShiftsByDay.has(dateKey)) {
      employeeShiftsByDay.set(dateKey, new Map<string, ShiftType>());
    }
    
    const dayEmployees = employeeShiftsByDay.get(dateKey)!;
    
    if (dayEmployees.has(employeeId) && dayEmployees.get(employeeId) !== shiftType) {
      console.log(`Employee ${employeeId} already has a different shift on ${dateKey}`);
      return;
    }
    
    dayEmployees.set(employeeId, shiftType);
    
    const uniqueKey = `${employeeId}-${dateKey}-${shiftType}`;
    
    if (!uniqueShiftMap.has(uniqueKey)) {
      uniqueShiftMap.set(uniqueKey, shift);
    }
  });
  
  return Array.from(uniqueShiftMap.values());
};
