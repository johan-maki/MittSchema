
"""Main scheduler service that orchestrates the optimization process."""

from typing import List, Dict, Any, Optional
from datetime import datetime
from services.optimizer_service import optimize_schedule

# Re-export the optimize_schedule function to maintain backward compatibility
__all__ = ['optimize_schedule']
