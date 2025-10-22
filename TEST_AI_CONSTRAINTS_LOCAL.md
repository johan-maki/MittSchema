# 🧪 Test AI Constraints Locally (RIGHT NOW)

You can test the AI constraint feature locally before deploying to Supabase!

---

## ✅ What's Already Running

1. **Local proxy server** - `localhost:3001` (parsing Swedish text with GPT-4)
2. **Frontend dev server** - `localhost:3002` (your React app)

---

## 🎯 How to Test

### 1. Make sure servers are running:

**Terminal 1 - Proxy Server:**
```bash
cd openai-local-proxy
node proxy.js
```

Should see:
```
🚀 Local OpenAI proxy running on http://localhost:3001
✅ Safe to use - API key stays on YOUR machine only
📝 Ready to parse Swedish scheduling constraints!
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Should see:
```
VITE v5.4.19  ready in 208 ms
➜  Local:   http://localhost:3002/
```

---

### 2. Open the app:

Go to: http://localhost:3002

Navigate to the **Schedule** page

---

### 3. Find the AI Constraint Input:

Look for the section titled:
**"AI Schema-begränsningar"** or **"AI Constraints"**

It should have:
- A text area for input
- A button "Tolka med AI" (Parse with AI)
- Example constraints listed below

---

### 4. Test These Examples:

**Test 1 - Single Day:**
```
Erik är ledig 15 november
```

Expected result:
- ✅ Employee: Erik
- ✅ Dates: 2025-11-15 to 2025-11-15 (single day)
- ✅ Type: unavailable_day
- ✅ Hard constraint: Yes

**Test 2 - Date Range:**
```
Erik är ledig hela veckan 20-27 december
```

Expected result:
- ✅ Employee: Erik
- ✅ Dates: 2025-12-20 to 2025-12-27 (8 days!)
- ✅ Type: unavailable_day
- ✅ Hard constraint: Yes

**Test 3 - Specific Shift:**
```
Charlotte ska inte jobba natt 15 november
```

Expected result:
- ✅ Employee: Charlotte
- ✅ Dates: 2025-11-15 to 2025-11-15
- ✅ Shift: natt
- ✅ Type: unavailable_shift
- ✅ Hard constraint: Yes

**Test 4 - Soft Preference:**
```
Anna vill jobba dag 10 januari
```

Expected result:
- ✅ Employee: Anna
- ✅ Dates: 2025-01-10 to 2025-01-10
- ✅ Shift: dag
- ✅ Type: preferred_shift
- ✅ Hard constraint: No (soft preference)

---

## 🔍 What to Check

### In Browser Console (F12):

You should see:
```
🔐 Using 🏠 LOCAL PROXY endpoint: http://localhost:3001/parse
```

### In Proxy Server Terminal:

You should see:
```
📝 Parsing constraint: Erik är ledig hela veckan 20-27 december
✅ Parsed successfully: {
  employee_name: 'Erik',
  start_date: '2025-12-20',
  end_date: '2025-12-27',
  constraint_type: 'unavailable_day',
  is_hard: true,
  confidence: 'high'
}
📅 START DATE: 2025-12-20
📅 END DATE: 2025-12-27
```

---

## ❌ Troubleshooting

### "Cannot connect to localhost:3001"

**Fix:** Restart the proxy server
```bash
cd openai-local-proxy
node proxy.js
```

### "Still shows old date format (2023-12-20)"

**Fix:** The proxy needs to be restarted to load new code
```bash
# Stop the proxy (Ctrl+C)
# Start it again:
node proxy.js
```

### "Date range returns only one day"

**Fix:** Check the proxy terminal - it should show:
```
📅 START DATE: 2025-12-20
📅 END DATE: 2025-12-27  ← Should be DIFFERENT dates!
```

If they're the same, the GPT-4 prompt needs adjustment.

### "TypeScript errors in VS Code"

**Fix:** Ignore them! They're because the `ai_constraints` table doesn't exist yet in the TypeScript types. The code will work fine after the migration runs.

---

## 📊 What Happens to Parsed Constraints?

**Currently (Local Testing):**
- ✅ Constraints are parsed by GPT-4
- ✅ Shown in the UI
- ✅ Stored in React state (temporary)
- ❌ NOT saved to database (only in memory)
- ❌ NOT used by Gurobi yet

**After Supabase Deployment:**
- ✅ Constraints parsed by GPT-4
- ✅ Shown in the UI
- ✅ User clicks "Accept"
- ✅ Saved to Supabase database (persistent!)
- ✅ Loaded on page refresh
- ✅ Passed to Gurobi when generating schedules

---

## ✨ Expected Behavior

When you type a constraint and click "Tolka med AI":

1. **Spinner appears** (processing)
2. **Constraint appears below** with:
   - Green badge: "Hög säkerhet" (high confidence)
   - Lock icon: "Hård begränsning" (hard constraint)
   - Description: "Erik kan inte jobba den 2025-12-20"
   - Original text: "Erik är ledig hela veckan 20-27 december"
3. **Can delete** with trash icon
4. **Input clears** ready for next constraint

---

## 🎯 Success Criteria

✅ GPT-4 correctly identifies employee name  
✅ Dates are in 2025 (not 2023!)  
✅ Date ranges expand to all days (not just start date)  
✅ Shift types recognized (dag, kväll, natt)  
✅ Hard vs soft detected correctly ("inte" = hard, "vill" = soft)  
✅ Swedish months parsed correctly (november = 11, december = 12)

---

## 📝 Test Report Template

After testing, note what works/doesn't:

```
✅ WORKING:
- Single day constraints
- Date ranges
- Specific shift types
- Hard vs soft detection

❌ NOT WORKING:
- [List any issues]

📋 NOTES:
- [Any observations]
```

---

## 🚀 Next: Deploy to Production

Once local testing works perfectly:

1. Share `docs/AI_CONSTRAINTS_DEPLOYMENT.md` with your friend
2. They follow the 3 steps (~10 min)
3. Push your code to GitHub
4. Test in production at https://mitt-schema.vercel.app

---

**Happy Testing!** 🎉

If everything works locally, it'll work in production too!
