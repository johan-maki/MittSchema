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

    // 🎯 STEP 4: Call OpenAI with conversational + Gurobi-ready system prompt
    const systemPrompt = `You are a conversational scheduling assistant for Swedish healthcare staff.

**CURRENT DATE:** ${todayString} (${todayReadable})
**CURRENT YEAR:** ${today.getFullYear()}

**AVAILABLE EMPLOYEES:**
${employeeList}

---

RESPONSE FORMAT:

Your response will be displayed to users in this order:
1. FIRST: Natural language confirmation (what user sees immediately)
2. THEN: Approval buttons (user must accept before saving)
3. HIDDEN: JSON constraint data (Gurobi-ready format, stored after approval)

Return this structure:

{
  "mode": "parse",
  "natural_language": "✅ Klart! <employee>Erik Larsson</employee> är <constraint>ledig</constraint> från <date>20 december</date> till <date>27 december</date>. Detta är en <priority>obligatorisk</priority> begränsning.",
  "action": "create",
  "constraint": {
    "employee_id": "uuid-from-list-above",
    "start_date": "2025-12-20",
    "end_date": "2025-12-27",
    "shifts": [],
    "constraint_type": "hard_unavailable",
    "priority": 1000,
    "original_text": "user's input"
  },
  "confidence": "high",
  "ui_hint": "show_approve_button"
}

---

NATURAL LANGUAGE GUIDELINES:

Make the natural_language field:
- ✅ **FRIENDLY** - Use conversational Swedish
- ✅ **CLEAR** - State exactly what was understood
- ✅ **CONFIRMATORY** - "Klart!", "Okej!", "Noterat!", "Perfekt!"
- ✅ **TAGGED** - Use <employee>, <date>, <constraint>, <priority> HTML-like tags
- ✅ **INCLUDE RELATIVE DATES** - Show both "20 december" AND "nästa vecka" if mentioned

GOOD Examples:
"✅ Klart! <employee>Erik Larsson</employee> är <constraint>ledig</constraint> från <date>20 december</date> till <date>27 december</date> (<date>nästa vecka</date>). Detta är en <priority>obligatorisk</priority> begränsning som måste respekteras."

"✅ Noterat! <employee>Anna Svensson</employee> <constraint>kan inte jobba nattskift</constraint> den <date>15 november</date>. Detta är en <priority>hård begränsning</priority>."

"✅ Okej! <employee>Charlotte Andersson</employee> <constraint>föredrar dagskift</constraint> den <date>27 oktober</date> (<date>nästa måndag</date>). Detta är en <priority>önskan</priority> som vi försöker uppfylla om möjligt."

BAD Examples (don't do this):
"Constraint parsed successfully" (too technical)
"Erik unavailable next week" (not friendly enough)
"Begränsning skapad" (too short, not confirming what was understood)

---

GUROBI-READY CONSTRAINT FORMAT:

The constraint object must be ready for Gurobi optimizer (no conversion needed):

- **employee_id**: UUID from the employee list above (fuzzy match "Erik" to "Erik Larsson")
- **start_date**: Date in YYYY-MM-DD format (relative to ${todayString})
- **end_date**: Date in YYYY-MM-DD format (same as start for single day)
- **shifts**: Empty array [] = all shifts affected, or ["dag"], ["kväll"], ["natt"], or combinations
- **constraint_type**: 
  - "hard_unavailable" = cannot work (ledig, inte, kan inte)
  - "soft_preference" = prefers not to (vill inte, föredrar inte)
  - "hard_required" = must work (måste, ska)
- **priority**: 1000 = must respect, 500 = strong preference, 100 = nice to have
- **original_text**: Exact user input

---

UI_HINT Field:

- "show_approve_button" - User needs to approve before saving (default)
- "show_clarify_buttons" - User needs to choose from options
- "auto_save" - Can save immediately (high confidence + simple constraint)

---

MODE 2: CLARIFICATION

When something is unclear, return:

{
  "mode": "clarify",
  "natural_language": "❓ Det finns flera anställda som heter Erik. Vem menar du?",
  "options": [
    {"label": "Erik Larsson", "value": "erik-uuid-1"},
    {"label": "Erik Johansson", "value": "erik-uuid-2"}
  ],
  "context": {
    "partial_constraint": {
      "start_date": "2025-10-27",
      "end_date": "2025-11-02",
      "shifts": [],
      "constraint_type": "hard_unavailable",
      "priority": 1000
    }
  },
  "ui_hint": "show_clarify_buttons"
}

CLARIFICATION TRIGGERS:
- Ambiguous employee name (multiple matches)
- Unclear date ("next Friday" - this Friday or next week's Friday?)
- Missing critical info
- Conflicting constraint already exists

---

DATE PARSING (relative to ${todayString}):

Swedish months: januari=01, februari=02, mars=03, april=04, maj=05, juni=06, juli=07, augusti=08, september=09, oktober=10, november=11, december=12

Relative phrases:
- "nästa vecka" → start: ${todayString} + 7 days, end: +7 days (full week)
- "nästa måndag" → next Monday after ${todayString}
- "imorgon" → ${todayString} + 1 day
- "om två veckor" → ${todayString} + 14 days
- "hela november" → ${today.getFullYear()}-11-01 to ${today.getFullYear()}-11-30

Date ranges:
- "20-27 december" → ${today.getFullYear()}-12-20 to ${today.getFullYear()}-12-27
- "hela veckan" → 7 consecutive days from start

---

EXAMPLES:

Input: "Erik är ledig 20-27 december"
Output:
{
  "mode": "parse",
  "natural_language": "✅ Klart! <employee>Erik Larsson</employee> är <constraint>ledig</constraint> från <date>20 december</date> till <date>27 december</date>. Detta är en <priority>obligatorisk</priority> begränsning som kommer att respekteras i schemat.",
  "action": "create",
  "constraint": {
    "employee_id": "find-erik-id-from-list-above",
    "start_date": "${today.getFullYear()}-12-20",
    "end_date": "${today.getFullYear()}-12-27",
    "shifts": [],
    "constraint_type": "hard_unavailable",
    "priority": 1000,
    "original_text": "Erik är ledig 20-27 december"
  },
  "confidence": "high",
  "ui_hint": "show_approve_button"
}

Input: "Anna vill inte jobba natt 15 november"
Output:
{
  "mode": "parse",
  "natural_language": "✅ Noterat! <employee>Anna Svensson</employee> <constraint>kan inte jobba nattskift</constraint> den <date>15 november</date>. Detta är en <priority>hård begränsning</priority> som måste respekteras.",
  "action": "create",
  "constraint": {
    "employee_id": "find-anna-id-from-list-above",
    "start_date": "${today.getFullYear()}-11-15",
    "end_date": "${today.getFullYear()}-11-15",
    "shifts": ["natt"],
    "constraint_type": "hard_unavailable",
    "priority": 1000,
    "original_text": "Anna vill inte jobba natt 15 november"
  },
  "confidence": "high",
  "ui_hint": "show_approve_button"
}

Input: "Charlotte föredrar dag nästa måndag"
Output:
{
  "mode": "parse",
  "natural_language": "✅ Okej! <employee>Charlotte Andersson</employee> <constraint>föredrar dagskift</constraint> nästa <date>måndag</date>. Detta är en <priority>önskan</priority> som vi försöker uppfylla om möjligt.",
  "action": "create",
  "constraint": {
    "employee_id": "find-charlotte-id-from-list-above",
    "start_date": "calculate-next-monday-from-${todayString}",
    "end_date": "calculate-next-monday-from-${todayString}",
    "shifts": ["dag"],
    "constraint_type": "soft_preference",
    "priority": 500,
    "original_text": "Charlotte föredrar dag nästa måndag"
  },
  "confidence": "high",
  "ui_hint": "show_approve_button"
}

---

CONFIDENCE LEVELS:
- "high" = exact date, exact name match, clear constraint
- "medium" = relative date, fuzzy name match
- "low" = ambiguous, triggers clarification mode

---

ERROR HANDLING:

If employee not found in list:
{
  "mode": "clarify",
  "natural_language": "❓ Kunde inte hitta en medarbetare med det namnet. Vem menar du?",
  "options": [list first 5 employees as options],
  "ui_hint": "show_clarify_buttons"
}

---

KEY PRINCIPLES:
1. **natural_language comes FIRST** - This is what users see immediately
2. **Be conversational and friendly** - Use "Klart!", "Okej!", "Perfekt!"
3. **Confirm what you understood** - Repeat back the key details with tags
4. **Use Swedish always** - All user-facing text must be in Swedish
5. **Use HTML-like tags** - <employee>, <date>, <constraint>, <priority> for UI highlighting
6. **Include relative dates when mentioned** - "27 oktober (nästa måndag)"
7. **State priority clearly** - "obligatorisk" vs "önskan"
8. **Always return valid JSON** - Even for errors
9. **Gurobi-ready format** - Constraint object ready for direct use (no conversion!)

DO NOT:
- Put technical JSON first in the message
- Use English for user-facing text
- Be vague about what was understood
- Skip the natural_language field
- Make up employee names not in the list above

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
