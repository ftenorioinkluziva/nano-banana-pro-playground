"use client";

import { useEffect, useRef, useCallback } from "react";

interface SSEEvent {
  event: string;
  data: any;
}

interface UseUGCSSEOptions {
  onGenerationCompleted?: (data: any) => void;
  onGenerationFailed?: (data: any) => void;
  onConnected?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useUGCSSE(options: UseUGCSSEOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // Don't reconnect if we're already connected
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      const eventSource = new EventSource("/api/sse/ugc-updates");
      eventSourceRef.current = eventSource;

      // Handle connection
      eventSource.addEventListener("connected", (event) => {
        const data = JSON.parse(event.data);
        console.log("[SSE] Connected:", data);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts
        options.onConnected?.(data);
      });

      // Handle generation completed
      eventSource.addEventListener("generation-completed", (event) => {
        const data = JSON.parse(event.data);
        console.log("[SSE] Generation completed:", data);
        options.onGenerationCompleted?.(data);
      });

      // Handle generation failed
      eventSource.addEventListener("generation-failed", (event) => {
        const data = JSON.parse(event.data);
        console.log("[SSE] Generation failed:", data);
        options.onGenerationFailed?.(data);
      });

      // Handle heartbeat (keep-alive)
      eventSource.addEventListener("heartbeat", (event) => {
        // Silently receive heartbeat
        // console.log("[SSE] Heartbeat received");
      });

      // Handle errors
      eventSource.onerror = (error) => {
        console.error("[SSE] Connection error:", error);

        if (eventSource.readyState === EventSource.CLOSED) {
          // Attempt to reconnect with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, delay);
          } else {
            console.error("[SSE] Max reconnection attempts reached");
            options.onError?.(new Error("Failed to establish SSE connection"));
          }
        }
      };
    } catch (error) {
      console.error("[SSE] Failed to create EventSource:", error);
      options.onError?.(error as Error);
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log("[SSE] Disconnected");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect,
    disconnect,
  };
}
