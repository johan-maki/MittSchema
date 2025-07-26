#!/usr/bin/env node

// Debug script to test what dates are sent to Gurobi API
// Using built-in fetch (available in Node.js 18+)

const GUROBI_API_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function testDateGeneration() {
  console.log('🧪 Testing Gurobi API date generation...\n');
  
  // Test different month scenarios
  const testCases = [
    {
      name: 'Juni 2025 (30 dagar)',
      startDate: '2025-06-01T00:00:00.000Z',
      endDate: '2025-06-30T23:59:59.999Z'
    },
    {
      name: 'Juli 2025 (31 dagar)', 
      startDate: '2025-07-01T00:00:00.000Z',
      endDate: '2025-07-31T23:59:59.999Z'
    },
    {
      name: 'Augusti 2025 (31 dagar)',
      startDate: '2025-08-01T00:00:00.000Z', 
      endDate: '2025-08-31T23:59:59.999Z'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📅 Testing ${testCase.name}:`);
    console.log(`   Start: ${testCase.startDate}`);
    console.log(`   End: ${testCase.endDate}`);
    
    try {
      const response = await fetch(`${GUROBI_API_URL}/optimize-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: testCase.startDate,
          end_date: testCase.endDate,
          department: 'Akutmottagning',
          min_staff_per_shift: 2,
          min_experience_per_shift: 1,
          include_weekends: true,
          random_seed: 12345
        })
      });
      
      if (!response.ok) {
        console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.schedule && data.schedule.length > 0) {
        console.log(`   ✅ Generated ${data.schedule.length} shifts`);
        
        // Analyze first and last dates
        const dates = [...new Set(data.schedule.map(s => s.date))].sort();
        console.log(`   📊 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
        console.log(`   📊 Total unique dates: ${dates.length}`);
        
        // Check for missing dates at boundaries
        const firstDate = new Date(testCase.startDate.split('T')[0]);
        const lastDate = new Date(testCase.endDate.split('T')[0]);
        const expectedDays = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
        
        if (dates.length !== expectedDays) {
          console.log(`   ⚠️  Expected ${expectedDays} days, got ${dates.length} days`);
          
          // Find missing dates
          const allExpectedDates = [];
          for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
            allExpectedDates.push(d.toISOString().split('T')[0]);
          }
          
          const missingDates = allExpectedDates.filter(date => !dates.includes(date));
          if (missingDates.length > 0) {
            console.log(`   ❌ Missing dates: ${missingDates.join(', ')}`);
          }
        }
        
      } else {
        console.log(`   ❌ No schedule generated`);
        console.log(`   ❌ Response:`, data.message || 'No message');
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
  }
}

testDateGeneration().catch(console.error);
