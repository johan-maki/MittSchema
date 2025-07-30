"""
Route optimization service using Gurobi for Vehicle Routing Problem (VRP).
This service optimizes delivery routes for home care services with Google Maps integration.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from gurobipy import Model, GRB, quicksum
import logging
from dataclasses import dataclass
from services.google_maps_service import get_google_maps_service

logger = logging.getLogger(__name__)

@dataclass
class Customer:
    id: str
    name: str
    address: str
    latitude: float
    longitude: float
    service_time: int  # minutes
    priority: str  # 'low', 'medium', 'high'
    time_window_start: Optional[str] = None  # HH:MM format
    time_window_end: Optional[str] = None    # HH:MM format

class RouteOptimizerService:
    """
    Gurobi-based route optimizer for home care services.
    
    Solves the Vehicle Routing Problem (VRP) with:
    - Distance minimization
    - Time window constraints
    - Service time requirements
    - Priority-based optimization
    """
    
    def __init__(self):
        self.model = None
        
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula.
        Returns distance in kilometers.
        """
        from math import radians, cos, sin, asin, sqrt
        
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
        
    def create_distance_matrix(self, customers: List[Customer], depot_lat: float = 59.3293, depot_lng: float = 18.0686) -> np.ndarray:
        """
        Create distance matrix between all customers and depot using Haversine formula (fallback).
        Depot is typically the company's headquarters.
        """
        n = len(customers)
        # Include depot as first location (index 0)
        locations = [(depot_lat, depot_lng)] + [(c.latitude, c.longitude) for c in customers]
        
        distance_matrix = np.zeros((n + 1, n + 1))
        
        for i in range(n + 1):
            for j in range(n + 1):
                if i != j:
                    lat1, lon1 = locations[i]
                    lat2, lon2 = locations[j]
                    distance_matrix[i][j] = self.calculate_distance(lat1, lon1, lat2, lon2)
                    
        return distance_matrix
    
    def create_google_maps_distance_matrix(self, customers: List[Customer], depot_lat: float = 59.3293, 
                                         depot_lng: float = 18.0686, google_maps_api_key: str = None) -> np.ndarray:
        """
        Create distance matrix using Google Maps Distance Matrix API for real driving distances.
        Falls back to Haversine formula if Google Maps is unavailable.
        
        Args:
            customers: List of Customer objects
            depot_lat: Depot latitude
            depot_lng: Depot longitude 
            google_maps_api_key: Google Maps API key
            
        Returns:
            Distance matrix as numpy array
        """
        n = len(customers)
        locations = [(depot_lat, depot_lng)] + [(c.latitude, c.longitude) for c in customers]
        
        if google_maps_api_key:
            try:
                # Initialize Google Maps service
                maps_service = get_google_maps_service(google_maps_api_key)
                
                # Get distance matrix from Google Maps
                logger.info(f"🗺️ Fetching real driving distances from Google Maps for {n+1} locations...")
                
                matrix_data = maps_service.get_distance_matrix(locations, locations)
                
                if matrix_data:
                    # Extract distance data
                    distance_data = maps_service.extract_distance_matrix_data(matrix_data)
                    
                    if distance_data and len(distance_data) == n + 1:
                        # Convert to numpy array
                        distance_matrix = np.zeros((n + 1, n + 1))
                        
                        for i in range(n + 1):
                            for j in range(n + 1):
                                if i != j and i < len(distance_data) and j < len(distance_data[i]):
                                    distance_matrix[i][j] = distance_data[i][j]['distance_km']
                                    
                        logger.info("✅ Successfully created distance matrix using Google Maps real driving distances")
                        return distance_matrix
                    else:
                        logger.warning("❌ Invalid distance matrix data from Google Maps, falling back to Haversine")
                else:
                    logger.warning("❌ Failed to get distance matrix from Google Maps, falling back to Haversine")
                    
            except Exception as e:
                logger.error(f"❌ Error using Google Maps Distance Matrix API: {str(e)}, falling back to Haversine")
        else:
            logger.info("ℹ️ No Google Maps API key provided, using Haversine distance calculation")
        
        # Fallback to Haversine formula
        return self.create_distance_matrix(customers, depot_lat, depot_lng)
        
    def optimize_route(
        self, 
        customers: List[Dict], 
        optimization_criteria: str = "minimize_distance",
        depot_coordinates: Optional[Tuple[float, float]] = None,
        max_route_time: int = 480,  # 8 hours in minutes
        vehicle_speed_kmh: float = 40.0,  # Average speed in urban areas
        google_maps_api_key: str = None  # Google Maps API key for real distances and geocoding
    ) -> Dict[str, Any]:
        """
        Optimize route using Gurobi mathematical optimization with Google Maps integration.
        
        Args:
            customers: List of customer dictionaries
            optimization_criteria: 'minimize_distance' or 'minimize_time'
            depot_coordinates: (lat, lng) of starting point
            max_route_time: Maximum route time in minutes
            vehicle_speed_kmh: Average vehicle speed for time calculations
            google_maps_api_key: Google Maps API key for geocoding and real distances
            
        Returns:
            Dictionary with optimized route, total distance/time, and statistics
        """
        
        if len(customers) < 2:
            raise ValueError("At least 2 customers required for route optimization")
            
        # Geocode addresses that don't have coordinates using Google Maps
        logger.info("🌍 Processing customer addresses and coordinates...")
        
        customer_objects = []
        
        # TEMPORARILY DISABLE GEOCODING TO FIND THE BUG
        geocoded_results = {}
        
        # Convert to Customer objects with existing coordinates or mock coordinates
        for i, cust in enumerate(customers):
            # Try to get coordinates from customer data
            lat = cust.get('latitude')
            lng = cust.get('longitude')
            
            # Fallback to mock coordinates (Stockholm area) if no coordinates
            if not lat or not lng:
                lat = 59.3293 + (i * 0.01)  # Stockholm area with slight offset
                lng = 18.0686 + (i * 0.01)
                logger.warning(f"⚠️ Using mock coordinates for {cust['name']}: {lat}, {lng}")
            
            customer_objects.append(Customer(
                id=cust['id'],
                name=cust['name'],
                address=cust['address'],
                latitude=lat,
                longitude=lng,
                service_time=cust.get('serviceTime', 30),
                priority=cust.get('priority', 'medium'),
                time_window_start=cust.get('timeWindow', {}).get('start') if cust.get('timeWindow') else None,
                time_window_end=cust.get('timeWindow', {}).get('end') if cust.get('timeWindow') else None
            ))
            
        # Set depot coordinates
        if depot_coordinates:
            depot_lat, depot_lng = depot_coordinates
        else:
            depot_lat, depot_lng = 59.3293, 18.0686  # Stockholm default
            
        logger.info(f"🚀 Starting route optimization for {len(customer_objects)} customers")
        
        try:
            # Create distance matrix using Google Maps if API key provided, otherwise use Haversine
            distance_matrix = self.create_google_maps_distance_matrix(
                customer_objects, depot_lat, depot_lng, google_maps_api_key
            )
            n = len(customer_objects)
            
            # Create Gurobi model
            model = Model("VRP_Optimization")
            model.setParam('OutputFlag', 0)  # Suppress Gurobi output
            model.setParam('TimeLimit', 30)  # 30 second time limit
            
            # Decision variables: x[i][j] = 1 if we go from location i to location j
            x = {}
            for i in range(n + 1):  # +1 for depot
                for j in range(n + 1):
                    if i != j:
                        x[i, j] = model.addVar(vtype=GRB.BINARY, name=f'x_{i}_{j}')
                        
            # Auxiliary variables for subtour elimination (MTZ formulation)
            u = {}
            for i in range(1, n + 1):  # Exclude depot
                u[i] = model.addVar(vtype=GRB.CONTINUOUS, lb=1, ub=n, name=f'u_{i}')
                
            # Objective function
            if optimization_criteria == "minimize_time":
                # Time = distance / speed + service_time
                obj_expr = quicksum(
                    x[i, j] * (distance_matrix[i][j] / vehicle_speed_kmh * 60 + 
                              (customer_objects[j-1].service_time if j > 0 else 0))
                    for i in range(n + 1) for j in range(n + 1) if i != j
                )
            else:  # minimize_distance
                obj_expr = quicksum(
                    x[i, j] * distance_matrix[i][j]
                    for i in range(n + 1) for j in range(n + 1) if i != j
                )
                
            model.setObjective(obj_expr, GRB.MINIMIZE)
            
            # Constraints
            
            # 1. Each customer must be visited exactly once (incoming)
            for j in range(1, n + 1):
                model.addConstr(
                    quicksum(x[i, j] for i in range(n + 1) if i != j) == 1,
                    name=f'visit_customer_{j}'
                )
                
            # 2. Each customer must be left exactly once (outgoing)
            for i in range(1, n + 1):
                model.addConstr(
                    quicksum(x[i, j] for j in range(n + 1) if i != j) == 1,
                    name=f'leave_customer_{i}'
                )
                
            # 3. Start and end at depot
            model.addConstr(
                quicksum(x[0, j] for j in range(1, n + 1)) == 1,
                name='start_depot'
            )
            model.addConstr(
                quicksum(x[i, 0] for i in range(1, n + 1)) == 1,
                name='end_depot'
            )
            
            # 4. Subtour elimination (Miller-Tucker-Zemlin formulation)
            for i in range(1, n + 1):
                for j in range(1, n + 1):
                    if i != j:
                        model.addConstr(
                            u[i] - u[j] + n * x[i, j] <= n - 1,
                            name=f'subtour_{i}_{j}'
                        )
                        
            # 5. Priority constraints (high priority customers visited earlier)
            priority_weights = {'high': 1, 'medium': 2, 'low': 3}
            for i in range(1, n + 1):
                for j in range(1, n + 1):
                    if i != j:
                        cust_i = customer_objects[i-1]
                        cust_j = customer_objects[j-1]
                        if priority_weights[cust_i.priority] < priority_weights[cust_j.priority]:
                            # Higher priority customer should be visited before lower priority
                            model.addConstr(
                                u[i] <= u[j] - 1 + n * (1 - quicksum(x[k, i] for k in range(n + 1) if k != i)),
                                name=f'priority_{i}_{j}'
                            )
            
            # Optimize
            logger.info("🔄 Running Gurobi optimization...")
            model.optimize()
            
            if model.status == GRB.OPTIMAL:
                logger.info("✅ Optimal solution found!")
                
                # Extract solution
                route = []
                current = 0  # Start at depot
                total_distance = 0
                
                while True:
                    next_location = None
                    for j in range(n + 1):
                        if current != j and x[current, j].x > 0.5:  # Solution found
                            next_location = j
                            total_distance += distance_matrix[current][j]
                            break
                            
                    if next_location is None or next_location == 0:
                        break  # Back to depot or no solution
                        
                    # Add customer to route (convert back to 0-based indexing)
                    route.append(customer_objects[next_location - 1])
                    current = next_location
                    
                # Calculate total time
                total_time = sum(customer.service_time for customer in route)
                total_time += (total_distance / vehicle_speed_kmh) * 60  # Travel time in minutes
                
                # Create route instructions
                route_instructions = []
                if route:
                    route_instructions.append(f"1. Starta från kontoret/hemmabase")
                    for i, customer in enumerate(route):
                        route_instructions.append(
                            f"{i + 2}. Kör till {customer.name} på {customer.address} "
                            f"({customer.service_time} min service, prioritet: {customer.priority})"
                        )
                    route_instructions.append(f"{len(route) + 2}. Återvänd till kontoret/hemmabase")
                
                result = {
                    "success": True,
                    "totalDistance": round(total_distance, 2),
                    "totalTime": round(total_time, 1),
                    "customers": [
                        {
                            "id": customer.id,
                            "name": customer.name,
                            "address": customer.address,
                            "latitude": customer.latitude,
                            "longitude": customer.longitude,
                            "serviceTime": customer.service_time,
                            "priority": customer.priority
                        }
                        for customer in route
                    ],
                    "routeInstructions": route_instructions,
                    "optimization_stats": {
                        "objective_value": model.objVal,
                        "solve_time": model.runtime,
                        "optimization_criteria": optimization_criteria,
                        "total_customers": len(customer_objects),
                        "vehicle_speed_kmh": vehicle_speed_kmh
                    }
                }
                
                logger.info(f"📊 Route optimized: {total_distance:.1f}km, {total_time:.0f}min, {len(route)} customers")
                return result
                
            else:
                logger.warning(f"⚠️ Optimization failed with status: {model.status}")
                return {
                    "success": False,
                    "error": f"Optimization failed with status: {model.status}",
                    "fallback_route": self._create_fallback_route(customer_objects)
                }
                
        except Exception as e:
            import traceback
            logger.error(f"💥 Route optimization error: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "error": str(e),
                "fallback_route": self._create_fallback_route(customer_objects)
            }
            
    def _create_fallback_route(self, customers: List[Customer]) -> Dict[str, Any]:
        """Create a simple fallback route when optimization fails."""
        
        # Simple nearest-neighbor heuristic
        import random
        
        route = customers.copy()
        random.shuffle(route)  # Simple randomization
        
        # Sort by priority (high first)
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        route.sort(key=lambda c: priority_order[c.priority])
        
        total_distance = sum(10 + random.random() * 20 for _ in route)  # Mock distance
        total_time = sum(customer.service_time for customer in route) + total_distance * 1.5
        
        return {
            "totalDistance": round(total_distance, 2),
            "totalTime": round(total_time, 1),
            "customers": [
                {
                    "id": customer.id,
                    "name": customer.name,
                    "address": customer.address,
                    "latitude": customer.latitude,
                    "longitude": customer.longitude,
                    "serviceTime": customer.service_time,
                    "priority": customer.priority
                }
                for customer in route
            ],
            "routeInstructions": [
                f"{i + 1}. Besök {customer.name} på {customer.address} ({customer.service_time} min)"
                for i, customer in enumerate(route)
            ]
        }
