
import { SCHEDULER_API } from "@/config/api";

interface GurobiScheduleRequest {
  start_date: string;
  end_date: string;
  department?: string;
  random_seed?: number;
  optimizer?: string;
  min_staff_per_shift?: number;
  min_experience_per_shift?: number;
  include_weekends?: boolean;
}

interface GurobiScheduleResponse {
  schedule: Array<{
    employee_id: string;
    employee_name: string;
    date: string;
    shift_type: string;
    start_time: string;
    end_time: string;
    is_weekend: boolean;
    department: string;
  }>;
  coverage_stats: {
    total_shifts: number;
    filled_shifts: number;
    coverage_percentage: number;
  };
  employee_stats: Record<string, {
    name: string;
    total_shifts: number;
    day_shifts: number;
    evening_shifts: number;
    night_shifts: number;
    weekend_shifts: number;
  }>;
  fairness_stats: {
    min_shifts_per_employee: number;
    max_shifts_per_employee: number;
    avg_shifts_per_employee: number;
    shift_distribution_range: number;
  };
  optimizer: string;
  optimization_status: string;
  objective_value?: number;
  message: string;
}

export const schedulerApi = {
  generateSchedule: async (
    startDate: string, 
    endDate: string, 
    department: string = "Akutmottagning",
    minStaffPerShift: number = 1,
    minExperiencePerShift: number = 1,
    includeWeekends: boolean = true,
    timestamp?: number, 
    retries = 3
  ): Promise<GurobiScheduleResponse> => {
    // Use local Gurobi API from environment config
    const url = `${SCHEDULER_API.BASE_URL}${SCHEDULER_API.ENDPOINTS.OPTIMIZE_SCHEDULE}`;
    
    // Ensure we always have a random seed for different results
    const random_seed = timestamp || Math.floor(Math.random() * 1000000);
    
    const requestBody: GurobiScheduleRequest = {
      start_date: startDate,
      end_date: endDate,
      department: department,
      random_seed: random_seed,
      optimizer: "gurobi",
      min_staff_per_shift: minStaffPerShift,
      min_experience_per_shift: minExperiencePerShift,
      include_weekends: includeWeekends
    };
    
    console.log("🚀 Calling Gurobi scheduler API with:", requestBody);
    
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
