#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAlias() {
  console.log('🔍 Testing alias syntax...')
  
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        id,
        employee_id,
        start_time,
        shift_type,
        profiles:employees!shifts_employee_id_fkey (
          first_name,
          last_name,
          experience_level
        )
      `)
      .limit(2)
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Success with alias:', JSON.stringify(data, null, 2))
    }
  } catch (e) {
    console.log('❌ Exception:', e.message)
  }
}

testAlias().catch(console.error)
