from fastapi import FastAPI
from supabase import create_client, Client
from ortools.sat.python import cp_model
import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Fetch environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PORT = int(os.getenv("PORT", 8080))  # Default to 8080 if PORT is not set

# Ensure Supabase credentials exist
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials are missing. Check environment variables.")

# Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/")
def home():
    return {"status": "Scheduler API active"}

@app.post("/optimize-schedule")
def optimize():
    try:
        # Fetch employees and shifts from Supabase
        employees_response = supabase.table("employees").select("*").execute()
        shifts_response = supabase.table("shifts").select("*").execute()

        employees = employees_response.data or []
        shifts = shifts_response.data or []

        if not employees or not shifts:
            return {"error": "No employees or shifts found in the database"}

        # Create an OR-Tools model
        model = cp_model.CpModel()

        # Decision variables
        assignments = {
            (e['id'], s['id']): model.NewBoolVar(f"{e['id']}_{s['id']}")
            for e in employees for s in shifts
        }

        # Constraint: Each shift must be assigned to exactly one employee
        for s in shifts:
            model.AddExactlyOne(assignments[(e['id'], s['id'])] for e in employees)

        # Solve the model
        solver = cp_model.CpSolver()
        status = solver.Solve(model)

        # Process results
        if status == cp_model.OPTIMAL:
            results = [
                {"shift_id": s['id'], "employee_id": e['id']}
                for s in shifts for e in employees
                if solver.Value(assignments[(e['id'], s['id'])])
            ]
            return {"optimized_schedule": results}
        else:
            return {"error": "Optimization failed or no optimal solution found"}
    
    except Exception as e:
        print(f"Error in optimization: {e}")
        return {"error": str(e)}

import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))  # Ensure PORT is an integer
    print(f"Starting FastAPI on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)

