from fastapi import APIRouter
from models import ScheduleRequest, ScheduleResponse
from controllers.optimization_controller import handle_optimization_request

router = APIRouter()

@router.post("/optimize-schedule", response_model=ScheduleResponse)
async def optimize_schedule_endpoint(request: ScheduleRequest):
    """Endpoint for schedule optimization."""
    return await handle_optimization_request(request)


