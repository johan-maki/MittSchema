
import { SCHEDULER_API } from "@/config/api";
import { supabase } from "@/integrations/supabase/client";
import type { Shift } from "@/types/shift";

export const schedulerApi = {
  /**
   * Generate a schedule using the Cloud Run scheduler API
   */
  generateSchedule: async (
    startDate: string, 
    endDate: string, 
    department: string
  ): Promise<{ schedule: Shift[] }> => {
    try {
      console.log('Calling scheduler API with dates:', { startDate, endDate, department });
      
      const response = await fetch(`${SCHEDULER_API.BASE_URL}${SCHEDULER_API.ENDPOINTS.OPTIMIZE_SCHEDULE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          department: department,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Scheduler API returned data:', data);
      return data;
    } catch (error) {
      console.error('Error calling scheduler API:', error);
      console.log('Falling back to Supabase edge function');
      
      // Fallback to Supabase Edge Function
      const { data, error: supabaseError } = await supabase.functions.invoke('generate-schedule', {
        body: { 
          start_date: startDate,
          end_date: endDate,
          department: department
        }
      });
      
      if (supabaseError) {
        console.error('Supabase edge function error:', supabaseError);
        throw supabaseError;
      }
      
      return data;
    }
  }
};
