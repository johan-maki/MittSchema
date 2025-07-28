#!/usr/bin/env node

/**
 * Reset Supabase for Experience Points System (1-5)
 * 
 * Detta script:
 * 1. Rensar all utvecklingsdata
 * 2. Uppdaterar constraints för 1-5 skalan
 * 3. Redo för nytt data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 Set it in your .env file or run with: SUPABASE_SERVICE_ROLE_KEY=your_key node reset-supabase-for-experience-points.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetSupabaseForExperiencePoints() {
  console.log('🔄 Resettar Supabase för erfarenhetspoäng-systemet (1-5)...\n');

  try {
    // 1. Rensa all utvecklingsdata
    console.log('🗑️  Rensar utvecklingsdata...');
    
    // Rensa shifts först (foreign key dependencies)
    const { error: shiftsError } = await supabase
      .from('shifts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (shiftsError) {
      console.log('ℹ️  Inga shifts att rensa eller fel:', shiftsError.message);
    } else {
      console.log('✅ Shifts rensade');
    }

    // Rensa employee_preferences
    const { error: preferencesError } = await supabase
      .from('employee_preferences')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (preferencesError) {
      console.log('ℹ️  Inga preferences att rensa eller fel:', preferencesError.message);
    } else {
      console.log('✅ Employee preferences rensade');
    }

    // Rensa employees
    const { error: employeesError } = await supabase
      .from('employees')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (employeesError) {
      console.log('ℹ️  Inga employees att rensa eller fel:', employeesError.message);
    } else {
      console.log('✅ Employees rensade');
    }

    console.log('\n📋 Nu behöver du köra detta SQL i Supabase SQL Editor:');
    console.log('─'.repeat(60));
    console.log(`
-- Ta bort gamla constraints
ALTER TABLE employees DROP CONSTRAINT IF EXISTS chk_experience_level;  
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_experience_level_check;

-- Lägg till ny constraint för 1-5 skalan
ALTER TABLE employees 
ADD CONSTRAINT chk_experience_level 
CHECK (experience_level >= 1 AND experience_level <= 5);
`);
    console.log('─'.repeat(60));
    console.log('\n✨ Efter att du kört SQL:en ovan är systemet redo för erfarenhetspoäng 1-5!');
    console.log('\n🎯 Du kan nu:');
    console.log('   • Lägga till medarbetare via frontend (kommer automatiskt använda 1-5 skalan)');
    console.log('   • Generera testdata med de nya knapparna (3, 5, 6, 10, 20 medarbetare)');
    console.log('   • Köra schemagenereringen med det nya systemet');

  } catch (error) {
    console.error('❌ Fel vid reset:', error);
    process.exit(1);
  }
}

// Kör reset
resetSupabaseForExperiencePoints();
