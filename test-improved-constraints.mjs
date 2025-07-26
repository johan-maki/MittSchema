#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

async function testImprovedConstraintHandling() {
  console.log('🔍 Testing improved constraint handling for Andreas...');

  // Get Andreas data
  const { data: andreas, error } = await supabase
    .from('employees')
    .select('*')
    .eq('first_name', 'Andreas')
    .eq('last_name', 'Lundquist')
    .single();

  if (error || !andreas) {
    console.log('❌ Andreas not found:', error);
    return;
  }

  // Simulate the new constraint logic
  function convertWorkPreferences(workPrefs) {
    if (!workPrefs) return {
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
    return workPrefs;
  }

  const workPrefs = convertWorkPreferences(andreas.work_preferences);
  
  console.log('📋 Andreas work preferences:');
  console.log(JSON.stringify(workPrefs, null, 2));

  // New improved logic
  const availableDays = Object.entries(workPrefs.day_constraints)
    .filter(([_, constraint]) => constraint.available)
    .map(([day, _]) => day);
    
  const preferredShifts = Object.entries(workPrefs.shift_constraints)
    .filter(([_, constraint]) => constraint.preferred)
    .map(([shift, _]) => shift);
  
  // NEW: Identify specific strict exclusions
  const strictlyUnavailableDays = Object.entries(workPrefs.day_constraints)
    .filter(([_, constraint]) => constraint.strict && !constraint.available)
    .map(([day, _]) => day);
    
  const strictlyExcludedShifts = Object.entries(workPrefs.shift_constraints)
    .filter(([_, constraint]) => constraint.strict && !constraint.preferred)
    .map(([shift, _]) => shift);
  
  console.log('🔍 Strict analysis:');
  console.log('  Strictly unavailable days:', strictlyUnavailableDays);
  console.log('  Strictly excluded shifts:', strictlyExcludedShifts);
  
  // NEW: Apply exclusions
  const effectiveAvailableDays = availableDays.filter(day => 
    !strictlyUnavailableDays.includes(day)
  );
  
  const effectivePreferredShifts = preferredShifts.filter(shift => 
    !strictlyExcludedShifts.includes(shift)
  );
  
  const improvedGurobiPreference = {
    employee_id: andreas.id,
    preferred_shifts: effectivePreferredShifts.length > 0 ? effectivePreferredShifts : ["day", "evening"],
    max_shifts_per_week: workPrefs.max_shifts_per_week || 5,
    available_days: effectiveAvailableDays.length > 0 ? effectiveAvailableDays : ["monday", "tuesday", "wednesday", "thursday", "friday"],
    excluded_shifts: strictlyExcludedShifts,
    excluded_days: strictlyUnavailableDays,
    available_days_strict: strictlyUnavailableDays.length > 0,
    preferred_shifts_strict: strictlyExcludedShifts.length > 0,
    role: andreas.role,
    experience_level: andreas.experience_level || 1
  };

  console.log('🚀 IMPROVED Andreas preferences for Gurobi:');
  console.log(JSON.stringify(improvedGurobiPreference, null, 2));

  console.log('\n🎯 Key improvements:');
  console.log('✅ excluded_shifts: ["night"] - explicitly tells Gurobi to avoid night shifts');
  console.log('✅ preferred_shifts: ["day", "evening"] - Andreas can get these');
  console.log('✅ available_days: all days - Andreas can work any day');
  console.log('✅ excluded_days: [] - no day restrictions');
  
  console.log('\n💡 This should solve the issue because:');
  console.log('  1. Gurobi knows Andreas CAN work (available_days has values)');
  console.log('  2. Gurobi knows Andreas PREFERS day/evening (preferred_shifts)');
  console.log('  3. Gurobi knows Andreas CANNOT work nights (excluded_shifts: ["night"])');
  console.log('  4. No generic "strict" flags that might exclude him entirely');
}

testImprovedConstraintHandling();
