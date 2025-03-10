from fastapi import FastAPI
from supabase import create_client
from ortools.sat.python import cp_model
import os
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI()

# Debug: Print environment variables (REMOVE in production)
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_KEY: {os.getenv('SUPABASE_KEY')}")
print(f"PORT: {os.getenv('PORT', '8080')}")  # Cloud Run uses this port

# Connect to Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Supabase credentials are missing. Check environment variables.")

supabase = create_client(supabase_url, supabase_key)

@app.get("/")
def home():
    return {"status": "Scheduler API active"}

@app.post("/optimize-schedule")
def optimize():
    try:
        employees_response = supabase.table("employees").select("*").execute()
        shifts_response = supabase.table("shifts").select("*").execute()

        # Debugging responses
        print(f"Employees Response: {employees_response}")
        print(f"Shifts Response: {shifts_response}")

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
        print(f"Error in optimization: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))  # Cloud Run dynamically assigns the port
    print(f"Starting FastAPI on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
