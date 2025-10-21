
"""Controller for handling schedule optimization requests."""

from fastapi import HTTPException
from datetime import datetime
import traceback
from typing import Dict, Any

from models import ScheduleRequest
from config import logger
from utils import get_supabase_client, fetch_employees, fetch_settings
from scheduler_service import optimize_schedule
from services.ai_constraint_converter import (
    convert_ai_constraints_to_preferences,
    validate_ai_constraint_dates
)

async def handle_optimization_request(request: ScheduleRequest):
    """Handle schedule optimization request logic."""
    try:
        logger.info(f"Processing schedule optimization request: {request}")
        
        # Validate request
        if not request.start_date or not request.end_date:
            raise HTTPException(status_code=400, detail="Start date and end date are required")
        
        # Parse date range
        try:
            start_date = datetime.fromisoformat(request.start_date.replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(request.end_date.replace('Z', '+00:00'))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
        
        date_range = (end_date - start_date).days + 1
        
        if date_range <= 0:
            raise HTTPException(status_code=400, detail="End date must be after start date")
        if date_range > 31:
            raise HTTPException(status_code=400, detail="Maximum scheduling period is 31 days")

        # Get Supabase client with connection retry
        try:
            supabase = get_supabase_client()
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {str(e)}")
            raise HTTPException(status_code=503, detail="Database connection failed")
        
        # Fetch employees from Supabase
        logger.info("Fetching employees from Supabase")
        employees = fetch_employees(supabase, request.department)

        if not employees:
            logger.warning("No employees found in the database")
            raise HTTPException(status_code=404, detail="No employees found for the specified department")

        # Try to fetch settings from Supabase
        settings = fetch_settings(supabase, request.department or "General")
        
        # Use the random_seed if provided, otherwise generate one
        random_seed = request.random_seed or int(datetime.now().timestamp() * 1000000) % 1000000
        logger.info(f"Using random seed: {random_seed}")
        
        # Process AI constraints if provided
        processed_employee_preferences = request.employee_preferences
        if request.ai_constraints:
            logger.info(f"📝 Received {len(request.ai_constraints)} AI constraints")
            
            # Validate constraint dates are within schedule period
            valid_constraints = validate_ai_constraint_dates(
                request.ai_constraints,
                request.start_date,
                request.end_date
            )
            logger.info(f"✅ {len(valid_constraints)} AI constraints validated")
            
            # Convert AI constraints to employee preferences format
            if valid_constraints:
                # Build preferences dict from request.employee_preferences
                pref_dict = {}
                if request.employee_preferences:
                    for pref in request.employee_preferences:
                        pref_dict[pref.employee_id] = pref.model_dump()
                
                # Merge AI constraints
                updated_prefs = convert_ai_constraints_to_preferences(valid_constraints, pref_dict)
                
                # Convert back to list of dicts (not Pydantic models)
                processed_employee_preferences = [
                    pref if isinstance(pref, dict) else pref.model_dump()
                    for pref in updated_prefs.values()
                ]
                
                logger.info(f"🤖 Merged AI constraints into employee preferences for {len(processed_employee_preferences)} employees")
        
        # Call the scheduler service to optimize the schedule
        # Always allow partial coverage to get best possible schedule even with insufficient staff
        result = optimize_schedule(
            employees=employees, 
            start_date=start_date, 
            end_date=end_date, 
            department=request.department, 
            random_seed=random_seed,
            optimizer=request.optimizer or "gurobi",
            min_staff_per_shift=request.min_staff_per_shift or 1,
            max_staff_per_shift=request.max_staff_per_shift,  # Pass through - None is valid (means exact staffing)
            min_experience_per_shift=request.min_experience_per_shift or 1,
            include_weekends=request.include_weekends if request.include_weekends is not None else True,
            allow_partial_coverage=True,  # Always True: generate best possible schedule regardless of coverage %
            optimize_for_cost=request.optimize_for_cost or False,
            employee_preferences=processed_employee_preferences,  # Use processed preferences with AI constraints
            manual_constraints=request.manual_constraints
        )
        
        # Debug: log what we got from optimizer
        statistics = result.get("statistics", {})
        coverage_data = statistics.get("coverage", {})
        fairness_data = statistics.get("fairness", {})
        
        # Calculate total cost from schedule
        total_cost = sum(shift.get('cost', 0) for shift in result["schedule"])
        
        response_data = {
            "schedule": result["schedule"],
            "coverage_stats": {
                "total_shifts": coverage_data.get("total_shifts", 0),
                "filled_shifts": coverage_data.get("filled_shifts", 0),
                "coverage_percentage": coverage_data.get("coverage_percentage", 0.0)
            },
            "employee_stats": result.get("employee_stats", {}),
            "fairness_stats": {
                "total_shifts": fairness_data.get("total_shifts", {}),
                "shift_types": fairness_data.get("shift_types", {}),
                "weekend_shifts": fairness_data.get("weekend_shifts", {}),
                # Legacy fields for backward compatibility
                "min_shifts_per_employee": fairness_data.get("total_shifts", {}).get("min", 0),
                "max_shifts_per_employee": fairness_data.get("total_shifts", {}).get("max", 0),
                "avg_shifts_per_employee": fairness_data.get("total_shifts", {}).get("avg", 0.0),
                "shift_distribution_range": fairness_data.get("total_shifts", {}).get("range", 0)
            },
            "total_cost": total_cost,
            "optimizer": result.get("optimizer", "gurobi"),
            "optimization_status": "optimal" if result.get("objective_value") is not None else "unknown",
            "objective_value": result.get("objective_value"),
            "message": result.get("message", "Schedule optimized successfully")
        }
        
        return response_data
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        logger.error(f"Error optimizing schedule: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error optimizing schedule: {error_detail}")
