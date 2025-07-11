
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
