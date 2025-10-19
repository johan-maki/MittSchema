/**
 * FREE RouteMap Component using OpenStreetMap (Leaflet)
 * No API key required - completely free and open-source!
 * 
 * Features:
 * - Interactive map with OpenStreetMap tiles
 * - Customer markers with colors and numbers
 * - Route lines between customers
 * - Popups with customer info
 * - No API costs or limits
 */

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Clock, Route as RouteIcon } from 'lucide-react';

// Fix Leaflet default icon issue with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Customer {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  serviceTime: number;
  priority: 'low' | 'medium' | 'high';
}

interface RouteMapFreeProps {
  customers: Customer[];
  startLocation?: { latitude: number; longitude: number; address: string };
  optimizedOrder?: Customer[];
  totalDistance?: number;
  totalTime?: number;
}

// Component to auto-fit map bounds
function MapBoundsSetter({ 
  customers, 
  startLocation 
}: { 
  customers: Customer[]; 
  startLocation?: { latitude: number; longitude: number; address: string } | undefined;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    if (startLocation) {
      points.push([startLocation.latitude, startLocation.longitude]);
    }

    customers.forEach(customer => {
      if (customer.latitude && customer.longitude) {
        points.push([customer.latitude, customer.longitude]);
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [customers, startLocation, map]);

  return null;
}

// Create custom marker icons with colors and numbers
function createNumberedIcon(number: number, priority: string) {
  const color = priority === 'high' ? '#EF4444' : 
                priority === 'medium' ? '#F59E0B' : '#10B981';

  const svgIcon = `
    <svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11.2 16 28 16 28s16-16.8 16-28C32 7.2 24.8 0 16 0z" 
            fill="${color}" stroke="white" stroke-width="2"/>
      <text x="16" y="18" font-size="14" font-weight="bold" fill="white" 
            text-anchor="middle" dominant-baseline="middle">${number}</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44]
  });
}

// Create start location icon (home)
function createHomeIcon() {
  const svgIcon = `
    <svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11.2 16 28 16 28s16-16.8 16-28C32 7.2 24.8 0 16 0z" 
            fill="#10B981" stroke="white" stroke-width="2"/>
      <text x="16" y="18" font-size="16" fill="white" 
            text-anchor="middle" dominant-baseline="middle">🏠</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44]
  });
}

export const RouteMapFree: React.FC<RouteMapFreeProps> = ({
  customers,
  startLocation,
  optimizedOrder,
  totalDistance,
  totalTime
}) => {
  // Use optimized order if available, otherwise use original order
  const customersToShow = optimizedOrder && optimizedOrder.length > 0 ? optimizedOrder : customers;
  
  // Filter customers with valid coordinates
  const validCustomers = customersToShow.filter(c => c.latitude && c.longitude);

  // Calculate route line coordinates
  const routeCoordinates = useMemo(() => {
    const coords: [number, number][] = [];
    
    if (startLocation && validCustomers.length > 0) {
      coords.push([startLocation.latitude, startLocation.longitude]);
    }
    
    validCustomers.forEach(customer => {
      if (customer.latitude && customer.longitude) {
        coords.push([customer.latitude, customer.longitude]);
      }
    });
    
    return coords;
  }, [validCustomers, startLocation]);

  // Default center (Stockholm)
  const center: [number, number] = startLocation 
    ? [startLocation.latitude, startLocation.longitude]
    : validCustomers.length > 0 
      ? [validCustomers[0].latitude!, validCustomers[0].longitude!]
      : [59.3293, 18.0686]; // Stockholm

  if (validCustomers.length === 0 && !startLocation) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Lägg till kunder med adresser för att se kartan</p>
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
      <div className="w-full h-96 rounded-lg border-2 border-gray-300 shadow-md overflow-hidden">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* OpenStreetMap tiles - FREE! */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Auto-fit bounds */}
          <MapBoundsSetter customers={validCustomers} startLocation={startLocation} />

          {/* Start location marker */}
          {startLocation && (
            <Marker
              position={[startLocation.latitude, startLocation.longitude]}
              icon={createHomeIcon()}
            >
              <Popup>
                <div className="p-2">
                  <strong className="text-green-700">🏠 Startposition</strong>
                  <p className="text-sm text-gray-600 mt-1">{startLocation.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Customer markers */}
          {validCustomers.map((customer, index) => (
            <Marker
              key={customer.id}
              position={[customer.latitude!, customer.longitude!]}
              icon={createNumberedIcon(index + 1, customer.priority)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {index + 1}. {customer.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{customer.address}</p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <div>⏱️ Servicetid: {customer.serviceTime} min</div>
                    <div>
                      {customer.priority === 'high' && '⚡ Hög prioritet'}
                      {customer.priority === 'medium' && '📌 Medel prioritet'}
                      {customer.priority === 'low' && '✓ Låg prioritet'}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route line */}
          {optimizedOrder && routeCoordinates.length > 1 && (
            <Polyline
              positions={routeCoordinates}
              color="#3B82F6"
              weight={4}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>

      {/* Map legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
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
        <p className="text-xs text-gray-500 mt-3">
          📍 Powered by OpenStreetMap - Gratis och open-source!
        </p>
      </div>
    </div>
  );
};
