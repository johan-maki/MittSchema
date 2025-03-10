
import { SCHEDULER_API } from "@/config/api";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";

/**
 * Client for the Scheduler API that uses OR-Tools for schedule optimization
 */
export const schedulerApi = {
  /**
   * Generate an optimized schedule using the Cloud Run OR-Tools API
   */
  generateSchedule: async (
    startDate: string,
    endDate: string,
    department: string = 'General',
    useEdgeFunctionFallback: boolean = true
  ) => {
    try {
      // First try the Cloud Run API
      console.log(`Calling Cloud Run API to generate schedule from ${startDate} to ${endDate}`);
      
      const response = await fetch(`${SCHEDULER_API.BASE_URL}${SCHEDULER_API.ENDPOINTS.OPTIMIZE_SCHEDULE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          department
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Cloud Run API error: ${errorText}`);
        
        if (useEdgeFunctionFallback) {
          return schedulerApi.generateScheduleWithEdgeFunction(startDate, endDate, department);
        }
        
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Schedule successfully generated via Cloud Run API', data);
      return data;
    } catch (error) {
      console.error('Error generating schedule with Cloud Run API:', error);
      
      if (useEdgeFunctionFallback) {
        console.log('Falling back to Supabase Edge Function');
        return schedulerApi.generateScheduleWithEdgeFunction(startDate, endDate, department);
      }
      
      throw error;
    }
  },

  /**
   * Fallback method to generate a schedule using the Supabase Edge Function
   */
  generateScheduleWithEdgeFunction: async (
    startDate: string,
    endDate: string,
    department: string = 'General'
  ) => {
    console.log(`Falling back to Edge Function to generate schedule from ${startDate} to ${endDate}`);
    
    // Get the required data for the Edge Function
    const { data: settings } = await supabase
      .from('schedule_settings')
      .select('*')
      .eq('department', department)
      .maybeSingle();
      
    const { data: profiles } = await supabase
      .from('employees')
      .select('*');
      
    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: {
        settings,
        profiles,
        currentDate: startDate,
        endDate: endDate,
        view: 'month' // Always generate a month
      }
    });

    if (error) {
      console.error('Error from Edge Function:', error);
      throw error;
    }

    return { schedule: data?.shifts || [] };
  }
};
