
# Scheduler API for Supabase Shift Data

## Overview

This service is a FastAPI-based backend that interacts with Supabase to manage shift scheduling data using Google OR-Tools for optimization.

## Features

- Optimizes employee schedules based on constraints
- Integrates with Supabase for employee and shift data
- Uses Google OR-Tools for constraint programming
- Handles employee preferences and shift requirements

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set environment variables:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   PORT=8080  # Default for Cloud Run
   ```

3. Run locally:
   ```bash
   uvicorn scheduler:app --reload
   ```

## Deployment to Google Cloud Run

1. Build the Docker image:
   ```bash
   docker build -t scheduler-api .
   ```

2. Tag and push to Google Container Registry:
   ```bash
   docker tag scheduler-api gcr.io/your-project-id/scheduler-api
   docker push gcr.io/your-project-id/scheduler-api
   ```

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy scheduler-api \
     --image gcr.io/your-project-id/scheduler-api \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars="SUPABASE_URL=your-supabase-url,SUPABASE_KEY=your-supabase-key"
   ```

## API Endpoints

- `GET /`: Health check endpoint
- `POST /optimize-schedule`: Generate optimized schedules

## Schedule Optimization Logic

The scheduler uses the following constraints:
- Employees can only work one shift per day
- Minimum required employees per shift type
- Maximum consecutive workdays
- Employee work preferences (preferred shifts, max shifts per week)
- Department-specific requirements

## Integration with Frontend

The frontend can connect to this API directly or through Supabase Edge Functions. For real-time updates, the frontend can subscribe to Supabase's real-time functionality to receive notifications when shifts are updated.
