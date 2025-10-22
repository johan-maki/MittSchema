# 🎯 AI Constraints - Clarification Support Update

**Date:** 22 October 2025  
**Status:** ✅ Code Complete - Needs Edge Function Re-deployment

---

## 🆕 What Was Added

### Problem
When a user wrote "Lena är ledig 17-23 november" and there were multiple employees named "Lena", the system would fail with:
```
❌ Parsing failed: {success: true, mode: 'clarify', ...}
```

Frontend didn't know how to handle the `clarify` mode response.

### Solution
Added full clarification flow support:

1. **Edge Function Updates** (`supabase/functions/parse-constraint/index.ts`)
   - Now accepts `employee_id` parameter for clarification follow-ups
   - Returns proper constraint data with `start_date`, `end_date`, `is_hard`, `shift_type`
   - Skips fuzzy matching when `employee_id` is pre-selected

2. **Frontend Updates** (`src/components/schedule/AIConstraintInput.tsx`)
   - Added clarification state management
   - Shows purple dialog when `mode: 'clarify'` is received
   - Displays employee options as buttons
   - Re-submits with selected `employee_id`
   - Clears clarification state after successful save

3. **API Updates** (`src/api/schedulerApi.ts`)
   - Updated `parseAIConstraint` to accept `selectedEmployeeId` parameter
   - Updated response type to include `mode`, `question`, `options`
   - Sends `employee_id` in request body for clarification follow-ups

---

## 🎨 User Experience

### Before (Broken)
```
User: "Lena är ledig 17-23 november"
System: ❌ Kunde inte tolka begränsningen
```

### After (Working)
```
User: "Lena är ledig 17-23 november"
System: Shows purple dialog:
  ┌─────────────────────────────────────────┐
  │ ❓ Flera medarbetare hittades.         │
  │    Vem menar du?                        │
  │                                         │
  │  [  Lena Andersson  ]                  │
  │  [  Lena Berg       ]                  │
  │  [  Lena Carlsson   ]                  │
  │                                         │
  │  [  Avbryt  ]                          │
  └─────────────────────────────────────────┘
User clicks: "Lena Berg"
System: ✅ Constraint saved successfully!
```

---

## 🚀 Deployment Steps

### Step 1: Re-deploy Edge Function

**Option A: Via Supabase CLI** (Recommended)
```bash
cd /Users/Johan.Maki/Desktop/MittSchema
supabase functions deploy parse-constraint
```

**Option B: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/ebyvourlaomcwitpibdl
2. Click **Edge Functions** → **parse-constraint**
3. Click **Edit Function**
4. Copy entire contents of `supabase/functions/parse-constraint/index.ts`
5. Paste and click **Deploy**

### Step 2: Test in Production

**Test 1: Single Employee Match (Should Work Immediately)**
```bash
curl -X POST \
  'https://ebyvourlaomcwitpibdl.supabase.co/functions/v1/parse-constraint' \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Charlotte ska inte jobba 15 november"
  }'
```

Expected:
```json
{
  "success": true,
  "mode": "parse",
  "constraint": {
    "employee_id": "...",
    "employee_name": "Charlotte Andersson",
    "start_date": "2025-11-15",
    "end_date": "2025-11-15",
    "is_hard": true,
    ...
  }
}
```

**Test 2: Multiple Employees (Should Return Clarification)**
```bash
curl -X POST \
  'https://ebyvourlaomcwitpibdl.supabase.co/functions/v1/parse-constraint' \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Lena är ledig 17-23 november"
  }'
```

Expected:
```json
{
  "success": true,
  "mode": "clarify",
  "question": "❓ Flera medarbetare hittades. Vem menar du?",
  "options": [
    {"label": "Lena Andersson", "value": "uuid-1"},
    {"label": "Lena Berg", "value": "uuid-2"},
    {"label": "Lena Carlsson", "value": "uuid-3"}
  ]
}
```

**Test 3: Follow-up with Selected Employee**
```bash
curl -X POST \
  'https://ebyvourlaomcwitpibdl.supabase.co/functions/v1/parse-constraint' \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Lena är ledig 17-23 november",
    "employee_id": "uuid-2"
  }'
```

Expected:
```json
{
  "success": true,
  "mode": "parse",
  "constraint": {
    "employee_id": "uuid-2",
    "employee_name": "Lena Berg",
    "start_date": "2025-11-17",
    "end_date": "2025-11-23",
    ...
  }
}
```

---

## ✅ Verification Checklist

After deployment, test in your browser:

- [ ] Open your app and navigate to Schedule page
- [ ] Click "Lägg till AI-baserade schemavillkor"
- [ ] Type: "Charlotte ska inte jobba 15 november"
- [ ] Verify: Constraint is parsed and saved immediately
- [ ] Type: "Lena är ledig 17-23 november" (if you have multiple Lenas)
- [ ] Verify: Purple dialog appears with employee options
- [ ] Click one of the options
- [ ] Verify: Constraint is parsed and saved successfully
- [ ] Check Supabase database:
  ```sql
  SELECT * FROM ai_constraints ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] Verify: Constraints are saved with correct employee_id, dates array, etc.

---

## 📊 Technical Changes Summary

### Files Modified
1. ✅ `supabase/functions/parse-constraint/index.ts` (Edge Function)
2. ✅ `src/components/schedule/AIConstraintInput.tsx` (Frontend UI)
3. ✅ `src/api/schedulerApi.ts` (API Client)

### New State Management
- `clarificationMode: boolean` - Whether showing clarification dialog
- `clarificationQuestion: string` - Question to display
- `clarificationOptions: Array<{label, value}>` - Employee options
- `pendingConstraintText: string` - Original text to re-parse

### New Function Parameters
- `parseAIConstraint(text, department, selectedEmployeeId?)` - API function
- `handleParse(selectedEmployeeId?)` - Parse handler

### Edge Function Request/Response
**Request:**
```typescript
{
  text: string;
  department?: string;
  employee_id?: string;  // ← NEW for clarification follow-ups
}
```

**Response (mode: 'parse'):**
```typescript
{
  success: true;
  mode: 'parse';
  constraint: {
    employee_id: string;
    employee_name: string;
    start_date: string;      // ← NEW
    end_date: string;        // ← NEW
    dates: string[];
    shifts: string[];
    shift_type?: string;     // ← NEW
    constraint_type: string;
    priority: number;
    is_hard: boolean;        // ← NEW
    confidence: string;      // ← NEW
    original_text: string;
    natural_language: string;
  }
}
```

**Response (mode: 'clarify'):**
```typescript
{
  success: true;
  mode: 'clarify';
  question: string;
  options: Array<{label: string; value: string}>;
}
```

---

## 🐛 Known Edge Cases (Handled)

✅ Multiple employees with same first name → Clarification dialog  
✅ No employees found → Clarification with top 10 employees  
✅ Empty employee list → Graceful fallback  
✅ User cancels clarification → State is cleared  
✅ Re-parsing after clarification → Uses selected employee_id  
✅ Constraint saved with original text → Preserved correctly  

---

## 📝 Next Steps

1. **Deploy Edge Function** (5 minutes)
2. **Test in browser** (5 minutes)
3. **Verify database** (2 minutes)
4. **Donesupabase* 🎉

Total time: ~12 minutes

---

## 🆘 Troubleshooting

**Issue:** Edge Function returns old response format  
**Fix:** Clear browser cache, hard refresh (Cmd+Shift+R)

**Issue:** Clarification dialog doesn't appear  
**Fix:** Check browser console for errors, verify Edge Function is deployed

**Issue:** Employee not found after selection  
**Fix:** Verify employee exists in database with correct ID

**Issue:** Constraint not saved to database  
**Fix:** Check Supabase logs, verify `ai_constraints` table exists

---

**Questions?** Check the full deployment guide: `docs/AI_CONSTRAINTS_DEPLOYMENT.md`
