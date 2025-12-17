"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { SSEEvent } from "@/lib/api/types";

interface UseSSEOptions {
  url: string;
  accessToken: string;
  tenantId?: string;
  onMessage?: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface SSEState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

export function useSSE({
  url,
  accessToken,
  tenantId,
  onMessage,
  onError,
  onOpen,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
}: UseSSEOptions) {
  const [state, setState] = useState<SSEState>({
    connected: false,
    reconnecting: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build URL with auth params
    const sseUrl = new URL(url);
    sseUrl.searchParams.set("token", accessToken);
    if (tenantId) {
      sseUrl.searchParams.set("tenantId", tenantId);
    }

    const eventSource = new EventSource(sseUrl.toString());
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setState({ connected: true, reconnecting: false, error: null });
      reconnectAttemptsRef.current = 0;
      onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        onMessage?.(data);
      } catch {
        console.error("Failed to parse SSE message:", event.data);
      }
    };

    eventSource.onerror = (error) => {
      setState((prev) => ({ ...prev, connected: false, error: "Connection lost" }));
      onError?.(error);

      eventSource.close();

      // Attempt reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        setState((prev) => ({ ...prev, reconnecting: true }));
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      } else {
        setState((prev) => ({
          ...prev,
          reconnecting: false,
          error: "Max reconnection attempts reached",
        }));
      }
    };
  }, [url, accessToken, tenantId, onMessage, onError, onOpen, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState({ connected: false, reconnecting: false, error: null });
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    reconnect: connect,
    disconnect,
  };
}

/**
 * Hook for subscribing to specific event types
 */
export function useSSESubscription<T extends SSEEvent>(
  sseState: ReturnType<typeof useSSE>,
  eventTypes: string[],
  callback: (event: T) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    // This would need integration with the SSE hook's event handling
    // For now, this is a placeholder for type-safe event subscriptions
  }, [eventTypes]);
}
