
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("scheduler-api")

# Load environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PORT = int(os.getenv("PORT", 8080))  # Default to 8080 if not set

# Validate environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check environment variables.")

# Core scheduling constants - Source of truth
SCHEDULING_CONSTRAINTS = {
    "min_rest_hours": 11,
    "max_consecutive_days": 5,
    "min_weekly_rest_hours": 36,
    "senior_experience_threshold": 4,
    "require_night_shift_qualification": True,
    "shift_types": {
        "day": {
            "start_hour": 8,
            "end_hour": 16,
            "min_staff": 3,
            "min_experience_sum": 6,
            "min_senior_count": 1
        },
        "evening": {
            "start_hour": 16,
            "end_hour": 0,  # 0 represents midnight (next day)
            "min_staff": 3,
            "min_experience_sum": 6,
            "min_senior_count": 1
        },
        "night": {
            "start_hour": 0,
            "end_hour": 8,
            "min_staff": 2,
            "min_experience_sum": 4,
            "min_senior_count": 1
        }
    }
}
