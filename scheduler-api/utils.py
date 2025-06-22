
from datetime import datetime, timedelta
from typing import Optional
from supabase import create_client, Client
from fastapi import HTTPException
from config import SUPABASE_URL, SUPABASE_KEY, logger

def get_supabase_client() -> Client:
    """Create and return a Supabase client instance"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_employees(supabase: Client, department: Optional[str] = None):
    """Fetch employees from Supabase"""
    try:
        employees_response = supabase.table("employees").select("*").execute()
        employees = employees_response.data
        logger.info(f"Retrieved {len(employees)} employees from database")
        
        if department:
            # Filter employees by department if specified
            employees = [e for e in employees if e.get('department') == department]
            logger.info(f"Filtered to {len(employees)} employees in department {department}")
            
        return employees
    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def fetch_settings(supabase: Client, department: str = "General"):
    """Fetch schedule settings from Supabase"""
    try:
        settings_response = supabase.table("schedule_settings").select("*").eq("department", department).single().execute()
        settings = settings_response.data
        logger.info("Retrieved settings from database")
        return settings
    except Exception as e:
        logger.warning(f"Error fetching settings, using defaults: {str(e)}")
        return {}  # Return empty dict to use defaults

def create_date_list(start_date: datetime, end_date: datetime):
    """Create list of dates between start_date and end_date, inclusive"""
    # Ensure we work with date objects only to avoid time zone issues
    start_date_only = start_date.date()
    end_date_only = end_date.date()
    
    # Calculate the actual number of days including both start and end date
    date_range = (end_date_only - start_date_only).days + 1
    
    # Generate datetime objects for each date (preserving original time for start_date)
    dates = []
    for i in range(date_range):
        date = datetime.combine(start_date_only, start_date.time()) + timedelta(days=i)
        dates.append(date)
    
    return dates

def format_shift_times(date: datetime, start_hour: int, end_hour: int):
    """Format shift start and end times based on shift configuration"""
    # Handle case where shift ends next day
    if end_hour < start_hour or end_hour == 0:
        start_time = datetime(date.year, date.month, date.day, start_hour, 0)
        end_time = datetime(date.year, date.month, date.day, 0, 0) + timedelta(days=1)
        if end_hour > 0:  # Adjust for any non-midnight end time
            end_time = datetime(date.year, date.month, date.day, end_hour, 0) + timedelta(days=1)
    else:
        start_time = datetime(date.year, date.month, date.day, start_hour, 0)
        end_time = datetime(date.year, date.month, date.day, end_hour, 0)
    
    return start_time, end_time
