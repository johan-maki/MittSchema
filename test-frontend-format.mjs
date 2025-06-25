const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔧 Testing exact frontend format for minimum staff enforcement')

async function testFrontendFormat() {
  try {
    // This is exactly what frontend sends based on schedulerApi.ts
    const frontendRequest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-07",
      "department": "Akutmottagning", 
      "random_seed": 123456,
      "optimizer": "gurobi",
      "min_staff_per_shift": 2,  // This should enforce 2 people per shift
      "min_experience_per_shift": 1,
      "include_weekends": true
    }
    
    console.log('🚀 Sending frontend-format request:')
    console.log(JSON.stringify(frontendRequest, null, 2))
    
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frontendRequest)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', response.status, errorText)
      return
    }
    
    const result = await response.json()
    console.log('\n📊 Results:')
    console.log('Total shifts:', result.schedule?.length || 0)
    console.log('Status:', result.optimization_status)
    console.log('Message:', result.message)
    
    if (result.schedule && result.schedule.length > 0) {
      // Detailed analysis of min_staff_per_shift compliance
      console.log('\n🔍 Analyzing min_staff_per_shift=2 compliance...')
      
      const shiftSlots = {}
      result.schedule.forEach(shift => {
        const key = `${shift.date}_${shift.shift_type}`
        if (!shiftSlots[key]) shiftSlots[key] = []
        shiftSlots[key].push(shift)
      })
      
      let compliantSlots = 0
      let violatingSlots = 0
      
      console.log('\nShift slot analysis:')
      Object.entries(shiftSlots).sort().forEach(([slot, shifts]) => {
        const staffCount = shifts.length
        const status = staffCount >= 2 ? '✅' : '❌'
        
        if (staffCount >= 2) {
          compliantSlots++
        } else {
          violatingSlots++
        }
        
        console.log(`${slot.padEnd(20)}: ${staffCount} staff ${status}`)
      })
      
      const totalSlots = Object.keys(shiftSlots).length
      const complianceRate = (compliantSlots / totalSlots * 100).toFixed(1)
      
      console.log('\n📈 COMPLIANCE SUMMARY:')
      console.log(`Total shift slots: ${totalSlots}`)
      console.log(`Compliant (≥2 staff): ${compliantSlots}`)
      console.log(`Violating (<2 staff): ${violatingSlots}`)
      console.log(`Compliance rate: ${complianceRate}%`)
      
      if (violatingSlots === 0) {
        console.log('🎉 PERFECT! All shifts have minimum 2 staff!')
      } else {
        console.log('⚠️  PROBLEM: Backend is not enforcing min_staff_per_shift parameter')
        console.log('   This needs investigation/fix in the Gurobi algorithm')
      }
      
      // Weekend fairness analysis
      console.log('\n🎯 Weekend fairness analysis...')
      const weekendShifts = result.schedule.filter(shift => shift.is_weekend)
      const employeeWeekendCount = {}
      
      weekendShifts.forEach(shift => {
        const empName = shift.employee_name
        employeeWeekendCount[empName] = (employeeWeekendCount[empName] || 0) + 1
      })
      
      console.log('Weekend shift distribution:')
      Object.entries(employeeWeekendCount).forEach(([name, count]) => {
        console.log(`  ${name}: ${count} weekend shifts`)
      })
      
      const weekendCounts = Object.values(employeeWeekendCount)
      if (weekendCounts.length > 0) {
        const minWeekend = Math.min(...weekendCounts)
        const maxWeekend = Math.max(...weekendCounts)
        const fairnessRange = maxWeekend - minWeekend
        
        console.log(`Weekend fairness range: ${minWeekend}-${maxWeekend} (difference: ${fairnessRange})`)
        
        if (fairnessRange <= 1) {
          console.log('✅ Weekend distribution is fair')
        } else {
          console.log('⚠️  Weekend distribution could be more fair')
        }
      }
    }
    
    // Test alternative parameter names for min staff
    console.log('\n🧪 Testing alternative parameter names...')
    
    const alternativeRequests = [
      {
        name: "min_nurses_per_shift",
        params: { ...frontendRequest, "min_nurses_per_shift": 2 }
      },
      {
        name: "minimum_staff",
        params: { ...frontendRequest, "minimum_staff": 2 }
      },
      {
        name: "staff_constraint",
        params: { ...frontendRequest, "staff_constraint": { "minimum": 2 } }
      }
    ]
    
    for (const test of alternativeRequests) {
      console.log(`\nTesting ${test.name}...`)
      
      try {
        const altResponse = await fetch(`${API_URL}/optimize-schedule`, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.params)
        })
        
        if (altResponse.ok) {
          const altResult = await altResponse.json()
          
          // Quick compliance check
          const altShiftSlots = {}
          altResult.schedule?.forEach(shift => {
            const key = `${shift.date}_${shift.shift_type}`
            if (!altShiftSlots[key]) altShiftSlots[key] = []
            altShiftSlots[key].push(shift)
          })
          
          const altViolations = Object.values(altShiftSlots).filter(shifts => shifts.length < 2).length
          const altTotal = Object.keys(altShiftSlots).length
          const altCompliance = ((altTotal - altViolations) / altTotal * 100).toFixed(1)
          
          console.log(`  ✅ Accepted: ${altCompliance}% compliance`)
          
          if (altCompliance === "100.0") {
            console.log(`  🎉 ${test.name} parameter works perfectly!`)
          }
        } else {
          console.log(`  ❌ Rejected: ${altResponse.status}`)
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testFrontendFormat()
