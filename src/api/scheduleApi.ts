
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";

export interface ScheduleRequest {
  profiles: Profile[];
  settings: any;
  currentDate: string;
  endDate: string;
}

export interface ScheduleResponse {
  shifts: Shift[];
  metadata?: {
    score?: number;
    constraintViolations?: string[];
    executionTimeMs?: number;
  };
}

/**
 * Calls the Supabase Edge Function that runs the OR-Tools scheduler
 */
export const generateOptimizedSchedule = async (request: ScheduleRequest): Promise<ScheduleResponse> => {
  console.log("Sending schedule optimization request:", request);
  
  try {
    const { data, error } = await supabase.functions.invoke('optimize-schedule', {
      body: request
    });

    if (error) {
      console.error("Error from schedule optimizer:", error);
      throw new Error(`Schedule optimization failed: ${error.message}`);
    }

    console.log("Received optimized schedule:", data);
    return data as ScheduleResponse;
  } catch (error) {
    console.error("Failed to generate optimized schedule:", error);
    throw error;
  }
};
