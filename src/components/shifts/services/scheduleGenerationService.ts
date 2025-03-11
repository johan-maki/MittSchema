
import { format, startOfMonth, endOfMonth } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { generateBasicSchedule } from "../utils/localScheduleGenerator";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";

export const generateScheduleForMonth = async (
  currentDate: Date,
  profiles: Profile[],
  settings: any
): Promise<{ schedule: Shift[] }> => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  console.log('Calling optimization API with dates:', {
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString()
  });

  // First try the API, then fall back to local generation if it fails
  try {
    const generatedSchedule = await schedulerApi.generateSchedule(
      monthStart.toISOString(),
      monthEnd.toISOString(),
      settings?.department || 'General'
    );
    console.log('Schedule optimization response:', generatedSchedule);
    return generatedSchedule;
  } catch (apiError) {
    console.error('Both API and edge function failed, falling back to local generation', apiError);
    // Generate a basic schedule locally as a fallback
    return await generateBasicSchedule(monthStart, monthEnd, profiles, settings);
  }
};
