
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ScheduleRequest(BaseModel):
    start_date: str
    end_date: str
    department: Optional[str] = None

class StaffingIssue(BaseModel):
    date: str
    shiftType: str
    current: int
    required: int

class ScheduleResponse(BaseModel):
    schedule: List[Dict[str, Any]]
    message: str
    staffing_issues: List[Dict[str, Any]] = []
