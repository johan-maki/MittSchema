#!/usr/bin/env python3
"""
Direct test of Gurobi optimizer to isolate the error
"""

import sys
import os
sys.path.append('/Users/Johan.Maki/vardschema-v1/scheduler-api')

# Set environment variables
os.environ['SUPABASE_URL'] = 'https://ebyvourlaomcwitpibdl.supabase.co'
os.environ['SUPABASE_KEY'] = 'test'

from datetime import datetime, timedelta
from services.gurobi_optimizer_service import optimize_schedule_with_gurobi

def test_direct_gurobi():
    print("Testing Gurobi optimizer directly...")
    
    # Create test employees
    employees = [
        {"id": 1, "first_name": "Anna", "last_name": "Test", "department": "Test"},
        {"id": 2, "first_name": "Erik", "last_name": "Test", "department": "Test"},
        {"id": 3, "first_name": "Maria", "last_name": "Test", "department": "Test"},
        {"id": 4, "first_name": "Lars", "last_name": "Test", "department": "Test"},
        {"id": 5, "first_name": "Karin", "last_name": "Test", "department": "Test"},
        {"id": 6, "first_name": "David", "last_name": "Test", "department": "Test"},
    ]
    
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=6)  # One week
    
    try:
        result = optimize_schedule_with_gurobi(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=1,
            min_experience_per_shift=1,
            include_weekends=True,
            random_seed=42
        )
        
        print("✅ SUCCESS!")
        print(f"Coverage: {result['coverage_stats']['coverage_percentage']}%")
        print(f"Shifts: {result['coverage_stats']['filled_shifts']}/{result['coverage_stats']['total_shifts']}")
        return result
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_direct_gurobi()
