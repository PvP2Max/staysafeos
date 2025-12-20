"use client";

import { useState, useCallback } from "react";

export interface GeolocationState {
  lat: number;
  lng: number;
}

export interface UseGeolocationReturn {
  location: GeolocationState | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => void;
  clearError: () => void;
}

/**
 * Hook for accessing browser geolocation
 */
export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let message = "Unable to get your location";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = "Location access was denied. Please enable location permissions.";
            break;
          case err.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        setError(message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    clearError,
  };
}
