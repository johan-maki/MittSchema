#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDepartments() {
  console.log('🔍 Checking employee departments...\n');
  
  // Get all employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, role, department')
    .order('first_name');
  
  if (empError) {
    console.error('❌ Error fetching employees:', empError);
    return;
  }
  
  console.log(`Found ${employees.length} employees\n`);
  
  let withDept = 0;
  let withoutDept = 0;
  
  employees.forEach(emp => {
    const status = emp.department ? '✅' : '❌';
    if (emp.department) withDept++;
    else withoutDept++;
    
    console.log(`${status} ${emp.first_name} ${emp.last_name}`);
    console.log(`   Role: ${emp.role || 'NULL'}`);
    console.log(`   Dept: ${emp.department || 'NULL'}\n`);
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   With department: ${withDept}`);
  console.log(`   Without department: ${withoutDept}\n`);
  
  // Check shifts
  console.log('🔍 Checking shifts with department data...\n');
  
  const { data: shifts, error: shiftError } = await supabase
    .from('shifts')
    .select(`
      id,
      start_time,
      shift_type,
      profiles:employees!shifts_employee_id_fkey (
        first_name,
        last_name,
        department
      )
    `)
    .limit(10);
  
  if (shiftError) {
    console.error('❌ Error fetching shifts:', shiftError);
    return;
  }
  
  console.log(`Sample of ${shifts.length} shifts:\n`);
  shifts.forEach(shift => {
    const deptStatus = shift.profiles?.department ? '✅' : '❌';
    console.log(`${deptStatus} Shift ${shift.id.substring(0, 8)}...`);
    console.log(`   Employee: ${shift.profiles?.first_name} ${shift.profiles?.last_name}`);
    console.log(`   Department: ${shift.profiles?.department || 'NULL'}\n`);
  });
}

checkDepartments();
  
  // Get work preferences from employees table
  const { data: employeesWithPrefs, error: prefError } = await supabase
    .from('employees')
    .select('id, work_preferences');
  
  if (prefError) {
    console.error('❌ Error fetching work preferences:', prefError);
    return;
  }
  
  // Convert to a format similar to the old structure
  const prefs = employeesWithPrefs.map(emp => ({
    employee_id: emp.id,
    ...emp.work_preferences
  }));
  
  console.log('📋 WORK PREFERENCES SUMMARY:\n');
  console.log('═'.repeat(80));
  
  for (const emp of employees) {
    const empPref = prefs.find(p => p.employee_id === emp.id);
    
    console.log(`\n👤 ${emp.first_name} ${emp.last_name}`);
    console.log('─'.repeat(80));
    
    if (!empPref) {
      console.log('  ⚠️  NO PREFERENCES SET (will use defaults)');
      continue;
    }
    
    console.log(`  Work Percentage: ${empPref.work_percentage}%`);
    
    // Day constraints
    if (empPref.day_constraints) {
      console.log('\n  📅 Day Constraints:');
      Object.entries(empPref.day_constraints).forEach(([day, constraint]) => {
        const strictMarker = constraint.strict ? ' 🔒 STRICT' : '';
        const availMarker = constraint.available ? '✅ Available' : '❌ Not Available';
        console.log(`     ${day}: ${availMarker}${strictMarker}`);
      });
    }
    
    // Shift constraints
    if (empPref.shift_constraints) {
      console.log('\n  🕐 Shift Constraints:');
      Object.entries(empPref.shift_constraints).forEach(([shift, constraint]) => {
        const strictMarker = constraint.strict ? ' 🔒 STRICT' : '';
        const prefMarker = constraint.preferred ? '⭐ Preferred' : '⚪ Not Preferred';
        console.log(`     ${shift}: ${prefMarker}${strictMarker}`);
      });
    }
    
    // Look for specific patterns
    const hasStrictNightExclusion = empPref.shift_constraints?.night?.strict && !empPref.shift_constraints?.night?.preferred;
    const hasStrictNightPreference = empPref.shift_constraints?.night?.strict && empPref.shift_constraints?.night?.preferred;
    
    if (hasStrictNightExclusion) {
      console.log('\n  ⚠️  CANNOT work night shifts (strict exclusion)');
    }
    if (hasStrictNightPreference) {
      console.log('\n  ⭐ MUST work night shifts (strict preference)');
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Summary:');
  console.log(`   Total employees: ${employees.length}`);
  console.log(`   With preferences: ${prefs.length}`);
  console.log(`   Without preferences: ${employees.length - prefs.length}`);
  
  // Check for Johan and Anna specifically
  const johan = employees.find(e => e.first_name === 'Johan');
  const anna = employees.find(e => e.first_name === 'Anna' || e.first_name === 'Maria');
  
  if (johan) {
    const johanPref = prefs.find(p => p.employee_id === johan.id);
    console.log(`\n🔎 Johan Gustafsson (${johan.id}):`);
    if (johanPref?.shift_constraints?.night) {
      const nightPref = johanPref.shift_constraints.night;
      console.log(`   Night shift: preferred=${nightPref.preferred}, strict=${nightPref.strict}`);
      if (nightPref.strict && nightPref.preferred) {
        console.log('   ✅ Should ONLY get night shifts');
      }
    } else {
      console.log('   ⚠️  No night shift preference set!');
    }
  }
  
  if (anna) {
    const annaPref = prefs.find(p => p.employee_id === anna.id);
    console.log(`\n🔎 ${anna.first_name} (${anna.id}):`);
    if (annaPref?.shift_constraints?.night) {
      const nightPref = annaPref.shift_constraints.night;
      console.log(`   Night shift: preferred=${nightPref.preferred}, strict=${nightPref.strict}`);
      if (nightPref.strict && !nightPref.preferred) {
        console.log('   ✅ Should NEVER get night shifts');
      }
    } else {
      console.log('   ⚠️  No night shift preference set!');
    }
  }
}

checkWorkPreferences();
