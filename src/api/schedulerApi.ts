
import { SCHEDULER_API } from "@/config/api";

export const schedulerApi = {
  generateSchedule: async (startDate: string, endDate: string, department: string, timestamp?: number) => {
    const url = `${SCHEDULER_API.BASE_URL}${SCHEDULER_API.ENDPOINTS.OPTIMIZE_SCHEDULE}`;
    
    // Ensure we always have a random seed for different results
    const random_seed = timestamp || Math.floor(Math.random() * 1000000);
    
    const requestBody = {
      start_date: startDate,
      end_date: endDate,
      department: department,
      random_seed: random_seed,
      constraints: {
        max_consecutive_days: 5,
        min_rest_hours: 11,
        max_shifts_per_day: 1  // Explicitly limit to one shift per day
      }
    };
    
    console.log("Calling scheduler API with:", requestBody);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store"  // Prevent caching
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`Failed to generate schedule: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log("API response:", result);
      
      // Return the result even if schedule is empty - we'll handle fallback in the service
      return result;
    } catch (error) {
      console.error("Error calling schedule API:", error);
      throw error;
    }
  }
};
