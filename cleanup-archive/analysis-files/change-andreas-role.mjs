#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kjgmsayrnrlwzixlozsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ21zYXlycmx3emlybG96c2ciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDI1NzE5MiwiZXhwIjoyMDQ5ODMzMTkyfQ.BEZVGvGfGNEyeBEIzRJr74Lp4FhONdqYu0NE4YiGEG0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function changeAndreasRole() {
  console.log('=== ÄNDRA ANDREAS ROLL I SUPABASE ===');
  
  try {
    // 1. Hitta Andreas nuvarande profil
    console.log('🔍 Söker efter Andreas...');
    const { data: andreas, error: findError } = await supabase
      .from('employees')
      .select('*')
      .ilike('name', '%andreas%')
      .single();
      
    if (findError) {
      console.error('❌ Kunde inte hitta Andreas:', findError);
      return;
    }
    
    console.log('👨‍⚕️ Hittade Andreas:');
    console.log(`   - Namn: ${andreas.name}`);
    console.log(`   - Nuvarande roll: ${andreas.role}`);
    console.log(`   - ID: ${andreas.id}`);
    
    // 2. Ändra roll från "Läkare" till "Sjuksköterska"
    console.log('\\n🔄 Ändrar roll från "Läkare" till "Sjuksköterska"...');
    
    const { data: updated, error: updateError } = await supabase
      .from('employees')
      .update({ role: 'Sjuksköterska' })
      .eq('id', andreas.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Kunde inte uppdatera Andreas roll:', updateError);
      return;
    }
    
    console.log('✅ Andreas roll uppdaterad!');
    console.log(`   - Ny roll: ${updated.role}`);
    
    console.log('\\n📋 NÄSTA STEG:');
    console.log('1. Gå till schemagenerering i appen');
    console.log('2. Klicka "Generera schema (nästa månad)"');
    console.log('3. Kontrollera om Andreas nu får pass');
    console.log('4. Om det fungerar = rolle-problemet bekräftat!');
    
    console.log('\\n🔄 ÅTERSTÄLL SENARE:');
    console.log('När testet är klart, kör följande för att återställa:');
    console.log(`node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('${supabaseUrl}', '${supabaseKey}');
supabase.from('employees').update({ role: 'Läkare' }).eq('id', '${andreas.id}').then(() => console.log('Andreas återställd till Läkare'));
"`);
    
  } catch (error) {
    console.error('❌ Oväntat fel:', error);
  }
}

changeAndreasRole();
