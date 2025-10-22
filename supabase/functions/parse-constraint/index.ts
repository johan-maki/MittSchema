import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to expand date range into array of dates
function expandDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, organization_id } = await req.json()
    
    if (!text) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No text provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('📝 Parsing constraint:', text)
    console.log('🏢 Organization ID:', organization_id)

    // 🎯 STEP 1: Load employees from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    let employeeQuery = supabase
      .from('employees')
      .select('id, name, full_name')
    
    if (organization_id) {
      employeeQuery = employeeQuery.eq('organization_id', organization_id)
    }
    
    const { data: employees, error: employeeError } = await employeeQuery
    
    if (employeeError) {
      console.error('❌ Error loading employees:', employeeError)
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to load employees from database'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`✅ Loaded ${employees?.length || 0} employees`)

    // 🎯 STEP 2: Prepare employee list for ChatGPT
    const employeeList = employees?.map(e => 
      `- ${e.name || e.full_name} (ID: ${e.id})`
    ).join('\n') || 'No employees found'

    // 🎯 STEP 3: Get current date dynamically
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    const todayReadable = today.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    // 🎯 STEP 4: Call OpenAI with Gurobi-ready system prompt
    const systemPrompt = `You are a scheduling constraint parser for Swedish healthcare. Output constraints in Gurobi-ready format.

**CURRENT DATE:** ${todayString} (${todayReadable})
**CURRENT YEAR:** ${today.getFullYear()}

**AVAILABLE EMPLOYEES:**
${employeeList}

**OUTPUT FORMAT (Gurobi-Ready):**
{
  "employee_id": "uuid-from-list-above",
  "start_date": "2025-12-20",
  "end_date": "2025-12-27",
  "shifts": [],
  "constraint_type": "hard_unavailable",
  "priority": 1000,
  "original_text": "user's input",
  "natural_language": "✅ Klart! <employee>Name</employee>..."
}

**RULES:**
1. Match employee name to ID from the list above (fuzzy match OK)
2. Use dates relative to ${todayString}
3. shifts: [] = all shifts, or ["dag"], ["kväll"], ["natt"], or combinations
4. Constraint types:
   - "hard_unavailable" = cannot work (ledig, inte, kan inte)
   - "soft_preference" = prefers not to (vill inte, föredrar inte)  
   - "hard_required" = must work (måste, ska)
5. Priority: 1000 = must respect, 500 = strong preference, 100 = nice to have
6. natural_language: User-friendly Swedish confirmation with <employee>, <date>, <constraint> tags

**EXAMPLES:**

Input: "Erik är ledig 20-27 december"
Output:
{
  "employee_id": "find-erik-id-from-list",
  "start_date": "${today.getFullYear()}-12-20",
  "end_date": "${today.getFullYear()}-12-27",
  "shifts": [],
  "constraint_type": "hard_unavailable",
  "priority": 1000,
  "original_text": "Erik är ledig 20-27 december",
  "natural_language": "✅ Klart! <employee>Erik</employee> är <constraint>ledig</constraint> från <date>20 december</date> till <date>27 december</date>. Detta är en <priority>obligatorisk</priority> begränsning."
}

Input: "Anna vill inte jobba natt 15 november"
Output:
{
  "employee_id": "find-anna-id-from-list",
  "start_date": "${today.getFullYear()}-11-15",
  "end_date": "${today.getFullYear()}-11-15",
  "shifts": ["natt"],
  "constraint_type": "hard_unavailable",
  "priority": 1000,
  "original_text": "Anna vill inte jobba natt 15 november",
  "natural_language": "✅ Noterat! <employee>Anna</employee> <constraint>kan inte jobba nattskift</constraint> den <date>15 november</date>."
}

If employee not found in list, return error:
{
  "error": "employee_not_found",
  "message": "Kunde inte hitta medarbetare",
  "available_employees": [list of names]
}

Return ONLY valid JSON.`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await openaiResponse.json()
    const parsed = JSON.parse(data.choices[0]?.message?.content || '{}')
    
    // 🎯 STEP 5: Check for errors
    if (parsed.error === 'employee_not_found') {
      return new Response(JSON.stringify({
        success: false,
        mode: 'clarify',
        question: parsed.message,
        options: employees?.slice(0, 5).map(e => ({
          label: e.full_name || e.name,
          value: e.id
        })) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 🎯 STEP 6: Validate employee_id exists
    const employeeExists = employees?.find(e => e.id === parsed.employee_id)
    if (!employeeExists) {
      return new Response(JSON.stringify({
        success: false,
        mode: 'clarify',
        question: `❓ Kunde inte hitta medarbetare. Vem menar du?`,
        options: employees?.slice(0, 5).map(e => ({
          label: e.full_name || e.name,
          value: e.id
        })) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 🎯 STEP 7: Expand date range into array
    const dates = expandDateRange(parsed.start_date, parsed.end_date)
    
    // 🎯 STEP 8: Return Gurobi-ready constraint
    const gurobiConstraint = {
      employee_id: parsed.employee_id,
      dates: dates,  // ← Array of all dates!
      shifts: parsed.shifts || [],
      constraint_type: parsed.constraint_type,
      priority: parsed.priority,
      original_text: parsed.original_text,
      natural_language: parsed.natural_language
    }
    
    console.log('✅ Parsed to Gurobi format:', gurobiConstraint)

    return new Response(JSON.stringify({
      success: true,
      mode: 'parse',
      constraint: gurobiConstraint,
      natural_language: parsed.natural_language
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    return new Response(JSON.stringify({
      success: false,
      message: `Failed to parse constraint: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
