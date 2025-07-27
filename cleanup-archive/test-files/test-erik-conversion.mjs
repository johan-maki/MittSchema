import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the convertWorkPreferences function (simplified version for testing)
function convertWorkPreferences(json) {
  const defaultPreferences = {
    max_shifts_per_week: 5,
    day_constraints: {
      monday: { available: true, strict: false },
      tuesday: { available: true, strict: false },
      wednesday: { available: true, strict: false },
      thursday: { available: true, strict: false },
      friday: { available: true, strict: false },
      saturday: { available: true, strict: false },
      sunday: { available: true, strict: false },
    },
    shift_constraints: {
      day: { preferred: true, strict: false },
      evening: { preferred: true, strict: false },
      night: { preferred: true, strict: false },
    },
  };

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return defaultPreferences;
  }

  const jsonObj = json;
  
  // Handle new granular constraint format (with possible mixed day formats)
  if (jsonObj.day_constraints && jsonObj.shift_constraints) {
    const dayConstraints = jsonObj.day_constraints;
    const convertedDayConstraints = {};
    
    // Handle each day, supporting both old {available, strict} and new {day, evening, night} formats
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const dayData = dayConstraints[day];
      
      if (!dayData) {
        // Default if no data for this day
        convertedDayConstraints[day] = { available: true, strict: false };
      } else if (typeof dayData.available === 'boolean') {
        // Old format: {available: boolean, strict: boolean}
        convertedDayConstraints[day] = {
          available: dayData.available,
          strict: typeof dayData.strict === 'boolean' ? dayData.strict : false
        };
      } else if (typeof dayData.day === 'boolean' || typeof dayData.evening === 'boolean' || typeof dayData.night === 'boolean') {
        // New granular format: {day: boolean, evening: boolean, night: boolean}
        // Convert to old format: available if ANY shift is true
        const hasAnyShift = dayData.day === true || dayData.evening === true || dayData.night === true;
        convertedDayConstraints[day] = {
          available: hasAnyShift,
          strict: true // Granular constraints are treated as strict
        };
      } else {
        // Fallback to default
        convertedDayConstraints[day] = { available: true, strict: false };
      }
    }
    
    return {
      max_shifts_per_week: typeof jsonObj.max_shifts_per_week === 'number' 
        ? jsonObj.max_shifts_per_week 
        : defaultPreferences.max_shifts_per_week,
      day_constraints: convertedDayConstraints,
      shift_constraints: jsonObj.shift_constraints || defaultPreferences.shift_constraints,
    };
  }
  
  return defaultPreferences;
}

async function testErikConversion() {
  try {
    console.log('\n=== TESTING ERIK PREFERENCE CONVERSION ===\n');
    
    // Get Erik's current data
    const { data: erik, error } = await supabase
      .from('employees')
      .select('work_preferences')
      .eq('id', '225e078a-bdb9-4d3e-9274-6c3b5432b4be')
      .single();
      
    if (error) {
      console.error('Error fetching Erik:', error);
      return;
    }
    
    console.log('1. Erik\'s raw database preferences:');
    console.log(JSON.stringify(erik.work_preferences, null, 2));
    
    console.log('\n2. Testing conversion...');
    const converted = convertWorkPreferences(erik.work_preferences);
    
    console.log('\n3. Converted preferences:');
    console.log(JSON.stringify(converted, null, 2));
    
    console.log('\n4. Weekend constraint check:');
    console.log(`Saturday available: ${converted.day_constraints.saturday.available}`);
    console.log(`Sunday available: ${converted.day_constraints.sunday.available}`);
    
    if (!converted.day_constraints.saturday.available && !converted.day_constraints.sunday.available) {
      console.log('\n✅ SUCCESS: Conversion correctly handles Erik\'s weekend constraints!');
      console.log('Erik should NOT get weekend shifts.');
    } else {
      console.log('\n❌ PROBLEM: Weekend constraints not converted correctly');
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testErikConversion();
