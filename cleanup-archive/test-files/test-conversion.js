// Test the convertWorkPreferences function with Erik's mixed data
const { convertWorkPreferences } = require('./src/types/profile.ts');

// Erik's actual data (mixed format)
const erikData = {
  "test_timestamp": "2025-07-26T13:23:48.785Z",
  "day_constraints": {
    "friday": {
      "strict": false,
      "available": true
    },
    "monday": {
      "strict": false,
      "available": true
    },
    "sunday": {
      "day": false,
      "night": false,
      "evening": false
    },
    "tuesday": {
      "strict": false,
      "available": true
    },
    "saturday": {
      "day": false,
      "night": false,
      "evening": false
    },
    "thursday": {
      "strict": false,
      "available": true
    },
    "wednesday": {
      "strict": false,
      "available": true
    }
  },
  "shift_constraints": {
    "day": {
      "strict": false,
      "preferred": true
    },
    "night": {
      "strict": false,
      "preferred": true
    },
    "evening": {
      "strict": false,
      "preferred": true
    }
  },
  "max_shifts_per_week": 5
};

console.log('Testing conversion of Erik\'s mixed format data...\n');

try {
  const converted = convertWorkPreferences(erikData);
  console.log('✅ Conversion successful!');
  console.log('\nConverted day constraints:');
  Object.entries(converted.day_constraints).forEach(([day, constraint]) => {
    console.log(`  ${day}: available=${constraint.available}, strict=${constraint.strict}`);
  });
  
  console.log('\nWeekend check:');
  console.log(`Saturday available: ${converted.day_constraints.saturday.available} (should be false)`);
  console.log(`Sunday available: ${converted.day_constraints.sunday.available} (should be false)`);
  
  if (!converted.day_constraints.saturday.available && !converted.day_constraints.sunday.available) {
    console.log('\n🎉 SUCCESS: Erik should NOT get weekend shifts!');
  } else {
    console.log('\n❌ PROBLEM: Erik might still get weekend shifts');
  }
  
} catch (error) {
  console.error('❌ Conversion failed:', error);
}
