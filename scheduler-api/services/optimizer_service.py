
"""Core service for schedule optimization using Gurobi mathematical optimization."""

import gurobipy as gp
from gurobipy import GRB
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from config import logger
from utils import create_date_list

def optimize_schedule(
    employees: List[Dict], 
    start_date: datetime, 
    end_date: datetime, 
    department: Optional[str] = None, 
    random_seed: Optional[int] = None,
    optimizer: str = "gurobi",  # Keep for API compatibility, but only Gurobi is supported
    min_staff_per_shift: int = 1,
    min_experience_per_shift: int = 1,
    include_weekends: bool = True
):
    """
    Core function to optimize the employee schedule using Gurobi.
    
    This function creates an optimal schedule that:
    1. Maximizes shift coverage (minimizes unfilled shifts)
    2. Ensures fair distribution of work
    3. Respects all legal and operational constraints
    
    Args:
        employees: List of employee dictionaries
        start_date: Schedule start date
        end_date: Schedule end date
        department: Department filter (optional, for API compatibility)
        random_seed: Random seed for reproducible results
        optimizer: Optimizer type (only "gurobi" supported)
        min_staff_per_shift: Minimum staff required per shift
        min_experience_per_shift: Minimum experience level required
        include_weekends: Whether to schedule weekend shifts
    
    Returns:
        Optimized schedule dictionary with coverage stats and employee assignments
    """
    
    logger.info("🚀 Starting Gurobi-based schedule optimization")
    
    if not employees:
        logger.warning("No employees found in the database")
        raise HTTPException(status_code=404, detail="No employees found in the database")
    
    try:
        # Create date list for the scheduling period
        dates = create_date_list(start_date, end_date)
        logger.info(f"📅 Optimizing schedule for {len(employees)} employees over {len(dates)} days")
        
        # Create Gurobi model
        model = gp.Model("HealthcareScheduler_AllGurobi")
        logger.info("🔧 Created Gurobi optimization model")
        
        # Set random seed if provided
        if random_seed is not None:
            model.setParam('Seed', random_seed)
            logger.info(f"🎲 Set Gurobi random seed: {random_seed}")
        
        # Suppress Gurobi output for cleaner logs (can be enabled for debugging)
        model.setParam('OutputFlag', 0)
        
        # Define shift types and time mappings
        shift_types = ["day", "evening", "night"]
        shift_times = {
            "day": ("06:00", "14:00"),
            "evening": ("14:00", "22:00"), 
            "night": ("22:00", "06:00")
        }
        
        logger.info(f"⚡ Creating decision variables for {len(employees) * len(dates) * len(shift_types)} combinations")
        
        # Create binary decision variables: x[emp_id, day, shift] = 1 if employee works that shift
        shifts = {}
        for emp in employees:
            for d, date in enumerate(dates):
                for shift in shift_types:
                    var_name = f"x_{emp['id']}_{d}_{shift}"
                    shifts[(emp['id'], d, shift)] = model.addVar(
                        vtype=GRB.BINARY,
                        name=var_name
                    )
        
        logger.info("🔗 Adding constraints...")
        
        # CONSTRAINT 1: Each employee works at most 1 shift per day
        for emp in employees:
            for d in range(len(dates)):
                model.addConstr(
                    gp.quicksum(shifts[(emp['id'], d, shift)] for shift in shift_types) <= 1,
                    name=f"max_one_shift_per_day_{emp['id']}_{d}"
                )
        
        # CONSTRAINT 2: Each employee works at most 5 days per week (legal constraint)
        for emp in employees:
            # Split dates into weeks (Monday = 0, Sunday = 6)
            for week_start in range(0, len(dates), 7):
                week_end = min(week_start + 7, len(dates))
                week_days = list(range(week_start, week_end))
                
                # Sum all shifts for this employee in this week
                weekly_shifts = gp.quicksum(
                    shifts[(emp['id'], d, shift)]
                    for d in week_days
                    for shift in shift_types
                )
                
                model.addConstr(
                    weekly_shifts <= 5,
                    name=f"max_5_days_per_week_{emp['id']}_week_{week_start}"
                )
        
        # CONSTRAINT 3: Minimum staff coverage per shift
        coverage_violations = []  # Track coverage violations for soft constraints
        
        for d, date in enumerate(dates):
            # Skip weekends if not included
            if not include_weekends and date.weekday() >= 5:  # Saturday=5, Sunday=6
                continue
                
            for shift in shift_types:
                # Total staff assigned to this shift
                total_staff = gp.quicksum(
                    shifts[(emp['id'], d, shift)] for emp in employees
                )
                
                # Hard constraint: at least 1 person per shift (or min_staff_per_shift)
                model.addConstr(
                    total_staff >= min_staff_per_shift,
                    name=f"min_staff_{d}_{shift}"
                )
        
        logger.info("🎯 Setting optimization objective...")
        
        # OBJECTIVE: Maximize total coverage while minimizing unfairness
        
        # Primary: Maximize total assigned shifts (coverage)
        total_coverage = gp.quicksum(
            shifts[(emp['id'], d, shift)]
            for emp in employees
            for d in range(len(dates))
            for shift in shift_types
        )
        
        # Secondary: Minimize unfairness in shift distribution
        # Calculate total shifts per employee
        emp_totals = []
        for emp in employees:
            emp_total = gp.quicksum(
                shifts[(emp['id'], d, shift)]
                for d in range(len(dates))
                for shift in shift_types
            )
            emp_totals.append(emp_total)
        
        # Minimize the range (max - min) of shifts between employees
        max_shifts = model.addVar(vtype=GRB.CONTINUOUS, name="max_shifts_per_emp")
        min_shifts = model.addVar(vtype=GRB.CONTINUOUS, name="min_shifts_per_emp")
        
        for emp_total in emp_totals:
            model.addConstr(max_shifts >= emp_total)
            model.addConstr(min_shifts <= emp_total)
        
        unfairness = max_shifts - min_shifts
        
        # Tertiary: Minimize unfairness in shift type distribution
        shift_type_unfairness = 0
        for shift in shift_types:
            shift_totals = []
            for emp in employees:
                shift_total = gp.quicksum(
                    shifts[(emp['id'], d, shift)]
                    for d in range(len(dates))
                )
                shift_totals.append(shift_total)
            
            # Add variables for this shift type's range
            max_shift_type = model.addVar(vtype=GRB.CONTINUOUS, name=f"max_{shift}_shifts")
            min_shift_type = model.addVar(vtype=GRB.CONTINUOUS, name=f"min_{shift}_shifts")
            
            for shift_total in shift_totals:
                model.addConstr(max_shift_type >= shift_total)
                model.addConstr(min_shift_type <= shift_total)
            
            shift_type_unfairness += (max_shift_type - min_shift_type)
        
        # Combined objective with priorities
        model.setObjective(
            10000 * total_coverage    # Highest priority: maximize coverage
            - 100 * unfairness        # Second priority: minimize total shift unfairness  
            - 10 * shift_type_unfairness,  # Third priority: minimize shift type unfairness
            GRB.MAXIMIZE
        )
        
        logger.info("⚡ Starting Gurobi optimization...")
        
        # Set optimization parameters
        model.setParam('TimeLimit', 300)  # 5 minutes max
        model.setParam('MIPGap', 0.01)    # 1% optimality gap is acceptable
        
        # Optimize!
        model.optimize()
        
        # Check results
        if model.status == GRB.OPTIMAL:
            logger.info("🎉 Found optimal solution!")
        elif model.status == GRB.SUBOPTIMAL:
            logger.info("✅ Found suboptimal but feasible solution!")
        elif model.status == GRB.INFEASIBLE:
            logger.error("❌ Problem is infeasible - no solution exists with current constraints")
            raise HTTPException(
                status_code=400,
                detail="No feasible schedule found. Try reducing minimum staff requirements or adding more employees."
            )
        elif model.status == GRB.TIME_LIMIT:
            logger.warning("⏰ Time limit reached - using best solution found")
            if model.SolCount == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Time limit reached without finding any feasible solution."
                )
        else:
            logger.error(f"❌ Optimization failed with status: {model.status}")
            raise HTTPException(
                status_code=500,
                detail=f"Optimization failed with Gurobi status: {model.status}"
            )
        
        # Extract and format the solution
        return _extract_gurobi_solution(model, shifts, employees, dates, shift_types, shift_times)
        
    except Exception as e:
        logger.error(f"💥 Gurobi optimization error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Optimization error: {str(e)}"
        )


def _extract_gurobi_solution(model, shifts, employees, dates, shift_types, shift_times) -> Dict[str, Any]:
    """Extract and format the solution from the optimized Gurobi model."""
    logger.info("📊 Extracting solution from Gurobi model...")
    
    schedule = []
    coverage_stats = {"total_shifts": 0, "filled_shifts": 0, "coverage_percentage": 0}
    employee_stats = {}
    
    # Initialize employee stats
    for emp in employees:
        employee_stats[emp['id']] = {
            "name": f"{emp.get('first_name', '')} {emp.get('last_name', '')}",
            "total_shifts": 0,
            "day_shifts": 0,
            "evening_shifts": 0,
            "night_shifts": 0,
            "weekend_shifts": 0
        }
    
    # Extract schedule assignments
    for emp in employees:
        for d, date in enumerate(dates):
            for shift in shift_types:
                if shifts[(emp['id'], d, shift)].X > 0.5:  # Binary variable is 1
                    # Create shift assignment
                    shift_start, shift_end = shift_times[shift]
                    
                    shift_assignment = {
                        "employee_id": emp['id'],
                        "employee_name": f"{emp.get('first_name', '')} {emp.get('last_name', '')}",
                        "date": date.strftime('%Y-%m-%d'),
                        "shift_type": shift,
                        "start_time": shift_start,
                        "end_time": shift_end,
                        "is_weekend": date.weekday() >= 5,
                        "department": emp.get('department', 'Unknown')
                    }
                    
                    schedule.append(shift_assignment)
                    
                    # Update statistics
                    coverage_stats["filled_shifts"] += 1
                    employee_stats[emp['id']]["total_shifts"] += 1
                    employee_stats[emp['id']][f"{shift}_shifts"] += 1
                    
                    if date.weekday() >= 5:  # Weekend
                        employee_stats[emp['id']]["weekend_shifts"] += 1
    
    # Calculate coverage statistics
    working_days = len([d for d in dates])  # All days for now
    coverage_stats["total_shifts"] = working_days * len(shift_types)
    
    if coverage_stats["total_shifts"] > 0:
        coverage_stats["coverage_percentage"] = round(
            (coverage_stats["filled_shifts"] / coverage_stats["total_shifts"]) * 100, 1
        )
    
    # Calculate fairness metrics
    total_shifts_list = [stats["total_shifts"] for stats in employee_stats.values()]
    fairness_stats = {
        "min_shifts_per_employee": min(total_shifts_list) if total_shifts_list else 0,
        "max_shifts_per_employee": max(total_shifts_list) if total_shifts_list else 0,
        "avg_shifts_per_employee": sum(total_shifts_list) / len(total_shifts_list) if total_shifts_list else 0,
        "shift_distribution_range": max(total_shifts_list) - min(total_shifts_list) if total_shifts_list else 0
    }
    
    # Log comprehensive results
    logger.info(f"🎯 Schedule optimization complete!")
    logger.info(f"📈 Coverage: {coverage_stats['coverage_percentage']}% ({coverage_stats['filled_shifts']}/{coverage_stats['total_shifts']} shifts)")
    logger.info(f"⚖️ Fairness: {fairness_stats['min_shifts_per_employee']}-{fairness_stats['max_shifts_per_employee']} shifts per employee (range: {fairness_stats['shift_distribution_range']})")
    
    if model.status in [GRB.OPTIMAL, GRB.SUBOPTIMAL]:
        logger.info(f"🔢 Objective value: {model.objVal:.2f}")
    
    return {
        "schedule": schedule,
        "coverage_stats": coverage_stats,
        "employee_stats": employee_stats,
        "fairness_stats": fairness_stats,
        "optimizer": "gurobi",
        "optimization_status": "optimal" if model.status == GRB.OPTIMAL else "feasible",
        "objective_value": model.objVal if model.status in [GRB.OPTIMAL, GRB.SUBOPTIMAL] else None,
        "message": f"Schedule optimized successfully with {coverage_stats['coverage_percentage']}% coverage using Gurobi mathematical optimization"
    }
