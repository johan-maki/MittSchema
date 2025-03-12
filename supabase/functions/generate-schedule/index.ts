
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./utils/corsHeaders.ts";
import { generateSchedule } from "./services/scheduleGenerator.ts";
import { getMockProfiles } from "./utils/helpers.ts";
import type { ScheduleRequest, ScheduleResponse } from "./utils/types.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try to parse request body
    let requestBody: ScheduleRequest;
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
    
    const { start_date, end_date, department, random_seed } = requestBody;
    
    console.log("Received request to generate schedule with:", {
      start_date,
      end_date,
      department,
      random_seed
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

    // Get mock profiles for testing
    const mockProfiles = getMockProfiles();

    // Generate schedule for the given date range
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    // Use the random seed if provided
    if (random_seed) {
      console.log(`Using random seed: ${random_seed}`);
      // Set a pseudo-random seed based on the timestamp
      Math.random = () => {
        const x = Math.sin(random_seed++) * 10000;
        return x - Math.floor(x);
      };
    }
    
    const { shifts, staffingIssues } = generateSchedule(start, end, mockProfiles, department);
    
    const response: ScheduleResponse = {
      schedule: shifts,
      staffingIssues: staffingIssues
    };
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error generating schedule:", error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate schedule: ' + (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
