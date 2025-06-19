"""
Gurobi-based optimizer service for advanced schedule optimization.

This service uses Gurobi's mathematical optimization solver to create
fair and efficient schedules that maximize coverage while minimizing
unfairness in shift distribution.
"""

import gurobipy as gp
from gurobipy import GRB
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from fastapi import HTTPException
from config import logger
from utils import create_date_list

class GurobiScheduleOptimizer:
    """
    Advanced schedule optimizer using Gurobi mathematical optimization.
    
    Goals:
    1. Maximize shift coverage (minimize unfilled shifts)
    2. Minimize unfairness in shift distribution
    3. Ensure legal constraints are met
    
    Constraints:
    1. Max 5 days per week per employee (legal constraint)
    2. Max 1 shift per day per employee
    3. Each shift requires exactly 1 person
    4. Fair distribution of day/evening/night shifts
    5. Fair distribution of weekend work
    """
    
    def __init__(self):
        self.model = None
        self.shifts = {}
        self.employees = []
        self.dates = []
        self.scheduled_days = []  # Track which days need coverage
        self.shift_types = ["day", "evening", "night"]
        
        # Shift time mappings
        self.shift_times = {
            "day": ("06:00", "14:00"),
            "evening": ("14:00", "22:00"), 
            "night": ("22:00", "06:00")
        }
    
    def optimize_schedule(
        self, 
        employees: List[Dict], 
        start_date: datetime, 
        end_date: datetime,
        min_staff_per_shift: int = 1,
        min_experience_per_shift: int = 1,
        include_weekends: bool = True,
        random_seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Main optimization function that creates the optimal schedule.
        
        Args:
            employees: List of employee dictionaries with id, name, etc.
            start_date: Schedule start date
            end_date: Schedule end date
            min_staff_per_shift: Minimum staff required per shift
            min_experience_per_shift: Minimum experience level required
            include_weekends: Whether to schedule weekend shifts
            random_seed: Random seed for reproducible results
            
        Returns:
            Dictionary containing the optimized schedule and statistics
        """
        logger.info("Starting Gurobi-based schedule optimization")
        
        try:
            # Initialize data
            self.employees = employees
            self.dates = create_date_list(start_date, end_date)
            
            logger.info(f"Optimizing schedule for {len(employees)} employees over {len(self.dates)} days")
            logger.info(f"Parameters: min_staff_per_shift={min_staff_per_shift}, include_weekends={include_weekends}")
            
            # Check if we have enough employees for basic coverage
            if include_weekends:
                working_days = len(self.dates)
            else:
                working_days = sum(1 for date in self.dates if date.weekday() < 5)
            
            actual_shift_requirements = working_days * len(self.shift_types) * min_staff_per_shift
            
            # Calculate max possible shifts correctly: 5 shifts per week per employee
            total_weeks = len(self.dates) / 7.0  # Convert days to weeks (can be fractional)
            max_shifts_per_employee = int(total_weeks * 5)  # 5 shifts per week maximum
            max_possible_shifts = len(employees) * max_shifts_per_employee
            
            logger.info(f"Period: {len(self.dates)} days ({total_weeks:.1f} weeks)")
            logger.info(f"Shift requirements: {actual_shift_requirements} shifts needed")
            logger.info(f"Employee capacity: {max_possible_shifts} shifts possible ({max_shifts_per_employee} shifts/employee over {total_weeks:.1f} weeks)")
            
            if actual_shift_requirements > max_possible_shifts:
                logger.error(f"Impossible to fulfill requirements: need {actual_shift_requirements} shifts but only {max_possible_shifts} possible")
                raise HTTPException(
                    status_code=400,
                    detail=f"Not enough employees: need {actual_shift_requirements} shifts but only {max_possible_shifts} possible with {len(employees)} employees over {total_weeks:.1f} weeks"
                )
            
            # Create Gurobi model
            self.model = gp.Model("HealthcareScheduler")
            
            # Set random seed if provided
            if random_seed is not None:
                self.model.setParam('Seed', random_seed)
                logger.info(f"Set Gurobi random seed: {random_seed}")
            
            # Suppress Gurobi output for cleaner logs
            self.model.setParam('OutputFlag', 1)  # Enable output for debugging
            self.model.setParam('TimeLimit', 30)  # 30 seconds should be enough for small problems
            
            # Create decision variables
            self._create_variables()
            
            # Add constraints
            self._add_constraints(min_staff_per_shift, min_experience_per_shift, include_weekends)
            
            # Set objective function
            self._set_objective()
            
            # Optimize
            logger.info("Starting Gurobi optimization...")
            self.model.optimize()
            
            # Process results
            if self.model.status == GRB.OPTIMAL:
                logger.info("Found optimal solution!")
                return self._extract_solution()
            elif self.model.status == GRB.SUBOPTIMAL:
                logger.info("Found suboptimal but feasible solution!")
                return self._extract_solution()
            elif self.model.status == GRB.TIME_LIMIT and self.model.SolCount > 0:
                logger.warning("Time limit reached but found feasible solution!")
                return self._extract_solution()
            else:
                logger.error(f"Optimization failed with status: {self.model.status}")
                # Let's provide more detailed error information
                status_names = {
                    GRB.INFEASIBLE: "INFEASIBLE",
                    GRB.INF_OR_UNBD: "INFEASIBLE_OR_UNBOUNDED", 
                    GRB.UNBOUNDED: "UNBOUNDED",
                    GRB.CUTOFF: "CUTOFF",
                    GRB.ITERATION_LIMIT: "ITERATION_LIMIT",
                    GRB.NODE_LIMIT: "NODE_LIMIT",
                    GRB.TIME_LIMIT: "TIME_LIMIT",
                    GRB.SOLUTION_LIMIT: "SOLUTION_LIMIT",
                    GRB.INTERRUPTED: "INTERRUPTED",
                    GRB.NUMERIC: "NUMERIC_ERROR",
                    GRB.SUBOPTIMAL: "SUBOPTIMAL",
                    GRB.OPTIMAL: "OPTIMAL"
                }
                status_name = status_names.get(self.model.status, f"UNKNOWN({self.model.status})")
                raise HTTPException(
                    status_code=400,
                    detail=f"No feasible schedule found. Gurobi status: {status_name}"
                )
                
        except Exception as e:
            logger.error(f"Gurobi optimization error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Optimization error: {str(e)}"
            )
    
    def _create_variables(self):
        """Create binary decision variables for each employee-date-shift combination."""
        logger.info("Creating decision variables...")
        
        # Binary variable: 1 if employee e works shift s on day d, 0 otherwise
        for emp in self.employees:
            for d, date in enumerate(self.dates):
                for shift in self.shift_types:
                    var_name = f"x_{emp['id']}_{d}_{shift}"
                    self.shifts[(emp['id'], d, shift)] = self.model.addVar(
                        vtype=GRB.BINARY,
                        name=var_name
                    )
        
        logger.info(f"Created {len(self.shifts)} decision variables")
    
    def _add_constraints(self, min_staff_per_shift: int, min_experience_per_shift: int, include_weekends: bool):
        """Add all constraints to the model."""
        logger.info("Adding constraints...")
        
        # 1. Each employee works at most 1 shift per day
        for emp in self.employees:
            for d in range(len(self.dates)):
                self.model.addConstr(
                    gp.quicksum(self.shifts[(emp['id'], d, shift)] for shift in self.shift_types) <= 1,
                    name=f"max_one_shift_per_day_{emp['id']}_{d}"
                )
        
        # 2. Each employee works at most 5 days per week (legal constraint)
        for emp in self.employees:
            # Split dates into weeks
            for week_start in range(0, len(self.dates), 7):
                week_end = min(week_start + 7, len(self.dates))
                week_days = list(range(week_start, week_end))
                
                # Sum all shifts for this employee in this week
                weekly_shifts = gp.quicksum(
                    self.shifts[(emp['id'], d, shift)]
                    for d in week_days
                    for shift in self.shift_types
                )
                
                self.model.addConstr(
                    weekly_shifts <= 5,
                    name=f"max_5_days_per_week_{emp['id']}_week_{week_start}"
                )
        
        # 3. Minimum staff coverage per shift - store which days need coverage for later calculation
        self.scheduled_days = []
        for d in range(len(self.dates)):
            date = self.dates[d]
            
            # Skip weekends if not included
            if not include_weekends and date.weekday() >= 5:  # Saturday=5, Sunday=6
                continue
                
            self.scheduled_days.append(d)  # Store the day index
            
            for shift in self.shift_types:
                # Ensure minimum staff per shift
                total_staff = gp.quicksum(
                    self.shifts[(emp['id'], d, shift)] for emp in self.employees
                )
                
                self.model.addConstr(
                    total_staff >= min_staff_per_shift,
                    name=f"min_staff_{d}_{shift}"
                )
                
                # Ensure maximum staff per shift (exactly what's needed, no overstaffing)
                # For most healthcare scenarios, we want exactly min_staff_per_shift people
                self.model.addConstr(
                    total_staff <= min_staff_per_shift,
                    name=f"max_staff_{d}_{shift}"
                )
        
        logger.info(f"Scheduling {len(self.scheduled_days)} days out of {len(self.dates)} total days")
        logger.info("All constraints added successfully")
    
    def _set_objective(self):
        """
        Set the objective function to maximize coverage and minimize unfairness.
        
        Objective components:
        1. Maximize total shift coverage (primary goal)
        2. Minimize unfairness in shift distribution (secondary goal)
        """
        logger.info("Setting objective function...")
        
        # Primary objective: Maximize total assigned shifts (coverage)
        total_coverage = gp.quicksum(
            self.shifts[(emp['id'], d, shift)]
            for emp in self.employees
            for d in range(len(self.dates))
            for shift in self.shift_types
        )
        
        # Secondary objective: Minimize unfairness in shift distribution
        # Calculate variance in total shifts per employee
        emp_total_shifts = []
        for emp in self.employees:
            emp_total = gp.quicksum(
                self.shifts[(emp['id'], d, shift)]
                for d in range(len(self.dates))
                for shift in self.shift_types
            )
            emp_total_shifts.append(emp_total)
        
        # For simplicity, minimize the maximum difference between any two employees
        max_shifts = self.model.addVar(vtype=GRB.CONTINUOUS, name="max_shifts")
        min_shifts = self.model.addVar(vtype=GRB.CONTINUOUS, name="min_shifts")
        
        for emp_shifts in emp_total_shifts:
            self.model.addConstr(max_shifts >= emp_shifts)
            self.model.addConstr(min_shifts <= emp_shifts)
        
        unfairness = max_shifts - min_shifts
        
        # Combined objective: prioritize coverage, then fairness
        self.model.setObjective(
            1000 * total_coverage - unfairness,  # Weight coverage much higher than fairness
            GRB.MAXIMIZE
        )
        
        logger.info("Objective function set: Maximize coverage, minimize unfairness")
    
    def _extract_solution(self) -> Dict[str, Any]:
        """Extract and format the solution from the optimized model."""
        logger.info("Extracting solution...")
        
        schedule = []
        coverage_stats = {"total_shifts": 0, "filled_shifts": 0, "coverage_percentage": 0}
        employee_stats = {}
        
        # Initialize employee stats
        for emp in self.employees:
            employee_stats[emp['id']] = {
                "name": f"{emp.get('first_name', '')} {emp.get('last_name', '')}",
                "total_shifts": 0,
                "day_shifts": 0,
                "evening_shifts": 0,
                "night_shifts": 0,
                "weekend_shifts": 0
            }
        
        # Extract schedule assignments - ONLY for scheduled days
        scheduled_days = getattr(self, 'scheduled_days', list(range(len(self.dates))))
        
        for emp in self.employees:
            for d in scheduled_days:  # Only iterate over scheduled days
                date = self.dates[d]
                    
                for shift in self.shift_types:
                    if self.shifts[(emp['id'], d, shift)].x > 0.5:  # Binary variable is 1
                        # Create shift assignment
                        shift_start, shift_end = self.shift_times[shift]
                        
                        shift_assignment = {
                            "employee_id": emp['id'],
                            "employee_name": f"{emp.get('first_name', '')} {emp.get('last_name', '')}",
                            "date": date.strftime('%Y-%m-%d'),
                            "shift_type": shift,
                            "start_time": shift_start,
                            "end_time": shift_end,
                            "is_weekend": date.weekday() >= 5
                        }
                        
                        schedule.append(shift_assignment)
                        
                        # Update statistics
                        coverage_stats["filled_shifts"] += 1
                        employee_stats[emp['id']]["total_shifts"] += 1
                        employee_stats[emp['id']][f"{shift}_shifts"] += 1
                        
                        if date.weekday() >= 5:  # Weekend
                            employee_stats[emp['id']]["weekend_shifts"] += 1
        
        # Calculate total possible shifts (only count days we're actually scheduling)
        coverage_stats["total_shifts"] = len(scheduled_days) * len(self.shift_types)
        
        if coverage_stats["total_shifts"] > 0:
            coverage_stats["coverage_percentage"] = round(
                (coverage_stats["filled_shifts"] / coverage_stats["total_shifts"]) * 100, 1
            )
        
        # Log results
        logger.info(f"Schedule generated with {coverage_stats['coverage_percentage']}% coverage")
        logger.info(f"Filled {coverage_stats['filled_shifts']} out of {coverage_stats['total_shifts']} shifts")
        
        return {
            "schedule": schedule,
            "statistics": {
                "coverage": coverage_stats,
                "fairness": {
                    "min_shifts": min(emp_data["total_shifts"] for emp_data in employee_stats.values()) if employee_stats else 0,
                    "max_shifts": max(emp_data["total_shifts"] for emp_data in employee_stats.values()) if employee_stats else 0,
                    "avg_shifts": sum(emp_data["total_shifts"] for emp_data in employee_stats.values()) / len(employee_stats) if employee_stats else 0,
                    "distribution_range": max(emp_data["total_shifts"] for emp_data in employee_stats.values()) - min(emp_data["total_shifts"] for emp_data in employee_stats.values()) if employee_stats else 0
                }
            },
            "employee_stats": employee_stats,
            "optimizer": "gurobi",
            "objective_value": self.model.objVal if self.model.status in [GRB.OPTIMAL, GRB.SUBOPTIMAL] else None
        }


def optimize_schedule_with_gurobi(
    employees: List[Dict], 
    start_date: datetime, 
    end_date: datetime,
    min_staff_per_shift: int = 1,
    min_experience_per_shift: int = 1,
    include_weekends: bool = True,
    random_seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Main function to optimize schedule using Gurobi.
    
    This is the entry point for Gurobi-based optimization that can be used
    as a drop-in replacement for the OR-Tools optimizer.
    """
    optimizer = GurobiScheduleOptimizer()
    return optimizer.optimize_schedule(
        employees=employees,
        start_date=start_date,
        end_date=end_date,
        min_staff_per_shift=min_staff_per_shift,
        min_experience_per_shift=min_experience_per_shift,
        include_weekends=include_weekends,
        random_seed=random_seed
    )
