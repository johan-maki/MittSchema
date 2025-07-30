/**
 * Address Autocomplete Component
 * Provides Google Places autocomplete functionality with Swedish address suggestions
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { GooglePlacePrediction } from '@/types/googlePlaces';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string, latitude: number, longitude: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Ange adress...",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    predictions,
    isLoading,
    error,
    getPlacePredictions,
    clearPredictions,
    getPlaceDetails
  } = useGooglePlacesAutocomplete({
    country: 'se', // Sweden
    debounceMs: 300
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim().length >= 2) {
      getPlacePredictions(newValue);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      clearPredictions();
      setIsOpen(false);
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: GooglePlacePrediction) => {
    onChange(prediction.description);
    setIsOpen(false);
    clearPredictions();

    // Get detailed place information including coordinates
    if (onAddressSelect) {
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        onAddressSelect(details.address, details.latitude, details.longitude);
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : predictions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
          handlePredictionSelect(predictions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        clearPredictions();
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        clearPredictions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearPredictions]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim().length >= 2 && predictions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${className}`}
        />
        
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Predictions dropdown */}
      {isOpen && (predictions.length > 0 || error) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {error ? (
            <div className="px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : (
            predictions.map((prediction, index) => (
              <div
                key={prediction.place_id}
                onClick={() => handlePredictionSelect(prediction)}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                  index === highlightedIndex ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
