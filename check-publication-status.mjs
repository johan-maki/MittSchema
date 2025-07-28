#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cmikgjuiwehnmgwgekxo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtaWtnanVpd2Vobm1nd2dla3hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODkxMjIyNiwiZXhwIjoyMDQ0NDg4MjI2fQ.Buz3SK7fIvz3nJrINjpFE2HNmADNzMcfqrLgIxIWHJM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublicationStatus() {
  console.log('🔍 Checking publication status of August 1st shifts...\n');
  
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      id,
      shift_type,
      start_time,
      end_time,
      is_published,
      employee_id,
      employees!shifts_employee_id_fkey (
        first_name,
        last_name
      )
    `)
    .gte('start_time', '2025-08-01T00:00:00.000Z')
    .lt('start_time', '2025-08-02T00:00:00.000Z')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${shifts?.length || 0} shifts on August 1st:\n`);

  shifts?.forEach((shift, i) => {
    const employee = shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unknown';
    const publishedStatus = shift.is_published ? '✅ PUBLISHED' : '❌ DRAFT (utkast)';
    
    console.log(`${i + 1}. ${shift.shift_type.toUpperCase()} SHIFT`);
    console.log(`   👤 Employee: ${employee}`);
    console.log(`   📋 Status: ${publishedStatus}`);
    console.log(`   🕐 Time: ${shift.start_time} → ${shift.end_time}`);
    console.log(`   🆔 ID: ${shift.id}`);
    console.log('');
  });

  // Summary by publication status
  const published = shifts?.filter(s => s.is_published) || [];
  const drafts = shifts?.filter(s => !s.is_published) || [];

  console.log('📊 PUBLICATION STATUS SUMMARY:');
  console.log(`   ✅ Published: ${published.length}`);
  console.log(`   ❌ Drafts: ${drafts.length}`);

  if (drafts.length > 0) {
    console.log('\n🚨 DRAFT SHIFTS (not visible in some views):');
    drafts.forEach(shift => {
      const employee = shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unknown';
      console.log(`   - ${shift.shift_type.toUpperCase()}: ${employee}`);
    });
  }
}

checkPublicationStatus().catch(console.error);
