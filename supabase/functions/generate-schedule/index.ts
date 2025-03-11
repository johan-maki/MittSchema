
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
    // Try to parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    const { start_date, end_date, department } = requestBody;
    
    console.log("Received request to generate schedule with:", {
      start_date,
      end_date,
      department
    });
    
    // Validate inputs
    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters start_date or end_date' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create mock profiles for testing if none provided
    const mockProfiles = [
      {
        id: "1",
        first_name: "Anna",
        last_name: "Andersson",
        role: "Läkare",
        experience_level: 4
      },
      {
        id: "2",
        first_name: "Bengt",
        last_name: "Bengtsson",
        role: "Sjuksköterska",
        experience_level: 3
      },
      {
        id: "3",
        first_name: "Cecilia",
        last_name: "Carlsson",
        role: "Undersköterska",
        experience_level: 2
      }
    ];

    // Generate schedule for the given date range
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    // Simple scheduling algorithm
    const shifts: Shift[] = [];
    const currentDay = new Date(start);
    
    // Map to track employee shift counts
    const employeeShiftCounts: Record<string, number> = {};
    
    // Initialize shift counts
    mockProfiles.forEach(emp => {
      employeeShiftCounts[emp.id] = 0;
    });
    
    // For each day in the range
    while (currentDay <= end) {
      // For each role, schedule employees
      Object.entries(roleToShiftType).forEach(([role, shiftType]) => {
        // Find employees with this role
        const employeesWithRole = mockProfiles.filter(emp => 
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
        
        // Determine how many employees to schedule (at least 1)
        const employeesToSchedule = Math.min(
          sortedEmployees.length, 
          Math.max(1, 2) // Default to 2 staff per shift
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
            department: department || 'General'
          });
          
          // Increment employee's shift count
          employeeShiftCounts[employee.id]++;
          
          console.log(`Scheduled ${employee.first_name} (${employee.role}) for ${shiftType} shift on ${currentDay.toDateString()}`);
        }
      });
      
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    console.log(`Generated ${shifts.length} shifts for ${mockProfiles.length} employees`);
    
    return new Response(
      JSON.stringify({ schedule: shifts }),
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
