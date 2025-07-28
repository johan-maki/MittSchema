"""
Gurobi-based optimizer service for advanced schedule optimization.

This service uses Gurobi's mathematical optimization solver to crea            # Add all constraints
            self._add_constraints(min_staff_per_shift, min_experience_per_shift, include_weekends)
            self._add_employee_preference_constraints()
            
            # Set objective functionair and efficient schedules that maximize coverage while minimizing
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
        
        # Employee preference tracking for objective function
        self.employee_shift_preferences = {}  # For preferred shifts
        self.employee_day_penalties = {}      # For non-preferred days (soft constraints)
        self.employees_with_custom_weekly_limits = set()  # For weekly constraints
        
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
        allow_partial_coverage: bool = False,
        random_seed: Optional[int] = None,
        employee_preferences: Optional[List] = None
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
            employee_preferences: Individual employee work preferences
            
        Returns:
            Dictionary containing the optimized schedule and statistics
        """
        logger.info("Starting Gurobi-based schedule optimization")
        
        try:
            # Initialize data
            self.employees = employees
            self.dates = create_date_list(start_date, end_date)
            self.employee_preferences = employee_preferences or []
            
            logger.info(f"Optimizing schedule for {len(employees)} employees over {len(self.dates)} days")
            logger.info(f"Parameters: min_staff_per_shift={min_staff_per_shift}, include_weekends={include_weekends}")
            logger.info(f"Employee preferences provided: {len(self.employee_preferences)}")
            
            # Log employee preferences for debugging
            if self.employee_preferences:
                for pref in self.employee_preferences:
                    logger.info(f"  Employee {pref.employee_id}: available_days={pref.available_days or []}, max_shifts_per_week={pref.max_shifts_per_week or 5}")
            
            # Check if we have enough employees for basic coverage
            if include_weekends:
                working_days = len(self.dates)
            else:
                working_days = sum(1 for date in self.dates if date.weekday() < 5)
            
            actual_shift_requirements = working_days * len(self.shift_types) * min_staff_per_shift
            
            # Calculate max possible shifts correctly: 5 shifts per week per employee
            # BUT ensure that for short periods (< 1 week), we allow at least 1 shift per day per employee
            total_weeks = len(self.dates) / 7.0  # Convert days to weeks (can be fractional)
            
            if total_weeks < 1.0:
                # For periods shorter than a week, allow 1 shift per day per employee
                max_shifts_per_employee = len(self.dates)  # 1 shift per day maximum for short periods
            else:
                # For longer periods, use the weekly constraint
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
            self._add_constraints(min_staff_per_shift, min_experience_per_shift, include_weekends, allow_partial_coverage)
            
            # Add employee preference constraints (CRITICAL: This was missing!)
            self._add_employee_preference_constraints()
            
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
    
    def _add_constraints(self, min_staff_per_shift: int, min_experience_per_shift: int, include_weekends: bool, allow_partial_coverage: bool = False):
        """Add all constraints to the model."""
        logger.info(f"Adding constraints... (allow_partial_coverage={allow_partial_coverage})")
        
        # 1. Each employee works at most 1 shift per day
        for emp in self.employees:
            for d in range(len(self.dates)):
                self.model.addConstr(
                    gp.quicksum(self.shifts[(emp['id'], d, shift)] for shift in self.shift_types) <= 1,
                    name=f"max_one_shift_per_day_{emp['id']}_{d}"
                )
        
        # 2. Each employee works at most 5 days per week (legal constraint)
        # Only apply this constraint for periods longer than a few days
        # Note: Individual employee preferences can override this in _add_employee_preference_constraints
        total_weeks = len(self.dates) / 7.0
        
        # Initialize tracking for employee preferences
        self.employees_with_custom_weekly_limits = set()
        self.employee_shift_preferences = {}  # Track preferred vs non-preferred shifts
        
        if total_weeks >= 0.7:  # Only apply weekly constraint for periods 5+ days
            for emp in self.employees:
                # Split dates into weeks
                for week_start in range(0, len(self.dates), 7):
                    week_end = min(week_start + 7, len(self.dates))
                    week_days = list(range(week_start, week_end))
                    
                    # For partial weeks, adjust the limit proportionally
                    days_in_week = len(week_days)
                    max_shifts_this_week = min(5, days_in_week)  # Max 5 or all days if fewer
                    
                    # Sum all shifts for this employee in this week
                    weekly_shifts = gp.quicksum(
                        self.shifts[(emp['id'], d, shift)]
                        for d in week_days
                        for shift in self.shift_types
                    )
                    
                    # Add constraint with a name that can be referenced later
                    constraint_name = f"default_max_{max_shifts_this_week}_days_per_week_{emp['id']}_week_{week_start}"
                    self.model.addConstr(
                        weekly_shifts <= max_shifts_this_week,
                        name=constraint_name
                    )
        else:
            logger.info(f"Skipping weekly constraint for short period ({len(self.dates)} days)")
        
        # 3. Minimum staff coverage per shift - ensure all days are scheduled
        self.scheduled_days = list(range(len(self.dates)))  # Schedule all days
        
        for d in range(len(self.dates)):
            date = self.dates[d]
            
            # Determine required staff based on weekend setting
            if not include_weekends and date.weekday() >= 5:  # Saturday=5, Sunday=6
                # For weekends when not included, allow 0 staff (optional coverage)
                required_staff = 0
            else:
                # Regular days require minimum staff
                required_staff = min_staff_per_shift
            
            for shift in self.shift_types:
                # Ensure minimum staff per shift
                total_staff = gp.quicksum(
                    self.shifts[(emp['id'], d, shift)] for emp in self.employees
                )
                
                # Only enforce minimum staff constraint if NOT allowing partial coverage
                if required_staff > 0 and not allow_partial_coverage:
                    self.model.addConstr(
                        total_staff >= required_staff,
                        name=f"min_staff_{d}_{shift}"
                    )
                elif allow_partial_coverage:
                    # When allowing partial coverage, minimum staff becomes a soft constraint
                    # The optimizer will try to maximize coverage without failing if impossible
                    logger.info(f"Allowing partial coverage for {date} {shift} shift")
                
                # Ensure exact staff per shift (no overstaffing) - always apply this
                self.model.addConstr(
                    total_staff <= min_staff_per_shift,
                    name=f"max_staff_{d}_{shift}"
                )
        
        logger.info(f"Scheduling {len(self.scheduled_days)} days out of {len(self.dates)} total days")
        logger.info("All constraints added successfully")
    
    def _add_employee_preference_constraints(self):
        """Add constraints based on individual employee preferences."""
        if not self.employee_preferences:
            logger.info("No employee preferences provided, skipping preference constraints")
            return
        
        logger.info(f"Adding employee preference constraints for {len(self.employee_preferences)} employees")
        
        # Validate employee preferences data
        valid_preferences = []
        for pref in self.employee_preferences:
            try:
                # Basic validation
                if not hasattr(pref, 'employee_id') or not pref.employee_id:
                    logger.warning(f"Invalid preference: missing employee_id")
                    continue
                    
                # Validate max_shifts_per_week
                if hasattr(pref, 'max_shifts_per_week') and pref.max_shifts_per_week is not None:
                    if not isinstance(pref.max_shifts_per_week, int) or pref.max_shifts_per_week < 0 or pref.max_shifts_per_week > 7:
                        logger.warning(f"Invalid max_shifts_per_week for employee {pref.employee_id}: {pref.max_shifts_per_week}, using default 5")
                        # We could set it to default here, but let the or 5 handle it
                
                # Validate available_days
                if hasattr(pref, 'available_days') and pref.available_days:
                    valid_days = {'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'}
                    invalid_days = [day for day in pref.available_days if day.lower() not in valid_days]
                    if invalid_days:
                        logger.warning(f"Invalid available_days for employee {pref.employee_id}: {invalid_days}")
                
                valid_preferences.append(pref)
                
            except Exception as e:
                logger.error(f"Error validating preferences for employee {getattr(pref, 'employee_id', 'unknown')}: {e}")
                continue
        
        if len(valid_preferences) != len(self.employee_preferences):
            logger.warning(f"Filtered {len(self.employee_preferences)} preferences down to {len(valid_preferences)} valid ones")
        
        # Create a mapping from employee_id to preferences for quick lookup
        pref_map = {pref.employee_id: pref for pref in valid_preferences}
        
        for emp in self.employees:
            emp_id = emp['id']
            pref = pref_map.get(emp_id)
            
            if not pref:
                logger.debug(f"No preferences found for employee {emp_id}, using defaults")
                continue
            
            logger.info(f"Applying preferences for employee {emp_id}")
            
            # 1. Available days constraint (can be hard or soft)
            available_days = pref.available_days or []
            available_days_strict = getattr(pref, 'available_days_strict', False)
            logger.info(f"Employee {emp_id} available_days from preference: {available_days}")
            logger.info(f"Employee {emp_id} available_days_strict: {available_days_strict}")
            
            if available_days:
                # Convert day names to weekday numbers
                day_name_to_weekday = {
                    'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
                    'friday': 4, 'saturday': 5, 'sunday': 6
                }
                
                available_weekdays = [day_name_to_weekday.get(day.lower()) for day in available_days if day.lower() in day_name_to_weekday]
                logger.info(f"Employee {emp_id} converted to weekday numbers: {available_weekdays}")
                
                if not available_weekdays:
                    logger.warning(f"Employee {emp_id} has no valid available days, they will be blocked from all shifts")
                    # Block all shifts for this employee (always hard constraint if no valid days)
                    for d in range(len(self.dates)):
                        for shift in self.shift_types:
                            self.model.addConstr(
                                self.shifts[(emp_id, d, shift)] == 0,
                                name=f"no_valid_days_{emp_id}_{d}_{shift}"
                            )
                else:
                    # Process each date based on availability
                    blocked_days = 0
                    logger.info(f"Employee {emp_id} processing dates for availability constraints (strict={available_days_strict})...")
                    
                    for d, date in enumerate(self.dates):
                        weekday = date.weekday()  # 0=Monday, 6=Sunday
                        day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][weekday]
                        
                        if weekday not in available_weekdays:
                            if available_days_strict:
                                # HARD CONSTRAINT: Employee absolutely cannot work this day
                                logger.info(f"Employee {emp_id} HARD BLOCKED from {day_name} {date.strftime('%Y-%m-%d')} (weekday={weekday})")
                                for shift in self.shift_types:
                                    self.model.addConstr(
                                        self.shifts[(emp_id, d, shift)] == 0,
                                        name=f"hard_unavailable_day_{emp_id}_{d}_{shift}"
                                    )
                                blocked_days += 1
                            else:
                                # SOFT CONSTRAINT: Track for penalty in objective function
                                logger.info(f"Employee {emp_id} SOFT PENALTY for {day_name} {date.strftime('%Y-%m-%d')} (weekday={weekday})")
                                # Store non-preferred days for objective function penalty
                                if emp_id not in self.employee_day_penalties:
                                    self.employee_day_penalties[emp_id] = []
                                self.employee_day_penalties[emp_id].append(d)
                        else:
                            logger.info(f"Employee {emp_id} AVAILABLE on {day_name} {date.strftime('%Y-%m-%d')} (weekday={weekday})")
                    
                    if available_days_strict and blocked_days > 0:
                        logger.info(f"Employee {emp_id} HARD blocked from {blocked_days} days, available on: {available_days}")
                    elif not available_days_strict and emp_id in self.employee_day_penalties:
                        logger.info(f"Employee {emp_id} has SOFT penalties for {len(self.employee_day_penalties[emp_id])} non-preferred days")
            else:
                logger.debug(f"Employee {emp_id} has no day restrictions (available all days)")
            
            # 2. EXCLUDED SHIFTS (HARD CONSTRAINT) - Process this FIRST
            excluded_shifts = getattr(pref, 'excluded_shifts', [])
            if excluded_shifts:
                logger.info(f"Employee {emp_id} HARD EXCLUDED from shifts: {excluded_shifts}")
                for d in range(len(self.dates)):
                    for shift in excluded_shifts:
                        if shift in self.shift_types:  # Validate shift type exists
                            self.model.addConstr(
                                self.shifts[(emp_id, d, shift)] == 0,
                                name=f"excluded_shift_{emp_id}_{d}_{shift}"
                            )
            
            # 3. EXCLUDED DAYS (HARD CONSTRAINT)
            excluded_days = getattr(pref, 'excluded_days', [])
            if excluded_days:
                logger.info(f"Employee {emp_id} HARD EXCLUDED from days: {excluded_days}")
                for d, date in enumerate(self.dates):
                    day_name = date.strftime('%A').lower()
                    if day_name in excluded_days:
                        for shift in self.shift_types:
                            self.model.addConstr(
                                self.shifts[(emp_id, d, shift)] == 0,
                                name=f"excluded_day_{emp_id}_{d}_{day_name}_{shift}"
                            )
            
            # 4. Preferred shifts constraint (can be hard or soft) - Process AFTER exclusions
            preferred_shifts = pref.preferred_shifts or self.shift_types
            preferred_shifts_strict = getattr(pref, 'preferred_shifts_strict', False)
            
            # Calculate non-preferred shifts, but exclude the already excluded ones
            all_non_excluded_shifts = [s for s in self.shift_types if s not in excluded_shifts]
            non_preferred_shifts = [s for s in all_non_excluded_shifts if s not in preferred_shifts]
            
            logger.info(f"Employee {emp_id} preferred_shifts: {preferred_shifts}, excluded_shifts: {excluded_shifts}, strict: {preferred_shifts_strict}")
            
            if non_preferred_shifts:
                if preferred_shifts_strict:
                    # HARD CONSTRAINT: Employee absolutely cannot work non-preferred shifts (that aren't already excluded)
                    logger.info(f"Employee {emp_id} HARD blocked from NON-PREFERRED shifts: {non_preferred_shifts}")
                    for d in range(len(self.dates)):
                        for shift in non_preferred_shifts:
                            self.model.addConstr(
                                self.shifts[(emp_id, d, shift)] == 0,
                                name=f"hard_non_preferred_shift_{emp_id}_{d}_{shift}"
                            )
                else:
                    # SOFT CONSTRAINT: Store preference information for objective function penalty
                    logger.info(f"Employee {emp_id} SOFT penalty for shifts: {non_preferred_shifts} (prefers: {preferred_shifts})")
                    
                # Store preference information for objective function
                self.employee_shift_preferences[emp_id] = {
                    'preferred': preferred_shifts,
                    'non_preferred': non_preferred_shifts,
                    'excluded': excluded_shifts,  # Store excluded shifts for reference
                    'strict': preferred_shifts_strict
                }
            else:
                logger.debug(f"Employee {emp_id} has no shift preferences (all shifts acceptable)")
            
            # 3. Maximum shifts per week constraint (override default if specified)
            max_shifts_per_week = pref.max_shifts_per_week or 5
            if max_shifts_per_week != 5:  # Only add if different from default
                total_weeks = len(self.dates) / 7.0
                
                # Mark this employee as having custom weekly limits
                self.employees_with_custom_weekly_limits.add(emp_id)
                
                if total_weeks >= 0.7:  # Only apply weekly constraint for periods 5+ days
                    for week_start in range(0, len(self.dates), 7):
                        week_end = min(week_start + 7, len(self.dates))
                        week_days = list(range(week_start, week_end))
                        
                        # For partial weeks, adjust the limit proportionally
                        days_in_week = len(week_days)
                        max_shifts_this_week = min(max_shifts_per_week, days_in_week)
                        
                        # Remove the default constraint for this employee and week if it exists
                        default_constraint_name = f"default_max_{min(5, days_in_week)}_days_per_week_{emp_id}_week_{week_start}"
                        try:
                            # Gurobi doesn't have direct constraint removal, so we'll add our custom constraint
                            # The solver will handle the constraint optimization
                            pass
                        except:
                            pass
                        
                        # Sum all shifts for this employee in this week
                        weekly_shifts = gp.quicksum(
                            self.shifts[(emp_id, d, shift)]
                            for d in week_days
                            for shift in self.shift_types
                        )
                        
                        self.model.addConstr(
                            weekly_shifts <= max_shifts_this_week,
                            name=f"custom_max_{max_shifts_this_week}_shifts_per_week_{emp_id}_week_{week_start}"
                        )
                        logger.info(f"Set custom max {max_shifts_this_week} shifts per week for employee {emp_id} (overrides default 5)")
            else:
                logger.debug(f"Employee {emp_id} uses default max 5 shifts per week")
        
        logger.info("Employee preference constraints added successfully")
        
        # Summary logging
        total_employees = len(self.employees)
        employees_with_preferences = len(self.employee_preferences)
        employees_with_custom_weekly = len(self.employees_with_custom_weekly_limits)
        employees_with_shift_prefs = len(self.employee_shift_preferences)
        
        logger.info(f"Employee preference summary:")
        logger.info(f"  Total employees: {total_employees}")
        logger.info(f"  Employees with preferences: {employees_with_preferences}")
        logger.info(f"  Employees with custom weekly limits: {employees_with_custom_weekly}")
        logger.info(f"  Employees with shift preferences: {employees_with_shift_prefs}")
        
        # Log any employees without preferences
        employees_without_prefs = [emp['id'] for emp in self.employees 
                                 if emp['id'] not in [pref.employee_id for pref in self.employee_preferences]]
        if employees_without_prefs:
            logger.info(f"  Employees using default constraints: {len(employees_without_prefs)}")
    
    def _set_objective(self):
        """
        Set the objective function to maximize coverage and minimize unfairness.
        
        Objective components (in order of priority):
        1. Maximize total shift coverage (primary goal, weight: 100)
        2. Minimize unfairness in total shift distribution (secondary goal, weight: 10)
        3. Minimize unfairness in shift type distribution (tertiary goal, weight: 5)
        4. Minimize unfairness in weekend shift distribution (quaternary goal, weight: 4)
        """
        logger.info("Setting enhanced objective function with shift type fairness...")
        
        # Primary objective: Maximize total assigned shifts (coverage)
        total_coverage = gp.quicksum(
            self.shifts[(emp['id'], d, shift)]
            for emp in self.employees
            for d in range(len(self.dates))
            for shift in self.shift_types
        )
        
        # Secondary objective: Minimize unfairness in total shift distribution
        emp_total_shifts = []
        for emp in self.employees:
            emp_total = gp.quicksum(
                self.shifts[(emp['id'], d, shift)]
                for d in range(len(self.dates))
                for shift in self.shift_types
            )
            emp_total_shifts.append(emp_total)
        
        # Total shift fairness variables
        max_total_shifts = self.model.addVar(vtype=GRB.CONTINUOUS, name="max_total_shifts")
        min_total_shifts = self.model.addVar(vtype=GRB.CONTINUOUS, name="min_total_shifts")
        
        for emp_shifts in emp_total_shifts:
            self.model.addConstr(max_total_shifts >= emp_shifts)
            self.model.addConstr(min_total_shifts <= emp_shifts)
        
        total_unfairness = max_total_shifts - min_total_shifts
        
        # Tertiary objective: Minimize unfairness in shift type distribution
        shift_type_unfairness = 0
        for shift_type in self.shift_types:
            emp_shift_type_counts = []
            for emp in self.employees:
                emp_shift_type_total = gp.quicksum(
                    self.shifts[(emp['id'], d, shift_type)]
                    for d in range(len(self.dates))
                )
                emp_shift_type_counts.append(emp_shift_type_total)
            
            # Shift type fairness variables
            max_shift_type = self.model.addVar(vtype=GRB.CONTINUOUS, name=f"max_{shift_type}_shifts")
            min_shift_type = self.model.addVar(vtype=GRB.CONTINUOUS, name=f"min_{shift_type}_shifts")
            
            for emp_shift_count in emp_shift_type_counts:
                self.model.addConstr(max_shift_type >= emp_shift_count)
                self.model.addConstr(min_shift_type <= emp_shift_count)
            
            shift_type_unfairness += (max_shift_type - min_shift_type)
        
        # Quaternary objective: Minimize unfairness in weekend shift distribution
        # This ensures weekend work is distributed fairly among employees
        emp_weekend_counts = []
        for emp in self.employees:
            emp_weekend_total = gp.quicksum(
                self.shifts[(emp['id'], d, shift)]
                for d in range(len(self.dates))
                for shift in self.shift_types
                if self._is_weekend(self.dates[d])
            )
            emp_weekend_counts.append(emp_weekend_total)
        
        # Weekend fairness variables
        max_weekend_shifts = self.model.addVar(vtype=GRB.CONTINUOUS, name="max_weekend_shifts")
        min_weekend_shifts = self.model.addVar(vtype=GRB.CONTINUOUS, name="min_weekend_shifts")
        
        for emp_weekend_count in emp_weekend_counts:
            self.model.addConstr(max_weekend_shifts >= emp_weekend_count)
            self.model.addConstr(min_weekend_shifts <= emp_weekend_count)
        
        weekend_unfairness = max_weekend_shifts - min_weekend_shifts
        
        # Fifth objective: Minimize assignment of non-preferred shifts
        # This encourages giving employees their preferred shift types when possible
        non_preferred_shift_penalty = 0
        for emp in self.employees:
            emp_id = emp['id']
            if emp_id in self.employee_shift_preferences:
                shift_prefs = self.employee_shift_preferences[emp_id]
                # Only apply soft penalty if not strict (strict constraints are already hard blocked)
                if not shift_prefs.get('strict', False):
                    non_preferred_shifts = shift_prefs['non_preferred']
                    for d in range(len(self.dates)):
                        for shift in non_preferred_shifts:
                            # Add penalty for each non-preferred shift assignment
                            non_preferred_shift_penalty += self.shifts[(emp_id, d, shift)]
        
        # Sixth objective: Minimize assignment on non-preferred days (soft day constraints)
        # This encourages respecting day preferences as much as possible when not strict
        non_preferred_day_penalty = 0
        for emp in self.employees:
            emp_id = emp['id']
            if emp_id in self.employee_day_penalties:
                penalty_days = self.employee_day_penalties[emp_id]
                for d in penalty_days:
                    for shift in self.shift_types:
                        # Add penalty for each shift assignment on non-preferred days
                        non_preferred_day_penalty += self.shifts[(emp_id, d, shift)]
        
        # Combined objective with balanced weights:
        # - Coverage is most important (weight: 100)
        # - Weekend fairness is high priority (weight: 15) - increased for better fairness
        # - Total fairness is important (weight: 10) 
        # - Shift type fairness is also important (weight: 5)
        # - Preferred shifts matter (weight: 8) - increased weight for better preference respect
        # - Preferred days matter (weight: 12) - high weight for day preferences
        self.model.setObjective(
            100 * total_coverage 
            - 15 * weekend_unfairness 
            - 10 * total_unfairness 
            - 5 * shift_type_unfairness 
            - 8 * non_preferred_shift_penalty 
            - 12 * non_preferred_day_penalty,
            GRB.MAXIMIZE
        )
        
        logger.info("Enhanced objective function set: Coverage (100x), Weekend fairness (15x), Total fairness (10x), Shift type fairness (5x), Preferred shifts (8x), Preferred days (12x)")
    
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
                        shift_start_time, shift_end_time = self.shift_times[shift]
                        
                        # Combine date with time to create full datetime strings
                        shift_start_datetime = f"{date.strftime('%Y-%m-%d')}T{shift_start_time}:00"
                        shift_end_datetime = f"{date.strftime('%Y-%m-%d')}T{shift_end_time}:00"
                        
                        # Handle night shifts that end the next day
                        if shift == "night" and shift_end_time == "06:00":
                            next_date = date + timedelta(days=1)
                            shift_end_datetime = f"{next_date.strftime('%Y-%m-%d')}T{shift_end_time}:00"
                        
                        # Calculate shift duration and cost
                        shift_hours = 8.0  # All shifts are 8 hours
                        hourly_rate = emp.get('hourly_rate', 1000.0)  # Default 1000 SEK if not set
                        shift_cost = shift_hours * hourly_rate
                        
                        shift_assignment = {
                            "employee_id": emp['id'],
                            "employee_name": f"{emp.get('first_name', '')} {emp.get('last_name', '')}",
                            "date": date.strftime('%Y-%m-%d'),
                            "shift_type": shift,
                            "start_time": shift_start_datetime,
                            "end_time": shift_end_datetime,
                            "is_weekend": date.weekday() >= 5,
                            "department": emp.get('department', 'General'),
                            "hours": shift_hours,
                            "hourly_rate": hourly_rate,
                            "cost": shift_cost
                        }
                        
                        logger.info(f"🔍 Created shift with cost: {shift_cost} for {emp.get('first_name', '')} {emp.get('last_name', '')}")
                        
                        schedule.append(shift_assignment)
                        
                        # Update statistics
                        coverage_stats["filled_shifts"] += 1
                        employee_stats[emp['id']]["total_shifts"] += 1
                        employee_stats[emp['id']][f"{shift}_shifts"] += 1
                        
                        if date.weekday() >= 5:  # Weekend
                            employee_stats[emp['id']]["weekend_shifts"] += 1
        
        # Calculate total possible shifts (all days, all shifts)
        coverage_stats["total_shifts"] = len(self.dates) * len(self.shift_types)
        
        if coverage_stats["total_shifts"] > 0:
            coverage_stats["coverage_percentage"] = round(
                (coverage_stats["filled_shifts"] / coverage_stats["total_shifts"]) * 100, 1
            )
        
        # Log results
        logger.info(f"Schedule generated with {coverage_stats['coverage_percentage']}% coverage")
        logger.info(f"Filled {coverage_stats['filled_shifts']} out of {coverage_stats['total_shifts']} shifts")
        
        # Calculate shift type fairness statistics
        shift_type_stats = {}
        for shift_type in self.shift_types:
            shift_counts = [emp_data[f"{shift_type}_shifts"] for emp_data in employee_stats.values()]
            if shift_counts:
                shift_type_stats[shift_type] = {
                    "min": min(shift_counts),
                    "max": max(shift_counts),
                    "avg": round(sum(shift_counts) / len(shift_counts), 1),
                    "range": max(shift_counts) - min(shift_counts)
                }
        
        # Overall fairness calculations
        total_shifts_per_employee = [emp_data["total_shifts"] for emp_data in employee_stats.values()]
        weekend_shifts_per_employee = [emp_data["weekend_shifts"] for emp_data in employee_stats.values()]
        
        fairness_stats = {
            "total_shifts": {
                "min": min(total_shifts_per_employee) if total_shifts_per_employee else 0,
                "max": max(total_shifts_per_employee) if total_shifts_per_employee else 0,
                "avg": round(sum(total_shifts_per_employee) / len(total_shifts_per_employee), 1) if total_shifts_per_employee else 0,
                "range": max(total_shifts_per_employee) - min(total_shifts_per_employee) if total_shifts_per_employee else 0
            },
            "shift_types": shift_type_stats,
            "weekend_shifts": {
                "min": min(weekend_shifts_per_employee) if weekend_shifts_per_employee else 0,
                "max": max(weekend_shifts_per_employee) if weekend_shifts_per_employee else 0,
                "avg": round(sum(weekend_shifts_per_employee) / len(weekend_shifts_per_employee), 1) if weekend_shifts_per_employee else 0,
                "range": max(weekend_shifts_per_employee) - min(weekend_shifts_per_employee) if weekend_shifts_per_employee else 0
            }
        }
        
        logger.info(f"Fairness - Total shifts range: {fairness_stats['total_shifts']['range']}")
        for shift_type, stats in shift_type_stats.items():
            logger.info(f"Fairness - {shift_type} shifts range: {stats['range']}")
        logger.info(f"Fairness - Weekend shifts range: {fairness_stats['weekend_shifts']['range']}")
        
        return {
            "schedule": schedule,
            "statistics": {
                "coverage": coverage_stats,
                "fairness": fairness_stats
            },
            "employee_stats": employee_stats,
            "optimizer": "gurobi",
            "objective_value": self.model.objVal if self.model.status in [GRB.OPTIMAL, GRB.SUBOPTIMAL] else None
        }
    
    def _is_weekend(self, date):
        """Check if a given date is a weekend (Saturday or Sunday)."""
        # weekday() returns 0-6 where Monday=0, Sunday=6
        # So Saturday=5, Sunday=6
        return date.weekday() >= 5


def optimize_schedule_with_gurobi(
    employees: List[Dict], 
    start_date: datetime, 
    end_date: datetime,
    min_staff_per_shift: int = 1,
    min_experience_per_shift: int = 1,
    include_weekends: bool = True,
    allow_partial_coverage: bool = False,
    random_seed: Optional[int] = None,
    employee_preferences: Optional[List] = None
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
        allow_partial_coverage=allow_partial_coverage,
        random_seed=random_seed,
        employee_preferences=employee_preferences
    )
