// Verify database state after reset
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verifying database state after reset...\n');

// Check employees
const { data: employees, error: employeesError } = await supabase
  .from('employees')
  .select('*')
  .order('first_name');

if (employeesError) {
  console.error('Error fetching employees:', employeesError);
} else {
  console.log(`📊 Total employees: ${employees.length}`);
  console.log('\n👥 Employee details:');
  employees.forEach(emp => {
    console.log(`  ✓ ${emp.first_name} ${emp.last_name}`);
    console.log(`    Role: ${emp.role}`);
    console.log(`    Department: ${emp.department}`);
    console.log(`    Experience: ${emp.experience_level} år`);
    console.log(`    Phone: ${emp.phone}`);
    console.log('');
  });
}

// Check shifts
const { data: shifts, error: shiftsError } = await supabase
  .from('shifts')
  .select('*');

if (shiftsError) {
  console.error('Error fetching shifts:', shiftsError);
} else {
  console.log(`📅 Total shifts: ${shifts.length}`);
}

// Verify standardization
const allSameRole = employees.every(emp => emp.role === 'Sjuksköterska');
const allSameDepartment = employees.every(emp => emp.department === 'Akutmottagning');
const allSameExperience = employees.every(emp => emp.experience_level === 1);

console.log('\n✅ Standardization verification:');
console.log(`  Role uniformity: ${allSameRole ? '✓ All Sjuksköterska' : '✗ Mixed roles'}`);
console.log(`  Department uniformity: ${allSameDepartment ? '✓ All Akutmottagning' : '✗ Mixed departments'}`);
console.log(`  Experience uniformity: ${allSameExperience ? '✓ All 1 år' : '✗ Mixed experience levels'}`);

if (allSameRole && allSameDepartment && allSameExperience) {
  console.log('\n🎉 Perfect! Database is fully standardized and ready for Gurobi integration!');
} else {
  console.log('\n⚠️  Warning: Data standardization incomplete');
}
