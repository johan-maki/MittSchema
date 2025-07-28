#!/usr/bin/env python3
"""
Test script for validating min_staff_per_shift and min_experience_per_shift functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'scheduler-api'))

from datetime import datetime, timedelta

# Try to import the optimizer service, but handle if dependencies are missing
try:
    from services.gurobi_optimizer_service import GurobiScheduleOptimizer
    OPTIMIZER_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Could not import GurobiScheduleOptimizer: {e}")
    print("💡 Install dependencies with: cd scheduler-api && pip install -r requirements.txt")
    OPTIMIZER_AVAILABLE = False
    
    # Create a mock class for testing purposes
    class GurobiScheduleOptimizer:
        def optimize_schedule(self, **kwargs):
            raise ImportError("GurobiScheduleOptimizer not available - install dependencies")

def test_min_staff_per_shift():
    """Test that min_staff_per_shift works correctly"""
    print("🧪 Testing min_staff_per_shift functionality...")
    
    if not OPTIMIZER_AVAILABLE:
        print("⚠️  Skipping test - optimizer dependencies not available")
        return
    
    # Create test employees
    employees = [
        {
            'id': 'emp1', 
            'first_name': 'Anna', 
            'last_name': 'Andersson', 
            'work_percentage': 100,
            'experience_level': 2,
            'hourly_rate': 1000
        },
        {
            'id': 'emp2', 
            'first_name': 'Björn', 
            'last_name': 'Bengtsson', 
            'work_percentage': 100,
            'experience_level': 3,
            'hourly_rate': 1200
        },
        {
            'id': 'emp3', 
            'first_name': 'Cecilia', 
            'last_name': 'Carlsson', 
            'work_percentage': 100,
            'experience_level': 1,
            'hourly_rate': 900
        },
        {
            'id': 'emp4', 
            'first_name': 'David', 
            'last_name': 'Davidsson', 
            'work_percentage': 100,
            'experience_level': 4,
            'hourly_rate': 1400
        }
    ]
    
    # Test 1: min_staff_per_shift = 1 (should work)
    optimizer = GurobiScheduleOptimizer()
    start_date = datetime(2024, 8, 1)  # Thursday
    end_date = datetime(2024, 8, 3)    # Saturday (2 days)
    
    try:
        result = optimizer.optimize_schedule(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=1,
            min_experience_per_shift=1,
            include_weekends=True
        )
        
        print(f"✅ Test 1 PASSED: min_staff_per_shift=1 worked, generated {len(result['schedule'])} shifts")
        
        # Validate that each shift has exactly 1 person
        shifts_by_date_type = {}
        for shift in result['schedule']:
            key = f"{shift['date']}_{shift['shift_type']}"
            if key not in shifts_by_date_type:
                shifts_by_date_type[key] = 0
            shifts_by_date_type[key] += 1
        
        violations = [k for k, count in shifts_by_date_type.items() if count != 1]
        if violations:
            print(f"❌ VIOLATION: Some shifts don't have exactly 1 person: {violations}")
        else:
            print("✅ All shifts have exactly 1 person as required")
            
    except Exception as e:
        print(f"❌ Test 1 FAILED: {e}")
    
    # Test 2: min_staff_per_shift = 2 (should need more people or partial coverage)
    try:
        result = optimizer.optimize_schedule(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=2,
            min_experience_per_shift=1,
            include_weekends=True,
            allow_partial_coverage=True  # Allow partial to see if it handles it
        )
        
        print(f"✅ Test 2 PASSED: min_staff_per_shift=2 with partial coverage worked, generated {len(result['schedule'])} shifts")
        
        # Validate staff levels
        shifts_by_date_type = {}
        for shift in result['schedule']:
            key = f"{shift['date']}_{shift['shift_type']}"
            if key not in shifts_by_date_type:
                shifts_by_date_type[key] = 0
            shifts_by_date_type[key] += 1
        
        for key, count in shifts_by_date_type.items():
            print(f"   {key}: {count} staff")
            
    except Exception as e:
        print(f"❌ Test 2 FAILED: {e}")

def test_min_experience_per_shift():
    """Test that min_experience_per_shift works correctly"""
    print("\n🧪 Testing min_experience_per_shift functionality...")
    
    if not OPTIMIZER_AVAILABLE:
        print("⚠️  Skipping test - optimizer dependencies not available")
        return
    
    # Create test employees with different experience levels
    employees = [
        {
            'id': 'junior1', 
            'first_name': 'Junior1', 
            'last_name': 'Staff', 
            'work_percentage': 100,
            'experience_level': 1,  # Junior
            'hourly_rate': 800
        },
        {
            'id': 'junior2', 
            'first_name': 'Junior2', 
            'last_name': 'Staff', 
            'work_percentage': 100,
            'experience_level': 1,  # Junior
            'hourly_rate': 800
        },
        {
            'id': 'senior1', 
            'first_name': 'Senior', 
            'last_name': 'Staff', 
            'work_percentage': 100,
            'experience_level': 4,  # Senior
            'hourly_rate': 1400
        }
    ]
    
    optimizer = GurobiScheduleOptimizer()
    start_date = datetime(2024, 8, 1)  # Thursday
    end_date = datetime(2024, 8, 2)    # Friday (1 day for simple test)
    
    # Test 1: min_experience_per_shift = 1 (should work with anyone)
    try:
        result = optimizer.optimize_schedule(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=1,
            min_experience_per_shift=1,
            include_weekends=False
        )
        
        print(f"✅ Test 1 PASSED: min_experience_per_shift=1 worked, generated {len(result['schedule'])} shifts")
        
        # Check experience levels in generated schedule
        for shift in result['schedule']:
            exp_level = shift.get('experience_level', 'N/A')
            print(f"   {shift['date']} {shift['shift_type']}: {shift['employee_name']} (exp: {exp_level})")
            
    except Exception as e:
        print(f"❌ Test 1 FAILED: {e}")
    
    # Test 2: min_experience_per_shift = 4 (should require senior staff)
    try:
        result = optimizer.optimize_schedule(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=1,
            min_experience_per_shift=4,  # Requires senior level
            include_weekends=False
        )
        
        print(f"✅ Test 2 PASSED: min_experience_per_shift=4 worked, generated {len(result['schedule'])} shifts")
        
        # Validate that all shifts have at least experience level 4
        for shift in result['schedule']:
            exp_level = shift.get('experience_level', 0)
            if exp_level < 4:
                print(f"❌ VIOLATION: {shift['date']} {shift['shift_type']} has experience {exp_level} < 4")
            else:
                print(f"   {shift['date']} {shift['shift_type']}: {shift['employee_name']} (exp: {exp_level}) ✅")
                
    except Exception as e:
        print(f"❌ Test 2 FAILED: {e}")
    
    # Test 3: min_experience_per_shift = 5 (should fail - no one has that much experience)
    try:
        result = optimizer.optimize_schedule(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=1,
            min_experience_per_shift=5,  # Higher than anyone has
            include_weekends=False
        )
        
        print(f"❌ Test 3 UNEXPECTED: min_experience_per_shift=5 should have failed but worked, generated {len(result['schedule'])} shifts")
        
    except Exception as e:
        print(f"✅ Test 3 PASSED: min_experience_per_shift=5 correctly failed: {e}")

def test_combined_requirements():
    """Test combined staff and experience requirements"""
    print("\n🧪 Testing combined staff and experience requirements...")
    
    if not OPTIMIZER_AVAILABLE:
        print("⚠️  Skipping test - optimizer dependencies not available")
        return
    
    # Create a mix of staff
    employees = [
        {'id': 'j1', 'first_name': 'Junior1', 'last_name': 'A', 'work_percentage': 100, 'experience_level': 1, 'hourly_rate': 800},
        {'id': 'j2', 'first_name': 'Junior2', 'last_name': 'B', 'work_percentage': 100, 'experience_level': 1, 'hourly_rate': 800},
        {'id': 'j3', 'first_name': 'Junior3', 'last_name': 'C', 'work_percentage': 100, 'experience_level': 1, 'hourly_rate': 800},
        {'id': 'j4', 'first_name': 'Junior4', 'last_name': 'D', 'work_percentage': 100, 'experience_level': 1, 'hourly_rate': 800},
        {'id': 's1', 'first_name': 'Senior', 'last_name': 'X', 'work_percentage': 100, 'experience_level': 4, 'hourly_rate': 1400},
    ]
    
    optimizer = GurobiScheduleOptimizer()
    start_date = datetime(2024, 8, 1)
    end_date = datetime(2024, 8, 2)  # 1 day
    
    # Test: 2 staff per shift, 4 experience points per shift
    # Should work with: 4 juniors (4*1=4 exp) or 1 senior (1*4=4 exp) or combinations
    try:
        result = optimizer.optimize_schedule(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=2,
            min_experience_per_shift=4,
            include_weekends=False
        )
        
        print(f"✅ Combined test PASSED: 2 staff + 4 experience worked, generated {len(result['schedule'])} shifts")
        
        # Analyze each shift
        shifts_by_datetime = {}
        for shift in result['schedule']:
            key = f"{shift['date']}_{shift['shift_type']}"
            if key not in shifts_by_datetime:
                shifts_by_datetime[key] = []
            shifts_by_datetime[key].append(shift)
        
        for shift_key, shift_list in shifts_by_datetime.items():
            staff_count = len(shift_list)
            total_experience = sum(s.get('experience_level', 1) for s in shift_list)
            staff_names = [s['employee_name'] for s in shift_list]
            
            print(f"   {shift_key}: {staff_count} staff, {total_experience} experience - {', '.join(staff_names)}")
            
            if staff_count < 2:
                print(f"     ❌ VIOLATION: Only {staff_count} staff (need 2)")
            if total_experience < 4:
                print(f"     ❌ VIOLATION: Only {total_experience} experience (need 4)")
                
    except Exception as e:
        print(f"❌ Combined test FAILED: {e}")

if __name__ == "__main__":
    print("🚀 Starting min_staff_per_shift and min_experience_per_shift tests...")
    print("=" * 70)
    
    test_min_staff_per_shift()
    test_min_experience_per_shift() 
    test_combined_requirements()
    
    print("\n" + "=" * 70)
    print("🏁 Tests completed!")
