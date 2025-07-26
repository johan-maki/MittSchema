import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('Checking available tables...\n');
    
    // Try different possible table names
    const possibleTables = ['profiles', 'employees', 'users', 'staff'];
    
    for (const tableName of possibleTables) {
      console.log(`Trying table: ${tableName}`);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`✅ Found table: ${tableName}`);
          console.log(`   Sample data:`, data);
          
          // Get all records to find Erik
          const { data: allRecords, error: allError } = await supabase
            .from(tableName)
            .select('*');
            
          if (!allError && allRecords) {
            console.log(`\nAll records in ${tableName}:`);
            allRecords.forEach((record, index) => {
              console.log(`  ${index + 1}. `, record);
            });
          }
        } else {
          console.log(`❌ Error with table ${tableName}:`, error.message);
        }
        console.log('');
      } catch (e) {
        console.log(`❌ Exception with table ${tableName}:`, e.message);
        console.log('');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
