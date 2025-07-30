#!/usr/bin/env python3
"""Test script for the improved route optimization with weighted objective function."""

import sys
import os
sys.path.append('scheduler-api')

# Set environment variables
os.environ['SUPABASE_URL'] = 'https://ebyvourlaomcwitpibdl.supabase.co'
os.environ['SUPABASE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
os.environ['GOOGLE_MAPS_API_KEY'] = 'AIzaSyA2MzeziWPYVyzwSLstnDySmqqm6oxz6FA'

from services.route_optimizer_service import RouteOptimizerService

def test_route_optimization():
    """Test improved route optimization with weighted objective function."""
    
    # Test data with different priorities
    customers = [
        {
            "id": "1",
            "name": "Anna Andersson", 
            "address": "Kungsgatan 45, Stockholm",
            "latitude": 59.3348413,
            "longitude": 18.0612716,
            "service_time": 30,
            "priority": "high"  # High priority
        },
        {
            "id": "2", 
            "name": "Bengt Bengtsson",
            "address": "Drottninggatan 89, Stockholm", 
            "latitude": 59.3293235,
            "longitude": 18.0685808,
            "service_time": 45,
            "priority": "low"   # Low priority
        },
        {
            "id": "3",
            "name": "Cecilia Carlsson",
            "address": "Sveavägen 24, Stockholm",
            "latitude": 59.3364022, 
            "longitude": 18.0624000,
            "service_time": 20,
            "priority": "high"  # High priority
        },
        {
            "id": "4",
            "name": "David Davidsson", 
            "address": "Götgatan 78, Stockholm",
            "latitude": 59.3142764,
            "longitude": 18.0746394,
            "service_time": 60,
            "priority": "medium"  # Medium priority
        }
    ]
    
    # Initialize route optimizer
    optimizer = RouteOptimizerService()
    
    print("🧪 Testing improved route optimization with weighted objective function")
    print("=" * 70)
    
    # Test 1: Distance optimization
    print("\n📍 Test 1: Distance optimization with priority weighting")
    print("Customers:")
    for customer in customers:
        print(f"  - {customer['name']}: {customer['priority']} priority ({customer['service_time']} min service)")
    
    try:
        result = optimizer.optimize_route(
            customers=customers,
            optimization_criteria="minimize_distance",
            depot_coordinates=(59.3293235, 18.0685808),  # Central Stockholm
            google_maps_api_key="AIzaSyA2MzeziWPYVyzwSLstnDySmqqm6oxz6FA"
        )
        
        print(f"\n✅ Distance optimization completed!")
        print(f"📊 Results:")
        print(f"   Total distance: {result['total_distance']:.2f} km")
        print(f"   Optimization time: {result['optimization_time']:.3f} seconds")
        print(f"   Objective value: {result['objective_value']:.2f}")
        
        print(f"\n🗺️ Optimized route order:")
        for i, customer in enumerate(result['route_order']):
            priority_icon = "🔴" if customer['priority'] == "high" else "🟡" if customer['priority'] == "medium" else "🟢"
            print(f"   {i+1}. {customer['name']} {priority_icon} ({customer['priority']} priority)")
            
    except Exception as e:
        print(f"❌ Distance optimization failed: {str(e)}")
    
    # Test 2: Time optimization  
    print("\n⏰ Test 2: Time optimization with priority weighting")
    
    try:
        result = optimizer.optimize_route(
            customers=customers,
            optimization_criteria="minimize_time", 
            depot_coordinates=(59.3293235, 18.0685808),
            vehicle_speed_kmh=35.0,  # Stockholm city speed
            google_maps_api_key="AIzaSyA2MzeziWPYVyzwSLstnDySmqqm6oxz6FA"
        )
        
        print(f"\n✅ Time optimization completed!")
        print(f"📊 Results:")
        print(f"   Total time: {result.get('total_time', 'N/A')} minutes")
        print(f"   Total distance: {result['total_distance']:.2f} km") 
        print(f"   Optimization time: {result['optimization_time']:.3f} seconds")
        print(f"   Objective value: {result['objective_value']:.2f}")
        
        print(f"\n🗺️ Optimized route order:")
        for i, customer in enumerate(result['route_order']):
            priority_icon = "🔴" if customer['priority'] == "high" else "🟡" if customer['priority'] == "medium" else "🟢"
            print(f"   {i+1}. {customer['name']} {priority_icon} ({customer['priority']} priority)")
            
    except Exception as e:
        print(f"❌ Time optimization failed: {str(e)}")

if __name__ == "__main__":
    test_route_optimization()
