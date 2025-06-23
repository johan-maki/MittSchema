import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateSalaryColumn() {
  console.log('🔧 Adding hourly_rate column to employees table...');
  
  try {
    // Step 1: Add the column with default value
    console.log('📝 Step 1: Adding hourly_rate column...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 1000.00;'
    });
    
    if (addColumnError) {
      console.error('❌ Error adding column:', addColumnError);
      // Try alternative approach for adding column
      console.log('🔄 Trying alternative approach...');
      
      // We'll use a workaround since we can't execute DDL directly
      // Instead, let's check if we can use SQL Editor or another method
      console.log('⚠️ Note: You may need to run this SQL manually in Supabase SQL Editor:');
      console.log('ALTER TABLE employees ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 1000.00;');
      console.log('UPDATE employees SET hourly_rate = 1000.00 WHERE hourly_rate IS NULL;');
      
      return;
    }
    
    console.log('✅ Column added successfully');
    
    // Step 2: Update existing records
    console.log('📝 Step 2: Updating existing employees...');
    const { error: updateError } = await supabase
      .from('employees')
      .update({ hourly_rate: 1000.00 })
      .is('hourly_rate', null);
    
    if (updateError) {
      console.error('❌ Error updating records:', updateError);
      return;
    }
    
    console.log('✅ Migration completed successfully');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const { data: employees, error: verifyError } = await supabase
      .from('employees')
      .select('first_name, last_name, hourly_rate')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError);
      return;
    }
    
    console.log('📊 Sample employees with hourly rates:');
    employees?.forEach(emp => {
      console.log(`  ${emp.first_name} ${emp.last_name}: ${emp.hourly_rate} SEK/hour`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateSalaryColumn();
