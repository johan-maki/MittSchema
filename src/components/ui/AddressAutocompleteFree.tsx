/**
 * FREE Address Autocomplete Component
 * Uses OpenStreetMap Nominatim - No API key required!
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useAddressAutocompleteFree } from '@/hooks/useAddressAutocompleteFree';

interface AddressAutocompleteFreeProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string, latitude: number, longitude: number) => void;
  placeholder?: string;
  className?: string;
}

export const AddressAutocompleteFree: React.FC<AddressAutocompleteFreeProps> = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Sök adress...',
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const { predictions, isLoading, error, getPlacePredictions, clearPredictions } = 
    useAddressAutocompleteFree({ country: 'se', debounceMs: 1000 });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim()) {
      getPlacePredictions(newValue);
    } else {
      clearPredictions();
    }
  };

  // Handle prediction selection
  const handlePredictionClick = (prediction: typeof predictions[0]) => {
    onChange(prediction.description);
    onAddressSelect?.(prediction.description, prediction.lat, prediction.lon);
    clearPredictions();
    setIsFocused(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        clearPredictions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearPredictions]);

  const showDropdown = isFocused && (predictions.length > 0 || isLoading || error);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {isLoading && predictions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Söker adresser...
            </div>
          )}

          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handlePredictionClick(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {prediction.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {prediction.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {!isLoading && !error && predictions.length === 0 && value.trim() && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Inga adresser hittades
            </div>
          )}

          {/* Attribution - Required by Nominatim terms */}
          <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
            📍 Powered by OpenStreetMap Nominatim (Free)
          </div>
        </div>
      )}
    </div>
  );
};
