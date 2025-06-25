#!/usr/bin/env node

const BACKEND_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function testCost() {
  try {
    console.log('🔍 Testing cost calculation...\n');
    
    const response = await fetch(`${BACKEND_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: '2025-07-01',
        end_date: '2025-07-03'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response received\n');
    
    // Check each shift for cost data
    console.log('🔍 Shift cost details:');
    data.schedule.slice(0, 5).forEach((shift, i) => {
      console.log(`  Shift ${i + 1}: ${shift.employee_name} - ${shift.shift_type}`);
      console.log(`    Hours: ${shift.hours}, Rate: ${shift.hourly_rate}, Cost: ${shift.cost}`);
    });
    
    // Calculate total cost manually
    const manualTotal = data.schedule.reduce((sum, shift) => sum + (shift.cost || 0), 0);
    console.log(`\n💰 Manual total cost: ${manualTotal} SEK`);
    console.log(`💰 API total_cost: ${data.total_cost || 'undefined'} SEK`);
    
    // Show all response keys
    console.log(`\n🔑 Response keys: ${Object.keys(data).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCost();
