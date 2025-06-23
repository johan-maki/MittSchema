#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking database contents...\n')
  
  try {
    // Get all shifts
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time')

    if (error) {
      console.error('❌ Error fetching shifts:', error)
      return
    }

    console.log(`📊 Found ${shifts.length} shifts total`)
    
    if (shifts.length > 0) {
      console.log(`📅 Date range: ${shifts[0].start_time} to ${shifts[shifts.length - 1].start_time}`)
      
      // Show recent shifts
      const recentShifts = shifts.slice(-10)
      console.log('\n🕐 Recent shifts:')
      recentShifts.forEach(shift => {
        console.log(`  ${shift.start_time} - ${shift.end_time} (Employee: ${shift.employee_id}, Published: ${shift.is_published})`)
      })
    }
    
    // Check employees table
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')

    if (empError) {
      console.error('❌ Error fetching employees:', empError)
      return
    }

    console.log(`\n👥 Found ${employees.length} employees`)
    if (employees.length > 0) {
      console.log('Employee IDs:')
      employees.forEach(emp => {
        console.log(`  ${emp.id}: ${emp.first_name} ${emp.last_name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error during check:', error)
  }
}

checkDatabase()
