#!/usr/bin/env python3
"""
Test the boundary date fix locally without hitting the deployed API
"""
import sys
import os
sys.path.append('/Users/Johan.Maki/vardschema-v1/scheduler-api')

from datetime import datetime
from services.gurobi_optimizer_service import GurobiScheduleOptimizer

def test_boundary_dates():
    print("🧪 Testing boundary date fixes locally...")
    
    # Create test employees - need enough for 2 per shift × 3 shifts = 6 minimum
    employees = [
        {"id": 1, "first_name": "Test", "last_name": "Employee1"},
        {"id": 2, "first_name": "Test", "last_name": "Employee2"},
        {"id": 3, "first_name": "Test", "last_name": "Employee3"},
        {"id": 4, "first_name": "Test", "last_name": "Employee4"},
        {"id": 5, "first_name": "Test", "last_name": "Employee5"},
        {"id": 6, "first_name": "Test", "last_name": "Employee6"},
        {"id": 7, "first_name": "Test", "last_name": "Employee7"},
        {"id": 8, "first_name": "Test", "last_name": "Employee8"},
        {"id": 9, "first_name": "Test", "last_name": "Employee9"},
        {"id": 10, "first_name": "Test", "last_name": "Employee10"},
    ]
    
    optimizer = GurobiScheduleOptimizer()
    
    test_cases = [
        {
            "name": "Single day (June 30)",
            "start_date": datetime(2025, 6, 30),
            "end_date": datetime(2025, 6, 30),
        },
        {
            "name": "Single day (July 31)",
            "start_date": datetime(2025, 7, 31),
            "end_date": datetime(2025, 7, 31),
        },
        {
            "name": "3 days boundary",
            "start_date": datetime(2025, 6, 29),
            "end_date": datetime(2025, 7, 1),
        },
        {
            "name": "Week with boundary (June 30 - July 6)",
            "start_date": datetime(2025, 6, 30),
            "end_date": datetime(2025, 7, 6),
        }
    ]
    
    for case in test_cases:
        print(f"\n📋 Testing: {case['name']}")
        print(f"   Date range: {case['start_date'].date()} to {case['end_date'].date()}")
        
        try:
            result = optimizer.optimize_schedule(
                employees=employees,
                start_date=case['start_date'],
                end_date=case['end_date'],
                min_staff_per_shift=2,
                include_weekends=True
            )
            
            print(f"   ✅ Status: {result.get('optimization_status', 'unknown')}")
            print(f"   📊 Total shifts: {len(result.get('schedule', []))}")
            
            # Check staffing per shift
            if result.get('schedule'):
                schedule = result['schedule']
                shift_groups = {}
                
                for shift in schedule:
                    key = f"{shift['date']}_{shift['shift_type']}"
                    if key not in shift_groups:
                        shift_groups[key] = []
                    shift_groups[key].append(shift)
                
                understaffed = 0
                for key, shifts in shift_groups.items():
                    if len(shifts) < 2:
                        understaffed += 1
                
                if understaffed == 0:
                    print(f"   ✅ All shifts properly staffed (≥2 people)")
                else:
                    print(f"   ❌ {understaffed} shifts understaffed")
            
        except Exception as e:
            print(f"   ❌ Failed: {str(e)}")

if __name__ == "__main__":
    test_boundary_dates()
