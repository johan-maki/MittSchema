#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateEmployeeSalaries() {
  console.log('💰 Adding salary support and updating employee salaries...\n')
  
  try {
    // First, let's see the current employee structure
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('*')

    if (fetchError) {
      console.error('❌ Error fetching employees:', fetchError)
      return
    }

    console.log('👥 Current employees:')
    employees.forEach(emp => {
      console.log(`  ${emp.first_name} ${emp.last_name} (ID: ${emp.id})`)
      if (emp.hourly_rate) {
        console.log(`    Current hourly rate: ${emp.hourly_rate} SEK`)
      } else {
        console.log(`    No hourly rate set`)
      }
    })

    // Update all employees to have 1000 SEK hourly rate
    console.log('\n💰 Setting all employees to 1000 SEK hourly rate...')
    
    for (const employee of employees) {
      const { error: updateError } = await supabase
        .from('employees')
        .update({ hourly_rate: 1000 })
        .eq('id', employee.id)

      if (updateError) {
        console.error(`❌ Error updating ${employee.first_name} ${employee.last_name}:`, updateError)
      } else {
        console.log(`✅ Updated ${employee.first_name} ${employee.last_name} to 1000 SEK/hour`)
      }
    }

    // Verify the updates
    console.log('\n✅ Verification - Updated employees:')
    const { data: updatedEmployees, error: verifyError } = await supabase
      .from('employees')
      .select('*')

    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError)
      return
    }

    updatedEmployees.forEach(emp => {
      console.log(`  ${emp.first_name} ${emp.last_name}: ${emp.hourly_rate || 'No rate'} SEK/hour`)
    })

  } catch (error) {
    console.error('❌ Error during update:', error)
  }
}

updateEmployeeSalaries()
