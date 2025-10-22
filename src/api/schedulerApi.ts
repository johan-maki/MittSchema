
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

  parseAIConstraint: async (text: string, department?: string, selectedEmployeeId?: string): Promise<{
    success: boolean;
    mode?: 'parse' | 'clarify';
    constraint?: any;
    message?: string;
    reason?: string;
    question?: string;
    options?: Array<{ label: string; value: string }>;
    natural_language?: string;
  }> => {
    try {
      // Use local proxy in development, Supabase Edge Function in production
      const isDevelopment = import.meta.env.DEV;
      const functionUrl = isDevelopment 
        ? 'http://localhost:3001/parse'  // 🏠 Local proxy (API key safe on your machine)
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-constraint`; // 🌐 Production Supabase
      
      console.log(`🔐 Using ${isDevelopment ? '🏠 LOCAL PROXY' : '🌐 PRODUCTION'} endpoint:`, functionUrl);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Only add auth header for production (Supabase)
      if (!isDevelopment) {
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          department: department || 'Akutmottagning',
          employee_id: selectedEmployeeId // For clarification follow-ups
          // organization_id removed - Edge Function loads ALL employees now
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge Function HTTP error:', response.status, errorText);
        throw new Error(`Failed to parse constraint: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Edge Function returned:', result);
      return result;
    } catch (error) {
      console.error('Error parsing AI constraint:', error);
      return {
        success: false,
        message: `Failed to parse constraint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

    // Save AI constraint to database (when accepted by user)
  saveAIConstraint: async (constraint: {
    employee_name: string;
    employee_id?: string;
    constraint_type: string;
    shift_type?: string;
    start_date: string;
    end_date: string;
    is_hard: boolean;
    confidence?: string;
    original_text: string;
    department?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Convert date range to array of dates (matching new schema)
      const dates: string[] = [];
      const start = new Date(constraint.start_date);
      const end = new Date(constraint.end_date);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      
      // Convert shift_type to shifts array (matching new schema)
      const shifts = constraint.shift_type ? [constraint.shift_type] : [];
      
      // Convert constraint_type and is_hard to new format
      let newConstraintType = 'hard_unavailable'; // Default
      let priority = 1000; // Default for hard constraints
      
      if (constraint.constraint_type === 'unavailability' || constraint.constraint_type === 'unavailable_day') {
        newConstraintType = constraint.is_hard ? 'hard_unavailable' : 'soft_preference';
        priority = constraint.is_hard ? 1000 : 100;
      } else if (constraint.constraint_type === 'shift_preference') {
        newConstraintType = 'soft_preference';
        priority = 100;
      } else if (constraint.constraint_type === 'required') {
        newConstraintType = 'hard_required';
        priority = 1000;
      }
      
      // Get current user ID for RLS policy
      const { data: { user } } = await supabase.auth.getUser();
      
      // Table will exist after migration - use new schema
      const { data, error } = await (supabase as any)
        .from('ai_constraints')
        .insert([{
          employee_id: constraint.employee_id || null,
          dates: dates,
          shifts: shifts,
          constraint_type: newConstraintType,
          priority: priority,
          original_text: constraint.original_text,
          department: constraint.department || 'Akutmottagning',
          created_by: user?.id || null // CRITICAL: Set created_by for RLS deletion policy
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Saved AI constraint to database:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error saving AI constraint:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save constraint'
      };
    }
  },

  // Load all AI constraints from database
  loadAIConstraints: async (department?: string): Promise<{
    success: boolean;
    constraints?: any[];
    error?: string;
  }> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Table will exist after migration
      let query = (supabase as any)
        .from('ai_constraints')
        .select('*')
        .order('created_at', { ascending: false });

      if (department) {
        query = query.eq('department', department);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log(`📋 Loaded ${data?.length || 0} AI constraints from database`);
      return { success: true, constraints: data || [] };
    } catch (error) {
      console.error('❌ Error loading AI constraints:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load constraints'
      };
    }
  },

  // Delete AI constraint from database
  deleteAIConstraint: async (constraintId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Table will exist after migration
      const { error } = await (supabase as any)
        .from('ai_constraints')
        .delete()
        .eq('id', constraintId);

      if (error) {
        throw error;
      }

      console.log('✅ Deleted AI constraint:', constraintId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting AI constraint:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete constraint'
      };
    }
  }
};
