"""
Converter to transform AI-parsed constraints into Gurobi-compatible format
Converts natural language constraints → hard_blocked_slots / medium_blocked_slots
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from dateutil import parser as date_parser

from models import AIConstraint, HardBlockedSlot, MediumBlockedSlot
from config import logger


def convert_ai_constraints_to_preferences(
    ai_constraints: List[AIConstraint],
    existing_preferences: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Convert AI constraints to Gurobi-compatible work_preferences format
    
    Args:
        ai_constraints: List of AIConstraint objects from natural language parsing
        existing_preferences: Existing work_preferences from database
        
    Returns:
        Updated preferences dict with AI constraints merged in
    """
    if not ai_constraints:
        return existing_preferences
    
    logger.info(f"🔄 Converting {len(ai_constraints)} AI constraints to Gurobi format")
    
    # Group constraints by employee
    constraints_by_employee = {}
    for constraint in ai_constraints:
        emp_id = constraint.employee_id
        if not emp_id:
            logger.warning(f"⚠️ Skipping constraint without employee_id: {constraint.original_text}")
            continue
            
        if emp_id not in constraints_by_employee:
            constraints_by_employee[emp_id] = []
        constraints_by_employee[emp_id].append(constraint)
    
    # Convert each employee's constraints
    updated_preferences = existing_preferences.copy()
    
    for emp_id, constraints in constraints_by_employee.items():
        # Get or create employee preference
        emp_pref = updated_preferences.get(emp_id, {
            "employee_id": emp_id,
            "hard_blocked_slots": [],
            "medium_blocked_slots": []
        })
        
        # Initialize blocked slots lists if missing
        if "hard_blocked_slots" not in emp_pref:
            emp_pref["hard_blocked_slots"] = []
        if "medium_blocked_slots" not in emp_pref:
            emp_pref["medium_blocked_slots"] = []
        
        # Add constraints
        for constraint in constraints:
            if constraint.is_hard:
                # Add to hard_blocked_slots
                for date in constraint.dates:
                    hard_slot = {
                        "date": date,
                        "shift_types": constraint.shifts if constraint.shifts else ["all_day"]
                    }
                    emp_pref["hard_blocked_slots"].append(hard_slot)
                    logger.info(f"  ➕ Hard block: {emp_id} on {date} {constraint.shifts}")
            else:
                # Add to medium_blocked_slots (soft preference)
                for date in constraint.dates:
                    medium_slot = {
                        "date": date,
                        "shift_types": constraint.shifts if constraint.shifts else ["all_day"]
                    }
                    emp_pref["medium_blocked_slots"].append(medium_slot)
                    logger.info(f"  ➕ Medium block: {emp_id} on {date} {constraint.shifts}")
        
        updated_preferences[emp_id] = emp_pref
    
    logger.info(f"✅ Converted AI constraints for {len(constraints_by_employee)} employees")
    return updated_preferences


def merge_ai_constraints_with_preferences(
    ai_constraints: List[AIConstraint],
    db_preferences: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Merge AI constraints with database preferences
    
    Args:
        ai_constraints: AI-parsed constraints
        db_preferences: Work preferences from database
        
    Returns:
        Merged preferences list
    """
    # Convert db preferences to dict by employee_id
    pref_dict = {pref["employee_id"]: pref for pref in db_preferences}
    
    # Convert and merge AI constraints
    updated_prefs = convert_ai_constraints_to_preferences(ai_constraints, pref_dict)
    
    # Convert back to list
    return list(updated_prefs.values())


def validate_ai_constraint_dates(
    constraints: List[AIConstraint],
    schedule_start: str,
    schedule_end: str
) -> List[AIConstraint]:
    """
    Validate that AI constraint dates fall within schedule period
    
    Args:
        constraints: List of AI constraints
        schedule_start: Schedule start date (ISO format)
        schedule_end: Schedule end date (ISO format)
        
    Returns:
        Filtered list of valid constraints
    """
    if not constraints:
        return []
    
    start_date = datetime.fromisoformat(schedule_start)
    end_date = datetime.fromisoformat(schedule_end)
    
    valid_constraints = []
    
    for constraint in constraints:
        # Filter dates within schedule period
        valid_dates = []
        for date_str in constraint.dates:
            try:
                date = datetime.fromisoformat(date_str)
                if start_date <= date <= end_date:
                    valid_dates.append(date_str)
                else:
                    logger.warning(f"⚠️ Constraint date {date_str} outside schedule period {schedule_start} to {schedule_end}")
            except ValueError as e:
                logger.error(f"❌ Invalid date format: {date_str} - {e}")
        
        # Keep constraint if it has valid dates
        if valid_dates:
            constraint.dates = valid_dates
            valid_constraints.append(constraint)
        else:
            logger.warning(f"⚠️ Removing constraint with no valid dates: {constraint.original_text}")
    
    logger.info(f"✅ Validated {len(valid_constraints)} of {len(constraints)} AI constraints")
    return valid_constraints
