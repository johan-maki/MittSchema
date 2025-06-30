import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wwqelgkhtfhsaipnfrnj.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cWVsZ2todGZoc2FpcG5mcm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTA3NjcsImV4cCI6MjA1MDE2Njc2N30.h-9xOJZ1l_L8KZF9SLy6vhKT_hAm5rvKNP3_MuTdCUU'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('👥 Adding nurses with generated UUIDs...')

async function addNursesWithIds() {
  try {
    // Check current count
    const { data: currentEmployees, error: countError } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
    
    if (countError) {
      console.error('❌ Error checking current employees:', countError)
      return
    }
    
    console.log(`📊 Current employees: ${currentEmployees?.length || 0}`)
    
    // Add 3 new nurses with UUIDs
    const newNurses = [
      {
        id: randomUUID(),
        first_name: 'Sofia',
        last_name: 'Svensson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 678 9012',
        hourly_rate: 1000
      },
      {
        id: randomUUID(),
        first_name: 'Peter',
        last_name: 'Pettersson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 789 0123',
        hourly_rate: 1000
      },
      {
        id: randomUUID(),
        first_name: 'Emma',
        last_name: 'Ericsson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 890 1234',
        hourly_rate: 1000
      }
    ]
    
    console.log('\n🏥 Adding new nurses:')
    for (const nurse of newNurses) {
      console.log(`   • ${nurse.first_name} ${nurse.last_name} - ${nurse.hourly_rate} SEK/timme`)
    }
    
    const { data: insertedNurses, error: insertError } = await supabase
      .from('employees')
      .insert(newNurses)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting new nurses:', insertError)
      return
    }
    
    console.log('\n✅ Successfully added nurses!')
    console.log('New nurses:', insertedNurses?.length || 0)
    
    // Update hourly_rate for existing employees to 1000 SEK
    console.log('\n💰 Updating existing employees to 1000 SEK hourly rate...')
    
    const { data: updatedSalaries, error: updateError } = await supabase
      .from('employees')
      .update({ hourly_rate: 1000 })
      .or('hourly_rate.is.null,hourly_rate.neq.1000') // Update those without rate or different rate
      .select()
    
    if (updateError) {
      console.error('❌ Error updating hourly rates:', updateError)
    } else {
      console.log(`✅ Updated hourly rates for ${updatedSalaries?.length || 0} employees`)
    }
    
    // Final verification
    const { data: finalEmployees, error: finalError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hourly_rate')
      .order('first_name')
    
    if (finalError) {
      console.error('❌ Error in final verification:', finalError)
      return
    }
    
    console.log('\n📋 FINAL STATUS:')
    console.log(`📊 Total employees: ${finalEmployees?.length || 0}`)
    console.log('\n👥 All employees:')
    finalEmployees?.forEach((emp, i) => {
      console.log(`   ${i+1}. ${emp.first_name} ${emp.last_name} - ${emp.hourly_rate || 'No rate'} SEK/timme`)
    })
    
    // Check salary consistency
    const rates = finalEmployees?.map(emp => emp.hourly_rate).filter(s => s !== null)
    const uniqueRates = [...new Set(rates)]
    
    console.log('\n💰 Hourly rate verification:')
    console.log(`   Employees with rate data: ${rates?.length || 0}`)
    if (uniqueRates.length > 0) {
      console.log(`   Unique rates: ${uniqueRates.join(', ')} SEK/timme`)
    }
    
    if (rates?.length === finalEmployees?.length && uniqueRates.length === 1 && uniqueRates[0] === 1000) {
      console.log('   ✅ All employees have correct 1000 SEK/timme rate!')
    } else if (rates?.length === 0) {
      console.log('   ⚠️  No hourly rates found in database')
    } else {
      console.log('   ⚠️  Rate inconsistency detected or some missing rates')
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error)
  }
}

addNursesWithIds()
