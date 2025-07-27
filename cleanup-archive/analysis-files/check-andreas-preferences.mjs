// Check Andreas work preferences in database
import { supabase } from './src/integrations/supabase/client.js';

async function checkAndreasPreferences() {
  console.log('🔍 Checking Andreas Lundquist work preferences...');
  
  try {
    // Get Andreas full record
    const { data: andreas, error } = await supabase
      .from('employees')
      .select('*')
      .eq('first_name', 'Andreas')
      .eq('last_name', 'Lundquist')
      .single();

    if (error) {
      console.error('❌ Error fetching Andreas:', error);
      return;
    }

    console.log('✅ Andreas found:', {
      id: andreas.id,
      first_name: andreas.first_name,
      last_name: andreas.last_name,
      role: andreas.role,
      experience_level: andreas.experience_level,
      work_preferences: andreas.work_preferences
    });

    // Check if work_preferences is null or empty
    if (!andreas.work_preferences) {
      console.log('🚨 PROBLEM: Andreas has no work_preferences!');
      console.log('⚠️ This means he gets default preferences which might not work well with Gurobi');
      
      // Set basic work preferences for Andreas
      const defaultPreferences = {
        max_shifts_per_week: 5,
        day_constraints: {
          monday: { available: true, strict: false },
          tuesday: { available: true, strict: false },
          wednesday: { available: true, strict: false },
          thursday: { available: true, strict: false },
          friday: { available: true, strict: false },
          saturday: { available: true, strict: false },
          sunday: { available: true, strict: false }
        },
        shift_constraints: {
          day: { preferred: true, strict: false },
          evening: { preferred: true, strict: false },
          night: { preferred: true, strict: false }
        }
      };

      console.log('🔧 Setting default work preferences for Andreas...');
      
      const { error: updateError } = await supabase
        .from('employees')
        .update({ work_preferences: defaultPreferences })
        .eq('id', andreas.id);

      if (updateError) {
        console.error('❌ Failed to update preferences:', updateError);
      } else {
        console.log('✅ Successfully set work preferences for Andreas!');
        console.log('📝 New preferences:', defaultPreferences);
      }
    } else {
      console.log('✅ Andreas has work preferences:', andreas.work_preferences);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndreasPreferences();
