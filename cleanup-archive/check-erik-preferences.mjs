#!/usr/bin/env node

// Check Erik Eriksson's current preferences

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lqfwmwnylzfezqgmjsjq.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZndtd255bHpmZXpxZ21qc2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTMzNzUsImV4cCI6MjA1MDAyOTM3NX0.YaJBfgHdpNjXhJ-Vhj5Dv-2-MWfvuhw7KVHzZDbNQlE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkErikPreferences() {
  console.log('🔍 Checking Erik Eriksson\'s current preferences...\n');
  
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .ilike('first_name', '%erik%')
      .ilike('last_name', '%erik%');
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (!employees || employees.length === 0) {
      console.log('❌ Erik Eriksson not found in database');
      return;
    }
    
    const erik = employees[0];
    console.log(`✅ Found Erik: ${erik.first_name} ${erik.last_name}`);
    console.log(`📧 Email: ${erik.email}`);
    console.log(`🆔 ID: ${erik.id}`);
    console.log(`👥 Department: ${erik.department}`);
    console.log(`⭐ Experience Level: ${erik.experience_level}`);
    console.log(`💼 Role: ${erik.role}`);
    console.log(`📋 Current Preferences:`, JSON.stringify(erik.work_preferences, null, 2));
    
  } catch (error) {
    console.log('❌ Database error:', error.message);
  }
}

checkErikPreferences().catch(console.error);
