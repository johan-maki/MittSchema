
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class HardBlockedSlot(BaseModel):
    """Hard blocked time slot - employee absolutely cannot work this specific time"""
    date: str = Field(description="ISO date string (YYYY-MM-DD)")
    shift_types: List[str] = Field(description="Which shifts on this date are blocked: 'day', 'evening', 'night', or 'all_day'")

class MediumBlockedSlot(BaseModel):
    """Medium blocked time slot - employee strongly prefers not to work but can if needed"""
    date: str = Field(description="ISO date string (YYYY-MM-DD)")
    shift_types: List[str] = Field(description="Which shifts on this date are avoided if possible: 'day', 'evening', 'night', or 'all_day'")

class ManualConstraint(BaseModel):
    """AI-parsed or manually-added constraint for schedule optimization"""
    type: str = Field(description="Constraint type: 'hard_blocked_slot', 'preferred_shift', 'min_experience', 'unknown'")
    employee_id: Optional[str] = Field(default=None, description="Employee UUID if constraint is for specific employee")
    dates: Optional[List[str]] = Field(default=None, description="ISO date strings (YYYY-MM-DD) for constraint")
    shift_types: Optional[List[str]] = Field(default=None, description="Shift types: 'day', 'evening', 'night'")
    is_hard: bool = Field(default=True, description="True = hard constraint (must follow), False = soft constraint (prefer)")
    confidence: Optional[str] = Field(default="high", description="Confidence level: 'high', 'medium', 'low'")
    description: Optional[str] = Field(default=None, description="Human-readable description of constraint")

class EmployeePreference(BaseModel):
    """Employee work preference model"""
    employee_id: str
    preferred_shifts: List[str] = Field(default=["day", "evening", "night"], description="Preferred shift types")
    max_shifts_per_week: int = Field(default=5, description="Maximum shifts per week")
    available_days: List[str] = Field(default=["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], description="Available days of week")
    # Hard constraint fields
    excluded_shifts: List[str] = Field(default=[], description="Shifts that employee absolutely cannot work (hard constraint)")
    excluded_days: List[str] = Field(default=[], description="Days that employee absolutely cannot work (hard constraint)")
    # New fields for hard vs soft constraints
    available_days_strict: bool = Field(default=False, description="If True, available_days becomes a hard constraint (must be followed)")
    preferred_shifts_strict: bool = Field(default=False, description="If True, preferred_shifts becomes a hard constraint")
    # Hard blocked specific time slots - ABSOLUTE: Cannot work (max 3)
    hard_blocked_slots: Optional[List[HardBlockedSlot]] = Field(default=None, description="Specific date+shift combinations that are absolutely blocked (max 3)")
    # Medium blocked specific time slots - PREFERENCE: Avoid if possible (max 3)
    medium_blocked_slots: Optional[List[MediumBlockedSlot]] = Field(default=None, description="Specific date+shift combinations to avoid if possible (max 3)")
    # Additional fields for metadata
    role: Optional[str] = Field(default=None, description="Employee role (e.g., 'Sjuksköterska', 'Läkare')")
    experience_level: Optional[int] = Field(default=1, description="Employee experience points (1-5)")

class ScheduleRequest(BaseModel):
    start_date: str
    end_date: str
    department: Optional[str] = None
    random_seed: Optional[int] = None
    optimizer: Optional[str] = Field(default="gurobi", description="Optimizer to use: 'gurobi' only")
    min_staff_per_shift: Optional[int] = Field(default=1, description="Minimum staff required per shift")
    min_experience_per_shift: Optional[int] = Field(default=1, description="Minimum experience points required per shift")
    include_weekends: Optional[bool] = Field(default=True, description="Whether to schedule weekend shifts")
    allow_partial_coverage: Optional[bool] = Field(default=False, description="Allow partial schedule when not enough staff")
    employee_preferences: Optional[List[EmployeePreference]] = Field(default=None, description="Individual employee work preferences")
    manual_constraints: Optional[List[ManualConstraint]] = Field(default=None, description="AI-parsed or manually added constraints")

class ShiftResponse(BaseModel):
    employee_id: str
    start_time: str
    end_time: str
    shift_type: str
    department: Optional[str] = None
    is_published: bool = False

class StaffingIssue(BaseModel):
    date: str
    shiftType: str
    current: int
    required: int

class CoverageStats(BaseModel):
    total_shifts: int
    filled_shifts: int
    coverage_percentage: float

class FairnessStats(BaseModel):
    min_shifts_per_employee: int
    max_shifts_per_employee: int
    avg_shifts_per_employee: float
    shift_distribution_range: int

class ScheduleResponse(BaseModel):
    schedule: List[Dict[str, Any]]
    coverage_stats: CoverageStats
    employee_stats: Dict[str, Any]
    fairness_stats: FairnessStats
    total_cost: Optional[float] = None
    optimizer: str
    optimization_status: str
    objective_value: Optional[float] = None
    message: str
