#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔄 Regenerating complete July 2025 schedule with correct dates...')
console.log('================================================================')

try {
  // Step 1: Clear ALL existing July-related shifts (including June 30)
  console.log('🗑️ Clearing all existing July 2025 related shifts...')
  
  const { error: deleteError } = await supabase
    .from('shifts')
    .delete()
    .gte('start_time', '2025-06-30T00:00:00')
    .lt('start_time', '2025-08-01T00:00:00')

  if (deleteError) {
    console.error('❌ Error clearing shifts:', deleteError)
    process.exit(1)
  }
  console.log('✅ Cleared all existing shifts')

  // Step 2: Generate new schedule with Render backend for FULL July
  console.log('')
  console.log('📞 Generating complete July schedule with Render backend...')
  
  const testData = {
    start_date: '2025-07-01',
    end_date: '2025-07-31',  // Make sure end date is July 31
    department: 'Akutmottagning',
    min_staff_per_shift: 1,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: 777777
  }

  const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ API Error:', response.status, errorText)
    process.exit(1)
  }

  const result = await response.json()
  console.log(`✅ Generated ${result.schedule.length} shifts`)

  // Step 3: Verify date coverage
  const dates = [...new Set(result.schedule.map(s => s.date))].sort()
  console.log('')
  console.log('📅 Date coverage verification:')
  console.log(`   First date: ${dates[0]}`)
  console.log(`   Last date: ${dates[dates.length - 1]}`)
  console.log(`   Total days: ${dates.length}`)
  
  // Check critical dates
  const criticalDates = ['2025-07-01', '2025-07-31']
  criticalDates.forEach(date => {
    const shiftsForDate = result.schedule.filter(s => s.date === date)
    console.log(`   ${date}: ${shiftsForDate.length} shifts`)
  })

  if (!dates.includes('2025-07-31')) {
    console.error('❌ CRITICAL: July 31 is missing from generated schedule!')
    console.error('   This needs to be fixed in the backend date generation.')
    // Don't exit - save what we have but flag the issue
  }

  // Step 4: Convert and save to database with published = true
  console.log('')
  console.log('💾 Saving schedule to database...')
  
  const shiftsToSave = result.schedule.map(shift => ({
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
    employee_id: shift.employee_id,
    start_time: shift.start_time,
    end_time: shift.end_time,
    shift_type: shift.shift_type,
    department: shift.department || 'Akutmottagning',
    is_published: true,  // CRITICAL: Set to true so they show in frontend
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  // Save in batches
  const batchSize = 50
  let totalSaved = 0
  
  for (let i = 0; i < shiftsToSave.length; i += batchSize) {
    const batch = shiftsToSave.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('shifts')
      .insert(batch)

    if (error) {
      console.error(`❌ Error saving batch:`, error)
      throw error
    }
    
    totalSaved += batch.length
    console.log(`  Saved batch: ${batch.length} shifts (total: ${totalSaved})`)
  }

  console.log(`✅ Successfully saved ${totalSaved} shifts as PUBLISHED!`)

  // Step 5: Final verification
  console.log('')
  console.log('🔍 Final verification...')
  
  const { data: savedShifts } = await supabase
    .from('shifts')
    .select('start_time, shift_type, is_published')
    .gte('start_time', '2025-06-30T00:00:00')
    .lt('start_time', '2025-08-01T00:00:00')
    .order('start_time')

  const publishedCount = savedShifts.filter(s => s.is_published).length
  console.log(`📊 Database verification:`)
  console.log(`   Total shifts: ${savedShifts.length}`)
  console.log(`   Published: ${publishedCount}`)
  console.log(`   Unpublished: ${savedShifts.length - publishedCount}`)

  // Check June 30 specifically (for the UI issue)
  const june30Shifts = savedShifts.filter(s => s.start_time.startsWith('2025-06-30'))
  console.log(`   June 30 shifts: ${june30Shifts.length} (should be 3)`)
  
  // Check July 31 specifically
  const july31Shifts = savedShifts.filter(s => s.start_time.startsWith('2025-07-31'))
  console.log(`   July 31 shifts: ${july31Shifts.length} (should be 3)`)

  if (july31Shifts.length === 0) {
    console.log('⚠️  WARNING: No July 31 shifts found - backend may have date generation issue')
  }

  console.log('')
  console.log('🎉 Schedule regeneration complete!')
  console.log('The frontend should now show all shifts including June 30 night shift.')

} catch (error) {
  console.error('❌ Error in schedule regeneration:', error)
}
