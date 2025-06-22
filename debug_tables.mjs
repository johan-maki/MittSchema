#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
  console.log('🔍 Checking available tables...')
  
  // Try different table names
  const tablesToTry = ['profiles', 'employees', 'users', 'profile']
  
  for (const table of tablesToTry) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (!error) {
        console.log(`✅ Table '${table}' exists`)
        if (data && data.length > 0) {
          console.log(`   Sample record:`, Object.keys(data[0]))
        }
      }
    } catch (e) {
      console.log(`❌ Table '${table}' does not exist`)
    }
  }
}

listTables().catch(console.error)
