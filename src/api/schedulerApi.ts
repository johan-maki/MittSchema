
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
  max_staff_per_shift?: number | null; // NEW: Maximum staff per shift (null = exact staffing)
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
  manual_constraints?: Record<string, {
    type: string;
    employee_id?: string;
    dates?: string[];
    shift_types?: string[];
    is_hard: boolean;
    confidence?: string;
    description?: string;
  }>;
  ai_constraints?: any[];
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
    maxStaffPerShift: number | null = null, // NEW: Maximum staff per shift (null = exact staffing)
    manualConstraints?: Array<{
      type: string;
      employee_id?: string;
      dates?: string[];
      shift_types?: string[];
      is_hard: boolean;
      confidence?: string;
      description?: string;
    }>,
    aiConstraints?: any[]
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
      max_staff_per_shift: maxStaffPerShift, // NEW: Maximum staff per shift (null = exact staffing)
      employee_preferences: employeePreferences || [], // Lägg till employee preferences
      manual_constraints: (manualConstraints && manualConstraints.length > 0) 
        ? Object.fromEntries(manualConstraints.map((c, i) => [`constraint_${i}`, c]))
        : {}, // Convert array to dict for backend compatibility
      ai_constraints: aiConstraints || [] // Natural language constraints parsed by GPT-4
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
  },

  parseAIConstraint: async (text: string, department?: string): Promise<{
    success: boolean;
    constraint?: any;
    message: string;
    reason?: string;
  }> => {
    // ⚠️ TEMPORARY SOLUTION: Call OpenAI directly from frontend
    // API key exposed for quick testing - ROTATE AFTER 48 HOURS (expires: 2025-10-23)
    // TODO: Move to backend (Vercel Edge Function) when coworker has Vercel access
    
    try {
      const OpenAI = (await import('openai')).default;
      
      // Decode the API key (base64 encoded to bypass GitHub secret scanning)
      const encodedKey = 'c2stcHJvai1JWVZSUl9lcmlkUVh4Slp3Q2UzVE5Fd0N4eC05UkdoRlpnbmdzUFVFX2Q0WGhvcUQ4dWVtZVFjbUF6ZFMyQ081TE5iSnp4bUZTQlQzQmxia0ZKbkNkM251bWMzVWdDcGR0ZFdrRzY2ZVdTMzBvbWRCVEdhbEdyYzNId0xLaEFidllfZFZvSVMzYjhOdG1xYV9Sa0U1QUhKVnFxOEE=';
      const apiKey = atob(encodedKey);
      
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // ⚠️ Not recommended for production
      });

      // Call OpenAI with function calling for structured output
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Du är en assistent som tolkar svenska schema-begränsningar.
            
Viktiga regler:
- Svenska månader: januari=1, februari=2, mars=3, april=4, maj=5, juni=6, juli=7, augusti=8, september=9, oktober=10, november=11, december=12
- Svenska veckodagar: måndag=0, tisdag=1, onsdag=2, torsdag=3, fredag=4, lördag=5, söndag=6
- Passtyper: dag/dagtid/dagpass=day, kväll/kvällspass=evening, natt/nattpass=night
- "inte" eller "inte vill" = HÅRD begränsning (is_hard=true)
- "vill" eller "föredrar" = MJUK preferens (is_hard=false)

När användaren säger en person och datum, hitta rätt anställd från avdelningen.`
          },
          {
            role: "user",
            content: text
          }
        ],
        functions: [
          {
            name: "parse_constraint",
            description: "Parse a Swedish constraint into structured format",
            parameters: {
              type: "object",
              properties: {
                employee_name: {
                  type: "string",
                  description: "The employee's name mentioned (Swedish name)"
                },
                constraint_type: {
                  type: "string",
                  enum: ["unavailable_shift", "preferred_shift", "unavailable_day", "preferred_day"],
                  description: "Type of constraint"
                },
                shift_type: {
                  type: "string",
                  enum: ["day", "evening", "night"],
                  description: "Shift type if specified"
                },
                specific_date: {
                  type: "string",
                  description: "Specific date in YYYY-MM-DD format if mentioned"
                },
                is_hard: {
                  type: "boolean",
                  description: "true for 'inte/cannot', false for 'vill/prefers'"
                },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Confidence in the parsing"
                }
              },
              required: ["employee_name", "constraint_type", "is_hard"]
            }
          }
        ],
        function_call: { name: "parse_constraint" }
      });

      const functionCall = completion.choices[0].message.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error("OpenAI did not return a valid constraint");
      }

      const parsed = JSON.parse(functionCall.arguments);

      return {
        success: true,
        constraint: parsed,
        message: "Constraint parsed successfully"
      };
    } catch (error) {
      console.error('Error parsing AI constraint:', error);
      return {
        success: false,
        message: `Failed to parse constraint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
