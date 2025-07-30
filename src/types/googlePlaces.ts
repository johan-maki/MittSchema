/**
 * Google Places API Types
 * Type definitions for Google Places Autocomplete
 */

export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings: Array<{
      offset: number;
      length: number;
    }>;
  };
  terms: Array<{
    offset: number;
    value: string;
  }>;
  types: string[];
}

export interface GooglePlaceDetails {
  place_id: string;
  address: string;
  latitude: number;
  longitude: number;
  formatted_address?: string;
  name?: string;
  types?: string[];
}

export interface GooglePlacesAutocompleteOptions {
  country?: string;
  types?: string[];
  debounceMs?: number;
  language?: string;
}

export interface GooglePlacesAutocompleteHook {
  predictions: GooglePlacePrediction[];
  isLoading: boolean;
  error: string | null;
  getPlacePredictions: (input: string) => void;
  clearPredictions: () => void;
  getPlaceDetails: (placeId: string) => Promise<GooglePlaceDetails | null>;
}
