"use client";

import { useCallback, useEffect, useState } from "react";
import { useSSE } from "@/lib/sse/use-sse";
import type { Ride, Van, SSEEvent } from "@/lib/api/types";

interface UseDispatchSSEProps {
  accessToken: string;
  tenantId?: string;
  onRideCreated?: (ride: Ride) => void;
  onRideUpdated?: (ride: Ride) => void;
  onVanUpdated?: (van: Van) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.staysafeos.com";

export function useDispatchSSE({
  accessToken,
  tenantId,
  onRideCreated,
  onRideUpdated,
  onVanUpdated,
}: UseDispatchSSEProps) {
  const handleMessage = useCallback(
    (event: SSEEvent) => {
      switch (event.type) {
        case "ride.created":
          onRideCreated?.(event.data as Ride);
          break;
        case "ride.updated":
        case "ride.cancelled":
        case "ride.completed":
          onRideUpdated?.(event.data as Ride);
          break;
        case "van.updated":
        case "van.online":
        case "van.offline":
          onVanUpdated?.(event.data as Van);
          break;
      }
    },
    [onRideCreated, onRideUpdated, onVanUpdated]
  );

  const sseState = useSSE({
    url: `${API_URL}/v1/stream`,
    accessToken,
    tenantId,
    onMessage: handleMessage,
    reconnectInterval: 3000,
    maxReconnectAttempts: 15,
  });

  return sseState;
}

/**
 * Hook to manage dispatch state with SSE updates
 */
export function useDispatchState(
  initialRides: Ride[],
  initialVans: Van[],
  accessToken: string,
  tenantId?: string
) {
  const [rides, setRides] = useState<Ride[]>(initialRides);
  const [vans, setVans] = useState<Van[]>(initialVans);

  // Update state when initial data changes (e.g., after server refresh)
  useEffect(() => {
    setRides(initialRides);
  }, [initialRides]);

  useEffect(() => {
    setVans(initialVans);
  }, [initialVans]);

  const handleRideCreated = useCallback((ride: Ride) => {
    setRides((prev) => {
      // Avoid duplicates
      if (prev.some((r) => r.id === ride.id)) {
        return prev.map((r) => (r.id === ride.id ? ride : r));
      }
      return [ride, ...prev];
    });
  }, []);

  const handleRideUpdated = useCallback((ride: Ride) => {
    setRides((prev) => prev.map((r) => (r.id === ride.id ? ride : r)));
  }, []);

  const handleVanUpdated = useCallback((van: Van) => {
    setVans((prev) => prev.map((v) => (v.id === van.id ? van : v)));
  }, []);

  const sseState = useDispatchSSE({
    accessToken,
    tenantId,
    onRideCreated: handleRideCreated,
    onRideUpdated: handleRideUpdated,
    onVanUpdated: handleVanUpdated,
  });

  // Helper to manually update a ride (for optimistic updates)
  const updateRide = useCallback((rideId: string, updates: Partial<Ride>) => {
    setRides((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, ...updates } : r))
    );
  }, []);

  // Helper to remove a ride from state
  const removeRide = useCallback((rideId: string) => {
    setRides((prev) => prev.filter((r) => r.id !== rideId));
  }, []);

  return {
    rides,
    vans,
    sseState,
    updateRide,
    removeRide,
  };
}
