#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data: employees } = await supabase
  .from('employees')
  .select('first_name, last_name, role, department')
  .order('first_name');

console.log('EMPLOYEES:\n');
let withDept = 0;
employees.forEach(e => {
  if (e.department) withDept++;
  console.log(`${e.first_name} ${e.last_name} - Role: ${e.role} - Dept: ${e.department || 'NULL'}`);
});

console.log(`\nWith dept: ${withDept}/${employees.length}\n`);

const { data: shifts } = await supabase
  .from('shifts')
  .select('id, profiles:employees!shifts_employee_id_fkey(first_name, last_name, department)')
  .limit(5);

console.log('SHIFTS:\n');
shifts.forEach(s => {
  console.log(`Shift - Employee: ${s.profiles?.first_name} ${s.profiles?.last_name} - Dept: ${s.profiles?.department || 'NULL'}`);
});
