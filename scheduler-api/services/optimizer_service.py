
"""Core service for schedule optimization - now exclusively using Gurobi mathematical optimization."""

from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from config import logger
from services.gurobi_optimizer_service import optimize_schedule_with_gurobi

def optimize_schedule(
    employees: List[Dict], 
    start_date: datetime, 
    end_date: datetime, 
    department: Optional[str] = None, 
    random_seed: Optional[int] = None,
    optimizer: str = "gurobi",  # Keep for API compatibility, but only Gurobi is supported
    min_staff_per_shift: int = 1,
    max_staff_per_shift: Optional[int] = None,
    min_experience_per_shift: int = 1,
    include_weekends: bool = True,
    allow_partial_coverage: bool = False,
    optimize_for_cost: bool = False,
    employee_preferences: Optional[List] = None,
    manual_constraints: Optional[List] = None,
    ai_constraints: Optional[List[Dict]] = None
):
    """
    Core function to optimize the employee schedule using Gurobi.
    
    This function creates an optimal schedule that:
    1. Maximizes shift coverage (minimizes unfilled shifts)
    2. Ensures fair distribution of work
    3. Respects all legal and operational constraints
    4. Optionally minimizes cost (when optimize_for_cost=True)
    
    Args:
        employees: List of employee dictionaries
        start_date: Schedule start date
        end_date: Schedule end date
        department: Department filter (optional, for API compatibility)
        random_seed: Random seed for reproducible results
        optimizer: Optimizer type (only "gurobi" supported)
        min_staff_per_shift: Minimum staff required per shift
        max_staff_per_shift: Maximum staff allowed per shift (None = same as min)
        min_experience_per_shift: Minimum experience points required per shift
        include_weekends: Whether to schedule weekend shifts
        allow_partial_coverage: Allow partial schedule when not enough staff
        optimize_for_cost: Optimize for minimum cost (prioritize lower hourly rates)
        employee_preferences: Individual employee work preferences
        manual_constraints: AI-parsed or manually added constraints (legacy)
        ai_constraints: AI-parsed constraints from Supabase (Gurobi-ready format)
    
    Returns:
        Optimized schedule dictionary with coverage stats and employee assignments
    """
    
    logger.info("🚀 Starting Gurobi-based schedule optimization")
    
    if not employees:
        logger.warning("No employees found in the database")
        raise HTTPException(status_code=404, detail="No employees found in the database")
    
    # Filter by department if specified
    if department:
        employees = [emp for emp in employees if emp.get('department') == department]
        logger.info(f"Filtered to {len(employees)} employees in department: {department}")
    
    if optimizer != "gurobi":
        logger.warning(f"Optimizer '{optimizer}' not supported. Using Gurobi instead.")
    
    try:
        # Use the dedicated Gurobi optimizer service
        result = optimize_schedule_with_gurobi(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=min_staff_per_shift,
            max_staff_per_shift=max_staff_per_shift,
            min_experience_per_shift=min_experience_per_shift,
            include_weekends=include_weekends,
            allow_partial_coverage=allow_partial_coverage,
            optimize_for_cost=optimize_for_cost,
            random_seed=random_seed,
            employee_preferences=employee_preferences,
            manual_constraints=manual_constraints,
            ai_constraints=ai_constraints
        )
        
        # Add department info to schedule items
        for shift in result["schedule"]:
            emp_id = shift["employee_id"]
            emp = next((e for e in employees if e["id"] == emp_id), {})
            shift["department"] = emp.get('department', 'Unknown')
        
        # Add fairness stats if not present (legacy compatibility)
        if "fairness_stats" not in result:
            total_shifts_list = [stats["total_shifts"] for stats in result["employee_stats"].values()]
            result["fairness_stats"] = {
                "min_shifts_per_employee": min(total_shifts_list) if total_shifts_list else 0,
                "max_shifts_per_employee": max(total_shifts_list) if total_shifts_list else 0,
                "avg_shifts_per_employee": sum(total_shifts_list) / len(total_shifts_list) if total_shifts_list else 0,
                "shift_distribution_range": max(total_shifts_list) - min(total_shifts_list) if total_shifts_list else 0
            }
        
        logger.info(f"🎯 Schedule optimization complete!")
        logger.info(f"📈 Coverage: {result['statistics']['coverage']['coverage_percentage']}% ({result['statistics']['coverage']['filled_shifts']}/{result['statistics']['coverage']['total_shifts']} shifts)")
        
        return result
        
    except Exception as e:
        logger.error(f"💥 Schedule optimization error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Optimization error: {str(e)}"
        )


