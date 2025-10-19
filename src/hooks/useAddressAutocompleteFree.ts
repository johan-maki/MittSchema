/**
 * FREE Address Autocomplete using Nominatim (OpenStreetMap)
 * No API key required - completely free!
 * 
 * Uses: https://nominatim.openstreetmap.org/
 * Rate limit: 1 request per second (we handle this with debouncing)
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
  };
}

interface AddressAutocompleteFreeHook {
  predictions: Array<{
    place_id: number;
    description: string;
    main_text: string;
    secondary_text: string;
    lat: number;
    lon: number;
  }>;
  isLoading: boolean;
  error: string | null;
  getPlacePredictions: (input: string) => void;
  clearPredictions: () => void;
}

type Prediction = {
  place_id: number;
  description: string;
  main_text: string;
  secondary_text: string;
  lat: number;
  lon: number;
};

export function useAddressAutocompleteFree({
  country = 'se',
  debounceMs = 1000 // Respect rate limits
}: {
  country?: string;
  debounceMs?: number;
} = {}): AddressAutocompleteFreeHook {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getPlacePredictions = useCallback((input: string) => {
    if (!input.trim() || input.length < 3) {
      setPredictions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setIsLoading(true);
    setError(null);

    // Debounce the request (respect rate limits)
    debounceTimer.current = setTimeout(async () => {
      try {
        abortControllerRef.current = new AbortController();

        // Nominatim search endpoint
        const countryCode = country.toUpperCase();
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.append('q', input);
        url.searchParams.append('format', 'json');
        url.searchParams.append('addressdetails', '1');
        url.searchParams.append('countrycodes', countryCode);
        url.searchParams.append('limit', '5');

        const response = await fetch(url.toString(), {
          signal: abortControllerRef.current.signal,
          headers: {
            'User-Agent': 'MittSchema-RouteOptimization/1.0' // Required by Nominatim
          }
        });

        if (!response.ok) {
          throw new Error('Geocoding service error');
        }

        const results: NominatimResult[] = await response.json();

        setIsLoading(false);

        if (results && results.length > 0) {
          setPredictions(results.map(result => {
            // Parse main text (street) and secondary text (city, etc)
            const parts = result.display_name.split(',');
            const mainText = parts[0]?.trim() || '';
            const secondaryText = parts.slice(1).join(',').trim();

            return {
              place_id: result.place_id,
              description: result.display_name,
              main_text: mainText,
              secondary_text: secondaryText,
              lat: parseFloat(result.lat),
              lon: parseFloat(result.lon)
            };
          }));
        } else {
          setPredictions([]);
        }
      } catch (err) {
        const error = err as Error;
        if (error.name !== 'AbortError') {
          console.error('Nominatim error:', error);
          setIsLoading(false);
          setError('Kunde inte hämta adressförslag');
          setPredictions([]);
        }
      }
    }, debounceMs);
  }, [country, debounceMs]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    predictions,
    isLoading,
    error,
    getPlacePredictions,
    clearPredictions
  };
}
