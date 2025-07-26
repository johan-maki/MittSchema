import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment check:', {
  url: supabaseUrl ? 'OK' : 'MISSING',
  key: supabaseKey ? 'OK' : 'MISSING'
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickCheckErik() {
  try {
    console.log('🔍 Quick Erik check...\n');
    
    const { data: erik, error } = await supabase
      .from('employees')
      .select('work_preferences')
      .eq('id', '225e078a-bdb9-4d3e-9274-6c3b5432b4be')
      .single();
      
    if (error || !erik) {
      console.log('❌ Could not fetch Erik:', error);
      return;
    }
    
    console.log('Erik rådata:', JSON.stringify(erik.work_preferences, null, 2));
    
    // Simulate convertWorkPreferences quickly
    const dayConstraints = erik.work_preferences?.day_constraints || {};
    console.log('\nErik day constraints:');
    Object.entries(dayConstraints).forEach(([day, constraint]) => {
      console.log(`  ${day}: ${JSON.stringify(constraint)}`);
    });
    
    // Check what available_days would be
    const availableDays = Object.entries(dayConstraints)
      .filter(([_, constraint]) => {
        // This is the key logic from the converter
        if (typeof constraint.available === 'boolean') {
          return constraint.available;
        } else if (typeof constraint.day === 'boolean' || typeof constraint.evening === 'boolean' || typeof constraint.night === 'boolean') {
          return constraint.day === true || constraint.evening === true || constraint.night === true;
        }
        return true;
      })
      .map(([day, _]) => day);
      
    // Check the NEW logic for available_days_strict
    const availableDaysStrict = Object.entries(dayConstraints)
      .some(([_, constraint]) => !constraint.available && constraint.strict);
      
    console.log('\nAvailable days for Gurobi:', availableDays);
    console.log('Available days strict:', availableDaysStrict);
    console.log('Weekend check:', {
      saturday: availableDays.includes('saturday'),
      sunday: availableDays.includes('sunday')
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

quickCheckErik();
