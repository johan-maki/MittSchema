#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('👥 Checking employee database sync...')
console.log('===================================')

try {
  // Get all employees from database
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at')

  if (error) {
    console.error('❌ Error fetching employees:', error)
    process.exit(1)
  }

  console.log(`📊 Database Results:`)
  console.log(`   Total employees found: ${employees.length}`)
  console.log('')

  if (employees.length === 0) {
    console.log('❌ No employees found in database!')
    console.log('   This explains why frontend shows 0 or incorrect count.')
  } else {
    console.log('👥 All employees in database:')
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.first_name} ${emp.last_name}`)
      console.log(`   ID: ${emp.id}`)
      console.log(`   Department: ${emp.department || 'No department'}`)
      console.log(`   Role: ${emp.role || 'No role'}`)
      console.log(`   Experience: ${emp.experience_level || 'No experience'}`)
      console.log(`   Created: ${emp.created_at}`)
      console.log(`   Active: ${emp.is_active !== false ? 'Yes' : 'No'}`)
      console.log('')
    })
  }

  // Check for any filtering that might hide employees
  console.log('🔍 Checking potential filtering issues:')
  
  // Check departments
  const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean)
  console.log(`   Departments found: ${departments.join(', ') || 'None'}`)
  
  // Check roles
  const roles = [...new Set(employees.map(emp => emp.role))].filter(Boolean)
  console.log(`   Roles found: ${roles.join(', ') || 'None'}`)
  
  // Check active status
  const activeEmployees = employees.filter(emp => emp.is_active !== false)
  const inactiveEmployees = employees.filter(emp => emp.is_active === false)
  console.log(`   Active employees: ${activeEmployees.length}`)
  console.log(`   Inactive employees: ${inactiveEmployees.length}`)
  
  // Check specific department filtering
  const akutmottagningEmployees = employees.filter(emp => emp.department === 'Akutmottagning')
  console.log(`   Akutmottagning department: ${akutmottagningEmployees.length}`)

  // Test frontend query specifically
  console.log('')
  console.log('🎯 Testing frontend-style query:')
  
  const { data: frontendEmployees, error: frontendError } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('first_name')

  if (frontendError) {
    console.error('❌ Frontend query error:', frontendError)
  } else {
    console.log(`   Frontend query result: ${frontendEmployees.length} employees`)
    if (frontendEmployees.length !== employees.length) {
      console.log('⚠️  MISMATCH: Frontend query returns different count!')
      console.log('   This suggests filtering by is_active = true')
    }
  }

  // Check if there are any database connection issues
  console.log('')
  console.log('🔗 Testing database connection:')
  const { data: connectionTest, error: connectionError } = await supabase
    .from('employees')
    .select('count', { count: 'exact' })

  if (connectionError) {
    console.error('❌ Connection test failed:', connectionError)
  } else {
    console.log(`✅ Connection OK - Total rows: ${connectionTest.length > 0 ? connectionTest[0].count : 'Unknown'}`)
  }

  // Recommendations
  console.log('')
  console.log('💡 DIAGNOSIS:')
  if (employees.length < 7) {
    console.log(`❌ Database only has ${employees.length} employees, but you expect 7.`)
    console.log('   SOLUTION: Missing employees need to be added to database.')
  } else if (employees.length === 7) {
    console.log('✅ Database has correct number of employees (7).')
    console.log('❌ Frontend is filtering or not loading correctly.')
    console.log('   SOLUTION: Check frontend employee loading logic.')
  } else {
    console.log(`✅ Database has ${employees.length} employees (more than expected 7).`)
    console.log('   Frontend might be filtering by department or active status.')
  }

} catch (error) {
  console.error('❌ Error checking employee sync:', error)
}
