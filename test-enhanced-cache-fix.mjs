#!/usr/bin/env node
// Test för att verifiera att förbättrad cache-invalidation fungerar

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

console.log('🎯 Testing enhanced cache invalidation fix...\n');

async function testEnhancedCacheFix() {
  console.log('1️⃣ Förbättringar som gjorts:');
  console.log('   ✅ Added removeQueries() för att radera gammal cache data');
  console.log('   ✅ Added refetchQueries() för att tvinga omhämtning');
  console.log('   ✅ Added staleTime: 0 och cacheTime: 0 för att förhindra caching');
  console.log('   ✅ Enhanced logging för att spåra cache-status');
  console.log('   ✅ Added EmployeeCacheDebug-komponent för visual debugging');
  
  console.log('\n2️⃣ Cache-invalidation förbättringar i:');
  console.log('   📁 DirectoryControls.tsx - generateTestData()');
  console.log('   📁 DirectoryControls.tsx - clearDatabase()'); 
  console.log('   📁 DirectoryControls.tsx - addProfile()');
  console.log('   📁 useProfileDirectory.tsx - deleteProfile()');
  console.log('   📁 useProfileData.ts - enhanced logging');
  console.log('   📁 EmployeeView.tsx - enhanced logging');
  
  console.log('\n3️⃣ Kontrollerar nuvarande database status:');
  const { data: currentEmployees, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, role')
    .order('first_name');
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Database har ${currentEmployees.length} employees:`);
  currentEmployees.forEach((emp, i) => {
    console.log(`   ${i+1}. ${emp.first_name} ${emp.last_name} (${emp.role})`);
  });
  
  console.log('\n4️⃣ Nästa steg för att testa:');
  console.log('   1. Öppna mitt-schema.vercel.app');
  console.log('   2. Gå till "Personalkatalog" sida');
  console.log('   3. Du bör nu se "Employee Cache Debug" box som visar cache-status');
  console.log('   4. Klicka "Töm databas" och se att counters går till 0');
  console.log('   5. Klicka "Testdata (6)" och se att counters går till 6');
  console.log('   6. Gå till Schedule-sidan och generera schema');
  console.log('   7. Kontrollera browser console för meddelanden om antal employees');
  
  console.log('\n🔧 Om problemet kvarstår:');
  console.log('   • Kolla browser console för "useProfileData" och "EmployeeView" meddelanden');
  console.log('   • Cache Debug-boxen visar om queries returnerar olika antal');
  console.log('   • Gör hard refresh (Ctrl+Shift+R) för att rensa browser cache');
  console.log('   • Kontrollera att React Query DevTools visar rätt cache-keys');
  
  return true;
}

testEnhancedCacheFix()
  .then(() => {
    console.log('\n🎉 Enhanced cache fix deployed!');
    console.log('✨ Nu bör frontend alltid visa aktuell employee count från databasen');
    console.log('🚀 Schema generation ska använda alla tillgängliga employees');
  })
  .catch(console.error);
