
from ortools.sat.python import cp_model
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from config import SCHEDULING_CONSTRAINTS, logger
from utils import create_date_list, format_shift_times

def optimize_schedule(employees: List[Dict], start_date: datetime, end_date: datetime, department: Optional[str] = None):
    """Core function to optimize the employee schedule using CP-SAT solver"""
    if not employees:
        logger.warning("No employees found in the database")
        raise HTTPException(status_code=404, detail="No employees found in the database")
    
    # Create date list for the scheduling period
    date_list = create_date_list(start_date, end_date)
    logger.info(f"Created date list from {date_list[0]} to {date_list[-1]}")
    
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
    
    logger.info(f"Created {len(employees) * len(date_list) * len(shift_types)} shift variables")
    
    # Track staffing issues during constraint building
    staffing_issues = []
    
    # ---- CORE CONSTRAINTS ----
    
    # Constraint 1: An employee can only work at most one shift per day
    for e in employees:
        for d in range(len(date_list)):
            model.Add(sum(shifts[(e['id'], d, s)] for s in shift_types) <= 1)
    
    # Constraint 2: Minimum required employees per shift type per day
    for d in range(len(date_list)):
        date_str = date_list[d].strftime("%Y-%m-%d")
        for s in shift_types:
            min_staff = SCHEDULING_CONSTRAINTS["shift_types"][s]["min_staff"]
            staff_sum = sum(shifts[(e['id'], d, s)] for e in employees)
            
            # Try to enforce minimum staffing, but allow the solver to find a solution
            # even if it can't meet this constraint exactly
            staff_satisfaction = model.NewBoolVar(f"min_staff_{d}_{s}")
            model.Add(staff_sum >= min_staff).OnlyEnforceIf(staff_satisfaction)
            model.Add(staff_sum < min_staff).OnlyEnforceIf(staff_satisfaction.Not())
            
            # Maximize satisfaction of staffing constraints in the objective
            model.Maximize(sum([staff_satisfaction for d in range(len(date_list)) for s in shift_types]))
            
            # Log potential staffing issues for reporting
            if len(employees) < min_staff:
                staffing_issues.append({
                    "date": date_str,
                    "shiftType": s,
                    "current": len(employees),
                    "required": min_staff
                })
    
    # Constraint 3: Maximum number of consecutive workdays
    max_consecutive_days = SCHEDULING_CONSTRAINTS["max_consecutive_days"]
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
    
    # Constraint 4: Minimum rest hours between shifts
    min_rest_hours = SCHEDULING_CONSTRAINTS["min_rest_hours"]
    for e in employees:
        for d1 in range(len(date_list)):
            for s1 in shift_types:
                end_hour_s1 = SCHEDULING_CONSTRAINTS["shift_types"][s1]["end_hour"]
                
                # For each potential next shift
                for d2 in range(len(date_list)):
                    # Only check if d2 is the same day or the next day
                    if d2 != d1 and d2 != d1 + 1:
                        continue
                        
                    for s2 in shift_types:
                        start_hour_s2 = SCHEDULING_CONSTRAINTS["shift_types"][s2]["start_hour"]
                        
                        # Calculate hours between shifts
                        hours_between = 0
                        if d2 > d1:  # Next day
                            hours_between = 24 - end_hour_s1 + start_hour_s2
                        else:  # Same day
                            hours_between = start_hour_s2 - end_hour_s1
                            
                        # Skip if rest time is sufficient
                        if hours_between >= min_rest_hours:
                            continue
                            
                        # Create a constraint that if shift1 is worked, then shift2 cannot be worked
                        # because there's not enough rest time between them
                        shift1 = shifts[(e['id'], d1, s1)]
                        shift2 = shifts[(e['id'], d2, s2)]
                        model.AddBoolOr([shift1.Not(), shift2.Not()])
    
    # Add remaining constraints
    _add_experience_constraints(model, shifts, employees, date_list, shift_types, staffing_issues)
    _add_employee_preference_constraints(model, shifts, employees, date_list, shift_types)
    
    # Create the solver and solve
    logger.info("Creating CP-SAT solver")
    solver = cp_model.CpSolver()
    
    # Set time limit for solver (in seconds)
    solver.parameters.max_time_in_seconds = 60.0  # 1 minute max
    
    logger.info("Starting solver")
    status = solver.Solve(model)
    logger.info(f"Solver status: {solver.StatusName(status)}")
    
    # Process the solution
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        return _process_solution(solver, shifts, employees, date_list, shift_types, department, staffing_issues)
    else:
        logger.error(f"Failed to find feasible schedule. Status: {solver.StatusName(status)}")
        raise HTTPException(
            status_code=400, 
            detail="No feasible schedule found. Try relaxing some constraints or adding more employees."
        )

def _add_experience_constraints(model, shifts, employees, date_list, shift_types, staffing_issues):
    """Add constraints related to experience levels"""
    for d in range(len(date_list)):
        for s in shift_types:
            # Require minimum experience sum for each shift
            min_experience_sum = SCHEDULING_CONSTRAINTS["shift_types"][s]["min_experience_sum"]
            total_experience = sum([
                shifts[(e['id'], d, s)] * e.get('experience_level', 1) 
                for e in employees
            ])
            
            # Create a soft constraint for experience
            exp_satisfaction = model.NewBoolVar(f"min_exp_{d}_{s}")
            model.Add(total_experience >= min_experience_sum).OnlyEnforceIf(exp_satisfaction)
            model.Add(total_experience < min_experience_sum).OnlyEnforceIf(exp_satisfaction.Not())
            
            # Add to objective
            model.Maximize(sum([exp_satisfaction for d in range(len(date_list)) for s in shift_types]))
            
            # Constraint: Senior staff requirements (based on experience threshold)
            min_senior_count = SCHEDULING_CONSTRAINTS["shift_types"][s]["min_senior_count"]
            senior_threshold = SCHEDULING_CONSTRAINTS["senior_experience_threshold"]
            
            senior_count = sum([
                shifts[(e['id'], d, s)] 
                for e in employees 
                if e.get('experience_level', 1) >= senior_threshold
            ])
            
            # Soft constraint for senior staff
            senior_satisfaction = model.NewBoolVar(f"min_senior_{d}_{s}")
            model.Add(senior_count >= min_senior_count).OnlyEnforceIf(senior_satisfaction)
            model.Add(senior_count < min_senior_count).OnlyEnforceIf(senior_satisfaction.Not())
            
            # Add to objective
            model.Maximize(sum([senior_satisfaction for d in range(len(date_list)) for s in shift_types]))

def _add_employee_preference_constraints(model, shifts, employees, date_list, shift_types):
    """Add constraints related to employee preferences"""
    # Night shift qualifications (if required)
    if SCHEDULING_CONSTRAINTS["require_night_shift_qualification"]:
        for e in employees:
            # Skip employees with no role data
            if not e.get('role'):
                continue
                
            # Simple logic: Only doctors and nurses can work night shifts
            can_work_night = e.get('role') in ['Läkare', 'Sjuksköterska']
            
            for d in range(len(date_list)):
                # Prevent unqualified staff from working night shifts
                if not can_work_night:
                    model.Add(shifts[(e['id'], d, 'night')] == 0)
    
    # Respect employee work preferences if available
    for e in employees:
        work_prefs = e.get('work_preferences', {})
        if work_prefs:
            # Handle preferred shifts
            preferred_shifts = work_prefs.get('preferred_shifts', [])
            if preferred_shifts:
                for d in range(len(date_list)):
                    for s in shift_types:
                        # Create soft constraint to encourage assigning preferred shifts
                        if s in preferred_shifts:
                            # Give bonus weight to preferred shifts in the objective
                            model.Maximize(sum([shifts[(e['id'], d, s)] for d in range(len(date_list)) for s in preferred_shifts]))
            
            # Handle max shifts per week
            max_shifts_per_week = work_prefs.get('max_shifts_per_week', 5)
            for week_start in range(0, len(date_list), 7):
                week_end = min(week_start + 7, len(date_list))
                week_shifts = []
                for d in range(week_start, week_end):
                    for s in shift_types:
                        week_shifts.append(shifts[(e['id'], d, s)])
                model.Add(sum(week_shifts) <= max_shifts_per_week)

def _process_solution(solver, shifts, employees, date_list, shift_types, department, staffing_issues):
    """Process the solution from the solver and format the output"""
    optimized_shifts = []
    for e in employees:
        for d in range(len(date_list)):
            for s in shift_types:
                if solver.Value(shifts[(e['id'], d, s)]) == 1:
                    date = date_list[d]
                    
                    # Get shift times based on shift type from the constants
                    shift_config = SCHEDULING_CONSTRAINTS["shift_types"][s]
                    start_hour = shift_config["start_hour"]
                    end_hour = shift_config["end_hour"]
                    
                    start_time, end_time = format_shift_times(date, start_hour, end_hour)
                    
                    shift = {
                        "employee_id": e['id'],
                        "start_time": start_time.isoformat(),
                        "end_time": end_time.isoformat(),
                        "shift_type": s,
                        "department": e.get('department', department or 'General'),
                        "is_published": False
                    }
                    logger.info(f"Scheduled {e.get('first_name', '')} ({e.get('role', '')}) for {s} shift on {date.strftime('%a %b %d %Y')}")
                    optimized_shifts.append(shift)
    
    logger.info(f"Generated {len(optimized_shifts)} shifts")
    
    return {
        "schedule": optimized_shifts,
        "staffing_issues": staffing_issues,
        "message": f"Successfully generated {len(optimized_shifts)} shifts for {len(employees)} employees"
    }
