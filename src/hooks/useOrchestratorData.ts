// src/hooks/useOrchestratorData.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { orchestratorService } from '@/services/orchestrator.service';
import {
    ComputerNode, ProfileItem, Alert, KPIStats,
    SystemEvent, ServiceStatus, ConnectionItem, BackupStatus
} from '@/types/orchestratorTypes';

function formatUptime(ms: number): string {
    const s    = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400);
    const hrs  = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h`;
    if (hrs  > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
}

export function useOrchestratorData() {
    const [stats, setStats]             = useState<KPIStats | null>(null);
    const [nodes, setNodes]             = useState<ComputerNode[]>([]);
    const [profiles, setProfiles]       = useState<ProfileItem[]>([]);
    const [alerts, setAlerts]           = useState<Alert[]>([]);
    const [events, setEvents]           = useState<SystemEvent[]>([]);
    const [services, setServices]       = useState<ServiceStatus[]>([]);
    const [connections, setConnections] = useState<ConnectionItem[]>([]);
    const [backupStatus, setBackupStatus] = useState<BackupStatus | undefined>();
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);

    const fetchingRef      = useRef(false);
    const connectedAtRef   = useRef<Map<string, number>>(new Map());
    const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchData = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setRefreshing(true);
        try {
            const [s, n, p, a, e, svc, c, b] = await Promise.all([
                orchestratorService.getDashboardStats(),
                orchestratorService.getNodes(),
                orchestratorService.getProfiles(),
                orchestratorService.getAlerts(),
                orchestratorService.getSystemEvents(),
                orchestratorService.getServicesStatus(),
                orchestratorService.getConnections(),
                orchestratorService.getBackups(),
            ]);
            setStats(s);
            setProfiles(p);
            setAlerts(a);
            setEvents(e);
            setServices(svc);
            setConnections(c);
            setBackupStatus(b);

            setNodes((n as any[]).map(node => {
                const cid = node.id.toString();
                if (node.connected_since_ts && !connectedAtRef.current.has(cid)) {
                    connectedAtRef.current.set(cid, node.connected_since_ts);
                }
                const connectedAt = connectedAtRef.current.get(cid);
                return {
                    ...node,
                    uptime: connectedAt ? formatUptime(Date.now() - connectedAt) : node.uptime,
                } as ComputerNode;
            }));
        } catch (err) {
            console.error('[useOrchestratorData] fetchData failed:', err);
        } finally {
            fetchingRef.current = false;
            setRefreshing(false);
            setLoading(false);
        }
    }, []);

    const debouncedFetch = useCallback(() => {
        if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
        fetchDebounceRef.current = setTimeout(() => {
            if (!document.hidden) fetchData();
        }, 4_000);
    }, [fetchData]);

    const updateNodeLive = useCallback((
        cid: string,
        cpu: number,
        ram: number,
        browsers?: number
    ) => {
        setNodes(prev => prev.map(n => {
            if (n.id.toString() !== cid) return n;
            const connectedAt = connectedAtRef.current.get(cid);
            return {
                ...n,
                cpu:          Math.round(cpu),
                ram:          Math.round(ram),
                openBrowsers: browsers ?? n.openBrowsers,
                uptime:       connectedAt ? formatUptime(Date.now() - connectedAt) : n.uptime,
            };
        }));
    }, []);

    const markNodeOnline = useCallback((cid: string, connectedSince?: string) => {
        if (!connectedAtRef.current.has(cid)) {
            connectedAtRef.current.set(
                cid,
                connectedSince ? new Date(connectedSince).getTime() : Date.now()
            );
        }
        setNodes(prev => prev.map(n =>
            n.id.toString() === cid ? { ...n, status: 'ONLINE' as const } : n
        ));
    }, []);

    const markNodeOffline = useCallback((cid: string) => {
        connectedAtRef.current.delete(cid);
        setNodes(prev => prev.map(n =>
            n.id.toString() === cid ? { ...n, status: 'OFFLINE' as const, uptime: '—' } : n
        ));
    }, []);

    // ── Refresca solo los servicios cada 20s ─────────────────────────
    const refreshServices = useCallback(async () => {
        try {
            const svc = await orchestratorService.getServicesStatus();
            setServices(svc);
        } catch (err) {
            console.error('[useOrchestratorData] refreshServices failed:', err);
        }
    }, []);

    useEffect(() => {
        // carga inmediata al montar
        refreshServices();

        const interval = setInterval(() => {
            if (!document.hidden) refreshServices();
        }, 20_000); // cada 20 segundos

        return () => clearInterval(interval);
    }, [refreshServices]);
    // ─────────────────────────────────────────────────────────────────

    return {
        // Estado
        stats, nodes, profiles, alerts, events, services, connections, backupStatus,
        loading, refreshing,
        // Acciones
        fetchData, debouncedFetch,
        setStats, 
        setAlerts, setEvents, setProfiles,
        // Actualizaciones en tiempo real
        updateNodeLive, markNodeOnline, markNodeOffline,
        connectedAtRef,
    };
}