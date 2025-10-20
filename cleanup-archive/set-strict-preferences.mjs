#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setStrictPreferences() {
  console.log('🔧 Setting STRICT preferences for Johan and Anna...\n');
  
  // Get all employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, work_preferences');
  
  if (empError) {
    console.error('❌ Error fetching employees:', empError);
    return;
  }
  
  // Find Johan and Anna (Maria)
  const johan = employees.find(e => e.first_name === 'Johan');
  const anna = employees.find(e => e.first_name === 'Anna');
  const maria = employees.find(e => e.first_name === 'Maria');
  
  // Update Johan - ONLY night shifts (strictly preferred)
  if (johan) {
    console.log(`\n👤 Updating Johan Gustafsson (${johan.id})`);
    console.log('   Setting: ONLY night shifts allowed');
    
    const updatedPrefs = {
      ...johan.work_preferences,
      shift_constraints: {
        day: {
          preferred: false,
          strict: true  // STRICT: Cannot work day
        },
        evening: {
          preferred: false,
          strict: true  // STRICT: Cannot work evening
        },
        night: {
          preferred: true,
          strict: true  // STRICT: Must work night
        }
      }
    };
    
    const { error } = await supabase
      .from('employees')
      .update({ work_preferences: updatedPrefs })
      .eq('id', johan.id);
    
    if (error) {
      console.error('   ❌ Error updating Johan:', error);
    } else {
      console.log('   ✅ Johan updated - will ONLY get night shifts');
    }
  } else {
    console.log('⚠️  Johan not found');
  }
  
  // Update Anna - NO night shifts (strictly excluded)
  if (anna) {
    console.log(`\n👤 Updating Anna Nilsson (${anna.id})`);
    console.log('   Setting: NO night shifts allowed');
    
    const updatedPrefs = {
      ...anna.work_preferences,
      shift_constraints: {
        day: {
          preferred: true,
          strict: false  // Flexible for day
        },
        evening: {
          preferred: true,
          strict: false  // Flexible for evening
        },
        night: {
          preferred: false,
          strict: true  // STRICT: Cannot work night
        }
      }
    };
    
    const { error } = await supabase
      .from('employees')
      .update({ work_preferences: updatedPrefs })
      .eq('id', anna.id);
    
    if (error) {
      console.error('   ❌ Error updating Anna:', error);
    } else {
      console.log('   ✅ Anna updated - will NEVER get night shifts');
    }
  } else {
    console.log('⚠️  Anna not found');
  }
  
  // Update Maria if she exists too
  if (maria && maria.id !== anna?.id) {
    console.log(`\n👤 Updating Maria Johansson (${maria.id})`);
    console.log('   Setting: NO night shifts allowed');
    
    const updatedPrefs = {
      ...maria.work_preferences,
      shift_constraints: {
        day: {
          preferred: true,
          strict: false
        },
        evening: {
          preferred: true,
          strict: false
        },
        night: {
          preferred: false,
          strict: true  // STRICT: Cannot work night
        }
      }
    };
    
    const { error } = await supabase
      .from('employees')
      .update({ work_preferences: updatedPrefs })
      .eq('id', maria.id);
    
    if (error) {
      console.error('   ❌ Error updating Maria:', error);
    } else {
      console.log('   ✅ Maria updated - will NEVER get night shifts');
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Done! Strict preferences have been set.');
  console.log('\n📝 Summary:');
  console.log('   • Johan: ONLY night shifts (day/evening excluded with strict=true)');
  console.log('   • Anna/Maria: NO night shifts (night excluded with strict=true)');
  console.log('\nNow generate a new schedule to see the constraints in action!');
}

setStrictPreferences();
