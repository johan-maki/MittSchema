
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  experience_level: number;
  department?: string;
  work_preferences?: {
    preferred_shifts?: string[];
    max_shifts_per_week?: number;
    available_days?: string[];
  };
}

interface Settings {
  max_consecutive_days: number;
  min_rest_hours: number;
  morning_shift: { min_staff: number; min_experience_sum: number };
  afternoon_shift: { min_staff: number; min_experience_sum: number };
  night_shift: { min_staff: number; min_experience_sum: number };
  senior_experience_threshold: number;
}

interface Shift {
  id: string;
  employee_id: string;
  shift_type: 'day' | 'evening' | 'night';
  start_time: string;
  end_time: string;
  department?: string;
}

// This is a placeholder for the OR-Tools integration
// In a real implementation, this would call the OR-Tools solver
async function runOptimizer(
  profiles: Employee[],
  settings: Settings,
  startDate: Date,
  endDate: Date
): Promise<{ shifts: Shift[], metadata?: any }> {
  console.log("Running optimizer with:", {
    employeeCount: profiles.length,
    dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    settings
  });

  // PLACEHOLDER - This simulates the optimizer output
  // In a real implementation, this would use OR-Tools CP-SAT solver
  // through a proper integration mechanism (like a REST API to a Python service)
  
  const shifts: Shift[] = [];
  const currentDay = new Date(startDate);
  
  // Map roles to shift types
  const roleToShiftType = {
    'Läkare': 'day',
    'Sjuksköterska': 'evening',
    'Undersköterska': 'night'
  };
  
  // Helper function to generate a unique ID
  function generateId() {
    return `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Helper function to get shift times
  function getShiftTimes(date: Date, shiftType: 'day' | 'evening' | 'night'): { start: string, end: string } {
    const dateStr = date.toISOString().split('T')[0];
    
    switch (shiftType) {
      case 'day':
        return {
          start: `${dateStr}T08:00:00.000Z`,
          end: `${dateStr}T16:00:00.000Z`,
        };
      case 'evening':
        return {
          start: `${dateStr}T15:00:00.000Z`,
          end: `${dateStr}T23:00:00.000Z`,
        };
      case 'night':
        return {
          start: `${dateStr}T22:00:00.000Z`,
          end: `${dateStr}T06:00:00.000Z`, // Next day, but simplified for now
        };
    }
  }
  
  // Track assigned shifts per employee
  const employeeShiftCounts: Record<string, number> = {};
  profiles.forEach(emp => employeeShiftCounts[emp.id] = 0);
  
  // Simple scheduling algorithm (placeholder for OR-Tools)
  while (currentDay <= endDate) {
    // For each role, schedule employees
    Object.entries(roleToShiftType).forEach(([role, shiftType]) => {
      // Find employees with this role who are available
      const employeesWithRole = profiles.filter(emp => {
        if (emp.role !== role) return false;
        
        // Check availability
        if (!emp.work_preferences?.available_days) return true;
        
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDay.getDay()];
        return emp.work_preferences.available_days.includes(dayName);
      });
      
      if (employeesWithRole.length === 0) return;
      
      // Sort employees by shift count and experience
      const sortedEmployees = [...employeesWithRole].sort((a, b) => {
        const countDiff = employeeShiftCounts[a.id] - employeeShiftCounts[b.id];
        if (countDiff !== 0) return countDiff;
        return b.experience_level - a.experience_level;
      });
      
      // Get staffing requirements
      const shiftSettings = settings[`${shiftType}_shift`] || { min_staff: 1, min_experience_sum: 1 };
      
      // Schedule shifts
      const employeesToSchedule = Math.min(
        sortedEmployees.length, 
        Math.max(1, shiftSettings.min_staff || 1)
      );
      
      for (let i = 0; i < employeesToSchedule; i++) {
        const employee = sortedEmployees[i];
        const { start, end } = getShiftTimes(currentDay, shiftType as 'day' | 'evening' | 'night');
        
        shifts.push({
          id: generateId(),
          employee_id: employee.id,
          shift_type: shiftType as 'day' | 'evening' | 'night',
          start_time: start,
          end_time: end,
          department: employee.department || 'General'
        });
        
        employeeShiftCounts[employee.id]++;
      }
    });
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  // Return generated shifts with metadata
  return {
    shifts,
    metadata: {
      score: 85, // Placeholder optimization score
      constraintViolations: [],
      executionTimeMs: 125 // Fake execution time
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { settings, profiles, currentDate, endDate } = await req.json();
    
    console.log("Received request to optimize schedule with:", {
      settingsPresent: !!settings,
      profilesCount: profiles?.length || 0,
      currentDate,
      endDate,
    });
    
    // Validate inputs
    if (!settings || !profiles || profiles.length === 0 || !currentDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Parse dates
    const start = new Date(currentDate);
    const end = new Date(endDate);
    
    // Run optimization algorithm (placeholder)
    const result = await runOptimizer(profiles, settings, start, end);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error optimizing schedule:", error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to optimize schedule: ' + error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
