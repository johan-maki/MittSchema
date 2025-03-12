
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
    
    const { start_date, end_date, department, random_seed, constraints } = requestBody;
    
    console.log("Received request to generate schedule with:", {
      start_date,
      end_date,
      department,
      random_seed,
      constraints
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
    
    // Pass constraints to the generator
    const { shifts, staffingIssues } = generateSchedule(
      start, 
      end, 
      mockProfiles, 
      department,
      constraints
    );
    
    // Apply additional deduplication to ensure one shift per employee per day
    const dedupedShifts = deduplicateScheduleShifts(shifts);
    
    const response: ScheduleResponse = {
      schedule: dedupedShifts,
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

/**
 * Helper function to deduplicate shifts - ensuring one shift per employee per day
 */
function deduplicateScheduleShifts(shifts: any[]): any[] {
  // Map to track shifts by employee and date
  const employeeShiftMap = new Map<string, Map<string, any>>();
  
  // Sort shifts chronologically
  const sortedShifts = [...shifts].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  
  // Process each shift
  for (const shift of sortedShifts) {
    const employeeId = shift.employee_id;
    const shiftDate = new Date(shift.start_time);
    const dateStr = `${shiftDate.getFullYear()}-${shiftDate.getMonth() + 1}-${shiftDate.getDate()}`;
    
    // Initialize employee map if needed
    if (!employeeShiftMap.has(employeeId)) {
      employeeShiftMap.set(employeeId, new Map<string, any>());
    }
    
    const employeeDates = employeeShiftMap.get(employeeId)!;
    
    // If employee already has a shift this day, skip
    if (!employeeDates.has(dateStr)) {
      employeeDates.set(dateStr, shift);
    }
  }
  
  // Track dates for consecutive day check
  const employeeDates = new Map<string, string[]>();
  const MAX_CONSECUTIVE_DAYS = 5;
  
  // Collect all dates by employee
  employeeShiftMap.forEach((dates, employeeId) => {
    const dateStrings = Array.from(dates.keys()).sort();
    employeeDates.set(employeeId, dateStrings);
  });
  
  // Check consecutive days constraints
  employeeDates.forEach((dateStrings, employeeId) => {
    let consecutiveDays = 1;
    let lastDate: Date | null = null;
    const datesToRemove = new Set<string>();
    
    for (const dateStr of dateStrings) {
      const currentDate = new Date(dateStr);
      
      if (lastDate) {
        const dayDiff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (Math.abs(dayDiff - 1) < 0.1) { // About 1 day difference (accounting for floating point)
          consecutiveDays++;
        } else {
          consecutiveDays = 1;
        }
      }
      
      lastDate = currentDate;
      
      // If we exceed consecutive days limit, mark this date for removal
      if (consecutiveDays > MAX_CONSECUTIVE_DAYS) {
        datesToRemove.add(dateStr);
      }
    }
    
    // Remove marked dates
    const employeeMap = employeeShiftMap.get(employeeId)!;
    datesToRemove.forEach(dateStr => {
      employeeMap.delete(dateStr);
    });
  });
  
  // Flatten the map back to an array of shifts
  const result: any[] = [];
  employeeShiftMap.forEach(dateMap => {
    dateMap.forEach(shift => {
      result.push(shift);
    });
  });
  
  console.log(`Deduplicated schedule from ${shifts.length} to ${result.length} shifts`);
  return result;
}
