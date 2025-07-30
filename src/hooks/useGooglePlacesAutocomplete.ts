/**
 * Google Places Autocomplete Hook
 * Provides address suggestions as user types using Google Places API
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  GooglePlacePrediction, 
  GooglePlaceDetails, 
  GooglePlacesAutocompleteOptions,
  GooglePlacesAutocompleteHook 
} from '@/types/googlePlaces';

export function useGooglePlacesAutocomplete({
  country = 'se', // Default to Sweden
  debounceMs = 300
}: GooglePlacesAutocompleteOptions = {}): GooglePlacesAutocompleteHook {
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      
      // Create a div element for PlacesService (required by Google Maps API)
      const div = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(div);
    }
  }, []);

  const getPlacePredictions = useCallback((input: string) => {
    if (!input.trim() || input.length < 2) {
      setPredictions([]);
      return;
    }

    if (!autocompleteService.current) {
      setError('Google Maps not loaded');
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Debounce the request  
    debounceTimer.current = setTimeout(() => {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: country ? { country } : undefined,
        language: 'sv', // Swedish language for Swedish addresses
        types: ['geocode'], // Only addresses, not businesses
      };

      autocompleteService.current!.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions.map(prediction => ({
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: {
                main_text: prediction.structured_formatting.main_text,
                secondary_text: prediction.structured_formatting.secondary_text,
                main_text_matched_substrings: prediction.structured_formatting.main_text_matched_substrings || []
              },
              terms: prediction.terms,
              types: prediction.types
            })));
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPredictions([]);
          } else {
            setError('Kunde inte hämta adressförslag');
            setPredictions([]);
          }
        }
      );
    }, debounceMs);
  }, [country, debounceMs]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<GooglePlaceDetails | null> => {
    if (!placesService.current) {
      setError('Google Maps not loaded');
      return null;
    }

    return new Promise((resolve) => {
      placesService.current!.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'geometry', 'name', 'types']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const details: GooglePlaceDetails = {
              place_id: placeId,
              address: place.formatted_address || '',
              latitude: place.geometry?.location?.lat() || 0,
              longitude: place.geometry?.location?.lng() || 0,
              formatted_address: place.formatted_address,
              name: place.name,
              types: place.types
            };
            resolve(details);
          } else {
            setError('Kunde inte hämta adressdetaljer');
            resolve(null);
          }
        }
      );
    });
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  return {
    predictions,
    isLoading,
    error,
    getPlacePredictions,
    clearPredictions,
    getPlaceDetails
  };
}
