"""
Gurobi-based optimizer service for advanced schedule optimization.

This service uses Gurobi's mathematical optimization solver to crea            # Add all constraints (note: max_staff_per_shift is stored in self.max_staff_per_shift)
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
        max_staff_per_shift: Optional[int] = None,
        min_experience_per_shift: int = 1,
        include_weekends: bool = True,
        allow_partial_coverage: bool = False,
        random_seed: Optional[int] = None,
        employee_preferences: Optional[List] = None,
        manual_constraints: Optional[List] = None,
        optimize_for_cost: bool = False
    ) -> Dict[str, Any]:
        """
        Main optimization function that creates the optimal schedule.
        
        Args:
            employees: List of employee dictionaries with id, name, etc.
            start_date: Schedule start date
            end_date: Schedule end date
            min_staff_per_shift: Minimum staff required per shift
            max_staff_per_shift: Maximum staff allowed per shift (None = same as min, allows exact staffing)
            min_experience_per_shift: Minimum experience points required per shift
            include_weekends: Whether to schedule weekend shifts
            random_seed: Random seed for reproducible results
            employee_preferences: Individual employee work preferences
            manual_constraints: AI-parsed or manually added constraints
            optimize_for_cost: Whether to optimize for minimum cost (prioritize lower hourly rates)
            
        Returns:
            Dictionary containing the optimized schedule and statistics
        """
        logger.info("Starting Gurobi-based schedule optimization")
        
        try:
            # Initialize data
            self.employees = employees
            self.dates = create_date_list(start_date, end_date)
            self.employee_preferences = employee_preferences or []
            self.manual_constraints = manual_constraints or []
            self.optimize_for_cost = optimize_for_cost
            
            # Set max staff per shift - default to min (exact staffing) for backward compatibility
            self.max_staff_per_shift = max_staff_per_shift if max_staff_per_shift is not None else min_staff_per_shift
            
            logger.info(f"Optimizing schedule for {len(employees)} employees over {len(self.dates)} days")
            logger.info(f"Parameters: min_staff={min_staff_per_shift}, max_staff={self.max_staff_per_shift}, min_experience={min_experience_per_shift}, include_weekends={include_weekends}, optimize_for_cost={optimize_for_cost}")
            logger.info(f"Employee preferences provided: {len(self.employee_preferences)}")
            logger.info(f"Manual constraints provided: {len(self.manual_constraints)}")
            
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
            
            # Calculate max possible shifts considering work_percentage for each employee
            total_weeks = len(self.dates) / 7.0  # Convert days to weeks (can be fractional)
            
            # Calculate total capacity based on each employee's work_percentage from preferences
            total_capacity = 0
            # Create a mapping from employee_id to work_percentage from preferences
            work_percentage_map = {}
            for pref in self.employee_preferences:
                if hasattr(pref, 'work_percentage') and pref.work_percentage is not None:
                    work_percentage_map[pref.employee_id] = pref.work_percentage
                    
            for emp in self.employees:
                # Get work_percentage from preferences first, fallback to employee object, then default to 100%
                work_percentage = work_percentage_map.get(emp.get('id'), emp.get('work_percentage', 100))
                
                # More accurate capacity calculation that respects very low percentages
                if total_weeks < 1.0:
                    # For periods shorter than a week, allow work_percentage of available days
                    max_shifts_exact = (work_percentage / 100.0) * len(self.dates)
                    max_shifts_for_this_emp = int(max_shifts_exact)
                    
                    # For very low percentages, allow at least 1 shift if percentage >= 10%
                    if work_percentage >= 10 and max_shifts_for_this_emp < 1:
                        max_shifts_for_this_emp = 1
                else:
                    # For longer periods, use work_percentage of 5 shifts per week
                    max_shifts_exact = (work_percentage / 100.0) * total_weeks * 5
                    max_shifts_for_this_emp = int(max_shifts_exact)
                    
                    # For very low percentages, allow at least 1 shift if percentage >= 5%
                    if work_percentage >= 5 and max_shifts_for_this_emp < 1:
                        max_shifts_for_this_emp = 1
                
                total_capacity += max_shifts_for_this_emp
                logger.debug(f"Employee {emp.get('first_name', 'Unknown')} ({work_percentage}%): max {max_shifts_for_this_emp} shifts over {total_weeks:.1f} weeks (exact: {max_shifts_exact:.2f}, experience: {emp.get('experience_level', 1)})")
            
            max_possible_shifts = total_capacity
            
            logger.info(f"Period: {len(self.dates)} days ({total_weeks:.1f} weeks)")
            logger.info(f"Shift requirements: {actual_shift_requirements} shifts needed")
            logger.info(f"Employee capacity: {max_possible_shifts} shifts possible (considering work_percentage for {len(employees)} employees)")
            
            if actual_shift_requirements > max_possible_shifts:
                if not allow_partial_coverage:
                    logger.error(f"Impossible to fulfill requirements: need {actual_shift_requirements} shifts but only {max_possible_shifts} possible")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough employees: need {actual_shift_requirements} shifts but only {max_possible_shifts} possible with {len(employees)} employees over {total_weeks:.1f} weeks"
                    )
                else:
                    logger.warning(f"Partial coverage enabled: need {actual_shift_requirements} shifts but only {max_possible_shifts} possible - will generate best possible partial schedule")
                    coverage_percentage = (max_possible_shifts / actual_shift_requirements) * 100
                    logger.info(f"Expected coverage: {coverage_percentage:.1f}% ({max_possible_shifts}/{actual_shift_requirements} shifts)")
            
            # Check if we have enough experience for coverage
            if min_experience_per_shift > 1:  # Only check if we require more than basic experience
                total_experience_available = sum(emp.get('experience_level', 1) for emp in self.employees)
                required_experience_per_day = len(self.shift_types) * min_experience_per_shift
                total_required_experience = working_days * required_experience_per_day
                
                logger.info(f"Experience check: need {total_required_experience} total experience points, have {total_experience_available * max_possible_shifts} theoretical maximum")
                logger.info(f"Experience per shift requirement: {min_experience_per_shift} points per shift")
                
                # Simple heuristic check: if we don't have enough total experience even with max shifts
                if total_experience_available < min_experience_per_shift and not allow_partial_coverage:
                    logger.error(f"Insufficient experience: highest experience level is {max(emp.get('experience_level', 1) for emp in self.employees)} but need {min_experience_per_shift}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient experience: need {min_experience_per_shift} experience points per shift but highest employee experience is {max(emp.get('experience_level', 1) for emp in self.employees)}"
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
            
            # Add manual AI-parsed constraints
            if self.manual_constraints:
                self._add_manual_constraints()
            
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
            elif self.model.status == GRB.INFEASIBLE or self.model.status == GRB.INF_OR_UNBD:
                logger.warning(f"Initial optimization failed with status: {self.model.status}")
                logger.warning("Attempting to find best-effort solution with relaxed constraints...")
                
                # Try progressive relaxation of experience constraints
                original_experience_requirement = min_experience_per_shift
                relaxation_attempts = []
                
                # Create a list of progressively lower experience requirements to try
                if original_experience_requirement > 1:
                    for experience_level in range(original_experience_requirement - 1, 0, -1):
                        relaxation_attempts.append(experience_level)
                
                # Always try with minimum experience = 1 as final fallback
                if 1 not in relaxation_attempts:
                    relaxation_attempts.append(1)
                
                for attempt_experience in relaxation_attempts:
                    logger.warning(f"Trying with relaxed experience requirement: {attempt_experience} (was {original_experience_requirement})")
                    
                    # Create new model for relaxed constraints
                    self.model = gp.Model("ScheduleOptimization_Relaxed")
                    self.shifts = {}
                    
                    # Recreate variables and constraints with relaxed requirements
                    self._create_variables()
                    self._add_constraints(min_staff_per_shift, attempt_experience, include_weekends, allow_partial_coverage)
                    self._add_employee_preference_constraints()
                    self._set_objective()
                    
                    # Try optimization with relaxed constraints
                    self.model.setParam('OutputFlag', 0)  # Reduce output for fallback attempts
                    self.model.setParam('TimeLimit', 15)  # Shorter time limit for fallback attempts
                    self.model.optimize()
                    
                    if self.model.status == GRB.OPTIMAL or self.model.status == GRB.SUBOPTIMAL or (self.model.status == GRB.TIME_LIMIT and self.model.SolCount > 0):
                        logger.warning(f"Found feasible solution with relaxed experience requirement: {attempt_experience}")
                        logger.warning("Note: This schedule may not meet all original experience requirements")
                        result = self._extract_solution()
                        # Add a warning flag to indicate this is a relaxed solution
                        result['relaxed_constraints'] = {
                            'original_min_experience': original_experience_requirement,
                            'actual_min_experience': attempt_experience,
                            'warning': f"Could not meet original experience requirement of {original_experience_requirement}. Using {attempt_experience} instead."
                        }
                        return result
                
                # If all relaxation attempts failed, provide detailed error
                logger.error("All optimization attempts failed, including with minimum constraints")
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
                    detail=f"No feasible schedule found even with relaxed constraints. Final Gurobi status: {status_name}. This may indicate insufficient staff or overly restrictive employee preferences."
                )
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
                # Calculate max shifts per week based on work_percentage
                work_percentage = emp.get('work_percentage', 100)  # Default to 100% if not specified
                
                # Split dates into weeks
                for week_start in range(0, len(self.dates), 7):
                    week_end = min(week_start + 7, len(self.dates))
                    week_days = list(range(week_start, week_end))
                    
                    # For partial weeks, adjust the limit proportionally
                    days_in_week = len(week_days)
                    
                    # Calculate max shifts based on work_percentage
                    # Full-time (100%) = max 5 days per week
                    # Part-time should be proportional: 20% = 1 day per week, 40% = 2 days, etc.
                    base_max_shifts = min(5, days_in_week)  # Legal limit is still 5 days max
                    
                    # Calculate exact shifts allowed based on percentage
                    # Don't use max(1, ...) to allow for very low percentages
                    exact_shifts_allowed = (work_percentage / 100.0) * base_max_shifts
                    
                    # Use floor for individual weeks, but allow the global constraint to handle
                    # the exact percentage distribution over the entire period
                    max_shifts_this_week = int(exact_shifts_allowed)
                    
                    # For very low percentages, we need to allow some weeks to have 1 shift
                    # even if the weekly calculation gives 0, so the global constraint can work
                    # Allow up to 1 shift per week for any non-zero percentage
                    if work_percentage > 0 and max_shifts_this_week == 0:
                        max_shifts_this_week = 1  # Allow 1 shift per week, global constraint will limit total
                    
                    logger.debug(f"Employee {emp.get('first_name', 'Unknown')} ({work_percentage}%): max {max_shifts_this_week} shifts this week (exact: {exact_shifts_allowed:.2f}, base: {base_max_shifts})")
                    
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
        
        # 2b. Add GLOBAL work_percentage constraint for the entire period
        # This ensures total shifts over the whole period respect work_percentage exactly
        logger.info("Adding global work_percentage constraints for entire period...")
        for emp in self.employees:
            work_percentage = emp.get('work_percentage', 100)
            
            # Calculate total max shifts for this employee over entire period
            total_weeks = len(self.dates) / 7.0
            total_max_shifts_exact = (work_percentage / 100.0) * total_weeks * 5  # 5 = max shifts per week
            total_max_shifts = int(total_max_shifts_exact)
            
            # Don't force a minimum - let the percentage be exactly respected
            # Even 0% should be allowed to get 0 shifts
            if work_percentage > 0 and total_max_shifts_exact >= 0.5:
                # If the exact calculation is at least 0.5, round up to give at least 1 shift
                total_max_shifts = max(1, total_max_shifts)
            else:
                # Otherwise, use the floor (which could be 0 for very low percentages)
                total_max_shifts = total_max_shifts
            
            # Sum all shifts for this employee across the entire period
            employee_total_shifts = gp.quicksum(
                self.shifts[(emp['id'], d, shift)]
                for d in range(len(self.dates))
                for shift in self.shift_types
            )
            
            # Add global constraint
            self.model.addConstr(
                employee_total_shifts <= total_max_shifts,
                name=f"global_work_percentage_{emp['id']}_max_{total_max_shifts}"
            )
            
            logger.debug(f"Employee {emp.get('first_name', 'Unknown')} ({work_percentage}%): global max {total_max_shifts} shifts over {total_weeks:.1f} weeks (exact: {total_max_shifts_exact:.2f})")
        
        logger.info("Global work_percentage constraints added successfully")
        
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
                
                # Ensure maximum staff per shift (prevent excessive overstaffing)
                # Uses max_staff_per_shift if configured, otherwise defaults to min (exact staffing)
                # This allows flexibility for extra staffing when needed (training, backup, overlap)
                self.model.addConstr(
                    total_staff <= self.max_staff_per_shift,
                    name=f"max_staff_{d}_{shift}"
                )
                
                # 4. Minimum experience level per shift
                # Calculate total experience points for this shift
                if min_experience_per_shift > 0:
                    total_experience = gp.quicksum(
                        self.shifts[(emp['id'], d, shift)] * emp.get('experience_level', 1)
                        for emp in self.employees
                    )
                    
                    # Only enforce minimum experience constraint if we require staff for this shift
                    if required_staff > 0 and not allow_partial_coverage:
                        self.model.addConstr(
                            total_experience >= min_experience_per_shift,
                            name=f"min_experience_{d}_{shift}"
                        )
                        logger.debug(f"Added experience constraint: {date} {shift} requires {min_experience_per_shift} experience points")
        
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
        
        # Initialize counters for summary
        hard_blocked_count = 0
        
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
        
        # 6. HARD BLOCKED TIME SLOTS (NEW!)
        # These are specific date+shift combinations that employee absolutely cannot work
        # Max 3 slots per employee, enforced as HARD constraints
        hard_blocked_count = 0
        for pref in valid_preferences:
            emp_id = pref.employee_id
            
            # Check if employee has hard blocked slots
            if hasattr(pref, 'hard_blocked_slots') and pref.hard_blocked_slots:
                logger.info(f"Employee {emp_id} has {len(pref.hard_blocked_slots)} hard blocked time slots")
                
                for slot in pref.hard_blocked_slots:
                    try:
                        # Parse the date string (format: "YYYY-MM-DD")
                        from datetime import datetime
                        slot_date = datetime.strptime(slot.date, '%Y-%m-%d').date()
                        
                        # Find the index of this date in our scheduling period
                        # dates is a list of date objects
                        day_index = None
                        for d, date in enumerate(self.dates):
                            if date.date() == slot_date:
                                day_index = d
                                break
                        
                        if day_index is None:
                            logger.warning(f"Hard blocked date {slot.date} for employee {emp_id} is outside scheduling period - skipping")
                            continue
                        
                        # Block the specified shift types for this date
                        for shift_type in slot.shift_types:
                            if shift_type == 'all_day':
                                # Block ALL shifts for this day (day, evening, night)
                                logger.info(f"HARD BLOCK: Employee {emp_id} blocked for ALL shifts on {slot.date}")
                                for shift in self.shift_types:
                                    self.model.addConstr(
                                        self.shifts[(emp_id, day_index, shift)] == 0,
                                        name=f"hard_blocked_all_{emp_id}_{day_index}_{shift}"
                                    )
                                    hard_blocked_count += 1
                            elif shift_type in self.shift_types:
                                # Block specific shift type
                                logger.info(f"HARD BLOCK: Employee {emp_id} blocked for {shift_type} shift on {slot.date}")
                                self.model.addConstr(
                                    self.shifts[(emp_id, day_index, shift_type)] == 0,
                                    name=f"hard_blocked_{emp_id}_{day_index}_{shift_type}"
                                )
                                hard_blocked_count += 1
                            else:
                                logger.warning(f"Unknown shift type '{shift_type}' in hard blocked slot for employee {emp_id} - skipping")
                    
                    except ValueError as e:
                        logger.error(f"Invalid date format in hard blocked slot for employee {emp_id}: {slot.date} - {e}")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing hard blocked slot for employee {emp_id}: {e}")
                        continue
        
        if hard_blocked_count > 0:
            logger.info(f"✓ Added {hard_blocked_count} hard blocked time slot constraints")
        
        # 7. MEDIUM BLOCKED TIME SLOTS (PENALTY-BASED)
        # These are strong preferences - employee prefers not to work but CAN if needed
        # Implemented as penalty terms in objective function rather than hard constraints
        # Max 3 slots per employee (enforced on frontend)
        medium_blocked_count = 0
        self.medium_penalty_vars = {}  # Store penalty variables for objective function
        
        for pref in valid_preferences:
            emp_id = pref.employee_id
            
            # Check if employee has medium blocked slots
            if hasattr(pref, 'medium_blocked_slots') and pref.medium_blocked_slots:
                logger.info(f"Employee {emp_id} has {len(pref.medium_blocked_slots)} medium blocked time slots")
                
                for slot in pref.medium_blocked_slots:
                    try:
                        # Parse the date string (format: "YYYY-MM-DD")
                        from datetime import datetime
                        slot_date = datetime.strptime(slot.date, '%Y-%m-%d').date()
                        
                        # Find the index of this date in our scheduling period
                        day_index = None
                        for d, date in enumerate(self.dates):
                            if date.date() == slot_date:
                                day_index = d
                                break
                        
                        if day_index is None:
                            logger.warning(f"Medium blocked date {slot.date} for employee {emp_id} is outside scheduling period - skipping")
                            continue
                        
                        # Create penalty variables for specified shift types
                        for shift_type in slot.shift_types:
                            if shift_type == 'all_day':
                                # Create penalty for ALL shifts on this day
                                logger.info(f"MEDIUM BLOCK: Employee {emp_id} prefers to avoid ALL shifts on {slot.date}")
                                for shift in self.shift_types:
                                    # Create penalty variable (1 if shift is assigned, 0 otherwise)
                                    penalty_var = self.model.addVar(
                                        vtype=GRB.BINARY,
                                        name=f"medium_penalty_{emp_id}_{day_index}_{shift}"
                                    )
                                    # Link penalty to shift assignment: penalty >= shift
                                    # If shift is assigned (1), penalty must be 1
                                    # If shift is not assigned (0), penalty can be 0 (optimizer will choose 0 to minimize cost)
                                    self.model.addConstr(
                                        penalty_var >= self.shifts[(emp_id, day_index, shift)],
                                        name=f"medium_penalty_link_{emp_id}_{day_index}_{shift}"
                                    )
                                    # Store penalty variable for objective function
                                    self.medium_penalty_vars[(emp_id, day_index, shift)] = penalty_var
                                    medium_blocked_count += 1
                            elif shift_type in self.shift_types:
                                # Create penalty for specific shift type
                                logger.info(f"MEDIUM BLOCK: Employee {emp_id} prefers to avoid {shift_type} shift on {slot.date}")
                                penalty_var = self.model.addVar(
                                    vtype=GRB.BINARY,
                                    name=f"medium_penalty_{emp_id}_{day_index}_{shift_type}"
                                )
                                self.model.addConstr(
                                    penalty_var >= self.shifts[(emp_id, day_index, shift_type)],
                                    name=f"medium_penalty_link_{emp_id}_{day_index}_{shift_type}"
                                )
                                self.medium_penalty_vars[(emp_id, day_index, shift_type)] = penalty_var
                                medium_blocked_count += 1
                            else:
                                logger.warning(f"Unknown shift type '{shift_type}' in medium blocked slot for employee {emp_id} - skipping")
                    
                    except ValueError as e:
                        logger.error(f"Invalid date format in medium blocked slot for employee {emp_id}: {slot.date} - {e}")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing medium blocked slot for employee {emp_id}: {e}")
                        continue
        
        if medium_blocked_count > 0:
            logger.info(f"✓ Created {medium_blocked_count} medium blocked penalty variables (will be added to objective)")
        
        logger.info("Employee preference constraints added successfully")
        
        # Summary logging
        total_employees = len(self.employees)
        employees_with_preferences = len(self.employee_preferences)
        employees_with_custom_weekly = len(self.employees_with_custom_weekly_limits)
        employees_with_shift_prefs = len(self.employee_shift_preferences)
        employees_with_hard_blocks = sum(1 for pref in valid_preferences 
                                         if hasattr(pref, 'hard_blocked_slots') and pref.hard_blocked_slots)
        
        logger.info(f"Employee preference summary:")
        logger.info(f"  Total employees: {total_employees}")
        logger.info(f"  Employees with preferences: {employees_with_preferences}")
        logger.info(f"  Employees with custom weekly limits: {employees_with_custom_weekly}")
        logger.info(f"  Employees with shift preferences: {employees_with_shift_prefs}")
        logger.info(f"  Employees with hard blocked slots: {employees_with_hard_blocks}")
        logger.info(f"  Total hard blocked constraints: {hard_blocked_count}")
        
        # Log any employees without preferences
        employees_without_prefs = [emp['id'] for emp in self.employees 
                                 if emp['id'] not in [pref.employee_id for pref in self.employee_preferences]]
        if employees_without_prefs:
            logger.info(f"  Employees using default constraints: {len(employees_without_prefs)}")
    
    def _add_manual_constraints(self):
        """
        Add manually specified constraints from AI-parser or user input.
        
        Supported constraint types:
        - hard_blocked_slot: Employee cannot work specific date+shift (hard constraint)
        - preferred_shift: Employee prefers/avoids specific shifts (soft constraint in objective)
        """
        logger.info(f"Adding {len(self.manual_constraints)} manual constraints...")
        
        for constraint in self.manual_constraints:
            try:
                constraint_type = constraint.type if hasattr(constraint, 'type') else constraint.get('type')
                employee_id = constraint.employee_id if hasattr(constraint, 'employee_id') else constraint.get('employee_id')
                dates = constraint.dates if hasattr(constraint, 'dates') else constraint.get('dates', [])
                shift_types = constraint.shift_types if hasattr(constraint, 'shift_types') else constraint.get('shift_types', [])
                is_hard = constraint.is_hard if hasattr(constraint, 'is_hard') else constraint.get('is_hard', True)
                description = constraint.description if hasattr(constraint, 'description') else constraint.get('description', 'Unknown')
                
                logger.info(f"Processing manual constraint: {description} (type={constraint_type}, hard={is_hard})")
                
                if constraint_type == 'hard_blocked_slot' and is_hard:
                    # Hard constraint: Employee absolutely cannot work this slot
                    if not employee_id or not dates or not shift_types:
                        logger.warning(f"Skipping incomplete hard_blocked_slot constraint: {description}")
                        continue
                    
                    for date_str in dates:
                        # Find date index in self.dates
                        try:
                            target_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
                            date_idx = next(i for i, d in enumerate(self.dates) if d.date() == target_date)
                            
                            for shift_type in shift_types:
                                if shift_type in self.shift_types:
                                    # Add hard constraint: this shift must be 0
                                    self.model.addConstr(
                                        self.shifts[(employee_id, date_idx, shift_type)] == 0,
                                        name=f"manual_hard_block_{employee_id}_{date_idx}_{shift_type}"
                                    )
                                    logger.info(f"  ✓ Added hard block: {employee_id} cannot work {shift_type} on {date_str}")
                        except (ValueError, StopIteration) as e:
                            logger.warning(f"Skipping invalid date {date_str} in constraint: {e}")
                            continue
                
                elif constraint_type == 'hard_blocked_slot' and not is_hard:
                    # Soft constraint: Employee prefers not to work this slot
                    # This would be handled in objective function - not yet implemented
                    logger.info(f"  → Soft constraint for {description} (would add penalty in objective)")
                
                else:
                    logger.info(f"  → Constraint type '{constraint_type}' not yet implemented")
            
            except Exception as e:
                logger.error(f"Error adding manual constraint: {e}")
                continue
        
        logger.info("Manual constraints applied successfully")
    
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
        
        # Seventh objective: Minimize violations of medium blocked slots
        # These are strong preferences - employee strongly prefers not to work but CAN if needed
        # Weight (30) is higher than soft preferences (8-12) but lower than hard constraints (impossible)
        medium_blocked_penalty = 0
        if hasattr(self, 'medium_penalty_vars') and self.medium_penalty_vars:
            medium_blocked_penalty = gp.quicksum(self.medium_penalty_vars.values())
        
        # Eighth objective: Minimize deviation from work_percentage targets (when cost optimization is OFF)
        # This encourages giving each employee shifts matching their work_percentage exactly
        # For example: 100% employee gets full schedule, 50% employee gets half, etc.
        work_percentage_deviation = 0
        if not self.optimize_for_cost:
            # Only optimize for work_percentage targets when NOT optimizing for cost
            # This ensures employees get their contracted hours when economics isn't a concern
            total_weeks = len(self.dates) / 7.0
            
            for emp in self.employees:
                work_percentage = emp.get('work_percentage', 100)
                
                # Calculate target shifts for this employee based on their work_percentage
                target_shifts_exact = (work_percentage / 100.0) * total_weeks * 5  # 5 shifts per week
                target_shifts = target_shifts_exact  # Use exact value for better precision
                
                # Calculate actual shifts assigned to this employee
                actual_shifts = gp.quicksum(
                    self.shifts[(emp['id'], d, shift)]
                    for d in range(len(self.dates))
                    for shift in self.shift_types
                )
                
                # Create absolute value of deviation using auxiliary variable
                deviation_var = self.model.addVar(vtype=GRB.CONTINUOUS, name=f"work_pct_dev_{emp['id']}")
                self.model.addConstr(deviation_var >= actual_shifts - target_shifts)
                self.model.addConstr(deviation_var >= target_shifts - actual_shifts)
                
                work_percentage_deviation += deviation_var
            
            logger.info("📊 Work percentage optimization ENABLED - will try to match each employee's contracted percentage")
        else:
            logger.info("📊 Work percentage optimization DISABLED - cost takes priority")
        
        # Ninth objective: Minimize total staffing cost (optional)
        # Only included when optimize_for_cost is enabled
        # This encourages using employees with lower hourly rates when possible
        total_cost = 0
        if self.optimize_for_cost:
            total_cost = gp.quicksum(
                self.shifts[(emp['id'], d, shift)] * emp.get('hourly_rate', 1000.0)
                for emp in self.employees
                for d in range(len(self.dates))
                for shift in self.shift_types
            )
            logger.info("💰 Cost optimization ENABLED - will prioritize employees with lower hourly rates")
        else:
            logger.info("� Cost optimization DISABLED - all employees treated equally regardless of hourly rate")
        
        # Combined objective with balanced weights:
        # - Coverage is most important (weight: 100)
        # - Total fairness is very high priority (weight: 50) - HIGH weight to spread shifts evenly across all experience levels
        # - Work percentage target matching (weight: 40) - when cost OFF, try to hit each employee's contracted percentage
        # - Medium blocked slots are high priority (weight: 30) - strong preference to avoid
        # - Preferred shifts are very important (weight: 18) - respect shift preferences
        # - Weekend fairness is high priority (weight: 15) - increased for better fairness
        # - Preferred days matter (weight: 12) - high weight for day preferences
        # - Shift type fairness is important (weight: 8)
        # - Cost is minor priority (weight: 0.001) - when enabled, prefer lower-cost employees as tie-breaker only
        
        objective_terms = [
            100 * total_coverage,
            -50 * total_unfairness,
            -30 * medium_blocked_penalty,
            -18 * non_preferred_shift_penalty,
            -15 * weekend_unfairness,
            -8 * shift_type_unfairness,
            -12 * non_preferred_day_penalty
        ]
        
        # Add work_percentage deviation penalty when cost optimization is OFF
        if not self.optimize_for_cost:
            # High weight (40) to strongly encourage matching contracted work percentages
            # This ensures 100% employees get full schedules, 50% get half, etc.
            objective_terms.append(-40 * work_percentage_deviation)
        
        # Add cost term only if cost optimization is enabled
        if self.optimize_for_cost:
            # Weight of 0.001 means: saving 1000 SEK is worth about 1 point of coverage/fairness
            # This keeps cost as a tie-breaker rather than dominating factor
            objective_terms.append(-0.001 * total_cost)
        
        self.model.setObjective(
            gp.quicksum(objective_terms),
            GRB.MAXIMIZE
        )
        
        if self.optimize_for_cost:
            logger.info(f"✅ Objective function set WITH cost consideration (0.001x): Coverage (100x), Total fairness (50x), Medium blocks (30x), Preferred shifts (18x), Weekend fairness (15x), Shift type (8x), Preferred days (12x), Cost (0.001x)")
        else:
            logger.info(f"✅ Objective function set WITHOUT cost consideration: Coverage (100x), Total fairness (50x), Work % targets (40x), Medium blocks (30x), Preferred shifts (18x), Weekend fairness (15x), Shift type (8x), Preferred days (12x)")
    
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
                            "experience_level": emp.get('experience_level', 1),
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
        
        # Analyze uncovered shifts - detailed breakdown
        uncovered_shifts = []
        shift_type_coverage = {"day": {"filled": 0, "total": 0}, "evening": {"filled": 0, "total": 0}, "night": {"filled": 0, "total": 0}}
        
        for d in range(len(self.dates)):
            date = self.dates[d]
            for shift in self.shift_types:
                shift_type_coverage[shift]["total"] += 1
                is_filled = False
                
                for emp in self.employees:
                    if self.shifts[(emp['id'], d, shift)].x > 0.5:
                        is_filled = True
                        shift_type_coverage[shift]["filled"] += 1
                        break
                
                if not is_filled:
                    # Analyze why this shift couldn't be filled
                    reasons = []
                    available_employees = 0
                    
                    for emp in self.employees:
                        emp_id = emp['id']
                        # Check if employee could theoretically work this shift
                        emp_pref = next((p for p in self.employee_preferences if p.employee_id == emp_id), None)
                        
                        if emp_pref:
                            # Check hard blocks
                            if hasattr(emp_pref, 'hard_blocked_slots') and emp_pref.hard_blocked_slots:
                                for block in emp_pref.hard_blocked_slots:
                                    if block.get('date') == date.strftime('%Y-%m-%d') and block.get('shift_type') == shift:
                                        reasons.append(f"{emp.get('first_name', '')} hårt blockerad")
                                        break
                            
                            # Check excluded shifts
                            if hasattr(emp_pref, 'excluded_shifts') and emp_pref.excluded_shifts:
                                if shift in emp_pref.excluded_shifts:
                                    reasons.append(f"{emp.get('first_name', '')} exkluderad från {shift}pass")
                                    continue
                            
                            # Check excluded days
                            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                            day_name = day_names[date.weekday()]
                            if hasattr(emp_pref, 'excluded_days') and emp_pref.excluded_days:
                                if day_name in emp_pref.excluded_days:
                                    reasons.append(f"{emp.get('first_name', '')} exkluderad från {day_name}")
                                    continue
                        
                        available_employees += 1
                    
                    if available_employees == 0:
                        if not reasons:
                            reasons.append("Ingen tillgänglig personal (alla blockerade/exkluderade)")
                    else:
                        reasons.append(f"Otillräcklig kapacitet ({available_employees} tillgängliga men alla upptagna)")
                    
                    uncovered_shifts.append({
                        "date": date.strftime('%Y-%m-%d'),
                        "day_name": ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"][date.weekday()],
                        "shift_type": shift,
                        "shift_label": {"day": "Dagpass", "evening": "Kvällspass", "night": "Nattpass"}[shift],
                        "reasons": reasons[:3]  # Top 3 reasons
                    })
        
        # Add detailed coverage analysis
        coverage_stats["uncovered_shifts"] = uncovered_shifts
        coverage_stats["uncovered_count"] = len(uncovered_shifts)
        coverage_stats["shift_type_coverage"] = {
            k: {
                "filled": v["filled"],
                "total": v["total"],
                "percentage": round((v["filled"] / v["total"] * 100), 1) if v["total"] > 0 else 0
            }
            for k, v in shift_type_coverage.items()
        }
        
        # Log results
        logger.info(f"Schedule generated with {coverage_stats['coverage_percentage']}% coverage")
        logger.info(f"Filled {coverage_stats['filled_shifts']} out of {coverage_stats['total_shifts']} shifts")
        logger.info(f"Uncovered shifts: {coverage_stats['uncovered_count']}")
        for shift_type, data in coverage_stats["shift_type_coverage"].items():
            logger.info(f"  {shift_type}: {data['percentage']}% ({data['filled']}/{data['total']})")
        
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
        
        # Validate experience requirements for each shift
        experience_violations = 0
        for d in range(len(self.dates)):
            date = self.dates[d]
            for shift in self.shift_types:
                # Calculate total experience for this shift
                shift_experience = 0
                shift_staff = 0
                for emp in self.employees:
                    if (emp['id'], d, shift) in self.shifts and self.shifts[(emp['id'], d, shift)].x > 0.5:
                        shift_experience += emp.get('experience_level', 1)
                        shift_staff += 1
                
                if shift_staff > 0:  # Only check shifts that are actually scheduled
                    logger.debug(f"Shift {date.strftime('%Y-%m-%d')} {shift}: {shift_staff} staff, {shift_experience} experience points")
                    if shift_experience < 1:  # Basic validation - should have at least some experience
                        experience_violations += 1
                        logger.warning(f"Experience concern: {date.strftime('%Y-%m-%d')} {shift} has {shift_experience} experience points with {shift_staff} staff")
        
        if experience_violations > 0:
            logger.warning(f"Found {experience_violations} shifts with potential experience issues")
        else:
            logger.info("All scheduled shifts meet basic experience requirements")
        
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
    max_staff_per_shift: Optional[int] = None,
    min_experience_per_shift: int = 1,
    include_weekends: bool = True,
    allow_partial_coverage: bool = False,
    optimize_for_cost: bool = False,
    random_seed: Optional[int] = None,
    employee_preferences: Optional[List] = None,
    manual_constraints: Optional[List] = None
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
        max_staff_per_shift=max_staff_per_shift,
        min_experience_per_shift=min_experience_per_shift,
        include_weekends=include_weekends,
        allow_partial_coverage=allow_partial_coverage,
        optimize_for_cost=optimize_for_cost,
        random_seed=random_seed,
        employee_preferences=employee_preferences,
        manual_constraints=manual_constraints
    )
