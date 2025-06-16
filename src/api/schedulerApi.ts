
import { SCHEDULER_API } from "@/config/api";

export const schedulerApi = {
  generateSchedule: async (startDate: string, endDate: string, department: string, timestamp?: number, retries = 3) => {
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
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store"  // Prevent caching
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error (attempt ${attempt}):`, errorText);
          
          if (attempt === retries) {
            throw new Error(`Failed to generate schedule: ${response.status} ${errorText}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        const result = await response.json();
        console.log("API response:", result);
        
        // Return the result even if schedule is empty - we'll handle fallback in the service
        return result;
      } catch (error) {
        console.error(`Error calling schedule API (attempt ${attempt}):`, error);
        
        if (attempt === retries || (error instanceof Error && error.name === 'AbortError')) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Maximum retry attempts exceeded');
  }
};
