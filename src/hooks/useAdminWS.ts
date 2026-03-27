import { useEffect, useRef, useCallback } from 'react';

type WSEvent = {
    type:
        | 'session_created' | 'session_active' | 'session_closed'
        | 'agent_checkin'   | 'browser_event'  | 'session_denied'
        | 'connected'       | 'agent_online'   | 'agent_offline'
        | 'agent_metrics'   | 'agent_log';
    [key: string]: any;
};


export function useAdminWS(
    onMessage: (event: any) => void,
    enabled:   boolean
) {
    const wsRef        = useRef<WebSocket | null>(null);
    const retryRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef   = useRef(true);
    const retryDelay   = useRef(1_000);   // backoff: 1s → 2s → 4s → max 30s
    const onMessageRef = useRef(onMessage);

    // Mantener ref actualizada sin re-crear el WS
    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

    const connect = useCallback(() => {
        // Si ya hay una conexión abierta o conectando, no crear otra
        if (wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING) return;

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${protocol}://${window.location.host}/api/v1/admin/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!mountedRef.current) { ws.close(); return; }
            retryDelay.current = 1_000;   // reset backoff en conexión exitosa
        };

        ws.onmessage = (raw) => {
            if (!mountedRef.current) return;
            try {
                const data = JSON.parse(raw.data);
                onMessageRef.current(data);
            } catch {
                // ignorar mensajes malformados
            }
        };

        ws.onclose = () => {
            if (!mountedRef.current || !enabled) return;
            // Backoff exponencial hasta 30s
            retryRef.current = setTimeout(() => {
                if (mountedRef.current) connect();
            }, retryDelay.current);
            retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
        };

        ws.onerror = () => {
            if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
        };
    }, [enabled]);

    useEffect(() => {
        mountedRef.current = true;
        if (enabled) connect();

        return () => {
            mountedRef.current = false;
            if (retryRef.current) clearTimeout(retryRef.current);
            const ws = wsRef.current;
            if (ws && ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
            wsRef.current = null;
        };
    }, [enabled, connect]);
}

