/**
 * Google Maps Script Loader
 * Loads the Google Maps JavaScript API with Places library
 */

import { useEffect } from 'react';

interface GoogleMapsLoaderProps {
  apiKey: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export const GoogleMapsLoader: React.FC<GoogleMapsLoaderProps> = ({
  apiKey,
  onLoad,
  onError
}) => {
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      onLoad?.();
      return;
    }

    // Create callback function
    window.initGoogleMaps = () => {
      onLoad?.();
    };

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      onError?.(new Error('Failed to load Google Maps API'));
    };

    // Add script to document
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Remove script
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      
      // Clean up global callback
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps;
      }
    };
  }, [apiKey, onLoad, onError]);

  return null; // This component doesn't render anything
};
