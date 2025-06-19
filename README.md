# Vårdschema - AI-Driven Employee Scheduling System

A complete, production-ready healthcare staff scheduling application built with React, TypeScript, Supabase, and Python FastAPI with Gurobi optimization.

## 🚀 Features

- **AI-Powered Scheduling**: Uses Gurobi for mathematical optimization
- **Real-time Updates**: Supabase integration for live data synchronization
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **User Authentication**: Secure login with Supabase Auth
- **Employee Management**: Complete CRUD operations for staff profiles
- **Schedule Optimization**: Advanced constraint solving with experience levels and availability
- **Multiple Views**: Day, week, and month calendar views with full CRUD operations
- **Employee Directory**: Searchable staff directory with role filtering
- **Employee Profiles**: Individual employee schedules and work preferences
- **Fallback System**: Local scheduling when API is unavailable
- **Health Monitoring**: Built-in system status monitoring
- **Production Ready**: Full build pipeline and deployment configuration

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: Vite + React 18
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query + React Context
- **Authentication**: Supabase Auth
- **Routing**: React Router v6

### Backend (Python FastAPI)
- **API Framework**: FastAPI
- **Optimization**: Gurobi Mathematical Optimizer
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Google Cloud Run
- **CORS**: Enabled for cross-origin requests

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Supabase account
- Google Cloud Platform account (for API deployment)
- Docker (for containerization)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd vardschema-v1
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_SCHEDULER_API_URL=https://your-scheduler-api-url
VITE_ENABLE_SCHEDULER_API=true
VITE_ENABLE_LOCAL_FALLBACK=true
```

### 3. Backend Setup

```bash
cd scheduler-api

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL="your_supabase_url"
export SUPABASE_KEY="your_supabase_key"
export PORT=8080
```

## 🚀 Running the Application

### Development Mode

**Frontend:**
```bash
npm run dev
# Opens at http://localhost:8080
```

**Backend (Local):**
```bash
cd scheduler-api
uvicorn app:app --reload --port 8080
```

### Production Deployment

**Frontend:**
```bash
npm run build
npm run preview
```

**Backend (Google Cloud Run):**
```bash
cd scheduler-api
chmod +x deploy.sh
export PROJECT_ID="your-gcp-project-id"
export SUPABASE_URL="your_supabase_url"
export SUPABASE_KEY="your_supabase_key"
./deploy.sh
```

## 🗄️ Database Schema

The application uses Supabase with the following main tables:

- `employees`: Staff profiles with experience levels and preferences
- `shifts`: Individual work shifts with timestamps and assignments
- `schedule_settings`: Department-specific scheduling constraints
- `leave_requests`: Employee time-off requests
- `notifications`: System notifications

## 📊 API Endpoints

### Scheduler API

- `GET /`: Health check
- `GET /health`: Detailed health status with database connectivity
- `POST /optimize-schedule`: Generate optimized schedule

**Request Example:**
```json
{
  "start_date": "2025-06-01T00:00:00Z",
  "end_date": "2025-06-30T23:59:59Z",
  "department": "General",
  "random_seed": 123456,
  "constraints": {
    "max_consecutive_days": 5,
    "min_rest_hours": 11,
    "max_shifts_per_day": 1
  }
}
```

## 🔧 Configuration

### Scheduling Constraints

The system supports configurable constraints:

- Maximum consecutive working days
- Minimum rest hours between shifts
- Experience level requirements per shift
- Minimum staff per shift type
- Department-specific rules

### Environment Variables

**Frontend:**
- `VITE_SCHEDULER_API_URL`: Scheduler API endpoint
- `VITE_ENABLE_SCHEDULER_API`: Enable/disable API calls
- `VITE_ENABLE_LOCAL_FALLBACK`: Enable local scheduling fallback

**Backend:**
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase service key
- `PORT`: Server port (default: 8080)

## 🔍 Monitoring & Health Checks

The application includes built-in health monitoring:

- **Frontend**: System status component shows API and database connectivity
- **Backend**: Health endpoint provides detailed system status
- **Error Handling**: Comprehensive error boundaries and retry logic

## 🚨 Troubleshooting

### Common Issues

**1. API Connection Failed**
- Check if scheduler API is deployed and accessible
- Verify CORS settings
- Ensure environment variables are set correctly

**2. Database Connection Issues**
- Verify Supabase credentials
- Check network connectivity
- Confirm database schema is up to date

**3. Scheduling Optimization Fails**
- Review employee data completeness
- Check constraint settings
- Monitor API logs for OR-Tools errors

### Development Tips

- Use browser DevTools to monitor API calls
- Check the System Status component on the Help page
- Enable local fallback for offline development
- Review console logs for detailed error information

## 📝 License

This project is developed for healthcare staff scheduling optimization.

## 🤝 Support

For technical support or questions:
- Check the in-app Help page
- Review system status on the Help page
- Contact your system administrator

---

**Version**: 1.2.0  
**Last Updated**: June 2025

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/78ac2d2a-1a83-481b-b1fc-31e7d8c7ea83) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
