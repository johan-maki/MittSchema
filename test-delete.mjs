import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Testing deletion...');

const { data: before } = await supabase
  .from('ai_constraints')
  .select('id, original_text')
  .eq('department', 'Akutmottagning')
  .limit(1);

console.log('Before:', before);

if (before && before.length > 0) {
  const { error } = await supabase
    .from('ai_constraints')
    .delete()
    .eq('id', before[0].id);
  
  console.log('Delete error:', error);
  
  const { data: after } = await supabase
    .from('ai_constraints')
    .select('id')
    .eq('id', before[0].id);
  
  console.log('After (should be empty):', after);
}
