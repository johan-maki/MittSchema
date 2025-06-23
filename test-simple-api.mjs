#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSimpleAPI() {
  console.log('🧪 Testing Gurobi API response structure...\n')
  
  try {
    // Get employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')

    if (empError) {
      console.error('❌ Error fetching employees:', empError)
      return
    }

    console.log(`👥 Found ${employees.length} employees`)
    
    // Call Gurobi API with minimal parameters
    const response = await fetch('http://localhost:8080/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employees: employees,
        start_date: '2025-10-01',
        end_date: '2025-10-03', // Just 3 days for quick test
        min_staff_per_shift: 1,
        min_experience_per_shift: 1,
        include_weekends: true,
        random_seed: 42
      })
    })

    if (!response.ok) {
      console.error('❌ API request failed:', response.status)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return
    }

    const result = await response.json()
    
    console.log('\n📋 FULL API RESPONSE STRUCTURE:')
    console.log('===============================')
    console.log(JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

testSimpleAPI()
