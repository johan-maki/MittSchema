// Uppdatera Andreas Lundquist från "Professor" till "Läkare"
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://guxwcmtpnmjkgzphlkdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1eHdjbXRwbm1qa2d6cGhsa2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU2MDUxNjMsImV4cCI6MjAzMTE4MTE2M30.n6Z7HLQOzwKXkJ7Dp7kd4fJZ3oZSqOacLOuFP9ib-4w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAndreasRole() {
    console.log('🔄 Updating Andreas Lundquist from Professor to Läkare...');
    
    try {
        // Leta efter Andreas baserat på namn
        const { data: employees, error: findError } = await supabase
            .from('employees')
            .select('*')
            .or('first_name.ilike.%andreas%,last_name.ilike.%lundquist%');
        
        if (findError) {
            console.error('❌ Error finding Andreas:', findError);
            return;
        }
        
        if (!employees || employees.length === 0) {
            console.log('❌ Andreas Lundquist not found in database');
            console.log('   Please add him through the frontend first');
            return;
        }
        
        const andreas = employees[0];
        console.log(`🎯 Found Andreas: ${andreas.first_name} ${andreas.last_name}`); 
        console.log(`   Current role: ${andreas.role}`);
        console.log(`   Experience level: ${andreas.experience_level}`);
        
        // Uppdatera hans roll till "Läkare"
        const { data: updatedAndreas, error: updateError } = await supabase
            .from('employees')
            .update({ 
                role: 'Läkare'
            })
            .eq('id', andreas.id)
            .select()
            .single();
        
        if (updateError) {
            console.error('❌ Error updating Andreas role:', updateError);
            return;
        }
        
        console.log('✅ Successfully updated Andreas role!');
        console.log(`   New role: ${updatedAndreas.role}`);
        console.log(`   Full record:`, JSON.stringify(updatedAndreas, null, 2));
        
        // Verifiera att ändringen fungerat
        console.log('\n🧪 Testing if Andreas now gets shifts...');
        console.log('   (Run: node test-andreas-as-doctor.mjs)');
        
    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

updateAndreasRole();
