#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qfkxlpjgypqgtqaaxvjg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma3hscGpneXBxZ3RxYWF4dmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MTY0MTMsImV4cCI6MjA0Njk5MjQxM30.4uTU7ePrP5oWdfQcyLY6eNdUzWgJLp2EW_cCVvDQ5FI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSaraUpdate() {
  console.log('🔍 Testing Sara work_percentage update...')
  
  try {
    // Find Sara first
    console.log('1. Finding Sara...')
    const { data: sara, error: findError } = await supabase
      .from('employees')
      .select('*')
      .ilike('first_name', '%sara%')
      .single()
    
    if (findError) {
      console.error('❌ Error finding Sara:', findError)
      return
    }
    
    console.log('✅ Found Sara:', {
      id: sara.id,
      name: `${sara.first_name} ${sara.last_name}`,
      current_work_percentage: sara.work_percentage
    })
    
    // Test update to 20%
    console.log('\n2. Updating Sara to 20% work percentage...')
    const { data: updateData, error: updateError } = await supabase
      .from('employees')
      .update({
        work_percentage: 20
      })
      .eq('id', sara.id)
      .select()
    
    if (updateError) {
      console.error('❌ Error updating Sara:', updateError)
      return
    }
    
    console.log('✅ Update response:', updateData)
    
    // Verify update
    console.log('\n3. Verifying update...')
    const { data: verification, error: verifyError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', sara.id)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      return
    }
    
    console.log('✅ Verification result:', {
      id: verification.id,
      name: `${verification.first_name} ${verification.last_name}`,
      work_percentage: verification.work_percentage
    })
    
    if (verification.work_percentage === 20) {
      console.log('🎉 SUCCESS: Sara work_percentage successfully updated to 20%!')
    } else {
      console.log('❌ FAIL: work_percentage not updated correctly')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testSaraUpdate()
