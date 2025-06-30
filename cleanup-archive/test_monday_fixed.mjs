#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMondayShifts() {
  console.log('🔍 Testing Monday 2025-06-23 shifts with corrected query...')
  
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        profiles:employees!shifts_employee_id_fkey (
          first_name,
          last_name,
          experience_level
        )
      `)
      .gte('start_time', '2025-06-23T00:00:00+00:00')
      .lt('start_time', '2025-06-24T00:00:00+00:00')
      .order('start_time')
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Monday 2025-06-23 shifts:', data.length, 'shifts found')
      data.forEach(shift => {
        console.log(`  - ${shift.shift_type}: ${shift.start_time.split('T')[1].substring(0,5)}-${shift.end_time.split('T')[1].substring(0,5)} (${shift.profiles?.first_name} ${shift.profiles?.last_name})`)
      })
    }
  } catch (e) {
    console.log('❌ Exception:', e.message)
  }
}

testMondayShifts().catch(console.error)
