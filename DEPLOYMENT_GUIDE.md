# MittSchema - Deployment Guide

## 🚀 Live Deployment URL

**Your application will be available at:** `https://mitt-schema.vercel.app`

## 📋 Deployment Steps

### Option 1: Deploy via Vercel Website (Recommended)

1. **Go to Vercel**: Visit [https://vercel.com](https://vercel.com)
2. **Sign up/Login**: Create account or login with GitHub
3. **Import Project**: Click "New Project" → "Import Git Repository"
4. **Select Repository**: Choose `johan-maki/MittSchema`
5. **Configure Project**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Environment Variables** (Add these in Vercel dashboard):
   ```
   VITE_SCHEDULER_API_URL=https://scheduler3-723515091945.europe-north2.run.app
   VITE_ENABLE_SCHEDULER_API=true
   VITE_ENABLE_LOCAL_FALLBACK=true
   VITE_ENABLE_DEV_TOOLS=false
   ```

7. **Deploy**: Click "Deploy" and wait for deployment to complete

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel --prod
```

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SCHEDULER_API_URL": "https://scheduler3-723515091945.europe-north2.run.app",
    "VITE_ENABLE_SCHEDULER_API": "true",
    "VITE_ENABLE_LOCAL_FALLBACK": "true",
    "VITE_ENABLE_DEV_TOOLS": "false"
  }
}
```

## 🎯 What's Included

### ✅ Production Features
- **Real Supabase Database**: Connected to production database
- **Sample Employees**: Automatically creates demo employees in production
- **Schedule Generation**: Full OR-Tools AI scheduling functionality
- **Mobile Responsive**: Works on all devices
- **Fast Loading**: Optimized for production performance

### ✅ Demo Data
Your colleague will see these sample employees:
- Maria Andersson (Läkare)
- Erik Johansson (Sjuksköterska) 
- Sara Petersson (Undersköterska)
- Johan Lindberg (Läkare)
- Anna Karlsson (Sjuksköterska)
- Peter Svensson (Undersköterska)

### ✅ Working Features
- **Employee Directory**: View and manage staff
- **Schedule Generation**: AI-powered schedule creation
- **Calendar Views**: Day, week, and month views
- **Schedule Settings**: Configurable constraints and rules
- **Shift Management**: Create and edit individual shifts

## 🌐 Production vs Development

- **Local Development**: Uses mock data and test employees
- **Production**: Uses real Supabase database with sample employees
- **Automatic Detection**: Environment automatically detected

## 📱 Sharing with Colleague

Once deployed, share this information:

**URL**: `https://mitt-schema.vercel.app` (or your custom domain)

**How to test**:
1. Visit the URL
2. Go to "Schema" page
3. Click "Generera schema" button
4. View generated schedule in preview dialog
5. Test "Katalog" to see employees
6. Try different calendar views

## 🔧 Troubleshooting

### If deployment fails:
1. Check Vercel build logs
2. Verify environment variables are set
3. Ensure all dependencies are in package.json
4. Check that build command succeeds locally

### If app doesn't work:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check if sample employees were created
4. Test schedule generation functionality

## 🚀 Next Steps

After successful deployment:
1. Share URL with colleague
2. Monitor application performance
3. Check user feedback
4. Plan additional features based on usage

---

**Note**: The application is configured to automatically create sample employees for demo purposes. In a real production environment, you would remove the auto-employee creation and implement proper user management.
