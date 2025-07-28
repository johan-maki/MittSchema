import { createClient } from '@supabase/supabase-js'

// Using the URL from .env.example (adjust if different)
const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExperienceLevels() {
  console.log('🔍 Checking current experience levels in database...')
  
  try {
    // Check current experience level distribution
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, first_name, last_name, experience_level')
      .order('experience_level')

    if (error) {
      console.error('❌ Error fetching employees:', error)
      return
    }

    console.log(`📊 Found ${employees.length} employees`)
    console.log('\n📈 Experience level distribution:')
    
    // Group by experience level
    const distribution = {}
    employees.forEach(emp => {
      const level = emp.experience_level
      if (!distribution[level]) {
        distribution[level] = []
      }
      distribution[level].push(emp)
    })

    // Show distribution
    Object.keys(distribution).sort((a, b) => Number(a) - Number(b)).forEach(level => {
      const count = distribution[level].length
      const percentage = ((count / employees.length) * 100).toFixed(1)
      console.log(`  Level ${level}: ${count} employees (${percentage}%)`)
      
      // Show a few examples
      if (distribution[level].length <= 3) {
        distribution[level].forEach(emp => {
          console.log(`    - ${emp.first_name} ${emp.last_name}`)
        })
      } else {
        console.log(`    - ${distribution[level][0].first_name} ${distribution[level][0].last_name} (and ${count-1} others)`)
      }
    })

    // Check if any values are outside 1-5 range
    const outOfRange = employees.filter(emp => emp.experience_level < 1 || emp.experience_level > 5)
    if (outOfRange.length > 0) {
      console.log('\n⚠️  Found employees with experience levels outside 1-5 range:')
      outOfRange.forEach(emp => {
        console.log(`  - ${emp.first_name} ${emp.last_name}: ${emp.experience_level}`)
      })
    } else {
      console.log('\n✅ All employees have experience levels within 1-5 range')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkExperienceLevels()
