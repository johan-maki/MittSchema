import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    
    console.log('📝 Parsing constraint:', text)

    // Call OpenAI API with simplified prompt
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a Swedish scheduling assistant. Parse natural language constraints into structured JSON.

Current year: 2025
Swedish months: januari=1, februari=2, mars=3, april=4, maj=5, juni=6, juli=7, augusti=8, september=9, oktober=10, november=11, december=12
Shift types: dag (day), kväll (evening), natt (night)

Rules:
- "inte" or "ledig" = hard constraint (is_hard: true)
- "vill" or "föredrar" = soft preference (is_hard: false)
- For date ranges like "hela veckan 20-27 december", provide start_date AND end_date
- For single dates like "15 november", use same date for both start_date and end_date
- If no shift type mentioned, leave shift_type empty

Examples:
"Erik är ledig hela veckan 20-27 december" → 
{
  "employee_name": "Erik",
  "start_date": "2025-12-20",
  "end_date": "2025-12-27",
  "constraint_type": "unavailable_day",
  "is_hard": true,
  "confidence": "high"
}

"Charlotte ska inte jobba natt 15 november" →
{
  "employee_name": "Charlotte", 
  "start_date": "2025-11-15",
  "end_date": "2025-11-15",
  "shift_type": "natt",
  "constraint_type": "unavailable_shift",
  "is_hard": true,
  "confidence": "high"
}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        functions: [
          {
            name: "parse_constraint",
            description: "Parse Swedish scheduling constraint. For date ranges, provide both start_date and end_date.",
            parameters: {
              type: "object",
              properties: {
                employee_name: {
                  type: "string",
                  description: "Employee's name"
                },
                constraint_type: {
                  type: "string",
                  enum: ["unavailable_day", "unavailable_shift", "preferred_day", "preferred_shift"],
                  description: "Type of constraint"
                },
                shift_type: {
                  type: "string",
                  enum: ["dag", "kväll", "natt"],
                  description: "Shift type if mentioned, otherwise omit"
                },
                start_date: {
                  type: "string",
                  description: "Start date in YYYY-MM-DD format"
                },
                end_date: {
                  type: "string",
                  description: "End date in YYYY-MM-DD format. For ranges, use actual end date. For single days, same as start_date."
                },
                is_hard: {
                  type: "boolean",
                  description: "true for hard constraints (cannot/must not), false for preferences (would like/prefer)"
                },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Confidence in the parsing"
                }
              },
              required: ["employee_name", "constraint_type", "start_date", "end_date", "is_hard"]
            }
          }
        ],
        function_call: { name: "parse_constraint" },
        temperature: 0.1
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await openaiResponse.json()
    const functionCall = data.choices[0]?.message?.function_call
    
    if (!functionCall || !functionCall.arguments) {
      throw new Error('OpenAI did not return a valid function call')
    }

    const parsed = JSON.parse(functionCall.arguments)
    
    console.log('✅ Parsed successfully:', parsed)

    return new Response(
      JSON.stringify({
        success: true,
        constraint: parsed,
        message: 'Constraint parsed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Failed to parse constraint: ${error.message}`,
        reason: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
