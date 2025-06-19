// Check current database state and trigger reset
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking current database state...\n');

// Check current employees
const { data: currentEmployees, error: employeesError } = await supabase
  .from('employees')
  .select('*');

if (employeesError) {
  console.error('Error fetching employees:', employeesError);
} else {
  console.log(`📊 Current employees in database: ${currentEmployees.length}`);
  currentEmployees.forEach(emp => {
    console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.role}, ${emp.department}, ${emp.experience_level} år)`);
  });
}

// Check current shifts
const { data: currentShifts, error: shiftsError } = await supabase
  .from('shifts')
  .select('*');

if (shiftsError) {
  console.error('Error fetching shifts:', shiftsError);
} else {
  console.log(`\n📅 Current shifts in database: ${currentShifts.length}`);
}

console.log('\n🗑️ Starting database reset...\n');

// Clear existing data - DELETE SHIFTS FIRST due to foreign key constraints
console.log('🧹 Clearing existing shifts...');
const { error: deleteShiftsError } = await supabase
  .from('shifts')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000');

if (deleteShiftsError) {
  console.error('Error deleting shifts:', deleteShiftsError);
  process.exit(1);
}

console.log('🧹 Clearing existing employees...');
const { error: deleteEmployeesError } = await supabase
  .from('employees')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000');

if (deleteEmployeesError) {
  console.error('Error deleting employees:', deleteEmployeesError);
  process.exit(1);
}

// Insert simplified employee data
console.log('👥 Inserting simplified employees...');
const simplifiedEmployees = [
  {
    id: uuidv4(),
    first_name: 'Erik',
    last_name: 'Eriksson',
    role: 'Sjuksköterska',
    department: 'Akutmottagning',
    experience_level: 1,
    phone: '+46 70 234 5678'
  },
  {
    id: uuidv4(),
    first_name: 'Maria',
    last_name: 'Johansson',
    role: 'Sjuksköterska',
    department: 'Akutmottagning',
    experience_level: 1,
    phone: '+46 70 345 6789'
  },
  {
    id: uuidv4(),
    first_name: 'Lars', 
    last_name: 'Larsson',
    role: 'Sjuksköterska',
    department: 'Akutmottagning',
    experience_level: 1,
    phone: '+46 70 456 7890'
  },
  {
    id: uuidv4(),
    first_name: 'Karin',
    last_name: 'Karlsson',
    role: 'Sjuksköterska',
    department: 'Akutmottagning',
    experience_level: 1,
    phone: '+46 70 567 8901'
  },
  {
    id: uuidv4(),
    first_name: 'Anna',
    last_name: 'Andersson',
    role: 'Sjuksköterska',
    department: 'Akutmottagning',
    experience_level: 1,
    phone: '+46 70 123 4567'
  },
  {
    id: uuidv4(),
    first_name: 'David',
    last_name: 'Davidsson',
    role: 'Sjuksköterska',
    department: 'Akutmottagning',
    experience_level: 1,
    phone: '+46 70 678 9012'
  }
];

const { data: insertedEmployees, error: insertError } = await supabase
  .from('employees')
  .insert(simplifiedEmployees)
  .select();

if (insertError) {
  console.error('Error inserting employees:', insertError);
  process.exit(1);
}

console.log('✅ Database reset complete!');
console.log(`📊 Inserted ${insertedEmployees?.length || 0} simplified employees:`);
insertedEmployees?.forEach(emp => {
  console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.role}, ${emp.department}, ${emp.experience_level} år)`);
});

console.log('\n🎉 All employees now have standardized data:');
console.log('  - Role: Sjuksköterska');
console.log('  - Department: Akutmottagning');
console.log('  - Experience Level: 1 år');
console.log('\n✨ The database is now ready for Gurobi integration!');
