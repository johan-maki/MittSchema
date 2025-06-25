const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔧 Debugging Gurobi response structure')

async function debugGurobiStructure() {
  try {
    const scheduleRequest = {
      "start_date": "2025-07-01", 
      "end_date": "2025-07-07", // Just one week for simpler debugging
      "min_nurses_per_shift": 2,
      "max_hours_per_nurse": 40
    }
    
    console.log('\n⏳ Getting one week schedule...')
    
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleRequest)
    })
    
    if (!response.ok) {
      console.error('❌ Request failed:', response.status)
      return
    }
    
    const result = await response.json()
    
    console.log('\n📊 Response structure:')
    console.log('Keys:', Object.keys(result))
    
    console.log('\n📅 Schedule data (first 5 items):')
    if (result.schedule) {
      result.schedule.slice(0, 5).forEach((shift, i) => {
        console.log(`${i+1}. ${JSON.stringify(shift, null, 2)}`)
      })
      
      console.log(`\n... and ${result.schedule.length - 5} more shifts`)
      
      // Analyze shift patterns
      console.log('\n🔍 Shift type analysis:')
      const shiftTypes = {}
      const dates = {}
      
      result.schedule.forEach(shift => {
        // Count shift types
        const type = shift.shift_type
        shiftTypes[type] = (shiftTypes[type] || 0) + 1
        
        // Count dates
        const date = shift.date
        dates[date] = (dates[date] || 0) + 1
      })
      
      console.log('Shift types:', shiftTypes)
      console.log('Shifts per date:', dates)
      
      // Check minimum 2 nurses constraint
      console.log('\n🎯 Constraint check: Minimum 2 nurses per shift slot')
      
      // Group by date and shift type
      const shiftSlots = {}
      result.schedule.forEach(shift => {
        const key = `${shift.date}_${shift.shift_type}`
        if (!shiftSlots[key]) {
          shiftSlots[key] = []
        }
        shiftSlots[key].push(shift)
      })
      
      console.log('\nShift slot coverage:')
      let violations = 0
      Object.keys(shiftSlots).sort().forEach(key => {
        const shifts = shiftSlots[key]
        const count = shifts.length
        const status = count >= 2 ? '✅' : '❌'
        if (count < 2) violations++
        
        console.log(`${key.padEnd(20)}: ${count} nurses ${status}`)
      })
      
      console.log(`\nTotal violations: ${violations}`)
      console.log(`Compliance: ${violations === 0 ? 'PERFECT' : 'FAILED'}`)
      
    } else {
      console.log('❌ No schedule data found')
    }
    
    console.log('\n📈 Coverage stats:')
    console.log(JSON.stringify(result.coverage_stats, null, 2))
    
    console.log('\n⚖️  Fairness stats:')
    console.log(JSON.stringify(result.fairness_stats, null, 2))
    
    console.log('\n👥 Employee stats (first few):')
    if (result.employee_stats) {
      const empIds = Object.keys(result.employee_stats).slice(0, 3)
      empIds.forEach(id => {
        console.log(`${id}: ${JSON.stringify(result.employee_stats[id], null, 2)}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugGurobiStructure()
