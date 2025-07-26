// Simple test of improved constraint logic
console.log('🔍 Testing improved constraint handling for Andreas...');

// Andreas work preferences (from previous debug)
const workPrefs = {
  "max_shifts_per_week": 5,
  "day_constraints": {
    "monday": { "available": true, "strict": false },
    "tuesday": { "available": true, "strict": false },
    "wednesday": { "available": true, "strict": false },
    "thursday": { "available": true, "strict": false },
    "friday": { "available": true, "strict": false },
    "saturday": { "available": true, "strict": false },
    "sunday": { "available": true, "strict": false }
  },
  "shift_constraints": {
    "day": { "preferred": true, "strict": false },
    "evening": { "preferred": true, "strict": false },
    "night": { "preferred": false, "strict": true }
  }
};

console.log('📋 Andreas work preferences:');
console.log(JSON.stringify(workPrefs, null, 2));

// Old logic (problematic)
const oldAvailableDaysStrict = Object.values(workPrefs.day_constraints).some(c => c.strict);
const oldPreferredShiftsStrict = Object.values(workPrefs.shift_constraints).some(c => c.strict);

console.log('\n❌ OLD LOGIC (problematic):');
console.log('  available_days_strict:', oldAvailableDaysStrict);
console.log('  preferred_shifts_strict:', oldPreferredShiftsStrict);
console.log('  → Andreas excluded entirely because preferred_shifts_strict = true');

// NEW improved logic
const availableDays = Object.entries(workPrefs.day_constraints)
  .filter(([_, constraint]) => constraint.available)
  .map(([day, _]) => day);
  
const preferredShifts = Object.entries(workPrefs.shift_constraints)
  .filter(([_, constraint]) => constraint.preferred)
  .map(([shift, _]) => shift);

// NEW: Identify specific strict exclusions
const strictlyUnavailableDays = Object.entries(workPrefs.day_constraints)
  .filter(([_, constraint]) => constraint.strict && !constraint.available)
  .map(([day, _]) => day);
  
const strictlyExcludedShifts = Object.entries(workPrefs.shift_constraints)
  .filter(([_, constraint]) => constraint.strict && !constraint.preferred)
  .map(([shift, _]) => shift);

console.log('\n✅ NEW LOGIC (improved):');
console.log('  Available days:', availableDays);
console.log('  Preferred shifts:', preferredShifts);
console.log('  Strictly unavailable days:', strictlyUnavailableDays);
console.log('  Strictly excluded shifts:', strictlyExcludedShifts);

// NEW: Apply exclusions
const effectiveAvailableDays = availableDays.filter(day => 
  !strictlyUnavailableDays.includes(day)
);

const effectivePreferredShifts = preferredShifts.filter(shift => 
  !strictlyExcludedShifts.includes(shift)
);

const improvedGurobiPreference = {
  employee_id: 'andreas-id',
  preferred_shifts: effectivePreferredShifts.length > 0 ? effectivePreferredShifts : ["day", "evening"],
  max_shifts_per_week: workPrefs.max_shifts_per_week || 5,
  available_days: effectiveAvailableDays.length > 0 ? effectiveAvailableDays : ["monday", "tuesday", "wednesday", "thursday", "friday"],
  excluded_shifts: strictlyExcludedShifts,
  excluded_days: strictlyUnavailableDays,
  available_days_strict: strictlyUnavailableDays.length > 0,
  preferred_shifts_strict: strictlyExcludedShifts.length > 0,
  role: 'nurse',
  experience_level: 1
};

console.log('\n🚀 FINAL Gurobi preferences (improved):');
console.log(JSON.stringify(improvedGurobiPreference, null, 2));

console.log('\n💡 Key improvements:');
console.log('✅ excluded_shifts: ["night"] - explicitly tells Gurobi to avoid night shifts');
console.log('✅ preferred_shifts: ["day", "evening"] - Andreas can get these');
console.log('✅ available_days: all days - Andreas can work any day');
console.log('✅ excluded_days: [] - no day restrictions');
console.log('✅ Specific exclusions instead of generic "strict" flags');

console.log('\n🎯 This solves Andreas\' problem because:');
console.log('  OLD: preferred_shifts_strict=true → Andreas excluded entirely');
console.log('  NEW: excluded_shifts=["night"] → Andreas can work day/evening shifts');
