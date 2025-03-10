
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from ortools.sat.python import cp_model
import os
import uvicorn
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

# Load environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PORT = int(os.getenv("PORT", 8080))  # Default to 8080 if not set

# Validate environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check environment variables.")

# Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Scheduler API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class ScheduleRequest(BaseModel):
    start_date: str
    end_date: str
    department: Optional[str] = None

class ScheduleResponse(BaseModel):
    schedule: List[Dict[str, Any]]
    message: str

@app.get("/")
def home():
    return {"status": "Scheduler API active", "version": "1.0.0"}

@app.post("/optimize-schedule", response_model=ScheduleResponse)
async def optimize_schedule(request: ScheduleRequest):
    try:
        # Parse date range
        start_date = datetime.fromisoformat(request.start_date)
        end_date = datetime.fromisoformat(request.end_date)
        date_range = (end_date - start_date).days + 1
        
        if date_range <= 0 or date_range > 31:
            raise HTTPException(status_code=400, detail="Invalid date range. Maximum period is 31 days.")

        # Fetch employees and settings from Supabase
        employees_response = supabase.table("employees").select("*").execute()
        settings_response = supabase.table("schedule_settings").select("*").maybeSingle().execute()
        
        employees = employees_response.data
        settings = settings_response.data or {}

        if not employees:
            raise HTTPException(status_code=404, detail="No employees found in the database")

        # Create date_list for the scheduling period
        date_list = [start_date + timedelta(days=i) for i in range(date_range)]
        
        # Initialize the constraint solver model
        model = cp_model.CpModel()
        
        # Mapping for shift types
        shift_types = ["day", "evening", "night"]
        
        # Create variables for each employee, date, and shift type
        # Variable will be 1 if employee e works on date d in shift s, 0 otherwise
        shifts = {}
        for e in employees:
            for d in range(len(date_list)):
                for s in shift_types:
                    shifts[(e['id'], d, s)] = model.NewBoolVar(f"shift_{e['id']}_{d}_{s}")
        
        # Constraint 1: An employee can only work at most one shift per day
        for e in employees:
            for d in range(len(date_list)):
                model.Add(sum(shifts[(e['id'], d, s)] for s in shift_types) <= 1)
        
        # Constraint 2: Minimum required employees per shift type per day
        min_employees = settings.get('min_employees_per_shift', 1)
        for d in range(len(date_list)):
            for s in shift_types:
                model.Add(sum(shifts[(e['id'], d, s)] for e in employees) >= min_employees)
        
        # Constraint 3: Maximum number of consecutive workdays
        max_consecutive_days = settings.get('max_consecutive_days', 5)
        for e in employees:
            for d in range(len(date_list) - max_consecutive_days + 1):
                # Sum of shifts for consecutive days
                consecutive_shifts = []
                for i in range(max_consecutive_days + 1):
                    if d + i < len(date_list):
                        for s in shift_types:
                            consecutive_shifts.append(shifts[(e['id'], d + i, s)])
                # Ensure no more than max_consecutive_days consecutive workdays
                model.Add(sum(consecutive_shifts) <= max_consecutive_days)
        
        # Constraint 4: Respect employee work preferences if available
        for e in employees:
            work_prefs = e.get('work_preferences', {})
            if work_prefs:
                # Handle preferred shifts
                preferred_shifts = work_prefs.get('preferred_shifts', [])
                if preferred_shifts:
                    for d in range(len(date_list)):
                        for s in shift_types:
                            if s not in preferred_shifts:
                                # Discourage non-preferred shifts (soft constraint)
                                model.Add(shifts[(e['id'], d, s)] == 0).OnlyEnforceIf(shifts[(e['id'], d, s)])
                
                # Handle max shifts per week
                max_shifts_per_week = work_prefs.get('max_shifts_per_week', 5)
                for week_start in range(0, len(date_list), 7):
                    week_end = min(week_start + 7, len(date_list))
                    week_shifts = []
                    for d in range(week_start, week_end):
                        for s in shift_types:
                            week_shifts.append(shifts[(e['id'], d, s)])
                    model.Add(sum(week_shifts) <= max_shifts_per_week)
        
        # Create the solver and solve
        solver = cp_model.CpSolver()
        status = solver.Solve(model)
        
        # Process the solution
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            # Convert solution to shifts
            optimized_shifts = []
            for e in employees:
                for d in range(len(date_list)):
                    for s in shift_types:
                        if solver.Value(shifts[(e['id'], d, s)]) == 1:
                            date = date_list[d]
                            # Create shift times based on shift type
                            if s == "day":
                                start_time = datetime(date.year, date.month, date.day, 8, 0)
                                end_time = datetime(date.year, date.month, date.day, 16, 0)
                            elif s == "evening":
                                start_time = datetime(date.year, date.month, date.day, 16, 0)
                                end_time = datetime(date.year, date.month, date.day, 0, 0) + timedelta(days=1)
                            else:  # night
                                start_time = datetime(date.year, date.month, date.day, 0, 0)
                                end_time = datetime(date.year, date.month, date.day, 8, 0)
                            
                            shift = {
                                "employee_id": e['id'],
                                "start_time": start_time.isoformat(),
                                "end_time": end_time.isoformat(),
                                "shift_type": s,
                                "department": e.get('department', 'General'),
                                "is_published": False
                            }
                            optimized_shifts.append(shift)
            
            # Optional: Save the generated shifts to Supabase
            if optimized_shifts:
                # Clear existing unpublished shifts first
                supabase.table("shifts").delete().eq("is_published", False).execute()
                
                # Insert new shifts in batches to avoid timeouts
                BATCH_SIZE = 50
                for i in range(0, len(optimized_shifts), BATCH_SIZE):
                    batch = optimized_shifts[i:i+BATCH_SIZE]
                    supabase.table("shifts").insert(batch).execute()
            
            return {
                "schedule": optimized_shifts,
                "message": f"Successfully generated {len(optimized_shifts)} shifts for {len(employees)} employees"
            }
        else:
            raise HTTPException(
                status_code=400, 
                detail="No feasible schedule found. Try relaxing some constraints or adding more employees."
            )
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=f"Error optimizing schedule: {error_detail}")

if __name__ == "__main__":
    print(f"Starting Scheduler API on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
