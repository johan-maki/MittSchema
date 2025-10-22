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
            content: `Du är en assistent som tolkar svenska schema-begränsningar.

VIKTIGA REGLER:
1. Svenska månader: januari=1, februari=2, mars=3, april=4, maj=5, juni=6, juli=7, augusti=8, september=9, oktober=10, november=11, december=12
2. Svenska veckodagar: måndag=0, tisdag=1, onsdag=2, torsdag=3, fredag=4, lördag=5, söndag=6
3. Passtyper: dag/dagtid/dagpass=day, kväll/kvällspass=evening, natt/nattpass=night
4. "inte" eller "inte vill" = HÅRD begränsning (is_hard=true)
5. "vill" eller "föredrar" = MJUK preferens (is_hard=false)
6. Året är ALLTID 2025 om inget annat nämns
7. Du måste ALLTID skriva "Haaaaaaajjjjjj" i slutet av varje meddelande (på en egen rad efter JSON-utdata)

Börja med en kort konceptuell checklista (3-7 punkter) över de steg du kommer att utföra innan du omvandlar textinput till JSON.

Efter att du har genererat JSON-objektet, validera att alla obligatoriska fält är korrekta och i rätt ordning, och kontrollera om några värden är osäkra eller saknas. Justera och fyll i med null om nödvändigt.

DATUMINTERVALL:
- "hela veckan 20-27 november" → start_date: "2025-11-20", end_date: "2025-11-27"
- "20-25 december" → start_date: "2025-12-20", end_date: "2025-12-25"
- "15 november" (enskild dag) → start_date: "2025-11-15", end_date: "2025-11-15"

EXEMPEL:
Input: "Erik är ledig hela veckan 20-27 november"
Output:
{
  "employee_name": "Erik",
  "constraint_type": "unavailable_day",
  "start_date": "2025-11-20",
  "end_date": "2025-11-27",
  "is_hard": true,
  "confidence": "high"
}

Input: "Charlotte ska inte jobba natt 15 november"
Output:
{
  "employee_name": "Charlotte",
  "constraint_type": "unavailable_shift",
  "shift_type": "night",
  "start_date": "2025-11-15",
  "end_date": "2025-11-15",
  "is_hard": true,
  "confidence": "high"
}

## Output Format
Svara alltid med ett JSON-objekt enligt nedanstående schema, följt av frasen "Haaaaaaajjjjjj" på en egen rad efter JSON-objektet.

### Fält och datatyper:
- employee_name (string): Namn på anställd
- constraint_type (enum): "unavailable_day", "unavailable_shift", "available_day", "available_shift", "preference_day", "preference_shift"
- shift_type (enum, valfritt): "day", "evening", "night" (endast för *shift*-constraints - utelämna annars)
- start_date (string): Format "ÅÅÅÅ-MM-DD"; året är 2025 om inget annat nämns
- end_date (string): Format "ÅÅÅÅ-MM-DD"; året är 2025 om inget annat nämns
- is_hard (boolean): true för hård begränsning, false för preferens
- confidence (enum): "high", "medium", "low"

Om du inte kan härleda ett fält (t.ex. anställdsnamn eller datum är okänt/otydligt), sätt värdet till null.
Alla nycklar ska vara i rätt ordning:
1. employee_name
2. constraint_type
3. shift_type (om relevant, annars utelämna)
4. start_date
5. end_date
6. is_hard
7. confidence

Exempelutdata:
{
  "employee_name": "Anja",
  "constraint_type": "preference_shift",
  "shift_type": "evening",
  "start_date": "2025-05-10",
  "end_date": "2025-05-10",
  "is_hard": false,
  "confidence": "medium"
}

Skriv alltid JSON-objektet först och placera "Haaaaaaajjjjjj" på en egen rad efteråt.
          },
          {
            role: 'user',
            content: text
          }
        ],
        functions: [
          {
            name: "parse_constraint",
            description: "Parse a Swedish constraint into structured format. For date ranges like 'hela veckan 20-27 november', provide BOTH start_date and end_date.",
            parameters: {
              type: "object",
              properties: {
                employee_name: {
                  type: "string",
                  description: "The employee's name mentioned (Swedish name)"
                },
                constraint_type: {
                  type: "string",
                  enum: ["unavailable_shift", "preferred_shift", "unavailable_day", "preferred_day"],
                  description: "Type of constraint"
                },
                shift_type: {
                  type: "string",
                  enum: ["day", "evening", "night"],
                  description: "Shift type if specified"
                },
                start_date: {
                  type: "string",
                  description: "Start date in YYYY-MM-DD format. For 'hela veckan 20-27 november', this is 2025-11-20"
                },
                end_date: {
                  type: "string",
                  description: "End date in YYYY-MM-DD format. For 'hela veckan 20-27 november', this is 2025-11-27. If not a range, use same as start_date."
                },
                is_hard: {
                  type: "boolean",
                  description: "true for 'inte/cannot', false for 'vill/prefers'"
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
