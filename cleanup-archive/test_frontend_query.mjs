#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWeekQuery() {
  console.log('🔍 Testing exact frontend week query for Week 26 (June 23-29)...')
  
  // Calculate week 26 range (Monday to Sunday)
  const startDate = new Date('2025-06-23T00:00:00.000Z') // Monday
  const endDate = new Date('2025-06-29T23:59:59.999Z')   // Sunday
  
  console.log('Date range:', {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  })
  
  try {
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        *,
        profiles:employees!shifts_employee_id_fkey (
          first_name,
          last_name,
          experience_level
        )
      `)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true })
    
    if (error) {
      console.log('❌ Error:', error.message)
      return
    }
    
    console.log(`✅ Found ${shifts.length} shifts for the week`)
    
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
        const employeeName = shift.profiles ? 
          `${shift.profiles.first_name} ${shift.profiles.last_name}` : 
          'NO PROFILE DATA'
        console.log(`  - ${shift.shift_type}: ${shift.start_time.split('T')[1].substring(0,5)}-${shift.end_time.split('T')[1].substring(0,5)} (${employeeName})`)
      })
    })
    
    // Check Monday specifically
    const mondayShifts = shiftsByDate['2025-06-23'] || []
    console.log(`\n🔍 Monday 2025-06-23 has ${mondayShifts.length} shifts:`)
    mondayShifts.forEach(shift => {
      console.log(`  - ${shift.shift_type}: ${shift.profiles?.first_name} ${shift.profiles?.last_name}`)
    })
    
  } catch (e) {
    console.log('❌ Exception:', e.message)
  }
}

testWeekQuery().catch(console.error)
