
import { SCHEDULER_API } from "@/config/api";

/**
 * API client for interacting with the Schedule Optimization API
 */
export const schedulerApi = {
  /**
   * Generate an optimized schedule for a given date range
   * @param startDate ISO string for start date
   * @param endDate ISO string for end date
   * @param department Optional department filter
   * @returns Promise with the optimized schedule
   */
  generateSchedule: async (startDate: string, endDate: string, department?: string) => {
    try {
      console.log("Scheduler API: Generating schedule with params:", { startDate, endDate, department });
      
      const response = await fetch(`${SCHEDULER_API.BASE_URL}${SCHEDULER_API.ENDPOINTS.OPTIMIZE_SCHEDULE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          department: department || 'General'
        }),
      });
      
      if (!response.ok) {
        console.error("Scheduler API error:", response.status, response.statusText);
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`API request failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
        } catch (e) {
          // If we can't parse the error as JSON, just use the text
          throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log("Scheduler API response:", data);
      return data;
    } catch (error) {
      console.error("Scheduler API call failed:", error);
      throw error;
    }
  }
};
