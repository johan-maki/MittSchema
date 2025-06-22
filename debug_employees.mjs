#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugEmployees() {
  console.log('🔍 Debugging employee profiles...')
  
  // Get all profiles
  const { data: profiles, error } = await supabase
    .from('employees')
    .select('*')
  
  if (error) {
    console.error('Error fetching profiles:', error)
    return
  }
  
  console.log(`📊 Found ${profiles.length} employee profiles`)
  
  profiles.forEach(profile => {
    console.log(`${profile.id}: ${profile.first_name} ${profile.last_name} (${profile.department})`)
  })
  
  // Check the specific employees for Monday
  const mondayEmployees = [
    'f2a75841-81ac-4580-a4c0-e6cbba34cbaa', // Day
    'cd5387d0-35db-46aa-a2fa-94122829875f', // Evening  
    '225e078a-bdb9-4d3e-9274-6c3b5432b4be'  // Night
  ]
  
  console.log('\n🔍 Monday 2025-06-23 employees:')
  mondayEmployees.forEach(empId => {
    const emp = profiles.find(p => p.id === empId)
    if (emp) {
      console.log(`${empId}: ${emp.first_name} ${emp.last_name}`)
    } else {
      console.log(`${empId}: NOT FOUND`)
    }
  })
}

debugEmployees().catch(console.error)
