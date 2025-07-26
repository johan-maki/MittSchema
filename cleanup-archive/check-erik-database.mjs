#!/usr/bin/env node

// Check Erik's actual preferences in database

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lqfwmwnylzfezqgmjsjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZndtd255bHpmZXpxZ21qc2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTMzNzUsImV4cCI6MjA1MDAyOTM3NX0.YaJBfgHdpNjXhJ-Vhj5Dv-2-MWfvuhw7KVHzZDbNQlE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
});

async function checkErikInDatabase() {
  console.log('🔍 Checking Erik Eriksson in employees table...\n');
  
  try {
    // First check employees table
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .or('first_name.ilike.%erik%,last_name.ilike.%erik%');
    
    if (empError) {
      console.log('❌ Error accessing employees:', empError.message);
      return;
    }
    
    console.log(`📋 Found ${employees?.length || 0} matching employees:`);
    employees?.forEach(emp => {
      console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.id})`);
      console.log(`    Work preferences:`, JSON.stringify(emp.work_preferences, null, 2));
    });
    
    if (!employees || employees.length === 0) {
      console.log('\n🔍 Let me check profiles table instead...');
      
      // Check profiles table
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .or('first_name.ilike.%erik%,last_name.ilike.%erik%');
      
      if (profError) {
        console.log('❌ Error accessing profiles:', profError.message);
        return;
      }
      
      console.log(`📋 Found ${profiles?.length || 0} matching profiles:`);
      profiles?.forEach(prof => {
        console.log(`  - ${prof.first_name} ${prof.last_name} (${prof.id})`);
        console.log(`    Work preferences:`, JSON.stringify(prof.work_preferences, null, 2));
      });
    }
    
  } catch (error) {
    console.log('❌ Database error:', error.message);
  }
}

checkErikInDatabase().catch(console.error);
