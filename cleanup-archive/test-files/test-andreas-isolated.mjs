#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

async function testAndreasIsolated() {
  console.log('🔍 Testing isolated Gurobi call for Andreas only...');

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

  console.log('📋 Andreas full profile:');
  console.log('ID:', andreas.id);
  console.log('Role:', andreas.role);
  console.log('Work preferences:', JSON.stringify(andreas.work_preferences, null, 2));

  // Extract preferences properly
  const workPrefs = andreas.work_preferences || {};
  const shiftConstraints = workPrefs.shift_constraints || {};
  const dayConstraints = workPrefs.day_constraints || {};

  // Build preferred shifts array
  const preferredShifts = [];
  if (shiftConstraints.day?.preferred) preferredShifts.push('day');
  if (shiftConstraints.evening?.preferred) preferredShifts.push('evening');
  if (shiftConstraints.night?.preferred) preferredShifts.push('night');

  // Build available days array
  const availableDays = Object.entries(dayConstraints)
    .filter(([day, constraint]) => constraint?.available)
    .map(([day]) => day);

  console.log('🔧 Processed preferences:');
  console.log('Preferred shifts:', preferredShifts);
  console.log('Available days:', availableDays);

  // Create minimal Gurobi test with just Andreas
  const testData = {
    start_date: '2025-08-01',
    end_date: '2025-08-07',
    employee_preferences: [{
      employee_id: andreas.id,
      preferred_shifts: preferredShifts,
      max_shifts_per_week: workPrefs.max_shifts_per_week || 5,
      available_days: availableDays,
      role: andreas.role,
      experience_level: andreas.experience_level || 1
    }]
  };

  console.log('🚀 Sending to Gurobi:', JSON.stringify(testData, null, 2));

  try {
    const response = await axios.post(
      'https://mittschema-gurobi-backend.onrender.com/optimize-schedule',
      testData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );
    
    console.log('✅ Gurobi response:');
    console.log('Status:', response.data.status);
    console.log('Schedule length:', response.data.schedule?.length || 0);
    
    if (response.data.schedule) {
      const andreasShifts = response.data.schedule.filter(s => s.employee_id === andreas.id);
      console.log(`👤 Andreas got ${andreasShifts.length} shifts in isolated test`);
      
      if (andreasShifts.length === 0) {
        console.log('❌ Even in isolation, Andreas gets 0 shifts');
        console.log('🔍 This suggests the problem is in his work_preferences data');
        console.log('💡 Check if available_days or preferred_shifts are empty arrays');
      } else {
        console.log('✅ Andreas gets shifts when isolated:');
        andreasShifts.forEach(shift => {
          const date = shift.date || shift.start_time?.split('T')[0];
          console.log(`  - ${date}: ${shift.shift_type} shift`);
        });
      }
    }
    
    if (response.data.message) {
      console.log('📝 Gurobi message:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error calling Gurobi:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testAndreasIsolated();
