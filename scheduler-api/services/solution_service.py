
"""Service for processing solver solutions."""

from datetime import datetime
from config import SCHEDULING_CONSTRAINTS, logger
from utils import format_shift_times

def process_solution(solver, shifts, employees, date_list, shift_types, department, staffing_issues):
    """Process the solution from the solver and format the output"""
    optimized_shifts = []
    for e in employees:
        for d in range(len(date_list)):
            for s in shift_types:
                if solver.Value(shifts[(e['id'], d, s)]) == 1:
                    date = date_list[d]
                    
                    # Get shift times based on shift type from the constants
                    shift_config = SCHEDULING_CONSTRAINTS["shift_types"][s]
                    start_hour = shift_config["start_hour"]
                    end_hour = shift_config["end_hour"]
                    
                    start_time, end_time = format_shift_times(date, start_hour, end_hour)
                    
                    shift = {
                        "employee_id": e['id'],
                        "start_time": start_time.isoformat(),
                        "end_time": end_time.isoformat(),
                        "shift_type": s,
                        "department": e.get('department', department or 'General'),
                        "is_published": False
                    }
                    logger.info(f"Scheduled {e.get('first_name', '')} ({e.get('role', '')}) for {s} shift on {date.strftime('%a %b %d %Y')}")
                    optimized_shifts.append(shift)
    
    logger.info(f"Generated {len(optimized_shifts)} shifts")
    
    return {
        "schedule": optimized_shifts,
        "staffing_issues": staffing_issues,
        "message": f"Successfully generated {len(optimized_shifts)} shifts for {len(employees)} employees"
    }
