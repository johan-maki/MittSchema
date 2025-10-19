
import { SCHEDULER_API } from "@/config/api";

interface GurobiScheduleRequest {
  start_date: string;
  end_date: string;
  department?: string;
  random_seed?: number;
  optimizer?: string;
  min_staff_per_shift?: number;
  minimum_staff?: number;
  staff_constraint?: string;
  min_experience_per_shift?: number;
  include_weekends?: boolean;
  weekend_penalty_weight?: number;
  fairness_weight?: number;
  balance_workload?: boolean;
  max_hours_per_nurse?: number;
  allow_partial_coverage?: boolean; // NEW: Allow partial schedules when not enough staff
  optimize_for_cost?: boolean; // NEW: Optimize for minimum cost
  employee_preferences?: Array<{
    employee_id: string;
    preferred_shifts: string[];
    max_shifts_per_week: number; // Keep for backward compatibility - converted from work_percentage
    available_days: string[];
    available_days_strict?: boolean;
    preferred_shifts_strict?: boolean;
    // New fields for better constraint handling
    excluded_shifts?: string[];
    excluded_days?: string[];
    role?: string;
    experience_level?: number;
    work_percentage?: number; // Add work_percentage for capacity calculations
  }>;
  manual_constraints?: Array<{
    type: string;
    employee_id?: string;
    dates?: string[];
    shift_types?: string[];
    is_hard: boolean;
    confidence?: string;
    description?: string;
  }>;
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
    hours?: number;
    hourly_rate?: number;
    cost?: number;
  }>;
  coverage_stats: {
    total_shifts: number;
    filled_shifts: number;
    coverage_percentage: number;
    uncovered_count?: number;
    uncovered_shifts?: Array<{
      date: string;
      day_name: string;
      shift_type: string;
      shift_label: string;
      reasons: string[];
    }>;
    shift_type_coverage?: {
      day: { filled: number; total: number; percentage: number };
      evening: { filled: number; total: number; percentage: number };
      night: { filled: number; total: number; percentage: number };
    };
  };
  employee_stats: Record<string, {
    name: string;
    total_shifts: number;
    day_shifts: number;
    evening_shifts: number;
    night_shifts: number;
    weekend_shifts: number;
    total_hours?: number;
    total_cost?: number;
  }>;
  fairness_stats: {
    min_shifts_per_employee: number;
    max_shifts_per_employee: number;
    avg_shifts_per_employee: number;
    shift_distribution_range: number;
  };
  cost_stats?: {
    total_cost: number;
    total_hours: number;
    average_hourly_rate: number;
    cost_by_shift_type: {
      day: number;
      evening: number;
      night: number;
    };
    cost_by_employee: Record<string, {
      name: string;
      hours: number;
      cost: number;
    }>;
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
    employeePreferences?: Array<{
      employee_id: string;
      preferred_shifts: string[];
      max_shifts_per_week: number; // Keep for backward compatibility - converted from work_percentage
      available_days: string[];
    }>,
    retries = 3,
    allowPartialCoverage: boolean = false, // NEW: Allow partial schedules when not enough staff
    optimizeForCost: boolean = false, // NEW: Optimize for minimum cost
    manualConstraints?: Array<{
      type: string;
      employee_id?: string;
      dates?: string[];
      shift_types?: string[];
      is_hard: boolean;
      confidence?: string;
      description?: string;
    }>
  ): Promise<GurobiScheduleResponse> => {
    // Use local Gurobi API from environment config
    const url = `${SCHEDULER_API.BASE_URL}${SCHEDULER_API.ENDPOINTS.OPTIMIZE_SCHEDULE}`;
    
    // Ensure we always have a random seed for different results
    // Convert large timestamps to smaller values suitable for Gurobi
    let random_seed: number;
    if (timestamp) {
      // If timestamp is provided, convert it to a smaller value (0-999999)
      random_seed = timestamp % 1000000;
    } else {
      random_seed = Math.floor(Math.random() * 1000000);
    }
    
    // Beräkna automatisk weekend penalty baserat på antal anställda och staffing requirements
    // Högre penalty för bättre rättvisa, justerat för antal personer som behövs
    const automaticWeekendPenalty = Math.max(1500, minStaffPerShift * 750);
    
    const requestBody: GurobiScheduleRequest = {
      start_date: startDate,
      end_date: endDate,
      department: department,
      random_seed: random_seed,
      optimizer: "gurobi",
      min_staff_per_shift: minStaffPerShift,
      minimum_staff: minStaffPerShift, // Säkerställ att båda parametrarna är samma
      staff_constraint: allowPartialCoverage ? "flexible" : "strict", // Use flexible for partial coverage
      min_experience_per_shift: minExperiencePerShift,
      include_weekends: includeWeekends,
      weekend_penalty_weight: automaticWeekendPenalty, // Automatisk beräkning för rättvisa
      fairness_weight: 1.0, // Maximal fokus på rättvis fördelning
      balance_workload: true, // Balansera arbetsbördan
      max_hours_per_nurse: 40, // Maximal arbetstid per sjuksköterska
      allow_partial_coverage: allowPartialCoverage, // NEW: Signal backend to allow partial schedules
      optimize_for_cost: optimizeForCost, // NEW: Signal backend to optimize for cost
      employee_preferences: employeePreferences || [], // Lägg till employee preferences
      manual_constraints: manualConstraints || [] // AI-parsed or manually added constraints
    };
    
    console.log("🚀 Calling Gurobi scheduler API with:", requestBody);
    console.log("🌍 Environment:", {
      isProduction: import.meta.env.PROD,
      schedulerUrl: SCHEDULER_API.BASE_URL,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
    });
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout (increased for Gurobi optimization)
        
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
        
        // Return the result - if empty, the service layer will handle the error appropriately
        return result;
      } catch (error) {
        console.error(`Error calling schedule API (attempt ${attempt}):`, error);
        
        if (attempt === retries || (error instanceof Error && error.name === 'AbortError')) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Unable to connect to Gurobi optimizer - request timed out. Please check your connection and try again.');
          }
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Unable to connect to Gurobi optimizer - server is not available. Please check the service status and try again.');
          }
          throw new Error(`Unable to connect to Gurobi optimizer: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your connection and try again.`);
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Unable to connect to Gurobi optimizer after multiple attempts. Please check the service status and try again.');
  }
};
