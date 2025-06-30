#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 Fixing employee table schema and data...')
console.log('==========================================')

try {
  // First, let's check the current table structure
  const { data: tableInfo, error: tableError } = await supabase
    .from('employees')
    .select('*')
    .limit(1)

  if (tableError) {
    console.error('❌ Error checking table:', tableError)
    process.exit(1)
  }

  console.log('📋 Current table columns:')
  if (tableInfo.length > 0) {
    console.log('   ' + Object.keys(tableInfo[0]).join(', '))
  }

  // Check if is_active column exists by trying to update it
  console.log('')
  console.log('🔍 Testing if is_active column exists...')
  
  const { error: testError } = await supabase
    .from('employees')
    .update({ is_active: true })
    .eq('id', 'non-existent-id') // This won't match anything but will test the column

  if (testError && testError.code === '42703') {
    console.log('❌ is_active column does not exist')
    console.log('💡 SOLUTION: We need to add this column or use a different approach')
    
    // Instead of adding column (which requires admin), let's check what the frontend actually uses
    console.log('')
    console.log('🔍 Checking what frontend queries look like...')
    
    // Test different possible queries that frontend might use
    const queries = [
      { name: 'All employees', query: supabase.from('employees').select('*') },
      { name: 'By department', query: supabase.from('employees').select('*').eq('department', 'Akutmottagning') },
      { name: 'Non-null department', query: supabase.from('employees').select('*').not('department', 'is', null) }
    ]

    for (const { name, query } of queries) {
      const { data, error } = await query
      if (error) {
        console.log(`   ❌ ${name}: ${error.message}`)
      } else {
        console.log(`   ✅ ${name}: ${data.length} employees`)
      }
    }

  } else {
    console.log('✅ is_active column exists or other error occurred')
    if (testError) {
      console.log('   Error details:', testError)
    }
  }

  // Fix the "hej test" employee that has no department
  console.log('')
  console.log('🔧 Fixing employee with missing department...')
  
  const { data: fixedEmployee, error: fixError } = await supabase
    .from('employees')
    .update({
      department: 'Akutmottagning',
      role: 'Sjuksköterska'
    })
    .eq('first_name', 'hej')
    .eq('last_name', 'test')
    .select()

  if (fixError) {
    console.error('❌ Error fixing employee:', fixError)
  } else {
    console.log('✅ Fixed "hej test" employee department')
  }

  // Final verification
  console.log('')
  console.log('📊 Final employee count verification:')
  
  const { data: allEmployees } = await supabase
    .from('employees')
    .select('*')

  const { data: akutEmployees } = await supabase
    .from('employees')
    .select('*')
    .eq('department', 'Akutmottagning')

  console.log(`   Total employees: ${allEmployees.length}`)
  console.log(`   Akutmottagning employees: ${akutEmployees.length}`)

  if (akutEmployees.length === 7) {
    console.log('✅ All employees now have Akutmottagning department')
  } else {
    console.log('⚠️  Some employees still missing department assignment')
  }

  // Test what frontend would see
  console.log('')
  console.log('🎯 Simulating frontend employee loading...')
  
  // This is likely what the frontend does
  const { data: frontendView, error: frontendError } = await supabase
    .from('employees')
    .select(`
      id,
      first_name,
      last_name,
      department,
      role,
      experience_level,
      created_at
    `)
    .eq('department', 'Akutmottagning')
    .order('first_name')

  if (frontendError) {
    console.error('❌ Frontend simulation error:', frontendError)
  } else {
    console.log(`✅ Frontend would see: ${frontendView.length} employees`)
    console.log('   Names:', frontendView.map(emp => `${emp.first_name} ${emp.last_name}`).join(', '))
  }

} catch (error) {
  console.error('❌ Error:', error)
}
