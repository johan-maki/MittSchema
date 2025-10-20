#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ladda environment-variabler
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Saknar Supabase konfiguration i .env filen');
  console.error('Behöver: VITE_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Skapa admin client med service role
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('🔄 Skapar testkonto...');
  
  const email = 'Test@hoppla.se';
  const password = 'Password123!';
  
  try {
    // Försök att skapa användaren direkt
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Bekräfta email automatiskt
      user_metadata: {
        name: 'Test User'
      }
    });

    if (error) {
      // Kontrollera om användaren redan existerar
      if (error.message.includes('User already registered') || error.message.includes('already registered')) {
        console.log('⚠️  Användaren existerar redan:', email);
        console.log('🔐 Du kan logga in med lösenordet: Password123!');
        return true;
      }
      
      console.error('❌ Fel vid skapande av användare:', error.message);
      return null;
    }

    if (data.user) {
      console.log('✅ Testkonto skapat framgångsrikt!');
      console.log('📧 Email:', data.user.email);
      console.log('🆔 User ID:', data.user.id);
      console.log('🔐 Lösenord: Password123!');
      console.log('');
      console.log('🎯 Du kan nu logga in med:');
      console.log('   Email: Test@hoppla.se');
      console.log('   Lösenord: Password123!');
      
      return data.user;
    }
    
  } catch (error) {
    console.error('❌ Oväntat fel:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Startar skapande av testkonto...');
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('');
  
  const user = await createTestUser();
  
  if (user) {
    console.log('');
    console.log('✨ Klart! Testkontot är nu redo att användas.');
  } else {
    console.log('');
    console.log('❌ Kunde inte skapa testkonto.');
    process.exit(1);
  }
}

main();