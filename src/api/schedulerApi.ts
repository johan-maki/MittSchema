
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
      random_seed: random_seed
    };
    
    console.log("Calling scheduler API with:", requestBody);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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
    
    if (!result.schedule || result.schedule.length === 0) {
      throw new Error("No schedule generated - try again with different parameters");
    }
    
    return result;
  }
};
