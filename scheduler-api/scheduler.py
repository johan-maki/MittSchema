from fastapi import FastAPI
from supabase import create_client, Client
from ortools.sat.python import cp_model
import os
import uvicorn

# Load environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PORT = int(os.getenv("PORT", 8080))  # Default to 8080 if not set

# Validate environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check environment variables.")

# Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

@app.get("/")
def home():
    return {"status": "Scheduler API active"}

@app.post("/optimize-schedule")
def optimize():
    try:
        employees_response = supabase.table("employees").select("*").execute()
        shifts_response = supabase.table("shifts").select("*").execute()

        employees = employees_response.data or []
        shifts = shifts_response.data or []

        if not employees or not shifts:
            return {"error": "No employees or shifts found in the database"}

        model = cp_model.CpModel()

        # Decision variables
        assignments = {}
        for e in employees:
            for s in shifts:
                assignments[(e['id'], s['id'])] = model.NewBoolVar(f"{e['id']}_{s['id']}")

        # Constraint: Exactly one employee per shift
        for s in shifts:
            model.AddExactlyOne(assignments[(e['id'], s['id'])] for e in employees)

        solver = cp_model.CpSolver()
        status = solver.Solve(model)

        if status == cp_model.OPTIMAL:
            results = [{"shift_id": s['id'], "employee_id": e['id']}
                       for s in shifts for e in employees
                       if solver.Value(assignments[(e['id'], s['id'])])]
            return {"optimized_schedule": results}
        else:
            return {"error": "Optimization failed or no optimal solution found"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    print(f"Starting FastAPI on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
