# 🚀 Render Backend Deployment Guide - AI Constraint Feature

## 📋 Problem Summary

The AI constraint parsing feature works perfectly **locally** but fails in **production** with:
```
"Failed to parse constraint: 500 OpenAI API key not configured"
```

### Root Cause Analysis
- **Architecture**: Frontend (Vercel) → Backend (Render) → OpenAI API
- **Issue**: Render backend has the AI code deployed but lacks `OPENAI_API_KEY` environment variable
- **Local works**: `.env` file has the key, but that's only for local development
- **Production fails**: Render environment variables don't include OpenAI key

## 🔧 Solution: Add OPENAI_API_KEY to Render

### Step 1: Access Render Dashboard
1. Go to: https://dashboard.render.com
2. Sign in with your account
3. Navigate to your service: **mittschema-gurobi-backend**

### Step 2: Add Environment Variable
1. Click on the **mittschema-gurobi-backend** service
2. Go to the **Environment** tab (left sidebar)
3. Click **"Add Environment Variable"**
4. Add the following:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `OPENAI_API_KEY` | `sk-proj-TL9L38XYl_aNI8tcodBlyL_3osb...` | Copy from local `.env` file |
   | `OPENAI_MODEL` | `gpt-4o` | Already in render.yaml |

5. Click **"Save Changes"**

### Step 3: Deploy the Changes
Render will automatically trigger a new deployment when you save environment variables.

Alternatively, you can manually trigger a deployment:
1. Go to the **"Manual Deploy"** section
2. Click **"Deploy latest commit"**
3. Or use the deploy script:
   ```bash
   ./deploy-render.sh
   ```

### Step 4: Verify Deployment

Wait for deployment to complete (usually 2-3 minutes), then test:

#### Test 1: Health Endpoint
```bash
curl https://mittschema-gurobi-backend.onrender.com/api/constraints/health
```

**Expected Response** (with OpenAI configured):
```json
{
  "status": "healthy",
  "openai_configured": true,
  "openai_model": "gpt-4o",
  "features": [
    "swedish_language",
    "function_calling",
    "date_parsing"
  ]
}
```

#### Test 2: Parse Endpoint
```bash
curl -X POST https://mittschema-gurobi-backend.onrender.com/api/constraints/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Charlotte ska inte jobba natt 15 november",
    "department": "Akutmottagning"
  }'
```

**Expected Response** (successful parsing):
```json
{
  "constraint": {
    "employee_id": "...",
    "constraint_type": "unavailable_shift",
    "shift_type": "night",
    "specific_date": "2025-11-15",
    "metadata": {
      "original_text": "Charlotte ska inte jobba natt 15 november",
      "language": "swedish",
      "confidence": "high"
    }
  }
}
```

#### Test 3: Production Website
1. Go to: https://mitt-schema.vercel.app
2. Navigate to the Schedule page
3. Find the AI Constraint Input section
4. Enter: **"charlotte ska inte jobb natten 14 november"**
5. Click **"Lägg till"**
6. Should see: ✅ Success message, not ❌ "OpenAI API key not configured"

## 📝 render.yaml Configuration

The `scheduler-api/render.yaml` file has been updated to include the OpenAI configuration:

```yaml
envVars:
  - key: SUPABASE_URL
    value: https://ebyvourlaomcwitpibdl.supabase.co
  - key: SUPABASE_KEY
    value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - key: OPENAI_API_KEY
    sync: false  # Managed via Render Dashboard for security
  - key: OPENAI_MODEL
    value: gpt-4o
```

**Note**: `OPENAI_API_KEY` uses `sync: false` which means:
- The key is **NOT** stored in the yaml file (for security)
- You **MUST** add it manually in Render Dashboard
- This prevents accidentally committing secrets to git

## 🔐 Security Best Practices

### Why not commit the API key?
- API keys are secrets and should never be in version control
- GitHub will scan for exposed keys and invalidate them
- Use environment variables in deployment platforms instead

### Where to store the key?
- ✅ **Local development**: `.env` file (in `.gitignore`)
- ✅ **Production (Render)**: Environment variables in dashboard
- ✅ **Production (Vercel)**: Frontend doesn't need the key (backend handles it)
- ❌ **Git repository**: Never commit secrets

### Getting a new OpenAI API key (if needed)
1. Go to: https://platform.openai.com/api-keys
2. Sign in with your OpenAI account
3. Click **"Create new secret key"**
4. Copy the key immediately (it won't be shown again)
5. Add to both `.env` and Render dashboard

## 📊 Architecture Overview

```
┌─────────────────┐
│  User Browser   │
│  (Production)   │
└────────┬────────┘
         │
         │ HTTPS Request
         ▼
┌─────────────────┐      ┌──────────────────┐
│     Vercel      │      │   Render Backend │
│   (Frontend)    │─────▶│   (Python API)   │
│ mitt-schema.    │      │ mittschema-      │
│ vercel.app      │      │ gurobi-backend   │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  │ API Call
                                  ▼
                         ┌─────────────────┐
                         │   OpenAI API    │
                         │   GPT-4o        │
                         │ (Swedish NLP)   │
                         └─────────────────┘
```

### Environment Variables by Platform

| Variable | Local (.env) | Vercel | Render | Purpose |
|----------|--------------|--------|--------|---------|
| `VITE_SCHEDULER_API_URL` | ✅ | ✅ | ❌ | Frontend config |
| `SUPABASE_URL` | ✅ | ❌ | ✅ | Backend database |
| `SUPABASE_KEY` | ✅ | ❌ | ✅ | Backend database |
| `OPENAI_API_KEY` | ✅ | ❌ | ✅ | AI parsing |
| `OPENAI_MODEL` | ✅ | ❌ | ✅ | AI model version |

## 🐛 Troubleshooting

### Issue: Still getting "OpenAI API key not configured"
**Solutions**:
1. Verify the key is added in Render dashboard (Environment tab)
2. Check deployment logs for errors
3. Ensure deployment completed successfully
4. Wait 2-3 minutes for deployment to propagate
5. Test health endpoint to confirm: `openai_configured: true`

### Issue: Health endpoint shows `openai_configured: false`
**Solutions**:
1. Check Render dashboard Environment variables
2. Verify `OPENAI_API_KEY` is present and correct
3. Trigger manual deployment after adding the key
4. Check Render logs for startup errors

### Issue: Deployment fails after adding environment variable
**Solutions**:
1. Check Render build logs for errors
2. Verify all dependencies in `requirements.txt`
3. Ensure `openai==1.54.3` is installed
4. Check `httpx==0.27.2` version (must be 0.27.x for compatibility)

### Issue: "Invalid API key" error
**Solutions**:
1. Verify you copied the complete key (starts with `sk-proj-`)
2. Check for extra spaces or newlines
3. Generate a new key from OpenAI dashboard
4. Update both `.env` and Render dashboard

## 📚 Related Documentation

- **AI Feature Implementation**: See previous conversation history
- **Local Testing**: All endpoints work on `localhost:8080`
- **Frontend Integration**: `src/components/schedule/AIConstraintInput.tsx`
- **Backend Service**: `scheduler-api/services/openai_constraint_service.py`
- **API Routes**: `scheduler-api/routes/constraint_routes.py`

## ✅ Success Checklist

After following this guide, verify:

- [ ] Render dashboard shows `OPENAI_API_KEY` in Environment tab
- [ ] Render deployment completed successfully (green checkmark)
- [ ] Health endpoint returns `"openai_configured": true`
- [ ] Parse endpoint successfully processes Swedish text
- [ ] Production website (mitt-schema.vercel.app) AI chat works
- [ ] No console errors in browser when using AI feature
- [ ] Swedish constraint text successfully converted to Gurobi format

## 🎉 Completion

Once all checklist items are verified, the AI constraint feature is **fully deployed** and **production-ready**!

Users can now input natural language Swedish constraints like:
- "Charlotte ska inte jobba natt 15 november"
- "Erik vill arbeta dagtid alla måndagar"
- "Sara är tillgänglig endast kvällar i januari"

The system will automatically:
1. Parse the Swedish text using GPT-4o
2. Extract employee, dates, shift types
3. Convert to Gurobi optimization constraints
4. Apply to schedule generation

---

**Last Updated**: 2025-01-XX
**Status**: 🟡 Awaiting Render environment variable configuration
