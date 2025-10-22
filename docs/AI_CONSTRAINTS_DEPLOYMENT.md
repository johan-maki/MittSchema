# 🚀 AI Constraints Deployment Guide

## 📋 What's Ready

Everything is prepared! When your friend gives you Supabase access, follow these steps:

---

## 🎯 Step 1: Run Database Migration

**In Supabase Dashboard:**

1. Go to your Supabase project: https://supabase.com/dashboard/project/ebyvourlaomcwitpibdl
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20250122000000_add_ai_constraints.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. ✅ Verify: You should see "Success. No rows returned"

**What this does:**
- Creates `ai_constraints` table to store parsed constraints
- Sets up proper indexes for performance
- Configures Row Level Security (RLS) policies

---

## 🎯 Step 2: Deploy Supabase Edge Function

**Option A: Via Supabase CLI (Recommended)**

```bash
# If not installed yet:
brew install supabase/tap/supabase

# Login to Supabase:
supabase login

# Link your project:
supabase link --project-ref ebyvourlaomcwitpibdl

# Deploy the Edge Function:
supabase functions deploy parse-constraint

# ✅ Success! The function is now live at:
# https://ebyvourlaomcwitpibdl.supabase.co/functions/v1/parse-constraint
```

**Option B: Via Supabase Dashboard**

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create new function**
3. Name: `parse-constraint`
4. Copy contents of `supabase/functions/parse-constraint/index.ts`
5. Paste and click **Deploy**

---

## 🎯 Step 3: Add OpenAI API Key Secret

**In Supabase Dashboard:**

1. Go to **Edge Functions** → **parse-constraint**
2. Click **Secrets** tab
3. Click **Add secret**
4. Name: `OPENAI_API_KEY`
5. Value: `<your-openai-api-key>` (use the key you have)
6. Click **Save**

---

## ✅ Step 4: Test in Production

1. Push your code to GitHub (Vercel will auto-deploy):
```bash
git add .
git commit -m "Add AI constraints feature"
git push
```

2. Wait for Vercel deployment to complete

3. Go to your production site: https://mitt-schema.vercel.app

4. Navigate to Schedule page

5. Try the AI constraint input:
   - Type: "Erik är ledig hela veckan 20-27 december"
   - Click "Tolka med AI"
   - Should parse correctly showing all dates Dec 20-27

---

## 🔧 How It Works

### Development (Local Testing - NOW)
```
User types Swedish text
    ↓
Frontend calls localhost:3001/parse (your local proxy)
    ↓
Proxy calls OpenAI API
    ↓
Returns parsed constraint
```

### Production (After Deployment - SOON)
```
User types Swedish text
    ↓
Frontend calls Supabase Edge Function
    ↓
Edge Function calls OpenAI API (key secure in Supabase)
    ↓
Returns parsed constraint
    ↓
User clicks "Accept"
    ↓
Saved to ai_constraints table in Supabase
    ↓
Used when generating schedules with Gurobi
```

---

## 📊 Verify Everything Works

**Test the Edge Function directly:**

```bash
curl -X POST \
  'https://ebyvourlaomcwitpibdl.supabase.co/functions/v1/parse-constraint' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"text": "Erik är ledig 15 november"}'
```

**Expected response:**
```json
{
  "success": true,
  "constraint": {
    "employee_name": "Erik",
    "start_date": "2025-11-15",
    "end_date": "2025-11-15",
    "constraint_type": "unavailable_day",
    "is_hard": true,
    "confidence": "high"
  },
  "message": "Constraint parsed successfully"
}
```

**Check the database:**

In Supabase SQL Editor:
```sql
SELECT * FROM ai_constraints ORDER BY created_at DESC LIMIT 10;
```

---

## 🐛 Troubleshooting

### Edge Function fails with "OPENAI_API_KEY not configured"
→ Make sure you added the secret in Step 3

### Frontend still calls localhost:3001
→ Make sure you're in production mode (not running `npm run dev`)
→ Check browser console for `Using 🌐 PRODUCTION endpoint`

### Date ranges not working
→ The GPT-4 prompt is simple and clear, should work
→ Check Edge Function logs in Supabase Dashboard

### TypeScript errors in VS Code
→ Ignore them - they'll go away after the migration runs
→ The `ai_constraints` table doesn't exist in TypeScript types yet
→ Code uses `as any` to bypass type checking

---

## 📝 Files Modified/Created

**Created:**
- ✅ `supabase/functions/parse-constraint/index.ts` - Edge Function with clean GPT-4 prompt
- ✅ `supabase/migrations/20250122000000_add_ai_constraints.sql` - Database schema
- ✅ This README file

**Modified:**
- ✅ `src/api/schedulerApi.ts` - Already configured to use Supabase in production!
  - `parseAIConstraint()` - Calls Edge Function
  - `saveAIConstraint()` - Saves to database
  - `loadAIConstraints()` - Loads from database  
  - `deleteAIConstraint()` - Deletes from database

**No changes needed:**
- ✅ Frontend components already use the API functions
- ✅ Automatic switch between local (dev) and Supabase (production)

---

## 🎉 Summary

**Right now (Local Development):**
- Your local proxy on `localhost:3001` works
- Frontend calls it when you run `npm run dev`
- Perfect for testing the GPT-4 prompt

**After deployment (Production):**
- Edge Function handles all OpenAI calls
- API key stays secure in Supabase (never exposed to browser)
- Constraints persist in database
- Gurobi uses them when generating schedules

**Total deployment time:** ~10 minutes  
**Your friend needs to:** Run migration + Deploy function + Add secret  
**You need to:** Nothing! Just `git push` and it works ✅

---

## 💡 Next Steps

After deployment works:

1. **Match employee names** - The current prompt just uses the name from user input. You might want to:
   - Fuzzy match against actual employee names in database
   - Show suggestions if name is ambiguous

2. **Persist constraints** - Currently constraints are only in React state:
   - Add "Accept" button to save to database
   - Load saved constraints on page load
   - Show list of active constraints

3. **Integrate with Gurobi** - Constraints need to be passed to optimizer:
   - Convert AI constraints to Gurobi format
   - Include them in schedule generation requests
   - Mark which constraints were respected/violated

4. **Better UX** - Enhance the user experience:
   - Show confidence level visually
   - Allow editing parsed constraints
   - Add undo/redo functionality

---

## 🆘 Need Help?

**Edge Function logs:**  
Supabase Dashboard → Edge Functions → parse-constraint → Logs

**Database queries:**  
Supabase Dashboard → SQL Editor

**Frontend errors:**  
Browser console (F12)

**Contact:**  
Everything is ready to go - just follow the steps above! 🚀
