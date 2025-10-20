#!/usr/bin/env node

console.log('🔍 Testar anslutning till Render-server...\n');

const RENDER_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function testRenderServer() {
  console.log(`📡 Testar: ${RENDER_URL}`);
  console.log('⏱️  Timeout: 30 sekunder\n');
  
  // Test 1: Root endpoint
  console.log('1️⃣ Testar root endpoint (/)...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${RENDER_URL}/`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Root endpoint svarar!');
      console.log('   Status:', data);
    } else {
      console.log(`❌ Root endpoint svarade med fel: ${response.status}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Timeout - servern svarar inte inom 30 sekunder');
      console.log('   Detta tyder på att Render-servern är i cold start eller nere');
    } else {
      console.log('❌ Fel vid anrop:', error.message);
    }
  }
  
  console.log('');
  
  // Test 2: Health endpoint
  console.log('2️⃣ Testar health endpoint (/health)...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${RENDER_URL}/health`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health endpoint svarar!');
      console.log('   Status:', data.status);
      console.log('   Database:', data.database);
      console.log('   Version:', data.version);
    } else {
      console.log(`❌ Health endpoint svarade med fel: ${response.status}`);
      const text = await response.text();
      console.log('   Error:', text);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Timeout - servern svarar inte inom 30 sekunder');
    } else {
      console.log('❌ Fel vid anrop:', error.message);
    }
  }
  
  console.log('\n📋 Sammanfattning:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Om servern inte svarar kan det bero på:');
  console.log('1. Render free tier - servern går i "sleep mode" efter inaktivitet');
  console.log('2. Cold start - första requesten tar 30-60 sekunder');
  console.log('3. Servern har kraschat och behöver redeployment');
  console.log('4. URL:en är felaktig');
  console.log('\n💡 Lösningar:');
  console.log('• Vänta 60 sekunder och försök igen');
  console.log('• Kontrollera Render dashboard för logs');
  console.log('• Redeploya manuellt från Render dashboard');
}

testRenderServer();
