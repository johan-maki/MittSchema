"""
Route optimization API endpoints for the scheduling system.
Provides endpoints for optimizing delivery routes using Gurobi with Haversine distances.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
from services.route_optimizer_service import RouteOptimizerService
from config import logger

router = APIRouter(prefix="/api/route", tags=["route-optimization"])

class CustomerInput(BaseModel):
    id: str
    name: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    serviceTime: int = 30  # minutes
    priority: str = "medium"  # 'low', 'medium', 'high'
    timeWindow: Optional[Dict[str, str]] = None  # {'start': 'HH:MM', 'end': 'HH:MM'}

class RouteOptimizationRequest(BaseModel):
    customers: List[CustomerInput]
    optimization_criteria: str = "minimize_distance"  # or 'minimize_time'
    startLocation: Optional[Tuple[float, float]] = None  # (lat, lng)
    max_route_time: int = 480  # 8 hours in minutes
    vehicle_speed_kmh: float = 40.0  # Average urban speed

class RouteOptimizationResponse(BaseModel):
    success: bool
    totalDistance: Optional[float] = None
    totalTime: Optional[float] = None
    customers: Optional[List[Dict[str, Any]]] = None
    routeInstructions: Optional[List[str]] = None
    optimization_stats: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    fallback_route: Optional[Dict[str, Any]] = None

@router.post("/optimize-route", response_model=RouteOptimizationResponse)
async def optimize_route(request: RouteOptimizationRequest):
    """
    Optimize delivery route using Gurobi mathematical optimization.
    
    This endpoint creates an optimal route for home care services that:
    - Minimizes total distance or time
    - Respects customer priorities
    - Handles time windows (if specified)
    - Provides turn-by-turn route instructions
    
    Args:
        request: Route optimization parameters including customers and preferences
        
    Returns:
        Optimized route with distance, time, customer order, and instructions
    """
    
    logger.info(f"🎯 Route optimization request received for {len(request.customers)} customers")
    
    try:
        if len(request.customers) < 2:
            raise HTTPException(
                status_code=400, 
                detail="At least 2 customers required for route optimization"
            )
        
        # Validate optimization criteria
        valid_criteria = ["minimize_distance", "minimize_time"]
        if request.optimization_criteria not in valid_criteria:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid optimization criteria. Must be one of: {valid_criteria}"
            )
        
        # Convert Pydantic models to dictionaries
        customers_data = []
        for customer in request.customers:
            customer_dict = {
                "id": customer.id,
                "name": customer.name,
                "address": customer.address,
                "latitude": customer.latitude,
                "longitude": customer.longitude,
                "serviceTime": customer.serviceTime,
                "priority": customer.priority,
                "timeWindow": customer.timeWindow if customer.timeWindow else None
            }
            customers_data.append(customer_dict)
            
        # Initialize route optimizer
        optimizer = RouteOptimizerService()
        
        # Optimize route using Haversine distance calculations
        result = optimizer.optimize_route(
            customers=customers_data,
            optimization_criteria=request.optimization_criteria,
            depot_coordinates=request.startLocation,
            max_route_time=request.max_route_time,
            vehicle_speed_kmh=request.vehicle_speed_kmh
        )
        
        # Return response
        if result.get("success", False):
            logger.info(f"✅ Route optimization successful: {result['totalDistance']:.1f}km, {result['totalTime']:.0f}min")
            return RouteOptimizationResponse(
                success=True,
                totalDistance=result["totalDistance"],
                totalTime=result["totalTime"],
                customers=result["customers"],
                routeInstructions=result.get("routeInstructions", []),
                optimization_stats=result.get("optimization_stats", {})
            )
        else:
            logger.warning(f"⚠️ Route optimization failed, using fallback: {result.get('error', 'Unknown error')}")
            fallback = result.get("fallback_route", {})
            return RouteOptimizationResponse(
                success=False,
                error=result.get("error", "Optimization failed"),
                fallback_route=fallback,
                totalDistance=fallback.get("totalDistance"),
                totalTime=fallback.get("totalTime"),
                customers=fallback.get("customers", []),
                routeInstructions=fallback.get("routeInstructions", [])
            )
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"💥 Route optimization API error: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Route optimization failed: {str(e)}"
        )

@router.get("/health")
async def route_health_check():
    """Health check endpoint for route optimization service."""
    try:
        # Test if Gurobi is available
        from gurobipy import Model
        test_model = Model("test")
        test_model.dispose()
        
        return {
            "status": "healthy",
            "service": "route_optimization",
            "gurobi_available": True,
            "message": "Route optimization service is running"
        }
    except ImportError:
        return {
            "status": "degraded",
            "service": "route_optimization", 
            "gurobi_available": False,
            "message": "Gurobi not available, fallback routing will be used"
        }
    except Exception as e:
        logger.error(f"Route optimization health check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )

@router.get("/demo-customers")
async def get_demo_customers():
    """
    Get demo customers for testing route optimization.
    Useful for development and demonstrations.
    """
    
    demo_customers = [
        {
            "id": "demo_1",
            "name": "Anna Andersson",
            "address": "Kungsgatan 45, Stockholm",
            "latitude": 59.3326,
            "longitude": 18.0649,
            "serviceTime": 45,
            "priority": "high",
            "timeWindow": {"start": "09:00", "end": "11:00"}
        },
        {
            "id": "demo_2", 
            "name": "Bengt Bengtsson",
            "address": "Drottninggatan 33, Stockholm",
            "latitude": 59.3295,
            "longitude": 18.0687,
            "serviceTime": 30,
            "priority": "medium",
            "timeWindow": {"start": "10:00", "end": "14:00"}
        },
        {
            "id": "demo_3",
            "name": "Cecilia Carlsson", 
            "address": "Sveavägen 67, Stockholm",
            "latitude": 59.3401,
            "longitude": 18.0583,
            "serviceTime": 60,
            "priority": "high",
            "timeWindow": {"start": "08:00", "end": "12:00"}
        },
        {
            "id": "demo_4",
            "name": "David Davidsson",
            "address": "Östermalmsgataan 12, Stockholm", 
            "latitude": 59.3348,
            "longitude": 18.0826,
            "serviceTime": 25,
            "priority": "low",
            "timeWindow": {"start": "13:00", "end": "17:00"}
        },
        {
            "id": "demo_5",
            "name": "Eva Eriksson",
            "address": "Birger Jarlsgatan 28, Stockholm",
            "latitude": 59.3356,
            "longitude": 18.0742,
            "serviceTime": 40,
            "priority": "medium",
            "timeWindow": {"start": "11:00", "end": "15:00"}
        }
    ]
    
    return {
        "customers": demo_customers,
        "count": len(demo_customers),
        "area": "Stockholm City",
        "note": "Demo customers for testing route optimization functionality"
    }

class GeocodeRequest(BaseModel):
    address: str

class GeocodeResponse(BaseModel):
    success: bool
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    formatted_address: Optional[str] = None
    error: Optional[str] = None

@router.post("/geocode", response_model=GeocodeResponse)
async def geocode_address(request: GeocodeRequest):
    """
    Geocoding endpoint - Currently disabled (use frontend Nominatim instead).
    
    This endpoint is kept for API compatibility but returns an error.
    Use the frontend's free Nominatim-based geocoding instead.
    
    Args:
        request: Address to geocode
        
    Returns:
        Error message directing to use frontend geocoding
    """
    
    logger.info(f"🌍 Geocoding request received for: {request.address}")
    logger.info("ℹ️ Backend geocoding disabled - use frontend Nominatim instead")
    
    return GeocodeResponse(
        success=False,
        address=request.address,
        error="Backend geocoding disabled. Please use frontend address autocomplete (OpenStreetMap Nominatim) instead."
    )
