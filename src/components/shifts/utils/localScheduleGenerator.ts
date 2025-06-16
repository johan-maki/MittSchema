import { format, addDays } from "date-fns";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a basic schedule locally as a fallback when API calls fail
 */
export const generateBasicSchedule = async (
  startDate: Date, 
  endDate: Date, 
  availableProfiles: Profile[],
  scheduleSettings: any
): Promise<{ schedule: Shift[], staffingIssues: { date: string; shiftType: string; current: number; required: number }[] }> => {
  console.log('Generating a basic schedule locally as fallback');
  
  if (!availableProfiles || availableProfiles.length === 0) {
    return { schedule: [], staffingIssues: [] };
  }

  const shifts: Shift[] = [];
  const staffingIssues: { date: string; shiftType: string; current: number; required: number }[] = [];
  const currentDay = new Date(startDate);
  const shiftTypes = ['day', 'evening', 'night'] as const;
  const roleToShiftType: Record<string, typeof shiftTypes[number]> = {
    'Läkare': 'day',
    'Sjuksköterska': 'evening',
    'Undersköterska': 'night'
  };
  
  // Track assigned shifts to avoid scheduling the same person repeatedly
  const assignedShifts: Record<string, { date: string, shiftType: string }[]> = {};
  const consecutiveDaysWorked: Record<string, number> = {};
  const lastShiftDate: Record<string, Date | null> = {};
  
  availableProfiles.forEach(profile => {
    assignedShifts[profile.id] = [];
    consecutiveDaysWorked[profile.id] = 0;
    lastShiftDate[profile.id] = null;
  });
  
  // Group profiles by role for better shift assignment
  const profilesByRole = availableProfiles.reduce((acc, profile) => {
    const role = profile.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(profile);
    return acc;
  }, {} as Record<string, typeof availableProfiles>);
  
  console.log('📊 Profile distribution by role:', Object.keys(profilesByRole).map(role => 
    `${role}: ${profilesByRole[role].length}`).join(', '));
  
  // For each day in the range
  while (currentDay <= endDate) {
    const dateStr = format(currentDay, 'yyyy-MM-dd');
    
    // For each shift type, schedule employees with some randomization
    for (const shiftType of shiftTypes) {
      // Get all potential profiles for this shift type
      let potentialProfiles: Profile[] = [];
      
      // Match roles to shift types when possible, otherwise use all available profiles
      if (shiftType === 'day') {
        potentialProfiles = profilesByRole['Läkare'] || [];
      } else if (shiftType === 'evening') {
        potentialProfiles = profilesByRole['Sjuksköterska'] || [];
      } else if (shiftType === 'night') {
        potentialProfiles = profilesByRole['Undersköterska'] || [];
      }
      
      // If no specific profiles for this shift type, use all available
      if (potentialProfiles.length === 0) {
        potentialProfiles = availableProfiles;
      }
      
      // Determine how many staff we need for this shift
      let staffNeeded = 2; // Default
      if (shiftType === 'day') staffNeeded = scheduleSettings?.morning_shift?.min_staff || 3;
      else if (shiftType === 'evening') staffNeeded = scheduleSettings?.afternoon_shift?.min_staff || 3;
      else if (shiftType === 'night') staffNeeded = scheduleSettings?.night_shift?.min_staff || 2;
      
      // Check if we have enough staff and record issues
      if (potentialProfiles.length < staffNeeded) {
        staffingIssues.push({
          date: dateStr,
          shiftType,
          current: potentialProfiles.length,
          required: staffNeeded
        });
        staffNeeded = Math.min(staffNeeded, potentialProfiles.length);
      }
      
      // Shuffle the profiles for randomization and better distribution
      const shuffledProfiles = [...potentialProfiles]
        .sort(() => Math.random() - 0.5) // Random shuffle
        .sort((a, b) => {
          // Prioritize profiles with fewer assigned shifts for better workload distribution
          const aShifts = assignedShifts[a.id]?.length || 0;
          const bShifts = assignedShifts[b.id]?.length || 0;
          
          // Also consider consecutive days worked (avoid overworking)
          const aConsecutive = consecutiveDaysWorked[a.id] || 0;
          const bConsecutive = consecutiveDaysWorked[b.id] || 0;
          
          // First priority: fewer total shifts
          if (aShifts !== bShifts) return aShifts - bShifts;
          
          // Second priority: fewer consecutive days
          return aConsecutive - bConsecutive;
        });
      
      // Schedule up to staffNeeded employees with constraint checking
      for (let i = 0; i < Math.min(staffNeeded, shuffledProfiles.length); i++) {
        const employee = shuffledProfiles[i];
        
        // Check if employee can work (avoid excessive consecutive days)
        const maxConsecutiveDays = 5; // Max 5 consecutive days
        if (consecutiveDaysWorked[employee.id] >= maxConsecutiveDays) {
          console.log(`⚠️ Skipping ${employee.first_name} ${employee.last_name} - too many consecutive days`);
          continue;
        }
        
        // Check for minimum rest period (at least 1 day off after night shift)
        const lastShift = assignedShifts[employee.id]?.slice(-1)[0];
        if (lastShift && lastShift.shiftType === 'night') {
          const lastShiftDate = new Date(lastShift.date);
          const currentShiftDate = new Date(currentDay);
          const daysDiff = Math.floor((currentShiftDate.getTime() - lastShiftDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 2) { // Need at least 1 day rest after night shift
            console.log(`⚠️ Skipping ${employee.first_name} ${employee.last_name} - needs rest after night shift`);
            continue;
          }
        }
        
        // Generate shift times based on shift type
        let startTime, endTime;
        switch(shiftType) {
          case 'day':
            startTime = `${dateStr}T07:00:00.000Z`;
            endTime = `${dateStr}T15:00:00.000Z`;
            break;
          case 'evening':
            startTime = `${dateStr}T15:00:00.000Z`;
            endTime = `${dateStr}T23:00:00.000Z`;
            break;
          case 'night':
            startTime = `${dateStr}T23:00:00.000Z`;
            const nextDay = addDays(new Date(currentDay), 1);
            const nextDateStr = format(nextDay, 'yyyy-MM-dd');
            endTime = `${nextDateStr}T07:00:00.000Z`;
            break;
        }
        
        // Create the shift
        shifts.push({
          id: uuidv4(), // Generate a proper UUID for the shift
          employee_id: employee.id,
          shift_type: shiftType,
          start_time: startTime,
          end_time: endTime,
          department: scheduleSettings?.department || 'General'
        });
        
        // Track that we assigned this employee a shift
        if (!assignedShifts[employee.id]) assignedShifts[employee.id] = [];
        assignedShifts[employee.id].push({ date: dateStr, shiftType });
        
        // Update consecutive days tracking
        const prevDate = lastShiftDate[employee.id];
        if (prevDate) {
          const daysDiff = Math.floor((currentDay.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            consecutiveDaysWorked[employee.id]++;
          } else {
            consecutiveDaysWorked[employee.id] = 1; // Reset consecutive count
          }
        } else {
          consecutiveDaysWorked[employee.id] = 1;
        }
        lastShiftDate[employee.id] = new Date(currentDay);
      }
    }
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  // Generate summary statistics for better insight
  const shiftsByEmployee = availableProfiles.map(profile => ({
    name: `${profile.first_name} ${profile.last_name}`,
    role: profile.role,
    shifts: assignedShifts[profile.id]?.length || 0
  }));
  
  console.log('📋 Two-week schedule summary:');
  console.log(`• Total shifts generated: ${shifts.length}`);
  console.log(`• Staffing issues: ${staffingIssues.length}`);
  console.log('• Workload distribution:', shiftsByEmployee.map(emp => 
    `${emp.name} (${emp.role}): ${emp.shifts} shifts`).join(', '));
  
  return { schedule: shifts, staffingIssues };
};

/**
 * Enhanced local schedule generator with smart, fair distribution for two weeks
 * This bypasses all API calls and creates a balanced schedule locally
 */
export const generateEnhancedLocalSchedule = async (
  startDate: Date,
  endDate: Date,
  availableProfiles: Profile[],
  scheduleSettings: any,
  onProgress?: (message: string, percentage: number) => void
): Promise<{ schedule: Shift[], staffingIssues: { date: string; shiftType: string; current: number; required: number }[] }> => {
  console.log('🧠 Enhanced local schedule generation starting...');
  onProgress?.('Setting up enhanced local generation...', 40);
  
  if (!availableProfiles || availableProfiles.length === 0) {
    return { schedule: [], staffingIssues: [] };
  }

  const shifts: Shift[] = [];
  const staffingIssues: { date: string; shiftType: string; current: number; required: number }[] = [];
  
  // Use standard shift types that match the existing system
  const shiftTypes = [
    { type: 'day' as const, start: '08:00', end: '16:00' },
    { type: 'evening' as const, start: '16:00', end: '00:00' },
    { type: 'night' as const, start: '00:00', end: '08:00' }
  ];

  // Track workload fairly across all employees
  const employeeWorkload: Record<string, {
    totalHours: number;
    shiftsCount: number;
    lastShiftDate: string | null;
    consecutiveDays: number;
    weekendShifts: number;
  }> = {};

  // Initialize workload tracking
  availableProfiles.forEach(profile => {
    employeeWorkload[profile.id] = {
      totalHours: 0,
      shiftsCount: 0,
      lastShiftDate: null,
      consecutiveDays: 0,
      weekendShifts: 0
    };
  });

  onProgress?.('Calculating fair shift distribution...', 50);

  // Calculate total days and required shifts
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetShiftsPerEmployee = Math.floor((totalDays * 2) / availableProfiles.length); // 2 shifts per day average
  
  console.log(`📈 Planning fair distribution: ${totalDays} days, ~${targetShiftsPerEmployee} shifts per employee`);

  // Generate shifts day by day
  const currentDay = new Date(startDate);
  let dayCount = 0;

  while (currentDay <= endDate) {
    const dateStr = format(currentDay, 'yyyy-MM-dd');
    const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
    
    onProgress?.(`Scheduling ${dateStr}...`, 60 + (dayCount / totalDays) * 30);

    // For each shift type on this day (limit to 2-3 shifts per day)
    const dailyShifts = isWeekend ? shiftTypes.slice(0, 2) : shiftTypes; // Fewer shifts on weekends
    
    for (const shiftType of dailyShifts) {
      // Find the best employee for this shift
      const bestEmployee = findBestEmployeeForShift(
        availableProfiles,
        employeeWorkload,
        dateStr,
        shiftType.type,
        isWeekend,
        targetShiftsPerEmployee
      );

      if (bestEmployee) {
        // Create the shift
        const shiftStart = new Date(currentDay);
        const [startHour, startMinute] = shiftType.start.split(':').map(Number);
        shiftStart.setHours(startHour, startMinute, 0, 0);
        
        const shiftEnd = new Date(shiftStart);
        const [endHour, endMinute] = shiftType.end.split(':').map(Number);
        
        // Handle overnight shifts
        if (endHour < startHour || (endHour === 0 && startHour > 0)) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }
        shiftEnd.setHours(endHour, endMinute, 0, 0);

        const shiftDurationHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);

        const shift: Shift = {
          id: uuidv4(),
          start_time: shiftStart.toISOString(),
          end_time: shiftEnd.toISOString(),
          shift_type: shiftType.type,
          department: scheduleSettings?.department || 'General',
          employee_id: bestEmployee.id,
          is_published: false
        };

        shifts.push(shift);

        // Update workload tracking
        const workload = employeeWorkload[bestEmployee.id];
        workload.totalHours += shiftDurationHours;
        workload.shiftsCount++;
        
        // Update consecutive days logic
        const previousLastShiftDate = workload.lastShiftDate;
        workload.lastShiftDate = dateStr;
        
        if (previousLastShiftDate) {
          const lastDate = new Date(previousLastShiftDate);
          const currentDate = new Date(dateStr);
          const dayDiff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (dayDiff === 1) {
            workload.consecutiveDays++;
          } else {
            workload.consecutiveDays = 1;
          }
        } else {
          workload.consecutiveDays = 1;
        }

        if (isWeekend) {
          workload.weekendShifts++;
        }

        console.log(`✅ Assigned ${shiftType.type} shift on ${dateStr} to ${bestEmployee.first_name} ${bestEmployee.last_name}`);
      } else {
        // Track staffing issue
        staffingIssues.push({
          date: dateStr,
          shiftType: shiftType.type,
          current: 0,
          required: 1
        });
        console.log(`⚠️  No available employee for ${shiftType.type} shift on ${dateStr}`);
      }
    }

    currentDay.setDate(currentDay.getDate() + 1);
    dayCount++;
  }

  // Log final distribution
  console.log('📊 Final workload distribution:');
  Object.entries(employeeWorkload).forEach(([employeeId, workload]) => {
    const employee = availableProfiles.find(p => p.id === employeeId);
    console.log(`  ${employee?.first_name} ${employee?.last_name}: ${workload.shiftsCount} shifts, ${workload.totalHours.toFixed(1)} hours`);
  });

  onProgress?.('Enhanced schedule generation complete!', 100);
  console.log(`🎉 Generated ${shifts.length} shifts with enhanced local algorithm`);

  return { schedule: shifts, staffingIssues };
};

/**
 * Find the best employee for a specific shift based on fair distribution
 */
function findBestEmployeeForShift(
  profiles: Profile[],
  workloadTracker: Record<string, any>,
  dateStr: string,
  shiftType: string,
  isWeekend: boolean,
  targetShiftsPerEmployee: number
): Profile | null {
  
  // Filter available employees (basic availability check)
  const availableEmployees = profiles.filter(employee => {
    const workload = workloadTracker[employee.id];
    
    // Don't schedule if they worked yesterday and already have 3+ consecutive days
    if (workload.lastShiftDate) {
      const lastDate = new Date(workload.lastShiftDate);
      const currentDate = new Date(dateStr);
      const dayDiff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // No consecutive days if they've already worked 3 in a row
      if (dayDiff === 1 && workload.consecutiveDays >= 3) {
        return false;
      }
    }
    
    return true;
  });

  if (availableEmployees.length === 0) {
    return null;
  }

  // Score employees based on fairness (lower score = more priority)
  const scoredEmployees = availableEmployees.map(employee => {
    const workload = workloadTracker[employee.id];
    let score = 0;

    // Primary factor: how many shifts they have compared to target
    const shiftDeficit = targetShiftsPerEmployee - workload.shiftsCount;
    score -= shiftDeficit * 10; // Prioritize employees with fewer shifts

    // Secondary factor: total hours worked
    score += workload.totalHours * 0.1;

    // Weekend fairness
    if (isWeekend) {
      score += workload.weekendShifts * 2; // Slightly penalize those who've worked many weekends
    }

    // Prefer employees who haven't worked recently
    if (workload.lastShiftDate) {
      const lastDate = new Date(workload.lastShiftDate);
      const currentDate = new Date(dateStr);
      const daysSinceLastShift = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      score -= daysSinceLastShift * 0.5; // Slight preference for more rest
    } else {
      score -= 5; // Strong preference for employees who haven't worked yet
    }

    return { employee, score };
  });

  // Sort by score (lowest first = highest priority)
  scoredEmployees.sort((a, b) => a.score - b.score);

  return scoredEmployees[0].employee;
}
