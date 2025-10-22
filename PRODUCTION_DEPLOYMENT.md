# 🚀 Production Deployment Guide - AI Constraints (Gurobi-Ready + Conversational)

## ✅ What's Ready for Deployment

Everything is prepared and pushed to GitHub! Your Edge Function now has:

1. **Conversational UI** - Natural language responses with HTML tags
2. **Gurobi-Ready Format** - No conversion needed
3. **Employee Lookup** - Automatically loads from Supabase
4. **Date Expansion** - Arrays of all dates
5. **Smart Clarification** - Asks questions when ambiguous

---

## 🎯 Deployment Steps (10 Minutes)

### **Step 1: Run Database Migration** (2 min)

In Supabase Dashboard → SQL Editor:

```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/20250122000000_add_ai_constraints.sql
```

✅ **Verify:** You should see "Success. No rows returned"

**What this creates:**
- `ai_constraints` table with Gurobi-ready schema
- Indexes on `employee_id`, `dates` array, `organization_id`
- Row Level Security policies

---

### **Step 2: Deploy Edge Function** (3 min)

**Option A: Via Supabase CLI** (Recommended)

```bash
# Install if needed
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref ebyvourlaomcwitpibdl

# Deploy
supabase functions deploy parse-constraint

# ✅ Success message will show:
# Deployed Function parse-constraint
# https://ebyvourlaomcwitpibdl.supabase.co/functions/v1/parse-constraint
```

**Option B: Via Dashboard**

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create new function"
3. Name: `parse-constraint`
4. Copy entire contents of `supabase/functions/parse-constraint/index.ts`
5. Paste and click "Deploy"

---

### **Step 3: Add Secrets** (1 min)

In Supabase Dashboard:

1. Go to **Edge Functions** → **parse-constraint** → **Secrets**
2. Click **Add secret**

**Add these 3 secrets:**

| Secret Name | Value | Where to find |
|-------------|-------|---------------|
| `OPENAI_API_KEY` | Your OpenAI key | *(You already have this in Supabase!)* |
| `SUPABASE_URL` | `https://ebyvourlaomcwitpibdl.supabase.co` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Project Settings → API → service_role |

**Important:** Use the **service_role** key (not the anon key) so the function can read employees table!

---

### **Step 4: Test in Production** (4 min)

**Test 1: Direct Edge Function call**

```bash
# Get your anon key from Supabase Dashboard → Settings → API
export SUPABASE_ANON_KEY="your-anon-key-here"

curl -X POST \
  'https://ebyvourlaomcwitpibdl.supabase.co/functions/v1/parse-constraint' \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Erik är ledig 20-27 december",
    "organization_id": "your-org-id"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "mode": "parse",
  "natural_language": "✅ Klart! <employee>Erik Larsson</employee> är <constraint>ledig</constraint> från <date>20 december</date> till <date>27 december</date>. Detta är en <priority>obligatorisk</priority> begränsning.",
  "constraint": {
    "employee_id": "uuid-here",
    "dates": ["2025-12-20", "2025-12-21", ..., "2025-12-27"],
    "shifts": [],
    "constraint_type": "hard_unavailable",
    "priority": 1000,
    "original_text": "Erik är ledig 20-27 december"
  }
}
```

**Test 2: Deploy frontend and test in browser**

```bash
# Your code is already pushed, Vercel will auto-deploy
# Just wait 2-3 minutes for deployment

# Then visit:
https://mitt-schema.vercel.app
```

Navigate to Schedule page and try:
- "Erik är ledig 20-27 december"
- "Anna vill inte jobba natt 15 november"
- "Charlotte föredrar dag nästa måndag"

---

## 🎨 What Users Will See

### **Example 1: Simple constraint**

**User types:** "Erik är ledig 20-27 december"

**UI shows:**
```
✅ Klart! Erik Larsson är ledig från 20 december till 27 december. 
Detta är en obligatorisk begränsning som måste respekteras i schemat.

[✅ Godkänn och spara]  [✏️ Redigera]  [❌ Avbryt]
```

*(Employee names, dates, and constraint types are highlighted in different colors)*

---

### **Example 2: Ambiguous input**

**User types:** "Erik är ledig nästa vecka"

**If multiple Eriks exist:**
```
❓ Det finns flera anställda som heter Erik. Vem menar du?

[Erik Larsson]  [Erik Johansson]
```

**After selection:**
```
✅ Klart! Erik Larsson är ledig från 27 oktober till 2 november (nästa vecka).
Detta är en obligatorisk begränsning.

[✅ Godkänn och spara]
```

---

### **Example 3: Soft preference**

**User types:** "Charlotte föredrar dag nästa måndag"

**UI shows:**
```
✅ Okej! Charlotte Andersson föredrar dagskift nästa måndag. 
Detta är en önskan som vi försöker uppfylla om möjligt.

[✅ Godkänn och spara]
```

---

## 🔧 How It Works (Complete Flow)

```
1. User types in browser: "Erik är ledig 20-27 december"
         ↓
2. Frontend calls: https://ebyvourlaomcwitpibdl.supabase.co/functions/v1/parse-constraint
   Body: { text: "...", organization_id: "..." }
         ↓
3. Edge Function loads employees from Supabase:
   SELECT id, name FROM employees WHERE organization_id = '...'
         ↓
4. Edge Function builds list:
   "Available employees: Erik Larsson (ID: uuid-1), Anna Svensson (ID: uuid-2)..."
         ↓
5. Edge Function calls OpenAI with comprehensive prompt:
   - Current date (dynamic!)
   - Employee list
   - Gurobi format requirements
   - Conversational response requirements
   - Examples
         ↓
6. ChatGPT returns JSON:
   {
     "mode": "parse",
     "natural_language": "✅ Klart! <employee>Erik Larsson</employee>...",
     "constraint": {
       "employee_id": "uuid-1",  ← Looked up!
       "start_date": "2025-12-20",
       "end_date": "2025-12-27",
       "shifts": [],
       "constraint_type": "hard_unavailable",
       "priority": 1000
     }
   }
         ↓
7. Edge Function expands dates:
   dates: ["2025-12-20", "2025-12-21", ..., "2025-12-27"]
         ↓
8. Returns to frontend (Gurobi-ready!)
         ↓
9. Frontend shows natural_language with HTML tags highlighted
         ↓
10. User clicks "Godkänn och spara"
         ↓
11. Frontend saves to ai_constraints table
    (Already in Gurobi format - no conversion!)
         ↓
12. When generating schedule:
    - Load constraints from database
    - Send DIRECTLY to Gurobi
    - NO CONVERSION NEEDED! ✅
```

---

## 📊 Response Format

### **Parse Mode (Normal):**
```json
{
  "success": true,
  "mode": "parse",
  "natural_language": "User-friendly Swedish with <tags>",
  "action": "create",
  "constraint": {
    "employee_id": "uuid",
    "dates": ["2025-12-20", "2025-12-21", ...],
    "shifts": [],
    "constraint_type": "hard_unavailable",
    "priority": 1000,
    "original_text": "user input"
  },
  "confidence": "high",
  "ui_hint": "show_approve_button"
}
```

### **Clarify Mode (Ambiguous):**
```json
{
  "success": false,
  "mode": "clarify",
  "natural_language": "❓ Question for user",
  "options": [
    {"label": "Erik Larsson", "value": "uuid-1"},
    {"label": "Erik Johansson", "value": "uuid-2"}
  ],
  "context": {
    "partial_constraint": {...}
  },
  "ui_hint": "show_clarify_buttons"
}
```

---

## 🐛 Troubleshooting

### **Error: "OPENAI_API_KEY not configured"**
→ Add the secret in Edge Functions → Secrets

### **Error: "Failed to load employees"**
→ Check `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key!)
→ Make sure employees table exists

### **Frontend still shows "Using LOCAL endpoint"**
→ You're in dev mode (`npm run dev`)
→ Check production: https://mitt-schema.vercel.app

### **Dates are wrong**
→ Edge Function uses current date dynamically - should always be correct
→ Check Edge Function logs in Supabase Dashboard

### **Employee not found**
→ Edge Function will trigger clarification mode
→ User will see options to choose from

### **TypeScript errors in VS Code**
→ Normal for Deno edge functions
→ They'll work fine when deployed
→ Errors disappear after table is created

---

## ✅ Verification Checklist

After deployment, verify these work:

- [ ] Simple constraint: "Erik är ledig 20-27 december"
- [ ] Date range expanded: Returns 8 dates (Dec 20-27)
- [ ] Natural language response: Shows Swedish text with HTML tags
- [ ] Employee lookup: Matches "Erik" to "Erik Larsson" UUID
- [ ] Shift-specific: "Anna vill inte jobba natt 15 november"
- [ ] Soft preference: "Charlotte föredrar dag nästa måndag"
- [ ] Relative dates: "nästa vecka" calculates correctly
- [ ] Ambiguous input: Shows clarification options
- [ ] Save to database: Constraint appears in ai_constraints table
- [ ] Gurobi-ready: dates array, employee_id, priority all set

---

## 🎉 Summary

**What's deployed:**
- ✅ Conversational system prompt (friendly Swedish)
- ✅ Gurobi-ready format (no conversion!)
- ✅ Employee lookup from Supabase
- ✅ Date expansion (ranges → arrays)
- ✅ Natural language responses with HTML tags
- ✅ Clarification mode for ambiguous inputs
- ✅ Dynamic current date (always correct)
- ✅ UI hints for frontend

**Deployment time:** 10 minutes  
**Next step:** Test in production, then integrate with schedule generation!

---

## 📝 Next: Frontend Integration

The Edge Function returns Gurobi-ready data. To complete the integration:

1. **Frontend saves** - Already done! (saveAIConstraint function exists)
2. **Schedule generation** - Load constraints and send to Gurobi:

```typescript
const generateSchedule = async () => {
  const { data: constraints } = await supabase
    .from('ai_constraints')
    .select('*')
    .eq('organization_id', orgId);
  
  // Send to Gurobi (already in correct format!)
  await fetch('gurobi-endpoint', {
    body: JSON.stringify({
      employees,
      dateRange,
      constraints  // ← No conversion needed!
    })
  });
};
```

---

**Everything is ready! Just deploy and test.** 🚀
