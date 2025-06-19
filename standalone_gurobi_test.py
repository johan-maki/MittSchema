#!/usr/bin/env python3
"""
Standalone test of Gurobi optimizer logic without dependencies
"""

import gurobipy as gp
from gurobipy import GRB
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

def create_date_list(start_date: datetime, end_date: datetime):
    """Create list of dates between start_date and end_date, inclusive"""
    date_range = (end_date - start_date).days + 1
    return [start_date + timedelta(days=i) for i in range(date_range)]

def test_gurobi_standalone():
    """Test Gurobi optimizer logic standalone"""
    print("🧪 Standalone Gurobi Test")
    print("=" * 50)
    
    # Create employees
    employees = []
    for i in range(6):
        employees.append({
            'id': f'emp_{i+1}',
            'name': f'Employee {i+1}',
            'department': 'Akutmottagning',
            'experience_level': 3
        })
    
    # Calculate date range (2 weeks)
    start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=13)  # 2 weeks (14 days)
    dates = create_date_list(start_date, end_date)
    
    print(f"📅 Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"👥 Employees: {len(employees)}")
    print(f"📆 Days: {len(dates)}")
    
    # Parameters
    min_staff_per_shift = 1
    include_weekends = True
    shift_types = ["day", "evening", "night"]
    
    print(f"⚙️ Parameters:")
    print(f"  min_staff_per_shift: {min_staff_per_shift}")
    print(f"  include_weekends: {include_weekends}")
    print(f"  shift_types: {shift_types}")
    print()
    
    # Count scheduled days
    scheduled_days = []
    for d in range(len(dates)):
        date = dates[d]
        # Skip weekends if not included
        if not include_weekends and date.weekday() >= 5:  # Saturday=5, Sunday=6
            continue
        scheduled_days.append(d)
    
    total_weeks = len(dates) / 7.0
    max_shifts_per_employee = int(total_weeks * 5)  # 5 shifts per week maximum
    max_possible_shifts = len(employees) * max_shifts_per_employee
    actual_shift_requirements = len(scheduled_days) * len(shift_types) * min_staff_per_shift
    
    print(f"📊 CALCULATIONS:")
    print(f"  Total days: {len(dates)}")
    print(f"  Scheduled days: {len(scheduled_days)} (include_weekends={include_weekends})")
    print(f"  Weeks: {total_weeks:.1f}")
    print(f"  Max shifts per employee: {max_shifts_per_employee}")
    print(f"  Total employee capacity: {max_possible_shifts}")
    print(f"  Required shifts: {actual_shift_requirements}")
    print(f"  Capacity ratio: {max_possible_shifts / actual_shift_requirements:.2f}")
    print()
    
    # Create model
    model = gp.Model("HealthcareScheduler")
    model.setParam('OutputFlag', 1)
    model.setParam('TimeLimit', 30)
    model.setParam('Seed', 42)
    
    # Create decision variables
    shifts = {}
    for emp in employees:
        for d in range(len(dates)):
            for shift in shift_types:
                var_name = f"shift_{emp['id']}_{d}_{shift}"
                shifts[(emp['id'], d, shift)] = model.addVar(
                    vtype=GRB.BINARY, 
                    name=var_name
                )
    
    print(f"🔢 Created {len(shifts)} decision variables")
    
    # Add constraints
    constraint_count = 0
    
    # 1. Max one shift per day per employee
    for emp in employees:
        for d in range(len(dates)):
            daily_shifts = gp.quicksum(shifts[(emp['id'], d, shift)] for shift in shift_types)
            model.addConstr(daily_shifts <= 1, name=f"max_one_shift_{emp['id']}_{d}")
            constraint_count += 1
    
    # 2. Max 5 shifts per week per employee
    for emp in employees:
        for week_start in range(0, len(dates), 7):
            week_end = min(week_start + 7, len(dates))
            week_shifts = gp.quicksum(
                shifts[(emp['id'], d, shift)]
                for d in range(week_start, week_end)
                for shift in shift_types
            )
            model.addConstr(week_shifts <= 5, name=f"max_weekly_{emp['id']}_{week_start}")
            constraint_count += 1
    
    # 3. Minimum and maximum staff coverage per shift
    coverage_constraints = 0
    for d in scheduled_days:
        for shift in shift_types:
            total_staff = gp.quicksum(shifts[(emp['id'], d, shift)] for emp in employees)
            
            # Minimum staff
            model.addConstr(
                total_staff >= min_staff_per_shift,
                name=f"min_staff_{d}_{shift}"
            )
            coverage_constraints += 1
            
            # Maximum staff (exactly what's needed)
            model.addConstr(
                total_staff <= min_staff_per_shift,
                name=f"max_staff_{d}_{shift}"
            )
            coverage_constraints += 1
    
    print(f"🚫 Added {constraint_count} employee constraints")
    print(f"📋 Added {coverage_constraints} coverage constraints")
    print()
    
    # Objective: minimize unfairness
    shift_counts = {}
    for emp in employees:
        shift_counts[emp['id']] = gp.quicksum(
            shifts[(emp['id'], d, shift)]
            for d in range(len(dates))
            for shift in shift_types
        )
    
    # Minimize the difference between max and min shifts per employee
    max_shifts = model.addVar(vtype=GRB.INTEGER, name="max_shifts")
    min_shifts = model.addVar(vtype=GRB.INTEGER, name="min_shifts")
    
    for emp in employees:
        model.addConstr(shift_counts[emp['id']] <= max_shifts)
        model.addConstr(shift_counts[emp['id']] >= min_shifts)
    
    model.setObjective(max_shifts - min_shifts, GRB.MINIMIZE)
    
    print("🎯 Objective: minimize unfairness (max_shifts - min_shifts)")
    print()
    
    # Optimize
    print("🚀 Starting optimization...")
    model.optimize()
    
    if model.status == GRB.OPTIMAL:
        print("✅ OPTIMAL SOLUTION FOUND!")
        
        # Extract solution
        solution = {}
        total_filled_shifts = 0
        employee_shift_counts = {emp['id']: 0 for emp in employees}
        
        for emp in employees:
            emp_shifts = []
            for d in range(len(dates)):
                for shift in shift_types:
                    if shifts[(emp['id'], d, shift)].x > 0.5:
                        emp_shifts.append({
                            'date': dates[d].strftime('%Y-%m-%d'),
                            'shift_type': shift,
                            'day': dates[d].strftime('%A')
                        })
                        total_filled_shifts += 1
                        employee_shift_counts[emp['id']] += 1
            
            solution[emp['id']] = {
                'employee_name': emp['name'],
                'shifts': emp_shifts,
                'total_shifts': len(emp_shifts)
            }
        
        total_required_shifts = len(scheduled_days) * len(shift_types)
        coverage_percentage = (total_filled_shifts / total_required_shifts * 100) if total_required_shifts > 0 else 0
        
        print(f"📊 RESULTS:")
        print(f"  Total shifts required: {total_required_shifts}")
        print(f"  Total shifts filled: {total_filled_shifts}")
        print(f"  Coverage: {coverage_percentage:.1f}%")
        print()
        
        print(f"👥 EMPLOYEE ASSIGNMENTS:")
        for emp_id, data in solution.items():
            print(f"  {data['employee_name']}: {data['total_shifts']} shifts")
        
        min_emp_shifts = min(employee_shift_counts.values())
        max_emp_shifts = max(employee_shift_counts.values())
        print(f"  Range: {min_emp_shifts}-{max_emp_shifts} shifts per employee")
        
    elif model.status == GRB.INFEASIBLE:
        print("❌ INFEASIBLE - No solution exists")
        model.computeIIS()
        print("Irreducible Infeasible Subsystem (IIS):")
        for c in model.getConstrs():
            if c.IISConstr:
                print(f"  {c.constrName}")
        
    else:
        print(f"❌ OPTIMIZATION FAILED - Status: {model.status}")

if __name__ == "__main__":
    test_gurobi_standalone()
