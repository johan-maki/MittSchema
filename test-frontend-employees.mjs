import { createClient } from '@supabase/supabase-js'

// Use environment variables from current directory
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wwqelgkhtfhsaipnfrnj.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cWVsZ2todGZoc2FpcG5mcm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTA3NjcsImV4cCI6MjA1MDE2Njc2N30.h-9xOJZ1l_L8KZF9SLy6vhKT_hAm5rvKNP3_MuTdCUU'

console.log('🔍 Testing frontend employee queries...')
console.log('Using Supabase URL:', SUPABASE_URL)

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testFrontendQueries() {
  try {
    console.log('\n1. EmployeeView query:')
    const { data: employeeViewData, error: employeeViewError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, role, department, experience_level')
      .order('first_name')
    
    if (employeeViewError) {
      console.error('❌ EmployeeView query error:', employeeViewError)
    } else {
      console.log('✅ EmployeeView query success:', employeeViewData?.length, 'employees')
      employeeViewData?.forEach((emp, i) => {
        console.log(`   ${i+1}. ${emp.first_name} ${emp.last_name} (${emp.role})`)
      })
    }

    console.log('\n2. Schedule page profiles query:')
    const { data: profilesData, error: profilesError } = await supabase
      .from('employees')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Profiles query error:', profilesError)
    } else {
      console.log('✅ Profiles query success:', profilesData?.length, 'employees')
    }

    console.log('\n3. Schedule page employees query:')
    const { data: scheduleEmployeesData, error: scheduleEmployeesError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, role')
      .order('first_name')
    
    if (scheduleEmployeesError) {
      console.error('❌ Schedule employees query error:', scheduleEmployeesError)
    } else {
      console.log('✅ Schedule employees query success:', scheduleEmployeesData?.length, 'employees')
    }

    console.log('\n4. ShiftForm employees query:')
    const { data: shiftFormData, error: shiftFormError } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .order('first_name')
    
    if (shiftFormError) {
      console.error('❌ ShiftForm query error:', shiftFormError)
    } else {
      console.log('✅ ShiftForm query success:', shiftFormData?.length, 'employees')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testFrontendQueries()
