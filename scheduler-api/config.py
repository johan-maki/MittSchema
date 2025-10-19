
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

# Note: Google Maps API removed - using Haversine distances for route optimization
logger.info("📐 Route optimization uses Haversine formula (as-the-crow-flies distances)")

# Core scheduling constants for Gurobi optimizer
GUROBI_CONSTRAINTS = {
    "max_days_per_week": 5,          # Legal constraint: max 5 working days per week
    "max_shifts_per_day": 1,         # Max 1 shift per employee per day
    "shift_hours": 8,                # Each shift is 8 hours
    "shift_types": {
        "day": {
            "start_time": "06:00",
            "end_time": "14:00"
        },
        "evening": {
            "start_time": "14:00", 
            "end_time": "22:00"
        },
        "night": {
            "start_time": "22:00",
            "end_time": "06:00"
        }
    }
}
