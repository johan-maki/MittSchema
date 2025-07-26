#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setDefaultWorkPreferences() {
  console.log('🔧 Setting default work preferences for all employees...\n');
  
  // Default preferences: can work all shifts, all days, max 5 shifts per week
  const defaultPreferences = {
    preferred_shifts: ["day", "evening", "night"],
    max_shifts_per_week: 5,
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  };
  
  try {
    // Get all employees without work preferences or with null preferences
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, work_preferences');
      
    if (fetchError) {
      console.error('❌ Error fetching employees:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${employees.length} employees`);
    
    // Filter employees that need default preferences
    const employeesNeedingDefaults = employees.filter(emp => 
      !emp.work_preferences || 
      emp.work_preferences === null ||
      Object.keys(emp.work_preferences).length === 0
    );
    
    console.log(`🎯 ${employeesNeedingDefaults.length} employees need default preferences`);
    
    if (employeesNeedingDefaults.length === 0) {
      console.log('✅ All employees already have work preferences set!');
      return;
    }
    
    // Update employees with default preferences
    for (const employee of employeesNeedingDefaults) {
      console.log(`⚙️  Setting defaults for ${employee.first_name} ${employee.last_name}...`);
      
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          work_preferences: defaultPreferences
        })
        .eq('id', employee.id);
        
      if (updateError) {
        console.error(`❌ Error updating ${employee.first_name}:`, updateError);
      } else {
        console.log(`✅ Updated ${employee.first_name} ${employee.last_name}`);
      }
    }
    
    console.log('\n🎉 Default work preferences have been set for all employees!');
    console.log('📋 Default settings:');
    console.log('   - Can work: Day, Evening, Night shifts');
    console.log('   - Available: All days of the week (including weekends)');
    console.log('   - Max shifts per week: 5');
    console.log('\n💡 Employees can now customize their preferences in their profile settings');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

setDefaultWorkPreferences();
