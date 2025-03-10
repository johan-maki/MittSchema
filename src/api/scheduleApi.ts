
import { supabase } from "@/integrations/supabase/client";

interface ScheduleOptimizationRequest {
  startDate: string;
  endDate: string;
  department?: string;
}

interface ScheduleOptimizationResponse {
  schedule: Array<{
    employee_id: string;
    start_time: string;
    end_time: string;
    shift_type: string;
    department: string;
    is_published: boolean;
  }>;
  message: string;
}

export const scheduleApi = {
  /**
   * Optimizes the work schedule for the given date range
   */
  optimizeSchedule: async (params: ScheduleOptimizationRequest): Promise<ScheduleOptimizationResponse> => {
    try {
      // Option 1: Use Supabase Edge Function (if deployed)
      const { data, error } = await supabase.functions.invoke('optimize-schedule', {
        body: {
          start_date: params.startDate,
          end_date: params.endDate,
          department: params.department
        },
      });

      if (error) throw error;
      return data;

      // Option 2: Call the standalone API if not using Supabase Edge Function
      /*
      const response = await fetch('https://your-scheduler-api-url/optimize-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: params.startDate,
          end_date: params.endDate,
          department: params.department
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to optimize schedule: ${errorText}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      throw error;
    }
  },

  /**
   * Subscribes to real-time shift updates from Supabase
   */
  subscribeToShiftUpdates: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel('public:shifts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
