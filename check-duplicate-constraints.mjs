import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Checking for duplicate constraints in database...\n');

const { data, error } = await supabase
  .from('ai_constraints')
  .select('*')
  .eq('department', 'Akutmottagning')
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log(`Found ${data.length} total constraints:\n`);
  data.forEach((c, i) => {
    console.log(`${i + 1}. ID: ${c.id}`);
    console.log(`   Employee ID: ${c.employee_id}`);
    console.log(`   Type: ${c.constraint_type}`);
    console.log(`   Dates: ${c.dates?.join(', ')}`);
    console.log(`   Original: "${c.original_text}"`);
    console.log(`   Created: ${c.created_at}`);
    console.log('');
  });
  
  // Check for potential duplicates
  const textGroups = {};
  data.forEach(c => {
    const key = c.original_text;
    if (!textGroups[key]) textGroups[key] = [];
    textGroups[key].push(c);
  });
  
  console.log('\n📊 Grouping by original_text:');
  Object.entries(textGroups).forEach(([text, constraints]) => {
    if (constraints.length > 1) {
      console.log(`\n⚠️ DUPLICATE: "${text}" appears ${constraints.length} times`);
      constraints.forEach(c => {
        console.log(`   - ID: ${c.id}, Created: ${c.created_at}`);
      });
    }
  });
}
