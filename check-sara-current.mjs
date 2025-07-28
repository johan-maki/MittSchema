#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qfkxlpjgypqgtqaaxvjg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma3hscGpneXBxZ3RxYWF4dmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MTY0MTMsImV4cCI6MjA0Njk5MjQxM30.4uTU7ePrP5oWdfQcyLY6eNdUzWgJLp2EW_cCVvDQ5FI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSaraCurrentStatus() {
  console.log('🔍 Checking Sara current status...')
  
  try {
    // Check all employees with Sara-like names
    console.log('1. Finding employees with Sara-like names...')
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .or('first_name.ilike.%sara%,last_name.ilike.%sara%')
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    console.log('✅ Found employees:', employees.map(emp => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      work_percentage: emp.work_percentage,
      role: emp.role
    })))
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkSaraCurrentStatus()
