import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mhhmzxcpghtygxbxqjql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaG16eGNwZ2h0eWd4YnhxanFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MTM0MjAsImV4cCI6MjA1MTQ4OTQyMH0.nZL1ktMONvgfIKM7P-hNZZlX6vCHNWJuUFJgXSHbGNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugErikPreferences() {
    console.log('🔍 Debugging Erik Eriksson preferences...');
    
    // 1. Hämta Erik från databasen
    const { data: erikProfile, error: profileError } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('first_name', 'Erik')
        .eq('last_name', 'Eriksson')
        .single();
    
    if (profileError) {
        console.error('❌ Error fetching Erik profile:', profileError);
        return;
    }
    
    console.log('👤 Erik profile:', erikProfile);
    
    // 2. Hämta Eriks preferenser
    const { data: preferences, error: prefError } = await supabase
        .from('employee_preferences')
        .select('*')
        .eq('employee_id', erikProfile.id);
    
    if (prefError) {
        console.error('❌ Error fetching Erik preferences:', prefError);
        return;
    }
    
    console.log('⚙️ Erik preferences from DB:', preferences);
    
    // 3. Kontrollera work_preferences
    if (erikProfile.work_preferences) {
        console.log('💼 Erik work_preferences:', JSON.stringify(erikProfile.work_preferences, null, 2));
        
        if (erikProfile.work_preferences.available_days) {
            console.log('📅 Available days:', erikProfile.work_preferences.available_days);
            console.log('📅 Is Saturday (6) available?', erikProfile.work_preferences.available_days.includes(6));
            console.log('📅 Is Sunday (0) available?', erikProfile.work_preferences.available_days.includes(0));
        }
    }
    
    // 4. Hämta senaste genererade shifts för Erik
    const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', erikProfile.id)
        .gte('date', '2025-08-01')
        .lte('date', '2025-08-31')
        .order('date');
    
    if (shiftsError) {
        console.error('❌ Error fetching Erik shifts:', shiftsError);
        return;
    }
    
    console.log(`📊 Erik has ${shifts.length} shifts in August`);
    
    // Analysera helgpass
    const weekendShifts = shifts.filter(shift => {
        const date = new Date(shift.date);
        const dayOfWeek = date.getDay(); // 0 = söndag, 6 = lördag
        return dayOfWeek === 0 || dayOfWeek === 6;
    });
    
    console.log(`🎯 Erik weekend shifts: ${weekendShifts.length}`);
    weekendShifts.forEach(shift => {
        const date = new Date(shift.date);
        const dayName = date.getDay() === 0 ? 'Söndag' : 'Lördag';
        console.log(`   - ${dayName} ${shift.date}: ${shift.shift_type}`);
    });
}

debugErikPreferences().catch(console.error);
