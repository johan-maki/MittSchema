#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking specific shifts for Monday June 30, 2025...')
console.log('======================================================')

try {
  // Check shifts for June 30, 2025 (Monday)
  const { data: june30Shifts, error } = await supabase
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

  if (error) {
    console.error('❌ Error fetching June 30 shifts:', error)
    process.exit(1)
  }

  console.log(`📊 Found ${june30Shifts.length} shifts for June 30, 2025:`)
  
  if (june30Shifts.length === 0) {
    console.log('❌ NO SHIFTS FOUND for June 30, 2025!')
    console.log('   This explains why "Lägg till" appears in the UI.')
  } else {
    june30Shifts.forEach(shift => {
      const employeeName = shift.employees 
        ? `${shift.employees.first_name} ${shift.employees.last_name}`
        : 'Unknown Employee'
      
      console.log(`  ${shift.shift_type.toUpperCase()}: ${shift.start_time} - ${shift.end_time}`)
      console.log(`    Employee: ${employeeName}`)
      console.log(`    Published: ${shift.is_published}`)
      console.log('')
    })
  }

  // Also check what the date range actually is in the database
  console.log('🗓️ Checking actual date range in database...')
  
  const { data: dateRange, error: rangeError } = await supabase
    .from('shifts')
    .select('start_time')
    .order('start_time', { ascending: true })
    .limit(1)

  const { data: dateRangeEnd, error: rangeEndError } = await supabase
    .from('shifts')
    .select('start_time')
    .order('start_time', { ascending: false })
    .limit(1)

  if (!rangeError && !rangeEndError && dateRange.length > 0 && dateRangeEnd.length > 0) {
    console.log(`   First shift: ${dateRange[0].start_time}`)
    console.log(`   Last shift: ${dateRangeEnd[0].start_time}`)
  }

  // Check if there are any shifts for July 31
  const { data: july31Shifts } = await supabase
    .from('shifts')
    .select('*')
    .gte('start_time', '2025-07-31T00:00:00')
    .lt('start_time', '2025-08-01T00:00:00')

  console.log(`📅 July 31 shifts: ${july31Shifts ? july31Shifts.length : 0}`)

} catch (error) {
  console.error('❌ Error:', error)
}
