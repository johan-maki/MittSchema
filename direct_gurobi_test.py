#!/usr/bin/env python3
"""
Direct test of Gurobi optimizer service without API
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'scheduler-api'))

from datetime import datetime, timedelta
from services.gurobi_optimizer_service import GurobiScheduleOptimizer

def test_gurobi_direct():
    """Test Gurobi optimizer directly"""
    print("🧪 Direct Gurobi Optimizer Test")
    print("=" * 50)
    
    # Create mock employees
    employees = []
    for i in range(6):
        employees.append({
            'id': f'emp_{i+1}',
            'name': f'Employee {i+1}',
            'department': 'Akutmottagning',
            'experience_level': 3
        })
    
    # Calculate date range (1 month / 4 weeks)
    start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=27)  # 4 weeks (28 days)
    
    print(f"📅 Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"👥 Employees: {len(employees)}")
    
    # Test parameters
    min_staff_per_shift = 1
    include_weekends = True
    
    print(f"⚙️ Parameters:")
    print(f"  min_staff_per_shift: {min_staff_per_shift}")
    print(f"  include_weekends: {include_weekends}")
    print()
    
    try:
        # Create optimizer and run
        optimizer = GurobiScheduleOptimizer()
        result = optimizer.optimize_schedule(
            employees=employees,
            start_date=start_date,
            end_date=end_date,
            min_staff_per_shift=min_staff_per_shift,
            include_weekends=include_weekends,
            random_seed=42
        )
        
        print("✅ SUCCESS! Gurobi optimization completed")
        print("=" * 50)
        print("📊 COVERAGE STATISTICS:")
        stats = result.get('statistics', {})
        coverage = stats.get('coverage', {})
        print(f"  Total shifts needed: {coverage.get('total_shifts', 0)}")
        print(f"  Shifts filled: {coverage.get('filled_shifts', 0)}")
        print(f"  Coverage percentage: {coverage.get('coverage_percentage', 0):.1f}%")
        print()
        
        fairness = stats.get('fairness', {})
        print("⚖️ FAIRNESS STATISTICS:")
        print(f"  Min shifts per employee: {fairness.get('min_shifts', 0)}")
        print(f"  Max shifts per employee: {fairness.get('max_shifts', 0)}")
        print(f"  Average shifts per employee: {fairness.get('avg_shifts', 0):.1f}")
        print(f"  Distribution range: {fairness.get('distribution_range', 0)}")
        print()
        
        print("👥 EMPLOYEE BREAKDOWN:")
        employee_stats = result.get('employee_stats', {})
        for emp_id, emp_data in employee_stats.items():
            print(f"  {emp_id}: {emp_data.get('total_shifts', 0)} shifts")
            
        # Calculate expected math
        total_days = (end_date - start_date).days + 1
        working_days = total_days if include_weekends else sum(1 for i in range(total_days) if (start_date + timedelta(days=i)).weekday() < 5)
        expected_shifts = working_days * 3 * min_staff_per_shift  # 3 shifts per day
        employee_capacity = len(employees) * ((total_days / 7) * 5)  # 5 shifts per week per employee
        
        print()
        print("🧮 EXPECTED MATH:")
        print(f"  Total days: {total_days}")
        print(f"  Working days: {working_days}")  
        print(f"  Expected shifts needed: {expected_shifts}")
        print(f"  Employee capacity: {employee_capacity:.0f}")
        print(f"  Theoretical coverage: {(employee_capacity / expected_shifts * 100):.1f}%")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_gurobi_direct()
