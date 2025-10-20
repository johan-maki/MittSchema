#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const RENDER_URL = 'https://mittschema-gurobi-backend.onrender.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testGurobiWithStrictPreferences() {
  console.log('🧪 Testing Gurobi optimization with STRICT preferences...\n');
  
  // Fetch employees with their new strict preferences
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, work_preferences, experience_level, role');
  
  if (empError) {
    console.error('❌ Error fetching employees:', empError);
    return;
  }
  
  console.log(`✅ Fetched ${employees.length} employees\n`);
  
  // Find Johan and Anna
  const johan = employees.find(e => e.first_name === 'Johan');
  const anna = employees.find(e => e.first_name === 'Anna');
  
  // Build employee preferences in Gurobi format
  const employeePreferences = employees.map(emp => {
    const prefs = emp.work_preferences || {};
    const shiftConstraints = prefs.shift_constraints || {};
    const dayConstraints = prefs.day_constraints || {};
    
    // Determine available days (exclude strict unavailable ones)
    const availableDays = Object.entries(dayConstraints)
      .filter(([_, constraint]) => constraint.available && !constraint.strict)
      .map(([day]) => day);
    
    const excludedDays = Object.entries(dayConstraints)
      .filter(([_, constraint]) => constraint.strict && !constraint.available)
      .map(([day]) => day);
    
    // Determine preferred and excluded shifts
    // For non-strict preferences
    const preferredShifts = Object.entries(shiftConstraints)
      .filter(([_, constraint]) => constraint.preferred && !constraint.strict)
      .map(([shift]) => shift);
    
    // For strictly excluded shifts (strict + not preferred)
    const excludedShifts = Object.entries(shiftConstraints)
      .filter(([_, constraint]) => constraint.strict && !constraint.preferred)
      .map(([shift]) => shift);
    
    // For strictly preferred shifts (strict + preferred) - these should be INCLUDED in preferred_shifts
    const strictlyPreferredShifts = Object.entries(shiftConstraints)
      .filter(([_, constraint]) => constraint.strict && constraint.preferred)
      .map(([shift]) => shift);
    
    // Combine all preferred shifts (both strict and non-strict)
    const allPreferredShifts = [...new Set([...preferredShifts, ...strictlyPreferredShifts])];
    
    return {
      employee_id: emp.id,
      preferred_shifts: allPreferredShifts.length > 0 ? allPreferredShifts : ['day', 'evening'],
      max_shifts_per_week: Math.ceil((prefs.work_percentage || 100) * 5 / 100),
      available_days: availableDays.length > 0 ? availableDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      excluded_shifts: excludedShifts,
      excluded_days: excludedDays,
      available_days_strict: excludedDays.length > 0,
      preferred_shifts_strict: strictlyPreferredShifts.length > 0,
      role: emp.role || 'Unknown',
      experience_level: emp.experience_level || 1,
      work_percentage: prefs.work_percentage || 100
    };
  });
  
  // Log Johan and Anna's constraints specifically
  if (johan) {
    const johanPrefs = employeePreferences.find(p => p.employee_id === johan.id);
    console.log('👤 Johan Gustafsson constraints:');
    console.log('   Excluded shifts:', johanPrefs.excluded_shifts);
    console.log('   Preferred shifts:', johanPrefs.preferred_shifts);
    console.log('   Work percentage:', johanPrefs.work_percentage + '%');
    console.log('   ⚠️  Should ONLY get night shifts\n');
  }
  
  if (anna) {
    const annaPrefs = employeePreferences.find(p => p.employee_id === anna.id);
    console.log('👤 Anna Nilsson constraints:');
    console.log('   Excluded shifts:', annaPrefs.excluded_shifts);
    console.log('   Preferred shifts:', annaPrefs.preferred_shifts);
    console.log('   Work percentage:', annaPrefs.work_percentage + '%');
    console.log('   ⚠️  Should NEVER get night shifts\n');
  }
  
  // Build the request payload
  const requestBody = {
    start_date: '2025-11-01T00:00:00Z',
    end_date: '2025-11-30T23:59:59Z',
    department: 'Akutmottagning',
    random_seed: Math.floor(Math.random() * 1000000),
    optimizer: 'gurobi',
    min_staff_per_shift: 2,  // Lowered to 2 for feasibility
    minimum_staff: 2,
    staff_constraint: 'strict',
    min_experience_per_shift: 2,  // Lowered to 2 for feasibility
    include_weekends: true,
    weekend_penalty_weight: 1500,  // Lower penalty
    fairness_weight: 1.0,
    balance_workload: true,
    max_hours_per_nurse: 40,
    allow_partial_coverage: false,
    employee_preferences: employeePreferences
  };
  
  console.log('🚀 Calling Gurobi API...\n');
  console.log(`📅 Period: November 1-30, 2025`);
  console.log(`👥 Employees: ${employees.length}`);
  console.log(`📋 Min staff per shift: 2`);
  console.log(`🎯 Optimizer: Gurobi (strict constraints)\n`);
  
  try {
    const response = await fetch(`${RENDER_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ Schedule generated successfully!\n');
    console.log('═'.repeat(80));
    console.log('📊 RESULTS:\n');
    
    // Check if Gurobi was used
    console.log(`🔧 Optimizer used: ${result.optimizer}`);
    if (result.optimizer !== 'gurobi') {
      console.log('⚠️  WARNING: Not using Gurobi!\n');
    } else {
      console.log('✅ Confirmed: Using Gurobi optimizer\n');
    }
    
    // Coverage stats
    console.log(`📈 Coverage: ${result.coverage_stats.coverage_percentage.toFixed(1)}%`);
    console.log(`   Filled: ${result.coverage_stats.filled_shifts}/${result.coverage_stats.total_shifts} shifts\n`);
    
    // Check Johan's shifts
    if (johan) {
      const johanShifts = result.schedule.filter(s => s.employee_id === johan.id);
      const johanByType = {
        day: johanShifts.filter(s => s.shift_type === 'day').length,
        evening: johanShifts.filter(s => s.shift_type === 'evening').length,
        night: johanShifts.filter(s => s.shift_type === 'night').length
      };
      
      console.log('👤 Johan Gustafsson:');
      console.log(`   Total shifts: ${johanShifts.length}`);
      console.log(`   Day: ${johanByType.day}`);
      console.log(`   Evening: ${johanByType.evening}`);
      console.log(`   Night: ${johanByType.night}`);
      
      if (johanByType.day > 0 || johanByType.evening > 0) {
        console.log('   ❌ ERROR: Johan got day/evening shifts! Should only get night!');
      } else if (johanByType.night > 0) {
        console.log('   ✅ SUCCESS: Johan only got night shifts!');
      } else {
        console.log('   ⚠️  WARNING: Johan got no shifts at all');
      }
      console.log();
    }
    
    // Check Anna's shifts
    if (anna) {
      const annaShifts = result.schedule.filter(s => s.employee_id === anna.id);
      const annaByType = {
        day: annaShifts.filter(s => s.shift_type === 'day').length,
        evening: annaShifts.filter(s => s.shift_type === 'evening').length,
        night: annaShifts.filter(s => s.shift_type === 'night').length
      };
      
      console.log('👤 Anna Nilsson:');
      console.log(`   Total shifts: ${annaShifts.length}`);
      console.log(`   Day: ${annaByType.day}`);
      console.log(`   Evening: ${annaByType.evening}`);
      console.log(`   Night: ${annaByType.night}`);
      
      if (annaByType.night > 0) {
        console.log('   ❌ ERROR: Anna got night shifts! Should never get night!');
      } else if (annaByType.day > 0 || annaByType.evening > 0) {
        console.log('   ✅ SUCCESS: Anna only got day/evening shifts!');
      } else {
        console.log('   ⚠️  WARNING: Anna got no shifts at all');
      }
      console.log();
    }
    
    // Overall fairness
    console.log('📊 Fairness stats:');
    console.log(`   Min shifts per employee: ${result.fairness_stats.min_shifts_per_employee}`);
    console.log(`   Max shifts per employee: ${result.fairness_stats.max_shifts_per_employee}`);
    console.log(`   Avg shifts per employee: ${result.fairness_stats.avg_shifts_per_employee.toFixed(1)}`);
    console.log(`   Range: ${result.fairness_stats.shift_distribution_range}\n`);
    
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error calling Gurobi API:', error.message);
  }
}

testGurobiWithStrictPreferences();
