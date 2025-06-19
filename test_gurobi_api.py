#!/usr/bin/env python3
"""
Test script to validate Gurobi scheduler with real employee data
"""

import requests
import json
from datetime import datetime, timedelta

def test_gurobi_scheduler():
    """Test the Gurobi scheduler API with realistic parameters"""
    print("🧪 Testing Gurobi Scheduler API")
    print("=" * 50)
    
    # API endpoint
    url = "http://localhost:8081/optimize-schedule"
    
    # Calculate date range (starting tomorrow for 14 days)
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=13)  # 2 weeks
    
    # Test request with simplified parameters
    request_data = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "department": "Akutmottagning",
        "random_seed": 42,  # Fixed seed for reproducible results
        "optimizer": "gurobi",
        "min_staff_per_shift": 1,
        "min_experience_per_shift": 1,
        "include_weekends": True
    }
    
    print(f"📅 Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"⚙️ Parameters: {json.dumps(request_data, indent=2)}")
    print()
    
    try:
        print("🚀 Sending request to Gurobi optimizer...")
        response = requests.post(url, json=request_data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ SUCCESS! Gurobi optimization completed")
            print("=" * 50)
            
            # Extract key metrics
            schedule = result.get("schedule", [])
            coverage_stats = result.get("coverage_stats", {})
            fairness_stats = result.get("fairness_stats", {})
            employee_stats = result.get("employee_stats", {})
            
            print(f"📊 COVERAGE STATISTICS:")
            print(f"  Total shifts needed: {coverage_stats.get('total_shifts', 0)}")
            print(f"  Shifts filled: {coverage_stats.get('filled_shifts', 0)}")
            print(f"  Coverage percentage: {coverage_stats.get('coverage_percentage', 0)}%")
            print()
            
            print(f"⚖️ FAIRNESS STATISTICS:")
            print(f"  Min shifts per employee: {fairness_stats.get('min_shifts_per_employee', 0)}")
            print(f"  Max shifts per employee: {fairness_stats.get('max_shifts_per_employee', 0)}")
            print(f"  Average shifts per employee: {fairness_stats.get('avg_shifts_per_employee', 0):.1f}")
            print(f"  Distribution range: {fairness_stats.get('shift_distribution_range', 0)}")
            print()
            
            print(f"👥 EMPLOYEE BREAKDOWN:")
            for emp_id, stats in employee_stats.items():
                name = stats.get('name', 'Unknown')
                total = stats.get('total_shifts', 0)
                day = stats.get('day_shifts', 0)
                evening = stats.get('evening_shifts', 0)
                night = stats.get('night_shifts', 0)
                weekend = stats.get('weekend_shifts', 0)
                print(f"  {name}: {total} total ({day}d/{evening}e/{night}n, {weekend} weekends)")
            print()
            
            print(f"🎯 OPTIMIZATION DETAILS:")
            print(f"  Optimizer used: {result.get('optimizer', 'unknown')}")
            print(f"  Status: {result.get('optimization_status', 'unknown')}")
            print(f"  Objective value: {result.get('objective_value', 'N/A')}")
            print(f"  Message: {result.get('message', 'No message')}")
            print()
            
            # Sample schedule entries
            if schedule:
                print(f"📋 SAMPLE SCHEDULE ENTRIES (first 5):")
                for i, shift in enumerate(schedule[:5]):
                    emp_name = shift.get('employee_name', 'Unknown')
                    date = shift.get('date', 'Unknown')
                    shift_type = shift.get('shift_type', 'Unknown')
                    start_time = shift.get('start_time', 'Unknown')
                    end_time = shift.get('end_time', 'Unknown')
                    print(f"  {i+1}. {emp_name} - {date} ({shift_type}: {start_time}-{end_time})")
                
                if len(schedule) > 5:
                    print(f"  ... and {len(schedule) - 5} more shifts")
            
            print()
            print("🎉 Gurobi optimization test completed successfully!")
            
            # Compare with the original 43% coverage problem
            coverage_pct = coverage_stats.get('coverage_percentage', 0)
            if coverage_pct > 43:
                improvement = coverage_pct - 43
                print(f"📈 IMPROVEMENT: +{improvement:.1f}% coverage vs original 43%!")
            
        else:
            print(f"❌ ERROR: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"💥 Connection error: {e}")
        print("Make sure the Gurobi API is running on localhost:8081")

if __name__ == "__main__":
    test_gurobi_scheduler()
