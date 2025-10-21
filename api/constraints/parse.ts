import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Edge runtime for fast, globally distributed execution
export const config = {
  runtime: 'edge',
};

// Swedish mappings
const SWEDISH_MONTHS = {
  "januari": 1, "februari": 2, "mars": 3, "april": 4,
  "maj": 5, "juni": 6, "juli": 7, "augusti": 8,
  "september": 9, "oktober": 10, "november": 11, "december": 12
};

const SWEDISH_WEEKDAYS = {
  "måndag": 0, "tisdag": 1, "onsdag": 2, "torsdag": 3,
  "fredag": 4, "lördag": 5, "söndag": 6
};

export default async function handler(req: Request) {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body
    const { text, department, context_date } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Text is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Fetch employees from Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, department')
      .eq('department', department || 'Akutmottagning');

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to fetch employees',
        reason: employeesError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare employee list for GPT
    const employeeNames = employees.map(emp => `${emp.first_name} ${emp.last_name}`);
    const employeeListStr = employeeNames.slice(0, 10).join(', ');
    const currentDate = context_date || new Date().toISOString().split('T')[0];

    // System message with Swedish support
    const systemMessage = `Du är en AI-assistent som hjälper till att tolka schema-begränsningar på svenska.

Tillgängliga anställda: ${employeeListStr}

Dagens datum: ${currentDate}

Du kan hantera:
- Hårda blockeringar ("ska inte jobba", "kan inte jobba", "ledig", "semester")
- Mjuka preferenser ("föredrar inte", "helst inte", "vill undvika")
- Svenska månadnamn (januari, februari, mars, etc.)
- Svenska veckodagar (måndag, tisdag, onsdag, etc.)
- Relativa datum ("nästa vecka", "i morgon", "om två veckor")
- Pass-typer: dag, kväll, natt

Tolka användarens begäran och anropa rätt funktion.`;

    // GPT-4 function definitions
    const functions = [
      {
        name: "add_hard_block",
        description: "Lägg till en hård blockering - anställd kan INTE jobba vid specifik tid (måste följas)",
        parameters: {
          type: "object",
          properties: {
            employee_name: {
              type: "string",
              description: "Namn på anställd"
            },
            dates: {
              type: "array",
              items: { type: "string" },
              description: "Lista med datum i ISO-format (YYYY-MM-DD)"
            },
            shift_types: {
              type: "array",
              items: { type: "string", enum: ["day", "evening", "night", "all_day"] },
              description: "Pass-typer: day, evening, night, eller all_day för hela dagen"
            },
            reason: {
              type: "string",
              description: "Anledning (semester, sjuk, annan anledning)"
            }
          },
          required: ["employee_name", "dates", "shift_types"]
        }
      },
      {
        name: "add_soft_preference",
        description: "Lägg till en mjuk preferens - anställd FÖREDRAR INTE att jobba men kan om nödvändigt",
        parameters: {
          type: "object",
          properties: {
            employee_name: {
              type: "string",
              description: "Namn på anställd"
            },
            dates: {
              type: "array",
              items: { type: "string" },
              description: "Lista med datum i ISO-format (YYYY-MM-DD)"
            },
            shift_types: {
              type: "array",
              items: { type: "string", enum: ["day", "evening", "night", "all_day"] },
              description: "Pass-typer: day, evening, night, eller all_day"
            },
            reason: {
              type: "string",
              description: "Anledning för preferens"
            }
          },
          required: ["employee_name", "dates", "shift_types"]
        }
      }
    ];

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: text }
      ],
      functions: functions as any,
      function_call: 'auto',
      temperature: 0.1,
    });

    const message = response.choices[0]?.message;

    // Check if function was called
    if (message?.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments || '{}');

      console.log(`🤖 GPT-4 called function: ${functionName}`, functionArgs);

      // Find employee ID by name (fuzzy match)
      const employeeName = functionArgs.employee_name || '';
      const employeeId = findEmployeeId(employeeName, employees);

      // Determine if hard or soft
      const isHard = functionName === 'add_hard_block';

      // Build constraint
      const constraint = {
        employee_id: employeeId,
        employee_name: employeeName,
        dates: functionArgs.dates || [],
        shifts: functionArgs.shift_types || [],
        is_hard: isHard,
        confidence: employeeId ? 'high' : 'medium',
        constraint_type: isHard ? 'hard_blocked_slot' : 'preferred_shift',
        original_text: text,
        reason: functionArgs.reason || null,
      };

      if (!employeeId) {
        constraint.reason = `Kunde inte hitta anställd med namn '${employeeName}'`;
        constraint.confidence = 'low' as any;
      }

      return new Response(JSON.stringify({
        success: true,
        constraint,
        message: `✅ Tolkade: ${employeeName} ${isHard ? 'kan inte' : 'föredrar inte att'} jobba ${functionArgs.shift_types} ${functionArgs.dates}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // No function called - GPT couldn't parse
      return new Response(JSON.stringify({
        success: false,
        constraint: null,
        message: `❌ Kunde inte tolka begäran: ${message?.content}`,
        reason: 'GPT-4 kunde inte identifiera en begränsning'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('OpenAI parsing error:', error);
    return new Response(JSON.stringify({
      success: false,
      constraint: null,
      message: `❌ Fel vid tolkning: ${error.message}`,
      reason: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Helper function: Find employee ID by name (fuzzy match)
function findEmployeeId(name: string, employees: any[]): string | null {
  const nameLower = name.toLowerCase().trim();

  for (const emp of employees) {
    const firstName = emp.first_name?.trim() || '';
    const lastName = emp.last_name?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

    // Exact match
    if (nameLower === fullName) {
      return emp.id;
    }
    // Partial match (first name or last name)
    if (nameLower === firstName.toLowerCase() || nameLower === lastName.toLowerCase()) {
      return emp.id;
    }
    // Partial match in full name
    if (nameLower.includes(fullName) || fullName.includes(nameLower)) {
      return emp.id;
    }
  }

  return null;
}
