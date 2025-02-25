import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface ShiftTimeConfig {
  start_time: string;
  end_time: string;
  min_staff: number;
  min_experience_sum: number;
  min_senior_count: number;
}

interface Settings {
  max_consecutive_days: number;
  min_rest_hours: number;
  min_weekly_rest_hours: number;
  senior_experience_threshold: number;
  require_night_shift_qualification: boolean;
  morning_shift: ShiftTimeConfig;
  afternoon_shift: ShiftTimeConfig;
  night_shift: ShiftTimeConfig;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  experience_level: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { settings, profiles, currentDate, view } = await req.json();

    if (!settings || !profiles || !currentDate || !view) {
      throw new Error("Missing required parameters");
    }

    const generatedShifts = [];
    const startDate = new Date(currentDate);
    const daysToSchedule = view === 'day' ? 1 : view === 'week' ? 7 : 31;
    const availableEmployees = profiles.filter((p: Profile) => p.experience_level >= 1);
    
    const employeeAssignments: { [key: string]: { [key: string]: boolean } } = {};

    for (let day = 0; day < daysToSchedule; day++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + day);
      const dateKey = currentDay.toISOString().split('T')[0];

      employeeAssignments[dateKey] = {};

      const morningStart = new Date(currentDay);
      morningStart.setHours(7, 0, 0);
      const morningEnd = new Date(currentDay);
      morningEnd.setHours(15, 0, 0);

      const afternoonStart = new Date(currentDay);
      afternoonStart.setHours(15, 0, 0);
      const afternoonEnd = new Date(currentDay);
      afternoonEnd.setHours(23, 0, 0);

      const nightStart = new Date(currentDay);
      nightStart.setHours(23, 0, 0);
      const nightEnd = new Date(currentDay);
      nightEnd.setDate(nightEnd.getDate() + 1);
      nightEnd.setHours(7, 0, 0);

      const getQualifiedEmployees = (shiftType: string) => {
        return availableEmployees.filter((emp: Profile) => {
          if (employeeAssignments[dateKey][emp.id]) {
            return false;
          }

          if (shiftType === 'night' && settings.require_night_shift_qualification) {
            return emp.experience_level >= settings.senior_experience_threshold;
          }
          return true;
        });
      };

      const morningEmployees = getQualifiedEmployees('day');
      if (morningEmployees.length > 0) {
        const employee = morningEmployees[0];
        employeeAssignments[dateKey][employee.id] = true;
        generatedShifts.push({
          start_time: morningStart.toISOString(),
          end_time: morningEnd.toISOString(),
          shift_type: 'day',
          department: 'General',
          employee_id: employee.id,
        });
      }

      const afternoonEmployees = getQualifiedEmployees('evening');
      if (afternoonEmployees.length > 0) {
        const employee = afternoonEmployees[0];
        employeeAssignments[dateKey][employee.id] = true;
        generatedShifts.push({
          start_time: afternoonStart.toISOString(),
          end_time: afternoonEnd.toISOString(),
          shift_type: 'evening',
          department: 'General',
          employee_id: employee.id,
        });
      }

      const nightEmployees = getQualifiedEmployees('night');
      if (nightEmployees.length > 0) {
        const employee = nightEmployees[0];
        employeeAssignments[dateKey][employee.id] = true;
        generatedShifts.push({
          start_time: nightStart.toISOString(),
          end_time: nightEnd.toISOString(),
          shift_type: 'night',
          department: 'General',
          employee_id: employee.id,
        });
      }
    }

    return new Response(
      JSON.stringify({ shifts: generatedShifts }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
