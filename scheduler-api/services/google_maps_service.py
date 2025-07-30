"""
Google Maps integration service for geocoding addresses and calculating routes.
Provides functionality to convert addresses to coordinates and get route directions.
"""

import requests
from typing import List, Dict, Any, Optional, Tuple
from config import logger
import json

class GoogleMapsService:
    """
    Service for interacting with Google Maps APIs.
    Handles geocoding (address to coordinates) and directions.
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.geocoding_base_url = "https://maps.googleapis.com/maps/api/geocode/json"
        self.directions_base_url = "https://maps.googleapis.com/maps/api/directions/json"
        self.distance_matrix_base_url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    
    def geocode_address(self, address: str) -> Optional[Dict[str, float]]:
        """
        Convert an address to latitude/longitude coordinates using Google Geocoding API.
        
        Args:
            address: Street address to geocode
            
        Returns:
            Dictionary with 'latitude' and 'longitude' keys, or None if geocoding fails
        """
        try:
            params = {
                'address': address,
                'key': self.api_key,
                'language': 'sv',  # Swedish language for better Swedish address handling
                'region': 'se'     # Bias results towards Sweden
            }
            
            response = requests.get(self.geocoding_base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                location = data['results'][0]['geometry']['location']
                
                logger.info(f"✅ Geocoded address '{address}' -> {location['lat']}, {location['lng']}")
                
                return {
                    'latitude': location['lat'],
                    'longitude': location['lng'],
                    'formatted_address': data['results'][0]['formatted_address']
                }
            else:
                logger.warning(f"❌ Geocoding failed for address '{address}': {data.get('status', 'Unknown error')}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ HTTP error during geocoding: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error during geocoding: {str(e)}")
            return None
    
    def geocode_multiple_addresses(self, addresses: List[str]) -> Dict[str, Optional[Dict[str, float]]]:
        """
        Geocode multiple addresses in batch.
        
        Args:
            addresses: List of addresses to geocode
            
        Returns:
            Dictionary mapping addresses to their coordinates (or None if failed)
        """
        results = {}
        
        logger.info(f"🌍 Geocoding {len(addresses)} addresses...")
        
        for address in addresses:
            results[address] = self.geocode_address(address)
            
        successful = sum(1 for result in results.values() if result is not None)
        logger.info(f"✅ Successfully geocoded {successful}/{len(addresses)} addresses")
        
        return results
    
    def get_distance_matrix(self, origins: List[Tuple[float, float]], 
                          destinations: List[Tuple[float, float]]) -> Optional[Dict[str, Any]]:
        """
        Get travel distances and times between multiple origins and destinations.
        
        Args:
            origins: List of (latitude, longitude) tuples for origin points
            destinations: List of (latitude, longitude) tuples for destination points
            
        Returns:
            Distance matrix data from Google Maps API, or None if request fails
        """
        try:
            # Format coordinates for API
            origins_str = '|'.join([f"{lat},{lng}" for lat, lng in origins])
            destinations_str = '|'.join([f"{lat},{lng}" for lat, lng in destinations])
            
            params = {
                'origins': origins_str,
                'destinations': destinations_str,
                'units': 'metric',
                'mode': 'driving',
                'language': 'sv',
                'key': self.api_key
            }
            
            response = requests.get(self.distance_matrix_base_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] == 'OK':
                logger.info(f"✅ Retrieved distance matrix for {len(origins)}x{len(destinations)} locations")
                return data
            else:
                logger.warning(f"❌ Distance matrix request failed: {data.get('status', 'Unknown error')}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ HTTP error during distance matrix request: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error during distance matrix request: {str(e)}")
            return None
    
    def get_route_directions(self, waypoints: List[Tuple[float, float]], 
                           optimize_waypoints: bool = True) -> Optional[Dict[str, Any]]:
        """
        Get turn-by-turn directions for a route with multiple waypoints.
        
        Args:
            waypoints: List of (latitude, longitude) tuples for the route
            optimize_waypoints: Whether to let Google optimize waypoint order
            
        Returns:
            Directions data from Google Maps API, or None if request fails
        """
        if len(waypoints) < 2:
            logger.warning("Need at least 2 waypoints for directions")
            return None
            
        try:
            origin = f"{waypoints[0][0]},{waypoints[0][1]}"
            destination = f"{waypoints[-1][0]},{waypoints[-1][1]}"
            
            params = {
                'origin': origin,
                'destination': destination,
                'mode': 'driving',
                'language': 'sv',
                'key': self.api_key
            }
            
            # Add intermediate waypoints if any
            if len(waypoints) > 2:
                waypoints_str = '|'.join([f"{lat},{lng}" for lat, lng in waypoints[1:-1]])
                params['waypoints'] = waypoints_str
                if optimize_waypoints:
                    params['waypoints'] = f"optimize:true|{waypoints_str}"
            
            response = requests.get(self.directions_base_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] == 'OK':
                logger.info(f"✅ Retrieved directions for {len(waypoints)}-point route")
                return data
            else:
                logger.warning(f"❌ Directions request failed: {data.get('status', 'Unknown error')}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ HTTP error during directions request: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error during directions request: {str(e)}")
            return None
    
    def extract_distance_matrix_data(self, matrix_data: Dict[str, Any]) -> List[List[Dict[str, Any]]]:
        """
        Extract distance and duration data from Google Distance Matrix API response.
        
        Args:
            matrix_data: Response from get_distance_matrix()
            
        Returns:
            2D list where result[i][j] contains distance/duration from origin i to destination j
        """
        if not matrix_data or matrix_data.get('status') != 'OK':
            return []
        
        results = []
        
        for row in matrix_data['rows']:
            row_results = []
            for element in row['elements']:
                if element['status'] == 'OK':
                    row_results.append({
                        'distance_km': element['distance']['value'] / 1000.0,  # Convert meters to km
                        'distance_text': element['distance']['text'],
                        'duration_minutes': element['duration']['value'] / 60.0,  # Convert seconds to minutes
                        'duration_text': element['duration']['text']
                    })
                else:
                    # Handle failed elements
                    row_results.append({
                        'distance_km': float('inf'),
                        'distance_text': 'N/A',
                        'duration_minutes': float('inf'),
                        'duration_text': 'N/A'
                    })
            results.append(row_results)
        
        return results

# Global instance to be used throughout the application
google_maps_service = None

def get_google_maps_service(api_key: str = None) -> GoogleMapsService:
    """
    Get or create Google Maps service instance.
    
    Args:
        api_key: Google Maps API key (required on first call)
        
    Returns:
        GoogleMapsService instance
    """
    global google_maps_service
    
    if google_maps_service is None:
        if api_key is None:
            raise ValueError("Google Maps API key required for first initialization")
        google_maps_service = GoogleMapsService(api_key)
    
    return google_maps_service
