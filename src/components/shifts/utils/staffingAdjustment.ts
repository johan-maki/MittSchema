
import type { Shift, ShiftType } from "@/types/shift";
import type { Profile } from "@/types/profile";

export const ensureMinimumStaffing = (shifts: Shift[], availableProfiles: Profile[]): Shift[] => {
  // Group shifts by day and type
  const shiftsByDay = new Map<string, Map<ShiftType, Shift[]>>();
  const result: Shift[] = [...shifts];
  
  // Map of role to preferred shift type
  const roleToShiftType: Record<string, ShiftType> = {
    'Läkare': 'day',
    'Sjuksköterska': 'evening',
    'Undersköterska': 'night'
  };
  
  // Set minimum staffing requirements
  const minStaffByShiftType: Record<ShiftType, number> = {
    'day': 3,
    'evening': 3,
    'night': 2
  };
  
  // Organize shifts by day and type
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
  
  // Track assigned employees by day to prevent double bookings
  const assignedEmployeesByDay = new Map<string, Set<string>>();
  
  // Process each day and ensure minimum staffing requirements
  shiftsByDay.forEach((dayShifts, dateStr) => {
    if (!assignedEmployeesByDay.has(dateStr)) {
      assignedEmployeesByDay.set(dateStr, new Set());
    }
    
    // Add existing assignments to tracking set
    for (const [_, shiftsOfType] of dayShifts.entries()) {
      for (const shift of shiftsOfType) {
        assignedEmployeesByDay.get(dateStr)!.add(shift.employee_id);
      }
    }
    
    // For each shift type, check and fix staffing levels
    for (const shiftType of ['day', 'evening', 'night'] as ShiftType[]) {
      const shiftsOfType = dayShifts.get(shiftType) || [];
      const neededStaff = minStaffByShiftType[shiftType] - shiftsOfType.length;
      
      if (neededStaff > 0) {
        console.log(`Need ${neededStaff} more staff for ${shiftType} shift on ${dateStr}`);
        
        // Prioritize employees whose role matches this shift type
        const primaryRoleProfiles = availableProfiles.filter(profile => 
          roleToShiftType[profile.role] === shiftType
        );
        
        // Secondary options: employees with any role who aren't yet assigned
        const allEligibleProfiles = availableProfiles;
        
        // Try to fill from role-matched employees first, then any available if needed
        let addedCount = 0;
        
        // First try with primary role match
        for (const profile of primaryRoleProfiles) {
          if (addedCount >= neededStaff) break;
          
          const isAlreadyAssigned = assignedEmployeesByDay.get(dateStr)!.has(profile.id);
          if (isAlreadyAssigned) continue;
          
          // Add this employee to the shift
          // Parse the date string properly
          const dateParts = dateStr.split('-').map(Number);
          const shiftDate = new Date(dateParts[0], dateParts[1], dateParts[2]);
          
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
            department: profile.department || 'General',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
          };
          
          console.log(`Added ${profile.first_name} ${profile.last_name} to ${shiftType} shift on ${dateStr}`);
          result.push(newShift);
          
          // Mark this employee as assigned for this day
          assignedEmployeesByDay.get(dateStr)!.add(profile.id);
          addedCount++;
        }
        
        // If we still need staff, try with any eligible profile
        if (addedCount < neededStaff) {
          for (const profile of allEligibleProfiles) {
            if (addedCount >= neededStaff) break;
            
            const isAlreadyAssigned = assignedEmployeesByDay.get(dateStr)!.has(profile.id);
            if (isAlreadyAssigned) continue;
            
            // Add this employee to the shift
            // Parse the date string properly
            const dateParts = dateStr.split('-').map(Number);
            const shiftDate = new Date(dateParts[0], dateParts[1], dateParts[2]);
            
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
              department: profile.department || 'General',
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString()
            };
            
            console.log(`Added ${profile.first_name} ${profile.last_name} to ${shiftType} shift on ${dateStr}`);
            result.push(newShift);
            
            // Mark this employee as assigned for this day
            assignedEmployeesByDay.get(dateStr)!.add(profile.id);
            addedCount++;
          }
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
