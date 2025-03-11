
import { format, startOfMonth, endOfMonth } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { generateBasicSchedule } from "../utils/localScheduleGenerator";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";

export const generateScheduleForMonth = async (
  currentDate: Date,
  profiles: Profile[],
  settings: any
): Promise<{ schedule: Shift[], staffingIssues?: { date: string; shiftType: string; current: number; required: number }[] }> => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  console.log('Calling optimization API with dates:', {
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString()
  });

  try {
    // Call the Scheduler API directly
    const response = await schedulerApi.generateSchedule(
      monthStart.toISOString(),
      monthEnd.toISOString(),
      settings?.department || 'General'
    );
    
    console.log('Schedule optimization response:', response);
    
    // Ensure the response includes staffing issues if available
    return {
      schedule: response.schedule || [],
      staffingIssues: response.staffingIssues || []
    };
  } catch (error) {
    console.error('API call failed:', error);
    
    // Fallback to local generation if the API fails
    console.log('Falling back to local schedule generation');
    const localSchedule = generateBasicSchedule(monthStart, monthEnd, profiles, settings);
    
    return {
      schedule: localSchedule,
      staffingIssues: []
    };
  }
};
