const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔄 Testing updated frontend configuration with enhanced penalties')

async function testUpdatedFrontendConfig() {
  try {
    // Simulera samma request som frontend skulle skicka
    const frontendLikeRequest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-31", // Hela juli för bättre analys
      "department": "Akutmottagning",
      "random_seed": 123456,
      "optimizer": "gurobi",
      "min_staff_per_shift": 2, // Från frontend slider
      "minimum_staff": 2, // Backup parameter
      "staff_constraint": "strict", // Framtvinga compliance
      "min_experience_per_shift": 0,
      "include_weekends": true,
      "weekend_penalty_weight": 200, // Högre penalty för rättvis helgpassfördelning
      "fairness_weight": 0.8,
      "balance_workload": true,
      "max_hours_per_nurse": 40
    }
    
    console.log('📤 Sending request (like frontend would):')
    console.log(JSON.stringify(frontendLikeRequest, null, 2))
    
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frontendLikeRequest)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', response.status, errorText)
      return
    }
    
    const result = await response.json()
    console.log('\n📊 Results:')
    console.log('Status:', result.optimization_status)
    console.log('Total shift assignments:', result.schedule?.length || 0)
    
    if (result.schedule && result.schedule.length > 0) {
      // Analyze staffing compliance
      const shiftStaffing = {}
      result.schedule.forEach(shift => {
        const key = `${shift.date}_${shift.shift_type}`
        if (!shiftStaffing[key]) {
          shiftStaffing[key] = 0
        }
        shiftStaffing[key]++
      })
      
      const uniqueShifts = Object.keys(shiftStaffing).length
      const staffCounts = Object.values(shiftStaffing)
      const minStaff = Math.min(...staffCounts)
      const maxStaff = Math.max(...staffCounts)
      const avgStaff = staffCounts.reduce((a, b) => a + b, 0) / staffCounts.length
      
      console.log(`\n👥 Staffing Analysis (${uniqueShifts} unique shifts):`)
      console.log(`   Min staff per shift: ${minStaff}`)
      console.log(`   Max staff per shift: ${maxStaff}`)
      console.log(`   Avg staff per shift: ${avgStaff.toFixed(1)}`)
      
      if (minStaff >= 2) {
        console.log('   ✅ All shifts meet minimum 2 staff requirement')
      } else {
        console.log('   ❌ Some shifts below minimum 2 staff')
      }
      
      // Analyze weekend fairness
      console.log('\n🎯 Weekend Fairness Analysis:')
      const weekendShifts = result.schedule.filter(shift => shift.is_weekend)
      const employeeWeekendCount = {}
      const employeeNames = {}
      
      weekendShifts.forEach(shift => {
        const empId = shift.employee_id
        employeeWeekendCount[empId] = (employeeWeekendCount[empId] || 0) + 1
        employeeNames[empId] = shift.employee_name
      })
      
      const weekendCounts = Object.values(employeeWeekendCount)
      if (weekendCounts.length > 0) {
        const minWeekend = Math.min(...weekendCounts)
        const maxWeekend = Math.max(...weekendCounts)
        
        console.log(`   Weekend shifts range: ${minWeekend} - ${maxWeekend} per employee`)
        console.log(`   Weekend shift distribution:`)
        
        Object.entries(employeeWeekendCount).forEach(([empId, count]) => {
          const name = employeeNames[empId] || 'Unknown'
          console.log(`     ${name}: ${count} weekend shifts`)
        })
        
        if (maxWeekend - minWeekend <= 1) {
          console.log('   ✅ Very fair weekend distribution (max difference: 1)')
        } else if (maxWeekend - minWeekend <= 2) {
          console.log('   ⚠️  Good weekend distribution (max difference: 2)')
        } else {
          console.log('   ❌ Uneven weekend distribution (max difference: >2)')
        }
      }
      
      // Analyze total workload
      console.log('\n📈 Total Workload Analysis:')
      const employeeWorkload = {}
      
      result.schedule.forEach(shift => {
        const empId = shift.employee_id
        if (!employeeWorkload[empId]) {
          employeeWorkload[empId] = {
            name: shift.employee_name,
            shifts: 0,
            hours: 0
          }
        }
        employeeWorkload[empId].shifts++
        employeeWorkload[empId].hours += shift.hours || 8
      })
      
      const workloads = Object.values(employeeWorkload)
      const minShifts = Math.min(...workloads.map(w => w.shifts))
      const maxShifts = Math.max(...workloads.map(w => w.shifts))
      const avgShifts = workloads.reduce((sum, w) => sum + w.shifts, 0) / workloads.length
      
      console.log(`   Shifts per employee range: ${minShifts} - ${maxShifts}`)
      console.log(`   Average shifts per employee: ${avgShifts.toFixed(1)}`)
      
      if (maxShifts - minShifts <= 2) {
        console.log('   ✅ Well-balanced workload distribution')
      } else {
        console.log('   ⚠️  Some imbalance in workload distribution')
      }
      
    } else {
      console.log('❌ No schedule generated')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testUpdatedFrontendConfig()
