
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

    // Simple scheduling algorithm (this can be enhanced later)
    const generatedShifts = [];
    const startDate = new Date(currentDate);
    const daysToSchedule = view === 'day' ? 1 : view === 'week' ? 7 : 31;
    const availableEmployees = profiles.filter((p: Profile) => p.experience_level >= 1);

    for (let day = 0; day < daysToSchedule; day++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + day);

      // Schedule morning shift
      const morningStart = new Date(currentDay);
      morningStart.setHours(7, 0, 0);
      const morningEnd = new Date(currentDay);
      morningEnd.setHours(15, 0, 0);

      // Schedule afternoon shift
      const afternoonStart = new Date(currentDay);
      afternoonStart.setHours(15, 0, 0);
      const afternoonEnd = new Date(currentDay);
      afternoonEnd.setHours(23, 0, 0);

      // Schedule night shift
      const nightStart = new Date(currentDay);
      nightStart.setHours(23, 0, 0);
      const nightEnd = new Date(currentDay);
      nightEnd.setDate(nightEnd.getDate() + 1);
      nightEnd.setHours(7, 0, 0);

      // Get qualified employees for each shift
      const getQualifiedEmployees = (shiftType: string) => {
        return availableEmployees.filter((emp: Profile) => {
          if (shiftType === 'night' && settings.require_night_shift_qualification) {
            return emp.experience_level >= settings.senior_experience_threshold;
          }
          return true;
        });
      };

      // Generate shifts based on settings requirements
      const shifts = [
        {
          start_time: morningStart.toISOString(),
          end_time: morningEnd.toISOString(),
          shift_type: 'day',
          department: 'General',
          employee_id: getQualifiedEmployees('day')[0]?.id,
        },
        {
          start_time: afternoonStart.toISOString(),
          end_time: afternoonEnd.toISOString(),
          shift_type: 'evening',
          department: 'General',
          employee_id: getQualifiedEmployees('evening')[1]?.id,
        },
        {
          start_time: nightStart.toISOString(),
          end_time: nightEnd.toISOString(),
          shift_type: 'night',
          department: 'General',
          employee_id: getQualifiedEmployees('night')[2]?.id,
        },
      ];

      generatedShifts.push(...shifts.filter(shift => shift.employee_id));
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
