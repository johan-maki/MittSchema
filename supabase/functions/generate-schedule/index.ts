
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

const roleToShiftType = {
  'Läkare': 'day',
  'Sjuksköterska': 'evening',
  'Undersköterska': 'night'
};

// Helper function to generate random ID
function generateId() {
  return `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to check if employee is available on a given day
function isEmployeeAvailable(employee: Employee, date: Date): boolean {
  if (!employee.work_preferences?.available_days) {
    return true; // Default to available if no preferences set
  }
  
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  return employee.work_preferences.available_days.includes(dayName);
}

// Helper function to get shift times for a given day and type
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
        end: `${dateStr}T06:00:00.000Z`, // Next day, but we'll simplify for now
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { settings, profiles, currentDate, endDate, view } = await req.json();
    
    console.log("Received request to generate schedule with:", {
      settingsPresent: !!settings,
      profilesCount: profiles?.length || 0,
      currentDate,
      endDate,
      view,
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

    console.log("Generating schedule with profiles:", profiles.map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      role: p.role,
      experience: p.experience_level
    })));

    // Generate schedule for the given date range
    const start = new Date(currentDate);
    const end = new Date(endDate);
    
    // Simple scheduling algorithm
    const shifts: Shift[] = [];
    const currentDay = new Date(start);
    
    // Map to track employee shift counts
    const employeeShiftCounts: Record<string, number> = {};
    
    // Initialize shift counts
    profiles.forEach(emp => {
      employeeShiftCounts[emp.id] = 0;
    });
    
    // For each day in the range
    while (currentDay <= end) {
      // For each role, schedule employees
      Object.entries(roleToShiftType).forEach(([role, shiftType]) => {
        // Find employees with this role
        const employeesWithRole = profiles.filter(emp => 
          emp.role === role && isEmployeeAvailable(emp, currentDay)
        );
        
        if (employeesWithRole.length === 0) {
          console.log(`No employees found for role ${role} on ${currentDay.toDateString()}`);
          return; // Skip this role if no employees
        }
        
        // Sort employees by shift count (to distribute evenly) and then by experience (to prioritize more experienced)
        const sortedEmployees = [...employeesWithRole].sort((a, b) => {
          const countDiff = employeeShiftCounts[a.id] - employeeShiftCounts[b.id];
          if (countDiff !== 0) return countDiff;
          return b.experience_level - a.experience_level;
        });
        
        // Get minimum staffing requirement for this shift type
        const shiftSettings = settings[`${shiftType}_shift`] || {
          min_staff: 1, 
          min_experience_sum: 1
        };
        
        // Determine how many employees to schedule (at least min_staff)
        const employeesToSchedule = Math.min(
          sortedEmployees.length, 
          Math.max(1, shiftSettings.min_staff || 1)
        );
        
        // Schedule shifts for selected employees
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
          
          // Increment employee's shift count
          employeeShiftCounts[employee.id]++;
          
          console.log(`Scheduled ${employee.first_name} (${employee.role}) for ${shiftType} shift on ${currentDay.toDateString()}`);
        }
      });
      
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    console.log(`Generated ${shifts.length} shifts for ${profiles.length} employees`);
    
    return new Response(
      JSON.stringify({ shifts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error generating schedule:", error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate schedule: ' + error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
