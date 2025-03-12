
import { SCHEDULER_API } from "@/config/api";

export const schedulerApi = {
  generateSchedule: async (startDate: string, endDate: string, department: string, timestamp?: number) => {
    const url = `${SCHEDULER_API.BASE_URL}${SCHEDULER_API.ENDPOINTS.OPTIMIZE_SCHEDULE}`;
    
    // Add timestamp to request body to ensure different results each time
    const requestBody = {
      start_date: startDate,
      end_date: endDate,
      department: department,
      random_seed: timestamp || Date.now() // Use timestamp or current time as seed
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
    
    return await response.json();
  }
};
