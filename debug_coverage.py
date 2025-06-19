#!/usr/bin/env python3
"""
Debug coverage calculation
"""

import sys
import os
sys.path.append('/Users/Johan.Maki/vardschema-v1/scheduler-api')

# Set environment variables
os.environ['SUPABASE_URL'] = 'https://ebyvourlaomcwitpibdl.supabase.co'
os.environ['SUPABASE_KEY'] = 'test'

from datetime import datetime, timedelta
from services.gurobi_optimizer_service import optimize_schedule_with_gurobi

def debug_coverage():
    print("Debugging coverage calculation...")
    
    # Create test employees
    employees = [
        {"id": 1, "first_name": "Anna", "last_name": "Test", "department": "Test"},
        {"id": 2, "first_name": "Erik", "last_name": "Test", "department": "Test"},
        {"id": 3, "first_name": "Maria", "last_name": "Test", "department": "Test"},
    ]
    
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=2)  # Just 3 days for simplicity
    
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
        
        # Debug: Group shifts by date and shift_type
        from collections import defaultdict
        shifts_by_slot = defaultdict(list)
        
        for shift in result['schedule']:
            key = (shift['date'], shift['shift_type'])
            shifts_by_slot[key].append(shift['employee_name'])
        
        print("\nShift coverage by slot:")
        for (date, shift_type), employees in shifts_by_slot.items():
            print(f"  {date} {shift_type}: {len(employees)} employees - {', '.join(employees)}")
        
        print(f"\nTotal unique shift slots: {len(shifts_by_slot)}")
        print(f"Total employee assignments: {len(result['schedule'])}")
        
        return result
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    debug_coverage()
