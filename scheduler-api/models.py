
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ScheduleRequest(BaseModel):
    start_date: str
    end_date: str
    department: Optional[str] = None
    random_seed: Optional[int] = None
    optimizer: Optional[str] = Field(default="gurobi", description="Optimizer to use: 'gurobi' only")
    min_staff_per_shift: Optional[int] = Field(default=1, description="Minimum staff required per shift")
    min_experience_per_shift: Optional[int] = Field(default=1, description="Minimum experience level required")
    include_weekends: Optional[bool] = Field(default=True, description="Whether to schedule weekend shifts")

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

class ScheduleResponse(BaseModel):
    schedule: List[Dict[str, Any]]
    staffingIssues: Optional[List[StaffingIssue]] = None
    message: Optional[str] = None
