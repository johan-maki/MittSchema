from fastapi import FastAPI
from supabase import create_client
from ortools.sat.python import cp_model
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Connect to Supabase using environment variables
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@app.get("/")
def home():
    return {"status": "Scheduler API active"}

@app.post("/optimize-schedule")
def optimize():
    # Fetch employees and shifts from Supabase
    employees = supabase.table("employees").select("*").execute().data
    shifts = supabase.table("shifts").select("*").execute().data

    model = cp_model.CpModel()

    # Decision variables
    assignments = {}
    for e in employees:
        for s in shifts:
            assignments[(e['id'], s['id'])] = model.NewBoolVar(f"{e['id']}_{s['id']}")

    # Constraint: Exactly one employee per shift (for demo purposes)
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
