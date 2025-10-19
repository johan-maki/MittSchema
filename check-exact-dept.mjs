import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data: employees } = await supabase
  .from('employees')
  .select('department')
  .order('department');

const uniqueDepts = [...new Set(employees.map(e => e.department))];

console.log('UNIQUE DEPARTMENTS:');
uniqueDepts.forEach(dept => {
  console.log(`"${dept}" - Length: ${dept ? dept.length : 0} - Bytes: ${JSON.stringify(dept)}`);
});
