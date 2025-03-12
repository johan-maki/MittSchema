
"""Core service for schedule optimization."""

from ortools.sat.python import cp_model
from datetime import datetime
import random
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from config import SCHEDULING_CONSTRAINTS, logger
from utils import create_date_list
from services.constraint_service import add_all_constraints
from services.solution_service import process_solution

def optimize_schedule(employees: List[Dict], start_date: datetime, end_date: datetime, department: Optional[str] = None, random_seed: Optional[int] = None):
    """Core function to optimize the employee schedule using CP-SAT solver"""
    if not employees:
        logger.warning("No employees found in the database")
        raise HTTPException(status_code=404, detail="No employees found in the database")
    
    # Initialize random number generator with seed
    if random_seed is not None:
        random.seed(random_seed)
        logger.info(f"Initialized random seed: {random_seed}")
    else:
        random.seed()
        logger.info("Using system random seed")
    
    # Create date list for the scheduling period
    date_list = create_date_list(start_date, end_date)
    logger.info(f"Created date list from {date_list[0]} to {date_list[-1]}")
    
    # Initialize the constraint solver model
    model = cp_model.CpModel()
    
    # Mapping for shift types
    shift_types = ["day", "evening", "night"]
    
    # Create variables for each employee, date, and shift type
    shifts = {}
    for e in employees:
        for d in range(len(date_list)):
            for s in shift_types:
                shifts[(e['id'], d, s)] = model.NewBoolVar(f"shift_{e['id']}_{d}_{s}")
    
    logger.info(f"Created {len(employees) * len(date_list) * len(shift_types)} shift variables")
    
    # Track staffing issues during constraint building
    staffing_issues = []
    
    # Add all constraints to the model
    add_all_constraints(model, shifts, employees, date_list, shift_types, staffing_issues)
    
    # Create the solver and solve
    logger.info("Creating CP-SAT solver")
    solver = cp_model.CpSolver()
    
    # Set time limit for solver (in seconds)
    solver.parameters.max_time_in_seconds = 60.0  # 1 minute max
    
    # Set random seed for solver
    solver_seed = random_seed if random_seed is not None else random.randint(0, 1000000)
    solver.parameters.random_seed = solver_seed
    logger.info(f"Using solver random seed: {solver_seed}")
    
    logger.info("Starting solver")
    status = solver.Solve(model)
    logger.info(f"Solver status: {solver.StatusName(status)}")
    
    # Process the solution
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        return process_solution(solver, shifts, employees, date_list, shift_types, department, staffing_issues)
    else:
        logger.error(f"Failed to find feasible schedule. Status: {solver.StatusName(status)}")
        raise HTTPException(
            status_code=400, 
            detail="No feasible schedule found. Try relaxing some constraints or adding more employees."
        )
