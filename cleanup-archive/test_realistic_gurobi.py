#!/usr/bin/env python3
"""
Test with more realistic employee count
"""

import requests
import json
from datetime import datetime, timedelta

def test_more_employees():
    """Test the Gurobi scheduler API with more employees"""
    print("🧪 Testing Gurobi Scheduler API with relaxed constraints")
    print("=" * 50)
    
    # API endpoint
    url = "http://localhost:8080/optimize-schedule"
    
    # Calculate date range (2 weeks for realistic testing)
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=13)  # 2 weeks (14 days)
    
    # Test request with relaxed parameters
    request_data = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "department": "Akutmottagning",
        "random_seed": 42,
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
            
            # Debug: Print raw response structure
            print("🔍 DEBUG - Raw response keys:", list(result.keys()))
            if 'schedule' in result:
                print(f"🔍 DEBUG - Schedule items: {len(result['schedule'])}")
            
            # Extract key metrics - try new structure first
            schedule = result.get("schedule", [])
            if "statistics" in result:
                # New structure
                statistics = result["statistics"]
                coverage_stats = statistics.get("coverage", {})
                fairness_stats = statistics.get("fairness", {})
                employee_stats = result.get("employee_stats", {})
            else:
                # Legacy structure
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
                print(f"  {stats.get('name', f'Employee {emp_id}')}: {stats.get('total_shifts', 0)} shifts")
                print(f"    Day: {stats.get('day_shifts', 0)}, Evening: {stats.get('evening_shifts', 0)}, Night: {stats.get('night_shifts', 0)}")
            
            if coverage_stats.get('coverage_percentage', 0) >= 90:
                print("🎉 Excellent coverage achieved!")
            elif coverage_stats.get('coverage_percentage', 0) >= 70:
                print("✅ Good coverage achieved!")
            else:
                print("⚠️ Coverage could be improved - consider adding more employees")
            
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {"detail": response.text}
            print(f"❌ ERROR: HTTP {response.status_code}")
            print(f"Response: {json.dumps(error_data, indent=2)}")
            
    except requests.exceptions.RequestException as e:
        print(f"💥 Connection error: {e}")
        print("Make sure the Gurobi API is running on localhost:8081")
        
    except Exception as e:
        print(f"💥 Unexpected error: {e}")

if __name__ == "__main__":
    test_more_employees()
