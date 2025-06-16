
"""Controller for handling schedule optimization requests."""

from fastapi import HTTPException
from datetime import datetime
import traceback
from typing import Dict, Any

from models import ScheduleRequest
from config import logger
from utils import get_supabase_client, fetch_employees, fetch_settings
from scheduler_service import optimize_schedule

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
        
        # Call the scheduler service to optimize the schedule
        result = optimize_schedule(
            employees, 
            start_date, 
            end_date, 
            department=request.department, 
            random_seed=random_seed,
            settings=settings
        )
        
        return {
            "schedule": result["schedule"],
            "staffing_issues": result.get("staffing_issues", []),
            "message": result.get("message", "Schedule optimized successfully")
        }
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        logger.error(f"Error optimizing schedule: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error optimizing schedule: {error_detail}")
