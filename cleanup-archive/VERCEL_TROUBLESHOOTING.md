# Vercel Troubleshooting Guide

## Common Vercel Loading Errors

### 1. Environment Variables Missing
**Symptom**: "Laddningsfel" / Loading Error

**Solution**: Add environment variables in Vercel Dashboard:
- Go to Project Settings > Environment Variables
- Add the following variables:

```
VITE_SUPABASE_URL=https://smblztfikisrnqfjmyqj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYmx6dGZpa2lzcm5xZmpteXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MjY4MjgsImV4cCI6MjA1NTQwMjgyOH0.yzDHEqCpNAThHKy1hNwXEUpSfgrkSchpmPuES27j8BY
VITE_SCHEDULER_API_URL=https://scheduler3-723515091945.europe-north2.run.app
VITE_ENABLE_SCHEDULER_API=true
VITE_ENABLE_LOCAL_FALLBACK=true
VITE_ENABLE_DEV_TOOLS=false
```

### 2. Build Configuration Issues
**Symptom**: Build fails or app doesn't load

**Solution**: 
- Framework should be auto-detected as "Vite"
- Build command: `npm run build`
- Output directory: `dist`

### 3. SPA Routing Issues
**Symptom**: 404 errors on refresh or direct URL access

**Solution**: Ensure `vercel.json` has proper rewrites (already configured)

### 4. Console Debugging
**Check browser console for errors:**
- Right-click → Inspect → Console tab
- Look for red error messages
- Check Network tab for failed requests

### 5. Quick Fix Steps
1. **Redeploy**: Go to Vercel Dashboard → Project → Deployments → "Redeploy"
2. **Clear Cache**: In deployment settings, enable "Force new build"
3. **Check Logs**: View build logs in Vercel dashboard for detailed errors

### 6. Fallback Solution
If still having issues, the app has been configured with:
- Better error handling
- Environment variable fallbacks
- Mock data when APIs are unavailable

The app should now display helpful error messages instead of generic loading errors.
