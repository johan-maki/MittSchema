
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
  availableProfiles.forEach(profile => {
    assignedShifts[profile.id] = [];
  });
  
  // Group profiles by role
  const profilesByRole = availableProfiles.reduce((acc, profile) => {
    const role = profile.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(profile);
    return acc;
  }, {} as Record<string, typeof availableProfiles>);
  
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
      
      // Shuffle the profiles for randomization
      const shuffledProfiles = [...potentialProfiles]
        .sort(() => Math.random() - 0.5) // Random shuffle
        .sort((a, b) => {
          // Prioritize profiles with fewer assigned shifts
          const aShifts = assignedShifts[a.id]?.length || 0;
          const bShifts = assignedShifts[b.id]?.length || 0;
          return aShifts - bShifts;
        });
      
      // Schedule up to staffNeeded employees
      for (let i = 0; i < Math.min(staffNeeded, shuffledProfiles.length); i++) {
        const employee = shuffledProfiles[i];
        
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
      }
    }
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  console.log(`Generated ${shifts.length} shifts locally with ${staffingIssues.length} staffing issues`);
  return { schedule: shifts, staffingIssues };
};
