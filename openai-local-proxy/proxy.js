const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: '🚀 Local OpenAI Proxy is running!',
    endpoints: {
      parse: 'POST /parse - Parse Swedish scheduling constraints'
    },
    ready: true
  });
});

// Your OpenAI API key (safe because it's only on YOUR local machine)
// TODO: Replace with your actual OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';

app.post('/parse', async (req, res) => {
  try {
    const { text, department } = req.body;
    
    console.log('📝 Parsing constraint:', text);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Du är en schema-assistent. Din uppgift är att tolka svenska fraser till strukturerad data.

NUVARANDE ÅR: 2025

REGLER:
- "inte" eller "ledig" = hård begränsning (is_hard: true)
- "vill" eller "föredrar" = mjuk preferens (is_hard: false)
- Svenska månader: januari=1...december=12
- Passtyper: dag, kväll, natt (på svenska)

DATUMINTERVALL:
När användaren säger "hela veckan 20-27 december":
→ start_date: "2025-12-20"
→ end_date: "2025-12-27"

När användaren säger "15 november":
→ start_date: "2025-11-15"  
→ end_date: "2025-11-15"

EXEMPEL:
"Erik är ledig hela veckan 20-27 december"
→ { employee_name: "Erik", start_date: "2025-12-20", end_date: "2025-12-27", is_hard: true }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        functions: [
          {
            name: "parse_constraint",
            description: "Tolka svensk text till schema-begränsning. För intervall som 'hela veckan 20-27 december', ge BÅDE start_date och end_date.",
            parameters: {
              type: "object",
              properties: {
                employee_name: {
                  type: "string",
                  description: "Namn på personen"
                },
                constraint_type: {
                  type: "string",
                  enum: ["unavailable_day", "unavailable_shift", "preferred_day", "preferred_shift"],
                  description: "Typ av begränsning"
                },
                shift_type: {
                  type: "string",
                  enum: ["dag", "kväll", "natt"],
                  description: "Passtyp (endast om specifikt nämnt)"
                },
                start_date: {
                  type: "string",
                  description: "Startdatum YYYY-MM-DD, år 2025"
                },
                end_date: {
                  type: "string",
                  description: "Slutdatum YYYY-MM-DD, år 2025. För intervall: hela veckan 20-27 december = 2025-12-20 till 2025-12-27"
                },
                is_hard: {
                  type: "boolean",
                  description: "true för 'inte/ledig', false för 'vill/föredrar'"
                },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"]
                }
              },
              required: ["employee_name", "constraint_type", "start_date", "end_date", "is_hard"]
            }
          }
        ],
        function_call: { name: "parse_constraint" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const functionCall = data.choices[0].message.function_call;
    
    if (!functionCall || !functionCall.arguments) {
      throw new Error('OpenAI did not return a valid function call');
    }

    const parsed = JSON.parse(functionCall.arguments);
    
    console.log('✅ Parsed successfully:', parsed);
    console.log('📅 START DATE:', parsed.start_date);
    console.log('📅 END DATE:', parsed.end_date);
    console.log('📅 SPECIFIC DATE (old field):', parsed.specific_date);
    
    res.json({
      success: true,
      constraint: parsed,
      message: 'Constraint parsed successfully'
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: `Failed to parse constraint: ${error.message}`,
      reason: error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Local OpenAI proxy running on http://localhost:${PORT}`);
  console.log('✅ Safe to use - API key stays on YOUR machine only');
  console.log('📝 Ready to parse Swedish scheduling constraints!\n');
});
