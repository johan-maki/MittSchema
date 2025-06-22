#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugShifts() {
  console.log('🔍 Debugging current shifts in database...')
  
  // Get all unpublished shifts
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('is_published', false)
    .order('start_time')
  
  if (error) {
    console.error('Error fetching shifts:', error)
    return
  }
  
  console.log(`📊 Found ${shifts.length} unpublished shifts in database`)
  
  // Group by date
  const shiftsByDate = {}
  shifts.forEach(shift => {
    const date = shift.start_time.split('T')[0]
    if (!shiftsByDate[date]) {
      shiftsByDate[date] = []
    }
    shiftsByDate[date].push(shift)
  })
  
  console.log('\n📅 Shifts by date:')
  Object.keys(shiftsByDate).sort().forEach(date => {
    console.log(`\n${date}:`)
    shiftsByDate[date].forEach(shift => {
      console.log(`  - ${shift.shift_type}: ${shift.start_time.split('T')[1].substring(0,5)}-${shift.end_time.split('T')[1].substring(0,5)} (Employee: ${shift.employee_id})`)
    })
  })
  
  // Check for Monday 23rd specifically
  const monday23 = shiftsByDate['2025-06-23'] || []
  console.log(`\n🔍 Monday 2025-06-23 has ${monday23.length} shifts:`)
  monday23.forEach(shift => {
    console.log(`  - ${shift.shift_type}: ${shift.start_time} to ${shift.end_time} (Employee: ${shift.employee_id})`)
  })
}

debugShifts().catch(console.error)
