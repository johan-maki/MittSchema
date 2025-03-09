
# Lovable Schedule Optimizer

This project demonstrates the integration of Google OR-Tools for optimizing employee schedules with a React frontend and Supabase backend.

## Project Structure

```
lovable-dev/
├── public/                     # Static assets
├── src/                        # React frontend
│   ├── api/                    # API integration
│   │   └── scheduleApi.ts      # Schedule optimization API client
│   ├── components/             # React components
│   ├── pages/                  # Page components
│   └── ...
├── supabase/                   # Supabase configuration
│   ├── functions/              # Edge Functions
│   │   └── optimize-schedule/  # Schedule optimizer edge function
│   │       ├── index.ts        # Edge function implementation
│   │       └── README.md       # Documentation for OR-Tools integration
│   └── ...
```

## Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: Supabase Edge Functions
- **Optimization**: Google OR-Tools (planned integration)
- **Database**: PostgreSQL (via Supabase)

## Optimization Strategy

The current implementation provides a placeholder for Google OR-Tools integration. To fully implement OR-Tools:

1. Create a separate Python service using OR-Tools CP-SAT solver
2. Deploy this service where it can be accessed by the Edge Function
3. Update the Edge Function to call the Python service API

## Getting Started

1. Set up the frontend:
   ```
   npm install
   npm run dev
   ```

2. Deploy the Edge Function:
   ```
   npx supabase functions deploy optimize-schedule
   ```

## Future Work

- Implement a Python service with OR-Tools CP-SAT solver
- Create constraints based on hospital scheduling requirements
- Develop objective functions for optimal scheduling
- Add visualization of optimization results

## License

MIT
