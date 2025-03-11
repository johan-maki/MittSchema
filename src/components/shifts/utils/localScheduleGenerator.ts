
import { format } from "date-fns";
import type { Shift } from "@/types/shift";
import type { Profile } from "@/types/profile";

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
    
    // For each role, schedule employees
    Object.entries(profilesByRole).forEach(([role, profiles]) => {
      if (profiles.length === 0) return;
      
      const shiftType = roleToShiftType[role] || 'day';
      
      // Determine how many staff we need for this shift
      const shiftSetting = scheduleSettings?.[`${shiftType}_shift`] || { min_staff: 1 };
      const staffNeeded = shiftSetting.min_staff || 1;
      
      // Check if we have enough staff and record issues
      if (profiles.length < staffNeeded) {
        staffingIssues.push({
          date: dateStr,
          shiftType,
          current: profiles.length,
          required: staffNeeded
        });
      }
      
      // Schedule up to staffNeeded employees
      for (let i = 0; i < Math.min(staffNeeded, profiles.length); i++) {
        // Simple round-robin assignment
        const employee = profiles[i % profiles.length];
        
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
            const nextDay = new Date(currentDay);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDateStr = format(nextDay, 'yyyy-MM-dd');
            endTime = `${nextDateStr}T07:00:00.000Z`;
            break;
        }
        
        shifts.push({
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          employee_id: employee.id,
          shift_type: shiftType,
          start_time: startTime,
          end_time: endTime,
          department: scheduleSettings?.department || 'General'
        });
      }
    });
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  console.log(`Generated ${shifts.length} shifts locally with ${staffingIssues.length} staffing issues`);
  return { schedule: shifts, staffingIssues };
};
