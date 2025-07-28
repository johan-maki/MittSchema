import { createClient } from '@supabase/supabase-js'

// Using the URL from .env.example (adjust if different)
const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runExperienceMigration() {
  console.log('🔄 Running experience points migration...')
  
  try {
    // First, check current state
    console.log('\n1️⃣ Checking current experience levels...')
    const { data: beforeEmployees, error: beforeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, experience_level')

    if (beforeError) {
      console.error('❌ Error fetching employees:', beforeError)
      return
    }

    console.log(`📊 Found ${beforeEmployees.length} employees`)
    
    if (beforeEmployees.length === 0) {
      console.log('ℹ️  No employees found - nothing to migrate')
      console.log('✅ Migration complete (database is empty)')
      return
    }

    // Show current distribution
    const beforeDistribution = {}
    beforeEmployees.forEach(emp => {
      const level = emp.experience_level || 'null'
      beforeDistribution[level] = (beforeDistribution[level] || 0) + 1
    })

    console.log('📈 Current experience level distribution:')
    Object.keys(beforeDistribution).sort().forEach(level => {
      console.log(`  Level ${level}: ${beforeDistribution[level]} employees`)
    })

    // Check if migration is needed
    const needsMigration = beforeEmployees.some(emp => 
      emp.experience_level === null || 
      emp.experience_level < 1 || 
      emp.experience_level > 5
    )

    if (!needsMigration) {
      console.log('\n✅ All employees already have valid experience points (1-5)')
      console.log('ℹ️  No migration needed!')
      return
    }

    console.log('\n2️⃣ Migrating experience values...')
    
    // Apply migration logic
    for (const emp of beforeEmployees) {
      let newLevel = emp.experience_level
      
      // Convert based on the migration rules
      if (emp.experience_level === null || emp.experience_level === undefined) {
        newLevel = 1 // Default for null values
      } else if (emp.experience_level <= 0.5) {
        newLevel = 1  // 0-6 months -> 1 (Nybörjare)
      } else if (emp.experience_level <= 1.5) {
        newLevel = 2  // 6-18 months -> 2 (Erfaren)
      } else if (emp.experience_level <= 3) {
        newLevel = 3  // 1.5-3 years -> 3 (Välerfaren)
      } else if (emp.experience_level >= 4) {
        newLevel = 4  // 3+ years -> 4 (Senior)
      } else {
        newLevel = 3  // Default to 3 for edge cases
      }

      // Only update if value changed
      if (newLevel !== emp.experience_level) {
        console.log(`  📝 ${emp.first_name} ${emp.last_name}: ${emp.experience_level} → ${newLevel}`)
        
        const { error: updateError } = await supabase
          .from('employees')
          .update({ experience_level: newLevel })
          .eq('id', emp.id)

        if (updateError) {
          console.error(`❌ Error updating ${emp.first_name} ${emp.last_name}:`, updateError)
        }
      }
    }

    console.log('\n3️⃣ Verifying migration...')
    
    // Check final state
    const { data: afterEmployees, error: afterError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, experience_level')

    if (afterError) {
      console.error('❌ Error verifying migration:', afterError)
      return
    }

    // Show final distribution
    const afterDistribution = {}
    afterEmployees.forEach(emp => {
      const level = emp.experience_level || 'null'
      afterDistribution[level] = (afterDistribution[level] || 0) + 1
    })

    console.log('📈 Final experience level distribution:')
    Object.keys(afterDistribution).sort().forEach(level => {
      console.log(`  Level ${level}: ${afterDistribution[level]} employees`)
    })

    // Check if all values are now in range
    const stillOutOfRange = afterEmployees.filter(emp => 
      emp.experience_level < 1 || emp.experience_level > 5
    )

    if (stillOutOfRange.length === 0) {
      console.log('\n✅ Migration successful! All employees now have experience points 1-5')
    } else {
      console.log('\n⚠️  Some employees still have values outside 1-5 range:')
      stillOutOfRange.forEach(emp => {
        console.log(`  - ${emp.first_name} ${emp.last_name}: ${emp.experience_level}`)
      })
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runExperienceMigration()
