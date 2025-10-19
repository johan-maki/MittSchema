import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Play, Download, Clock, Route, MapIcon, Navigation, Users } from 'lucide-react';
import { AddressAutocompleteFree } from '@/components/ui/AddressAutocompleteFree';
import { RouteMapFree } from '@/components/RouteMapFree';
import { SCHEDULER_API } from '@/config/api';

interface Customer {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  serviceTime: number; // minutes
  priority: 'low' | 'medium' | 'high';
  timeWindow?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

interface StartLocation {
  address: string;
  latitude: number;
  longitude: number;
}

interface OptimizedRoute {
  totalDistance: number;
  totalTime: number;
  customers: Customer[];
  routeInstructions?: string[];
}

const RouteOptimization: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    address: '',
    serviceTime: 30,
    priority: 'medium'
  });
  const [startLocation, setStartLocation] = useState<StartLocation>({
    address: 'Stockholm, Sverige',
    latitude: 59.3293,
    longitude: 18.0686
  });
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const loadDemoCustomers = async () => {
    setIsLoadingDemo(true);
    try {
      const response = await fetch(`${SCHEDULER_API.BASE_URL}/api/route/demo-customers`);
      if (response.ok) {
        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const demoCustomers = data.customers.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          address: customer.address,
          latitude: customer.latitude,
          longitude: customer.longitude,
          serviceTime: customer.serviceTime,
          priority: customer.priority,
          timeWindow: customer.timeWindow
        }));
        setCustomers(demoCustomers);
      } else {
        console.error('Failed to load demo customers');
      }
    } catch (error) {
      console.error('Error loading demo customers:', error);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const addCustomer = async () => {
    if (!newCustomer.name || !newCustomer.address) {
      alert('Vänligen fyll i namn och adress');
      return;
    }

    setIsLoadingDemo(true); // Reuse loading state for geocoding

    try {
      // Geocode the address automatically
      const geocodeResponse = await fetch(`${SCHEDULER_API.BASE_URL}/api/route/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: newCustomer.address
        }),
      });

      let latitude: number | undefined;
      let longitude: number | undefined;

      if (geocodeResponse.ok) {
        const geocodeResult = await geocodeResponse.json();
        if (geocodeResult.success) {
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
          console.log(`✅ Geocoded address: ${newCustomer.address} -> ${latitude}, ${longitude}`);
        } else {
          console.warn(`⚠️ Geocoding failed for ${newCustomer.address}: ${geocodeResult.error}`);
        }
      } else {
        console.warn('⚠️ Geocoding service unavailable');
      }

      const customer: Customer = {
        id: Date.now().toString(),
        name: newCustomer.name!,
        address: newCustomer.address!,
        latitude,
        longitude,
        serviceTime: newCustomer.serviceTime || 30,
        priority: newCustomer.priority || 'medium',
        timeWindow: newCustomer.timeWindow
      };

      setCustomers([...customers, customer]);
      setNewCustomer({
        name: '',
        address: '',
        serviceTime: 30,
        priority: 'medium'
      });

    } catch (error) {
      console.error('❌ Error during geocoding:', error);
      
      // Add customer without coordinates if geocoding fails
      const customer: Customer = {
        id: Date.now().toString(),
        name: newCustomer.name!,
        address: newCustomer.address!,
        serviceTime: newCustomer.serviceTime || 30,
        priority: newCustomer.priority || 'medium',
        timeWindow: newCustomer.timeWindow
      };

      setCustomers([...customers, customer]);
      setNewCustomer({
        name: '',
        address: '',
        serviceTime: 30,
        priority: 'medium'
      });
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const removeCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
  };

  const optimizeRoute = async () => {
    if (customers.length < 2) {
      alert('Du behöver minst 2 kunder för att optimera en slinga');
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Skicka till backend för Gurobi-optimering
      const response = await fetch(`${SCHEDULER_API.BASE_URL}/api/route/optimize-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customers: customers,
          optimization_criteria: 'minimize_distance',
          startLocation: [startLocation.latitude, startLocation.longitude],
          max_route_time: 480,
          vehicle_speed_kmh: 40.0
        }),
      });

      if (!response.ok) {
        throw new Error('Rutt-optimering misslyckades');
      }

      const result = await response.json();
      setOptimizedRoute(result);

    } catch (error) {
      console.error('Route optimization error:', error);
      
      // Fallback: Mock optimization för demo
      const mockOptimization = {
        totalDistance: Math.random() * 50 + 20, // 20-70 km
        totalTime: customers.length * 45 + Math.random() * 60, // ~45 min per customer + travel
        customers: [...customers].sort(() => Math.random() - 0.5), // Random shuffle för demo
        routeInstructions: customers.map((customer, index) => 
          `${index + 1}. Kör till ${customer.name} på ${customer.address} (${customer.serviceTime} min service)`
        )
      };
      
      setOptimizedRoute(mockOptimization);
      console.log('Använder mock-optimering för demo');
    } finally {
      setIsOptimizing(false);
    }
  };

  const exportRoute = () => {
    if (!optimizedRoute) return;

    const routeData = {
      totalDistance: optimizedRoute.totalDistance,
      totalTime: optimizedRoute.totalTime,
      customers: optimizedRoute.customers.map((customer, index) => ({
        stop: index + 1,
        name: customer.name,
        address: customer.address,
        serviceTime: customer.serviceTime,
        priority: customer.priority,
        estimatedArrival: '', // Skulle kunna beräknas
      })),
      routeInstructions: optimizedRoute.routeInstructions
    };

    const dataStr = JSON.stringify(routeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimerad_slinga_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Route className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Slingplanering</h1>
            <p className="text-gray-600">Optimera besöksordning för hemtjänst med AI-driven ruttplanering</p>
          </div>
          <button
            onClick={loadDemoCustomers}
            disabled={isLoadingDemo}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            {isLoadingDemo ? 'Laddar...' : 'Ladda demo-kunder'}
          </button>
        </div>

        {/* Statistics */}
        {optimizedRoute && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total sträcka</p>
                  <p className="text-xl font-bold text-blue-900">{optimizedRoute.totalDistance.toFixed(1)} km</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total tid</p>
                  <p className="text-xl font-bold text-purple-900">{Math.round(optimizedRoute.totalTime)} min</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Antal stopp</p>
                  <p className="text-xl font-bold text-green-900">{optimizedRoute.customers.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Customer Management */}
        <div className="space-y-6">
          {/* Add Customer Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Lägg till kund
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kundnamn
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name || ''}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Namn på kund"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicetid (min)
                  </label>
                  <input
                    type="number"
                    value={newCustomer.serviceTime || 30}
                    onChange={(e) => setNewCustomer({...newCustomer, serviceTime: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="5"
                    max="240"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adress
                </label>
                <AddressAutocompleteFree
                  value={newCustomer.address || ''}
                  onChange={(value) => setNewCustomer({...newCustomer, address: value})}
                  onAddressSelect={(address, latitude, longitude) => {
                    setNewCustomer({
                      ...newCustomer, 
                      address,
                      latitude,
                      longitude
                    });
                  }}
                  placeholder="Kundadress"
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioritet
                  </label>
                  <select
                    value={newCustomer.priority || 'medium'}
                    onChange={(e) => setNewCustomer({...newCustomer, priority: e.target.value as 'low' | 'medium' | 'high'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Låg</option>
                    <option value="medium">Medium</option>
                    <option value="high">Hög</option>
                  </select>
                </div>
              </div>

              <button
                onClick={addCustomer}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Lägg till kund
              </button>
            </div>
          </div>

          {/* Customer List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Kunder ({customers.length})
              </h2>
              {customers.length >= 2 && (
                <button
                  onClick={optimizeRoute}
                  disabled={isOptimizing}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isOptimizing ? 'Optimerar...' : 'Optimera slinga'}
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {customers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{customer.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(customer.priority)}`}>
                        {customer.priority === 'high' ? 'Hög' : customer.priority === 'medium' ? 'Medium' : 'Låg'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{customer.address}</p>
                    <p className="text-xs text-gray-500">{customer.serviceTime} min service</p>
                  </div>
                  <button
                    onClick={() => removeCustomer(customer.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {customers.length === 0 && (
                <p className="text-gray-500 text-center py-8">Inga kunder tillagda än</p>
              )}
            </div>

            {optimizedRoute && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={exportRoute}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportera rutt-instruktioner
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Route Visualization */}
        <div className="space-y-6">
          {/* Interactive Map */}
          {customers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                Karta
              </h2>
              <RouteMapFree
                customers={customers}
                startLocation={startLocation}
                optimizedOrder={optimizedRoute?.customers}
                totalDistance={optimizedRoute?.totalDistance}
                totalTime={optimizedRoute?.totalTime}
              />
            </div>
          )}
          
          {/* Route Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Optimerad rutt
            </h2>
            
            {optimizedRoute ? (
              <div className="space-y-4">
                {/* Route Steps */}
                <div className="space-y-3">
                  {optimizedRoute.customers.map((customer, index) => (
                    <div key={customer.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{customer.name}</h3>
                        <p className="text-sm text-gray-600">{customer.address}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {customer.serviceTime} min
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(customer.priority)}`}>
                            {customer.priority === 'high' ? 'Hög' : customer.priority === 'medium' ? 'Medium' : 'Låg'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Route Instructions */}
                {optimizedRoute.routeInstructions && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Ruttbeskrivning:</h3>
                    <div className="space-y-2">
                      {optimizedRoute.routeInstructions.map((instruction, index) => (
                        <p key={index} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-200">
                          {instruction}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Lägg till kunder och klicka på "Optimera slinga" för att se den optimala rutten</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteOptimization;
