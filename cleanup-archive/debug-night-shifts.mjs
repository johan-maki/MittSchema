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

async function debugNightShifts() {
  console.log('🔍 Analyzing night shift patterns and month boundaries...\n')
  
  try {
    // Get all shifts for the current schedule
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employees:employee_id(first_name, last_name)
      `)
      .gte('start_time', '2025-06-01')
      .lte('start_time', '2025-08-31')
      .order('start_time')

    if (error) {
      console.error('❌ Error fetching shifts:', error)
      return
    }

    console.log(`📊 Found ${shifts.length} shifts`)
    
    // Group by date and analyze patterns
    const dateGroups = {}
    
    for (const shift of shifts) {
      const date = shift.start_time.split('T')[0] // Get date part
      if (!dateGroups[date]) {
        dateGroups[date] = { day: null, evening: null, night: null }
      }
      
      // Determine shift type based on start time
      const startTime = shift.start_time.split('T')[1].substring(0, 5)
      let shiftType = 'unknown'
      
      if (startTime >= '06:00' && startTime < '14:00') {
        shiftType = 'day'
      } else if (startTime >= '14:00' && startTime < '22:00') {
        shiftType = 'evening'  
      } else if (startTime >= '22:00' || startTime < '06:00') {
        shiftType = 'night'
      }
      
      dateGroups[date][shiftType] = {
        employee: shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unknown',
        start: startTime,
        published: shift.is_published
      }
    }
    
    // Sort dates
    const sortedDates = Object.keys(dateGroups).sort()
    
    console.log('\n📅 Shift Analysis by Date:')
    console.log('=====================================')
    
    let issues = []
    
    for (const date of sortedDates) {
      const shifts = dateGroups[date]
      const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long' })
      
      // Check for missing shifts
      const missingShifts = []
      if (!shifts.day) missingShifts.push('DAY')
      if (!shifts.evening) missingShifts.push('EVENING')  
      if (!shifts.night) missingShifts.push('NIGHT')
      
      let status = '✅'
      if (missingShifts.length > 0) {
        status = '⚠️'
        issues.push({
          date,
          dayOfWeek,
          missing: missingShifts,
          hasNight: !!shifts.night,
          hasDay: !!shifts.day,
          hasEvening: !!shifts.evening
        })
      }
      
      console.log(`${status} ${date} (${dayOfWeek}):`)
      console.log(`    Day:     ${shifts.day ? `${shifts.day.employee} (${shifts.day.start})` : 'MISSING'}`)
      console.log(`    Evening: ${shifts.evening ? `${shifts.evening.employee} (${shifts.evening.start})` : 'MISSING'}`)  
      console.log(`    Night:   ${shifts.night ? `${shifts.night.employee} (${shifts.night.start})` : 'MISSING'}`)
      
      // Check for first/last day issues
      const isFirstOfMonth = date.endsWith('-01')
      const isLastOfMonth = date.endsWith('-31') || date.endsWith('-30') || (date.endsWith('-29') && date.includes('-02-')) || (date.endsWith('-28') && date.includes('-02-'))
      
      if (isFirstOfMonth && !shifts.night) {
        console.log(`    🚨 FIRST OF MONTH - MISSING NIGHT SHIFT!`)
      }
      
      if (isLastOfMonth && shifts.night && (!shifts.day || !shifts.evening)) {
        console.log(`    🚨 LAST OF MONTH - HAS NIGHT BUT MISSING DAY/EVENING!`)
      }
      
      console.log('')
    }
    
    // Summary of issues
    console.log('\n🔍 ISSUE SUMMARY:')
    console.log('==================')
    
    if (issues.length === 0) {
      console.log('✅ No missing shifts found!')
    } else {
      console.log(`❌ Found ${issues.length} dates with missing shifts:`)
      
      const firstNightIssues = issues.filter(issue => 
        issue.date.endsWith('-01') && !issue.hasNight
      )
      
      const lastDayIssues = issues.filter(issue => 
        (issue.date.endsWith('-31') || issue.date.endsWith('-30')) && 
        issue.hasNight && (!issue.hasDay || !issue.hasEvening)
      )
      
      if (firstNightIssues.length > 0) {
        console.log(`\n🚨 FIRST NIGHT ISSUES (${firstNightIssues.length}):`)
        firstNightIssues.forEach(issue => {
          console.log(`   ${issue.date} (${issue.dayOfWeek}) - Missing night shift`)
        })
      }
      
      if (lastDayIssues.length > 0) {
        console.log(`\n🚨 LAST DAY ISSUES (${lastDayIssues.length}):`)
        lastDayIssues.forEach(issue => {
          console.log(`   ${issue.date} (${issue.dayOfWeek}) - Has night but missing: ${issue.missing.join(', ')}`)
        })
      }
      
      console.log(`\nAll issues:`)
      issues.forEach(issue => {
        console.log(`   ${issue.date} (${issue.dayOfWeek}) - Missing: ${issue.missing.join(', ')}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error)
  }
}

debugNightShifts()
