const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Your OpenAI API key (use environment variable!)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';

// Mock employees (for local testing - production loads from Supabase)
const MOCK_EMPLOYEES = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Erik Larsson' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Anna Svensson' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Charlotte Andersson' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Louise Nilsson' },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Helena Bergman' },
  { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Elin Johansson' },
];

// Helper: Expand date range
function expandDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: '🚀 Local OpenAI Proxy (Gurobi-Ready Format)',
    employees: MOCK_EMPLOYEES.length,
    ready: true
  });
});

// Parse constraint (Gurobi-ready format)
app.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    
    console.log('📝 Parsing constraint:', text);
    
    // Get current date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayReadable = today.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Prepare employee list for ChatGPT
    const employeeList = MOCK_EMPLOYEES.map(e => 
      `- ${e.name} (ID: ${e.id})`
    ).join('\n');
    
    // System prompt (Gurobi-ready format)
    const systemPrompt = `You are a scheduling constraint parser. Output in Gurobi-ready format.

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
1. Match employee name to ID from list (fuzzy match OK - "Erik" matches "Erik Larsson")
2. Use dates relative to ${todayString}
3. shifts: [] = all shifts, or ["dag"], ["kväll"], ["natt"], or combinations
4. Constraint types:
   - "hard_unavailable" = cannot work (ledig, inte, kan inte)
   - "soft_preference" = prefers not to (vill inte, föredrar inte)
   - "hard_required" = must work (måste, ska)
5. Priority: 1000 = must respect, 500 = strong, 100 = nice to have
6. natural_language: Swedish confirmation with <employee>, <date>, <constraint> tags

**EXAMPLES:**

Input: "Erik är ledig 20-27 december"
Output:
{
  "employee_id": "550e8400-e29b-41d4-a716-446655440001",
  "start_date": "${today.getFullYear()}-12-20",
  "end_date": "${today.getFullYear()}-12-27",
  "shifts": [],
  "constraint_type": "hard_unavailable",
  "priority": 1000,
  "original_text": "Erik är ledig 20-27 december",
  "natural_language": "✅ Klart! <employee>Erik Larsson</employee> är <constraint>ledig</constraint> från <date>20 december</date> till <date>27 december</date>."
}

Input: "Anna vill inte jobba natt 15 november"
Output:
{
  "employee_id": "550e8400-e29b-41d4-a716-446655440002",
  "start_date": "${today.getFullYear()}-11-15",
  "end_date": "${today.getFullYear()}-11-15",
  "shifts": ["natt"],
  "constraint_type": "hard_unavailable",
  "priority": 1000,
  "original_text": "Anna vill inte jobba natt 15 november",
  "natural_language": "✅ Noterat! <employee>Anna Svensson</employee> <constraint>kan inte jobba nattskift</constraint> den <date>15 november</date>."
}

If employee not found:
{
  "error": "employee_not_found",
  "message": "Kunde inte hitta medarbetare",
  "suggested_names": [list]
}

Return ONLY valid JSON.`;

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
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
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0]?.message?.content || '{}');
    
    // Check for employee not found
    if (parsed.error === 'employee_not_found') {
      return res.json({
        success: false,
        mode: 'clarify',
        question: parsed.message,
        options: MOCK_EMPLOYEES.slice(0, 5).map(e => ({
          label: e.name,
          value: e.id
        }))
      });
    }
    
    // Validate employee exists
    const employeeExists = MOCK_EMPLOYEES.find(e => e.id === parsed.employee_id);
    if (!employeeExists) {
      return res.json({
        success: false,
        mode: 'clarify',
        question: '❓ Kunde inte hitta medarbetare. Vem menar du?',
        options: MOCK_EMPLOYEES.slice(0, 5).map(e => ({
          label: e.name,
          value: e.id
        }))
      });
    }
    
    // Expand date range
    const dates = expandDateRange(parsed.start_date, parsed.end_date);
    
    // Build Gurobi-ready constraint
    const gurobiConstraint = {
      employee_id: parsed.employee_id,
      dates: dates,  // ← Array of all dates!
      shifts: parsed.shifts || [],
      constraint_type: parsed.constraint_type,
      priority: parsed.priority,
      original_text: parsed.original_text,
      natural_language: parsed.natural_language
    };
    
    console.log('✅ Parsed to Gurobi format:', JSON.stringify(gurobiConstraint, null, 2));
    
    res.json({
      success: true,
      mode: 'parse',
      constraint: gurobiConstraint,
      natural_language: parsed.natural_language
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: `Failed to parse constraint: ${error.message}`
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Local OpenAI Proxy (Gurobi-Ready) running on http://localhost:${PORT}`);
  console.log(`📋 Loaded ${MOCK_EMPLOYEES.length} mock employees`);
  console.log(`\n💡 Test it:`);
  console.log(`   curl -X POST http://localhost:${PORT}/parse -H "Content-Type: application/json" -d '{"text":"Erik är ledig 20-27 december"}'\n`);
});
