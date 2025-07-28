#!/usr/bin/env node

// Simple database query to check all employees
async function checkEmployees() {
  console.log('🔍 Checking all employees...')
  
  try {
    const response = await fetch('https://qfkxlpjgypqgtqaaxvjg.supabase.co/rest/v1/employees?select=*', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma3hscGpneXBxZ3RxYWF4dmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MTY0MTMsImV4cCI6MjA0Njk5MjQxM30.4uTU7ePrP5oWdfQcyLY6eNdUzWgJLp2EW_cCVvDQ5FI',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma3hscGpneXBxZ3RxYWF4dmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MTY0MTMsImV4cCI6MjA0Njk5MjQxM30.4uTU7ePrP5oWdfQcyLY6eNdUzWgJLp2EW_cCVvDQ5FI'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const employees = await response.json()
    
    console.log('✅ Found employees:')
    employees.forEach(emp => {
      console.log(`- ${emp.first_name} ${emp.last_name} (ID: ${emp.id}) - ${emp.work_percentage}% - ${emp.role}`)
    })
    
    // Find Sara specifically
    const sara = employees.find(emp => 
      emp.first_name.toLowerCase().includes('sara') || 
      emp.last_name.toLowerCase().includes('sara')
    )
    
    if (sara) {
      console.log('\n🎯 Found Sara:')
      console.log(`Name: ${sara.first_name} ${sara.last_name}`)
      console.log(`ID: ${sara.id}`)
      console.log(`Work Percentage: ${sara.work_percentage}%`)
      console.log(`Role: ${sara.role}`)
    } else {
      console.log('\n❌ No Sara found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkEmployees()
