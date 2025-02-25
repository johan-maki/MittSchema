
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { settings, profiles, currentDate, view } = await req.json();

    // Simple scheduling algorithm (this should be enhanced based on requirements)
    const generatedShifts = [];
    const startDate = new Date(currentDate);
    const daysToSchedule = view === 'day' ? 1 : view === 'week' ? 7 : 31;

    // Get available employees
    const availableEmployees = profiles.filter(p => !p.is_manager);

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

      // Assign employees to shifts (this is a simple rotation, should be enhanced)
      const shifts = [
        {
          start_time: morningStart.toISOString(),
          end_time: morningEnd.toISOString(),
          shift_type: 'day',
          department: 'General',
          employee_id: availableEmployees[0]?.id,
        },
        {
          start_time: afternoonStart.toISOString(),
          end_time: afternoonEnd.toISOString(),
          shift_type: 'evening',
          department: 'General',
          employee_id: availableEmployees[1]?.id,
        },
        {
          start_time: nightStart.toISOString(),
          end_time: nightEnd.toISOString(),
          shift_type: 'night',
          department: 'General',
          employee_id: availableEmployees[2]?.id,
        },
      ];

      generatedShifts.push(...shifts);
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
