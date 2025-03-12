
from fastapi import APIRouter, HTTPException
from datetime import datetime
import traceback
from typing import Dict, Any

from models import ScheduleRequest, ScheduleResponse
from config import logger
from utils import get_supabase_client, fetch_employees, fetch_settings
from scheduler_service import optimize_schedule

router = APIRouter()

@router.post("/optimize-schedule", response_model=ScheduleResponse)
async def optimize_schedule_endpoint(request: ScheduleRequest):
    try:
        logger.info(f"Received schedule optimization request: {request}")
        
        # Parse date range
        start_date = datetime.fromisoformat(request.start_date)
        end_date = datetime.fromisoformat(request.end_date)
        date_range = (end_date - start_date).days + 1
        
        if date_range <= 0 or date_range > 31:
            raise HTTPException(status_code=400, detail="Invalid date range. Maximum period is 31 days.")

        # Get Supabase client
        supabase = get_supabase_client()
        
        # Fetch employees from Supabase
        logger.info("Fetching employees from Supabase")
        employees = fetch_employees(supabase, request.department)

        if not employees:
            logger.warning("No employees found in the database")
            raise HTTPException(status_code=404, detail="No employees found in the database")

        # Try to fetch settings from Supabase
        settings = fetch_settings(supabase, request.department or "General")
        
        # Use the random_seed if provided
        random_seed = request.random_seed
        logger.info(f"Using random seed: {random_seed}")
        
        # Call the scheduler service to optimize the schedule
        result = optimize_schedule(employees, start_date, end_date, department=request.department, random_seed=random_seed)
        
        return {
            "schedule": result["schedule"],
            "staffing_issues": result["staffing_issues"],
            "message": result["message"]
        }
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        logger.error(f"Error optimizing schedule: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error optimizing schedule: {error_detail}")

