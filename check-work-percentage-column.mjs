/**
 * Script to add work_percentage column to employees table in Supabase
 * Run this after creating the SQL migration in Supabase dashboard
 */

import { createClient } from '@supabase/supabase-js'

// Load from hardcoded values since we can't easily load .env in ES modules
const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addWorkPercentageColumn() {
  console.log('🔧 Adding work_percentage column to employees table...')
  
  try {
    // Check if column already exists by trying to select it
    const { data, error } = await supabase
      .from('employees')
      .select('work_percentage')
      .limit(1)
    
    if (!error) {
      console.log('✅ work_percentage column already exists!')
      
      // Set default values for any null entries
      const { data: updateData, error: updateError } = await supabase
        .from('employees')
        .update({ work_percentage: 100 })
        .is('work_percentage', null)
      
      if (updateError) {
        console.error('❌ Error setting default values:', updateError)
      } else {
        console.log('✅ Set default work_percentage = 100 for existing employees')
      }
      
      return
    }
    
    if (error.message.includes('does not exist') || error.message.includes('not found')) {
      console.log('❌ work_percentage column does not exist in database')
      console.log('📝 You need to run the SQL migration first:')
      console.log('   1. Open Supabase Dashboard')
      console.log('   2. Go to SQL Editor')
      console.log('   3. Run the contents of add-work-percentage-column.sql')
      console.log('   4. Then run this script again')
      return
    }
    
    throw error
    
  } catch (err) {
    console.error('❌ Error checking work_percentage column:', err)
  }
}

// Run the function
addWorkPercentageColumn()
