/**
 * Google Places Autocomplete Hook - Updated for Places API (New)
 * Uses AutocompleteSuggestion and Place instead of deprecated services
 * Migration guide: https://developers.google.com/maps/documentation/javascript/places-migration-overview
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
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isGoogleMapsLoaded = useRef(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      isGoogleMapsLoaded.current = true;
    }
  }, []);

  const getPlacePredictions = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setPredictions([]);
      return;
    }

    if (!isGoogleMapsLoaded.current) {
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
    debounceTimer.current = setTimeout(async () => {
      try {
        // Use new AutocompleteSuggestion API (recommended from March 1, 2025)
        const request = {
          input,
          includedRegionCodes: country ? [country.toUpperCase()] : undefined,
          language: 'sv', // Swedish language
          locationRestriction: country === 'se' ? {
            // Restrict to Sweden bounds
            west: 10.0,
            north: 69.0,
            east: 24.5,
            south: 55.0
          } : undefined
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { suggestions } = await (google.maps.places as any).AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        setIsLoading(false);

        if (suggestions && suggestions.length > 0) {
          setPredictions(suggestions.map((suggestion: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const placePrediction = (suggestion as any).placePrediction;
            return {
              place_id: placePrediction.placeId,
              description: placePrediction.text.text,
              structured_formatting: {
                main_text: placePrediction.structuredFormat.mainText.text,
                secondary_text: placePrediction.structuredFormat.secondaryText?.text || '',
                main_text_matched_substrings: []
              },
              terms: [],
              types: placePrediction.types || []
            };
          }));
        } else {
          setPredictions([]);
        }
      } catch (err) {
        console.error('Autocomplete error:', err);
        setIsLoading(false);
        setError('Kunde inte hämta adressförslag');
        setPredictions([]);
      }
    }, debounceMs);
  }, [country, debounceMs]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<GooglePlaceDetails | null> => {
    if (!isGoogleMapsLoaded.current) {
      setError('Google Maps not loaded');
      return null;
    }

    try {
      // Use new Place API (recommended from March 1, 2025)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const place = new (google.maps.places as any).Place({
        id: placeId,
        requestedLanguage: 'sv'
      });

      // Fetch place details
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'types']
      });

      const details: GooglePlaceDetails = {
        place_id: placeId,
        address: place.formattedAddress || '',
        latitude: place.location?.lat() || 0,
        longitude: place.location?.lng() || 0,
        formatted_address: place.formattedAddress,
        name: place.displayName,
        types: place.types
      };

      return details;
    } catch (err) {
      console.error('Place details error:', err);
      setError('Kunde inte hämta adressdetaljer');
      return null;
    }
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
