import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rxokhrlqqvqgupepwktj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4b2tocmxxcXZxZ3VwZXB3a3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNzc2NzAsImV4cCI6MjA0ODg1MzY3MH0.rNYvBaA4s5R2fQz0q6kZLNlbB3o-7VtCqp2D1Dg-Qww';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the date calculation logic specifically for August 2024
async function testAugustDateFix() {
  try {
    const targetMonth = 7; // August (0-indexed)
    const targetYear = 2024;
    
    console.log('🧪 Testing August 2024 date boundary fix...');
    console.log('Target Month:', targetMonth, '(August)');
    console.log('Target Year:', targetYear);
    
    // Calculate last day using the same logic as the fix
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
    const lastDayOfTargetMonth = targetMonth === 1 && isLeapYear ? 29 : daysInMonth[targetMonth];
    
    // Construct dates as ISO strings
    const startDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
    const endDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDayOfTargetMonth).padStart(2, '0')}T23:59:59.999Z`;
    
    console.log('📅 Date Range:');
    console.log('  Start:', startDateISO);
    console.log('  End:', endDateISO);
    console.log('  Last day of month:', lastDayOfTargetMonth);
    
    // Test schedule generation with a specific employee
    const requestData = {
      start_date: startDateISO,
      end_date: endDateISO,
      employee_preferences: [
        {
          employee_id: "5e6b8a3e-9d4f-4c2b-8a7e-1f5d9c8b6e4a",
          name: "Andreas",
          department: "Akutmottagning",
          role: "Level5",
          date_preferences: [
            {
              date: "2024-08-01",
              available_shifts: ["natt"],
              preference_strength: 5
            },
            {
              date: "2024-08-02", 
              available_shifts: ["dag", "kväll"],
              preference_strength: 4
            }
          ],
          shift_type_preferences: {
            dag: 3,
            kväll: 4,
            natt: 5
          },
          max_shifts_per_month: 15,
          min_hours_between_shifts: 11,
          weekend_preference: 3
        }
      ]
    };

    console.log('🎯 Testing Gurobi API request...');
    console.log('Employee preferences for August 1st:', requestData.employee_preferences[0].date_preferences[0]);
    
    // Call the Gurobi API to see what it returns
    const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Gurobi API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📤 Gurobi API Response:');
    
    if (result.schedule && result.schedule.length > 0) {
      const shifts = result.schedule;
      const august1Shifts = shifts.filter(shift => {
        const shiftDate = shift.date || shift.start_time?.split('T')[0];
        return shiftDate === '2024-08-01';
      });
      
      const september1Shifts = shifts.filter(shift => {
        const shiftDate = shift.date || shift.start_time?.split('T')[0];
        return shiftDate === '2024-09-01';
      });
      
      console.log('🌙 August 1st shifts:', august1Shifts.length);
      august1Shifts.forEach(shift => {
        console.log(`  - ${shift.shift_type} shift for ${shift.employee_name || 'Unknown'}`);
        console.log('    Full shift object:', shift);
      });
      
      console.log('🚫 September 1st shifts (should be 0):', september1Shifts.length);
      september1Shifts.forEach(shift => {
        console.log(`  - ${shift.shift_type} shift for ${shift.employee_name || 'Unknown'}`);
      });
      
      // Check if August 1st has a night shift (check for both 'night' and 'natt')
      const august1NightShift = august1Shifts.find(shift => 
        shift.shift_type === 'natt' || shift.shift_type === 'night'
      );
      if (august1NightShift) {
        console.log('✅ SUCCESS: August 1st has night shift coverage!');
        console.log('   Night shift details:', august1NightShift);
      } else {
        console.log('❌ ISSUE: August 1st still missing night shift coverage');
        console.log('   Available shift types:', august1Shifts.map(s => s.shift_type));
      }
      
      // Check if September 1st incorrectly has shifts
      if (september1Shifts.length === 0) {
        console.log('✅ SUCCESS: September 1st correctly has no shifts');
      } else {
        console.log('❌ ISSUE: September 1st still incorrectly has shifts');
      }
      
    } else {
      console.log('❌ No schedule returned from Gurobi API');
      console.log('Full response:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testAugustDateFix();
