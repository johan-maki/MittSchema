#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testJoin() {
  console.log('🔍 Testing different join syntaxes...')
  
  // Try 1: Direct employees reference
  try {
    console.log('\n1. Testing employees:employee_id')
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        id,
        employee_id,
        start_time,
        shift_type,
        employees:employee_id (
          first_name,
          last_name
        )
      `)
      .limit(1)
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Success:', data)
    }
  } catch (e) {
    console.log('❌ Exception:', e.message)
  }
  
  // Try 2: Foreign key reference
  try {
    console.log('\n2. Testing with foreign key name')
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        id,
        employee_id,
        start_time,
        shift_type,
        employees!shifts_employee_id_fkey (
          first_name,
          last_name
        )
      `)
      .limit(1)
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Success:', data)
    }
  } catch (e) {
    console.log('❌ Exception:', e.message)
  }
  
  // Try 3: Simple alias
  try {
    console.log('\n3. Testing simple employees reference')
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        id,
        employee_id,
        start_time,
        shift_type,
        employees (
          first_name,
          last_name
        )
      `)
      .limit(1)
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Success:', data)
    }
  } catch (e) {
    console.log('❌ Exception:', e.message)
  }
}

testJoin().catch(console.error)
