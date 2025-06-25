#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('➕ Adding June 30 shifts to complete the week view...')
console.log('==================================================')

try {
  // Get employee IDs from existing July shifts
  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .eq('department', 'Akutmottagning')
    .limit(3)

  if (!employees || employees.length === 0) {
    throw new Error('No employees found')
  }

  console.log(`👥 Using ${employees.length} employees for June 30 shifts`)

  // Create 3 shifts for June 30, 2025 (Monday)
  const june30Shifts = [
    {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
      employee_id: employees[0].id,
      start_time: '2025-06-30T06:00:00+00:00',
      end_time: '2025-06-30T14:00:00+00:00',
      shift_type: 'day',
      department: 'Akutmottagning',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
      employee_id: employees[1].id,
      start_time: '2025-06-30T14:00:00+00:00',
      end_time: '2025-06-30T22:00:00+00:00',
      shift_type: 'evening',
      department: 'Akutmottagning',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
      employee_id: employees[2].id,
      start_time: '2025-06-30T22:00:00+00:00',
      end_time: '2025-07-01T06:00:00+00:00',
      shift_type: 'night',
      department: 'Akutmottagning',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  console.log('💾 Saving June 30 shifts...')
  
  const { error } = await supabase
    .from('shifts')
    .insert(june30Shifts)

  if (error) {
    console.error('❌ Error saving June 30 shifts:', error)
    throw error
  }

  console.log('✅ Successfully added 3 shifts for June 30, 2025')

  // Verify with employee names
  june30Shifts.forEach((shift, index) => {
    const employee = employees[index]
    console.log(`  ${shift.shift_type.toUpperCase()}: ${employee.first_name} ${employee.last_name} (${shift.start_time} - ${shift.end_time})`)
  })

  // Final verification
  console.log('')
  console.log('🔍 Final verification - June 30 shifts:')
  
  const { data: verifyShifts } = await supabase
    .from('shifts')
    .select(`
      *,
      employees (
        first_name,
        last_name
      )
    `)
    .gte('start_time', '2025-06-30T00:00:00')
    .lt('start_time', '2025-07-01T00:00:00')
    .order('start_time')

  if (verifyShifts && verifyShifts.length > 0) {
    verifyShifts.forEach(shift => {
      const employeeName = shift.employees 
        ? `${shift.employees.first_name} ${shift.employees.last_name}`
        : 'Unknown'
      console.log(`  ✅ ${shift.shift_type.toUpperCase()}: ${employeeName} (Published: ${shift.is_published})`)
    })
  } else {
    console.log('  ❌ No shifts found!')
  }

  console.log('')
  console.log('🎉 Complete! The frontend should now show all shifts including Monday June 30.')
  console.log('   Refresh the browser to see the updated schedule.')

} catch (error) {
  console.error('❌ Error adding June 30 shifts:', error)
}
