/**
 * useWebSocket - Base WebSocket hook for real-time connections
 *
 * Provides:
 * - Automatic reconnection with exponential backoff
 * - Connection state tracking
 * - Message sending/receiving
 * - Ping/pong keepalive
 */

import { useEffect, useRef, useCallback } from 'preact/hooks';
import { signal } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketOptions {
  /** URL to connect to */
  url: string;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Max reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Base delay between reconnects in ms (default: 1000) */
  reconnectDelay?: number;
  /** Ping interval in ms (default: 30000) */
  pingInterval?: number;
  /** Message handler */
  onMessage?: (data: unknown) => void;
  /** Connection opened handler */
  onOpen?: () => void;
  /** Connection closed handler */
  onClose?: (event: CloseEvent) => void;
  /** Error handler */
  onError?: (error: Event) => void;
  /** State change handler */
  onStateChange?: (state: WebSocketState) => void;
}

export interface WebSocketHook {
  /** Current connection state */
  state: WebSocketState;
  /** Send a message */
  send: (data: unknown) => boolean;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Is currently connected */
  isConnected: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useWebSocket(options: WebSocketOptions): WebSocketHook {
  const {
    url,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    pingInterval = 30000,
    onMessage,
    onOpen,
    onClose,
    onError,
    onStateChange,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store signal in ref to persist across renders
  const stateSignalRef = useRef(signal<WebSocketState>('disconnected'));
  const stateSignal = stateSignalRef.current;

  const setState = useCallback((newState: WebSocketState) => {
    stateSignal.value = newState;
    onStateChange?.(newState);
  }, [onStateChange, stateSignal]);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, pingInterval);
  }, [pingInterval]);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState('connecting');

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setState('connected');
        startPingInterval();
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle pong silently
          if (data.type === 'PONG') return;
          onMessage?.(data);
        } catch {
          // Non-JSON message
          onMessage?.(event.data);
        }
      };

      ws.onclose = (event) => {
        clearTimers();
        setState('disconnected');
        onClose?.(event);

        // Auto-reconnect if enabled and not a clean close
        if (autoReconnect && !event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        setState('error');
        onError?.(error);
      };

      wsRef.current = ws;
    } catch (error) {
      setState('error');
      onError?.(error as Event);
    }
  }, [url, autoReconnect, maxReconnectAttempts, reconnectDelay, onMessage, onOpen, onClose, onError, setState, clearTimers, startPingInterval]);

  const disconnect = useCallback(() => {
    clearTimers();
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setState('disconnected');
  }, [clearTimers, maxReconnectAttempts, setState]);

  const send = useCallback((data: unknown): boolean => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [url]); // Reconnect if URL changes

  return {
    state: stateSignal.value,
    send,
    connect,
    disconnect,
    isConnected: stateSignal.value === 'connected',
  };
}

export default useWebSocket;
