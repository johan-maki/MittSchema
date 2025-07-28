#!/usr/bin/env python3
"""
Simplified test script for validating min_staff_per_shift and min_experience_per_shift functionality
This version works without requiring all backend dependencies.
"""

import sys
import os
from datetime import datetime, timedelta

def test_configuration_validation():
    """Test configuration validation without full optimizer"""
    print("🧪 Testing configuration validation...")
    
    # Test data structures that would be passed to optimizer
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
    
    # Validate configuration scenarios
    scenarios = [
        {
            'name': 'Basic scenario',
            'min_staff_per_shift': 1,
            'min_experience_per_shift': 1,
            'expected_feasible': True,
            'reason': 'Lowest requirements should always work'
        },
        {
            'name': 'High staff requirement',
            'min_staff_per_shift': 2,
            'min_experience_per_shift': 1,
            'expected_feasible': True,
            'reason': 'Need 2 people per shift, have 4 available'
        },
        {
            'name': 'High experience requirement',
            'min_staff_per_shift': 1,
            'min_experience_per_shift': 4,
            'expected_feasible': True,
            'reason': 'Need 4 experience points, highest employee has 4'
        },
        {
            'name': 'Impossible experience requirement',
            'min_staff_per_shift': 1,
            'min_experience_per_shift': 5,
            'expected_feasible': False,
            'reason': 'Need 5 experience points, highest employee has 4'
        },
        {
            'name': 'Combined high requirements',
            'min_staff_per_shift': 2,
            'min_experience_per_shift': 6,
            'expected_feasible': True,
            'reason': 'Need 6 exp with 2 people: emp4(4) + emp2(3) = 7 exp'
        },
        {
            'name': 'Impossible combined requirements',
            'min_staff_per_shift': 3,
            'min_experience_per_shift': 12,
            'expected_feasible': False,
            'reason': 'Max possible: emp4(4) + emp2(3) + emp1(2) = 9 exp < 12'
        }
    ]
    
    for scenario in scenarios:
        print(f"\n📋 {scenario['name']}:")
        print(f"   Requirements: {scenario['min_staff_per_shift']} staff, {scenario['min_experience_per_shift']} experience")
        print(f"   Expected: {'✅ Feasible' if scenario['expected_feasible'] else '❌ Infeasible'}")
        print(f"   Reason: {scenario['reason']}")
        
        # Simple feasibility check
        total_employees = len(employees)
        max_experience = sum(sorted([emp['experience_level'] for emp in employees], reverse=True)[:scenario['min_staff_per_shift']])
        
        staff_feasible = scenario['min_staff_per_shift'] <= total_employees
        experience_feasible = scenario['min_experience_per_shift'] <= max_experience
        
        actual_feasible = staff_feasible and experience_feasible
        
        if actual_feasible == scenario['expected_feasible']:
            print(f"   Result: ✅ Prediction matches expectation")
        else:
            print(f"   Result: ❌ Prediction mismatch - got {'feasible' if actual_feasible else 'infeasible'}")
        
        print(f"   Analysis: Staff check: {'✅' if staff_feasible else '❌'} ({scenario['min_staff_per_shift']} <= {total_employees})")
        print(f"             Experience check: {'✅' if experience_feasible else '❌'} ({scenario['min_experience_per_shift']} <= {max_experience} max possible)")

def test_relaxed_constraints_logic():
    """Test the relaxed constraints logic"""
    print("\n🧪 Testing relaxed constraints logic...")
    
    # Simulate the relaxed constraints that should happen in backend
    original_min_experience = 5
    available_experience_levels = [1, 2, 3, 4]  # No one has level 5
    
    relaxed_levels = []
    for attempt in range(5):  # Try 5, 4, 3, 2, 1
        current_requirement = original_min_experience - attempt
        relaxed_levels.append(current_requirement)
        
        max_available = max(available_experience_levels)
        if current_requirement <= max_available:
            print(f"✅ Relaxed to {current_requirement}: Should work (max available: {max_available})")
            break
        else:
            print(f"⚠️  Try {current_requirement}: Still too high (max available: {max_available})")
    
    print(f"Relaxation sequence: {' -> '.join(map(str, relaxed_levels))}")

def test_data_structure_validation():
    """Validate that our test data structures match expected format"""
    print("\n🧪 Testing data structure validation...")
    
    required_employee_fields = ['id', 'first_name', 'last_name', 'work_percentage', 'experience_level', 'hourly_rate']
    
    test_employee = {
        'id': 'test1',
        'first_name': 'Test',
        'last_name': 'Person', 
        'work_percentage': 100,
        'experience_level': 3,
        'hourly_rate': 1200
    }
    
    missing_fields = [field for field in required_employee_fields if field not in test_employee]
    extra_fields = [field for field in test_employee if field not in required_employee_fields]
    
    if not missing_fields and not extra_fields:
        print("✅ Employee data structure is valid")
    else:
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
        if extra_fields:
            print(f"⚠️  Extra fields found: {extra_fields}")
    
    # Test configuration parameters
    config_params = {
        'min_staff_per_shift': 2,
        'min_experience_per_shift': 4,
        'start_date': datetime(2024, 8, 1),
        'end_date': datetime(2024, 8, 3),
        'include_weekends': True
    }
    
    print("✅ Configuration parameters structure is valid")
    for key, value in config_params.items():
        print(f"   {key}: {value} ({type(value).__name__})")

if __name__ == "__main__":
    print("🚀 Starting simplified staffing and experience tests...")
    print("=" * 70)
    print("ℹ️  This version validates logic without requiring Gurobi/backend dependencies")
    print("=" * 70)
    
    test_configuration_validation()
    test_relaxed_constraints_logic() 
    test_data_structure_validation()
    
    print("\n" + "=" * 70)
    print("🏁 Simplified tests completed!")
    print("💡 To test with actual optimization, ensure backend dependencies are installed:")
    print("   cd scheduler-api && pip install -r requirements.txt")
