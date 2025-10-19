/**
 * RouteMap Component
 * Interactive Google Maps visualization for optimized routes
 * Shows customer locations, route paths, and turn-by-turn directions
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Clock, Route as RouteIcon } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  serviceTime: number;
  priority: 'low' | 'medium' | 'high';
}

interface RouteMapProps {
  customers: Customer[];
  startLocation?: { latitude: number; longitude: number; address: string };
  optimizedOrder?: Customer[];
  totalDistance?: number;
  totalTime?: number;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export const RouteMap: React.FC<RouteMapProps> = ({
  customers,
  startLocation,
  optimizedOrder,
  totalDistance,
  totalTime
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) {
      setMapError('Google Maps inte tillgängligt');
      return;
    }

    try {
      // Create map centered on Stockholm or start location
      const center = startLocation
        ? { lat: startLocation.latitude, lng: startLocation.longitude }
        : { lat: 59.3293, lng: 18.0686 }; // Stockholm

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }] // Hide point of interest labels for cleaner view
          }
        ]
      });

      mapInstanceRef.current = map;
      
      // Initialize DirectionsRenderer for route display
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false, // We'll add custom markers
        polylineOptions: {
          strokeColor: '#3B82F6', // Blue route line
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      directionsRendererRef.current = directionsRenderer;

      setIsMapLoaded(true);
      setMapError(null);
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Kunde inte ladda kartan');
    }

    // Cleanup
    return () => {
      clearMarkers();
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [startLocation]);

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Add markers for customers
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || customers.length === 0) return;

    clearMarkers();

    const bounds = new window.google.maps.LatLngBounds();

    // Add start location marker if provided
    if (startLocation) {
      const startMarker = new window.google.maps.Marker({
        position: { lat: startLocation.latitude, lng: startLocation.longitude },
        map: mapInstanceRef.current,
        title: 'Start',
        label: {
          text: '🏠',
          fontSize: '20px'
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#10B981', // Green
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      const startInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>Startposition</strong><br/>
            ${startLocation.address}
          </div>
        `
      });

      startMarker.addListener('click', () => {
        startInfoWindow.open(mapInstanceRef.current!, startMarker);
      });

      markersRef.current.push(startMarker);
      bounds.extend({ lat: startLocation.latitude, lng: startLocation.longitude });
    }

    // Add customer markers
    const customersToShow = optimizedOrder && optimizedOrder.length > 0 ? optimizedOrder : customers;
    
    customersToShow.forEach((customer, index) => {
      if (!customer.latitude || !customer.longitude) return;

      const position = { lat: customer.latitude, lng: customer.longitude };

      // Color based on priority
      const color = customer.priority === 'high' ? '#EF4444' : 
                    customer.priority === 'medium' ? '#F59E0B' : '#10B981';

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        title: customer.name,
        label: {
          text: `${index + 1}`,
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Create info window for each customer
      const priorityLabel = customer.priority === 'high' ? '⚡ Hög prioritet' :
                           customer.priority === 'medium' ? '📌 Medel prioritet' : '✓ Låg prioritet';
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${index + 1}. ${customer.name}</h3>
            <p style="margin: 4px 0; color: #6B7280; font-size: 14px;">${customer.address}</p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
              <div style="font-size: 13px; color: #374151;">
                ⏱️ Servicetid: ${customer.serviceTime} min<br/>
                ${priorityLabel}
              </div>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      mapInstanceRef.current!.fitBounds(bounds);
      
      // Add padding to bounds
      const listener = window.google.maps.event.addListenerOnce(mapInstanceRef.current!, 'bounds_changed', () => {
        const zoom = mapInstanceRef.current!.getZoom();
        if (zoom && zoom > 15) {
          mapInstanceRef.current!.setZoom(15);
        }
      });
    }

  }, [isMapLoaded, customers, optimizedOrder, startLocation]);

  // Draw route between customers
  useEffect(() => {
    if (!isMapLoaded || !directionsRendererRef.current || !optimizedOrder || optimizedOrder.length < 2) return;

    const customersWithCoords = optimizedOrder.filter(c => c.latitude && c.longitude);
    if (customersWithCoords.length < 2) return;

    // Create waypoints for directions API
    const origin = startLocation 
      ? { lat: startLocation.latitude, lng: startLocation.longitude }
      : { lat: customersWithCoords[0].latitude!, lng: customersWithCoords[0].longitude! };

    const destination = { 
      lat: customersWithCoords[customersWithCoords.length - 1].latitude!, 
      lng: customersWithCoords[customersWithCoords.length - 1].longitude! 
    };

    const waypoints = customersWithCoords.slice(
      startLocation ? 0 : 1,
      startLocation ? customersWithCoords.length - 1 : customersWithCoords.length - 1
    ).map(customer => ({
      location: { lat: customer.latitude!, lng: customer.longitude! },
      stopover: true
    }));

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: false, // We already have optimized order
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'SE'
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
        } else {
          console.warn('Directions request failed:', status);
        }
      }
    );

  }, [isMapLoaded, optimizedOrder, startLocation]);

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map statistics */}
      {totalDistance && totalTime && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <RouteIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Sträcka</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{totalDistance.toFixed(1)} km</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Total Tid</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{Math.round(totalTime)} min</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border-2 border-gray-300 shadow-md"
        style={{ minHeight: '400px' }}
      />

      {/* Map legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          Kartförklaring
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Startposition</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Hög prioritet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Medel prioritet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Låg prioritet</span>
          </div>
        </div>
      </div>
    </div>
  );
};
