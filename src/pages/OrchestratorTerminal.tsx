// src/pages/OrchestratorTerminal.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    LayoutDashboard, Server, Users, Bell, Search, Filter,
    CheckCircle2, AlertTriangle, Monitor, History,
    Terminal as TerminalIcon, Settings, Plus, ExternalLink, RefreshCw,
    Globe, Shield
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orchestratorService } from '@/services/orchestrator.service';
import { useAdminWS } from '@/hooks/useAdminWS';
import { useOrchestratorData } from '@/hooks/useOrchestratorData';
import { useNodeDrawer } from '@/hooks/useNodeDrawer';
import { useDashboardModals } from '@/hooks/useDashboardModals';
import {
    ComputerNode, ProfileItem, Alert, KPIStats,
    SystemEvent, ServiceStatus, ConnectionItem, BackupStatus
} from '@/types/orchestratorTypes';
import {
    AdminKPICard, ComputerRow, AlertItem, SkeletonKPI,
    SkeletonRow, HealthOverview, SystemEventsFeed, ServiceStatusBar,
    ConnectionRow, ProfileRow, GlobalStatusHero, MiniCapacityPanel,
    JobsQueueWidget, FilterButton, SettingsPanel
} from '@/components/OrchestratorComponents';
import {
    NodeItemDrawer, AlertModal, SessionHistoryModal,
    DashKPIModal, DashFiltersDrawer, HealthDetailModal, ServiceDetailModal,
    SecurityCheckModal, SessionStartModal, CreateProfileModal, EventDetailModal,
    SystemDiagnosticModal, ResourceDetailModal, JobQueueModal,
    ProxyHistoryModal
} from '@/components/OrchestratorDrawers';

// ─── HELPER (fuera del componente) ──────────────────────────────────────────
// Añadir función helper cerca de getInitialTab:
function computeVerdict(score: number, risks: string[], services: ServiceStatus[]): string {
    const degradedSvcs = services.filter(s => s.status === 'DEGRADED').map(s => s.name);
    if (score >= 90) return '"Sistema operando nominalmente. Todos los servicios en línea."';
    if (score >= 75) {
        const issue = risks[0] ?? 'advertencias menores detectadas';
        return `"Operación estable con avisos: ${issue.toLowerCase()}"`;
    }
    if (score >= 55) {
        const down = degradedSvcs.slice(0, 2).join(', ');
        return `"Degradación detectada${down ? ` en ${down}` : ''}. Revisar proxies y agentes."`;
    }
    return '"Estado crítico — múltiples servicios afectados. Intervención requerida."';
}

function formatUptime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400);
    const hrs = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
}

type TabType = 'DASHBOARD' | 'NODES' | 'PROFILES' | 'ALERTS' | 'CONNECTIONS' | 'SETTINGS';

function getInitialTab(searchParams: URLSearchParams): TabType {
    const t = searchParams.get('tab');
    return (t === 'NODES' || t === 'PROFILES' || t === 'ALERTS' || t === 'CONNECTIONS' || t === 'SETTINGS')
        ? t
        : 'DASHBOARD';
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

const SidebarItem = ({ label, active, onClick, icon }: any) => (
    <button
        onClick={onClick}
        className={`w-full aspect-square rounded-2xl flex flex-col gap-1 items-center justify-center transition-all relative ${active ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'text-[#444] hover:text-white hover:bg-white/5'
            }`}
    >
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00ff88] rounded-r-full" />}
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
);

// ─── MAIN ────────────────────────────────────────────────────────────────────

const OrchestratorTerminal: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // ─── HOOKS ───────────────────────────────────────────────────
    const {
        stats, nodes, profiles, alerts, events, services, connections, backupStatus,
        loading, refreshing, fetchData, debouncedFetch,
        setStats,
        setAlerts, setEvents, setProfiles,
        updateNodeLive, markNodeOnline, markNodeOffline,
    } = useOrchestratorData();

    const {
        selectedNode, nodeHistory, nodeLogs, selectedNodeRef,
        openDrawer: handleNodeClick,
        closeDrawer,
        appendMetric,
        appendLog,
    } = useNodeDrawer();

    const {
        dashModal, setDashModal,
        showHealthDetail, setShowHealthDetail,
        showSystemDiag, setShowSystemDiag,
        showResourceDetail, setShowResourceDetail,
        showJobQueue, setShowJobQueue,
        showDashFilters, setShowDashFilters,
        selectedService, setSelectedService,
        selectedEvent, setSelectedEvent,
        securityProfile, setSecurityProfile,
        selectedConn, setSelectedConn,
        showSessionModal, setShowSessionModal,
        showCreateProfile, setShowCreateProfile,
        selectedProfileHistoryId, setSelectedProfileHistoryId,
        profileHistoryData, setProfileHistoryData,
        selectedAlert, setSelectedAlert,
    } = useDashboardModals();

    // ─── UI STATE (solo vive en este componente) ──────────────────
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>(() => getInitialTab(searchParams));
    const [searchText, setSearchText] = useState(searchParams.get('q') || '');
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || 'ALL',
        minLatency: Number(searchParams.get('minLat')) || 0,
        minMem: Number(searchParams.get('minMem')) || 0,
    });
    const [dashFilters, setDashFilters] = useState({
        timeRange: '1h', severity: 'ALL', owner: 'ALL', cookieStatus: 'ALL'
    });
    const [rotationInProgress, setRotationInProgress] = useState(false);
    const [selectedComputerId, setSelectedComputerId] = useState<string | null>(null);

    // Auto-detectar computer propio por IP
    useEffect(() => {
        orchestratorService.getMyComputer()
            .then(data => {
                if (data.computer_id) {
                    setSelectedComputerId(data.computer_id.toString());
                }
            })
            .catch(() => {
                const first = nodes.find(n => n.status === 'ONLINE');
                if (first) setSelectedComputerId(first.id);
            });
    }, [nodes]); // ← re-detectar cuando cambian los nodos

    const [verifyInProgress, setVerifyInProgress] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const alertsEndRef = useRef<HTMLDivElement>(null);
    const rotationLogRef = useRef<string[]>([]);
    const autoRefreshRef = useRef(autoRefresh);
    useEffect(() => { autoRefreshRef.current = autoRefresh; }, [autoRefresh]);

    // ─── ESTADO PARA MODALES CON FETCH ───────────────────────────
    const [eventPages, setEventPages] = useState<any[]>([]);
    const [eventPagesLoading, setEventPagesLoading] = useState(false);
    const [proxyLogs, setProxyLogs] = useState<any[]>([]);
    const [proxyLogsLoading, setProxyLogsLoading] = useState(false);

    // ─── DERIVED ─────────────────────────────────────────────────
    const liveSelectedNode = useMemo(
        () => nodes.find(n => n.id === selectedNode?.id) ?? selectedNode,
        [nodes, selectedNode]
    );

    const liveSelectedEvent = useMemo(
        () => selectedEvent
            ? events.find(e => e.id === selectedEvent.id) ?? selectedEvent
            : null,
        [events, selectedEvent]
    );

    const visibleContent = useMemo(() => {
        const q = searchText.toLowerCase();
        if (activeTab === 'NODES') return nodes.filter(n => n.name.toLowerCase().includes(q));
        if (activeTab === 'PROFILES') return profiles.filter(p => {
            const nm = p.name.toLowerCase().includes(q) || (p.owner ?? '').toLowerCase().includes(q);
            const om = dashFilters.owner === 'ALL' || p.owner === dashFilters.owner;
            const cm = dashFilters.cookieStatus === 'ALL' || p.cookieStatus === dashFilters.cookieStatus;
            return nm && om && cm;
        });
        if (activeTab === 'ALERTS') return alerts.filter(a => a.message.toLowerCase().includes(q));
        if (activeTab === 'CONNECTIONS') return connections.filter(c => c.url.toLowerCase().includes(q));
        return [];
    }, [activeTab, nodes, profiles, alerts, connections, searchText, dashFilters]);

    // ─── EFFECTS ─────────────────────────────────────────────────
    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        setSearchParams(prev => { prev.set('tab', activeTab); return prev; });
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'ALERTS' && alertsEndRef.current) {
            alertsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTab, alerts]);

    useEffect(() => {
        const t = setTimeout(() => {
            setSearchParams(prev => {
                searchText ? prev.set('q', searchText) : prev.delete('q');
                filters.status !== 'ALL' ? prev.set('status', filters.status) : prev.delete('status');
                filters.minLatency > 0 ? prev.set('minLat', String(filters.minLatency)) : prev.delete('minLat');
                filters.minMem > 0 ? prev.set('minMem', String(filters.minMem)) : prev.delete('minMem');
                return prev;
            });
        }, 500);
        return () => clearTimeout(t);
    }, [searchText, filters]);

    // ─── WS CALLBACK ─────────────────────────────────────────────
    const handleWSEvent = useCallback((event: any) => {
        if (!['agent_metrics', 'pong'].includes(event.type)) {
            console.log('[WS]', event.type, JSON.stringify(event).slice(0, 120));
        }
        // Métricas del agente — UN solo bloque
        if (event.type === 'agent_metrics') {
            const cid = event.computer_id?.toString();
            const cpu = event.data?.system?.cpu_percent ?? 0;
            const ram = event.data?.system?.memory_percent ?? 0;
            const browsers = event.data?.active_browsers_count;
            if (!cid || ram === 0) return;
            updateNodeLive(cid, cpu, ram, browsers);
            appendMetric(cid, cpu, ram);
            return;
        }

        if (event.type === 'agent_log') {
            appendLog(event.computer_id?.toString(), event.log);

            // Detectar estado de AdsPower y refrescar services
            const msg = event.log?.message ?? '';
            if (msg.includes('AdsPower no está disponible')) {
                fetchData(); // ← services se actualizará con adspower DEGRADED
            } else if (msg.includes('AdsPower disponible nuevamente')) {
                fetchData(); // ← services se actualizará con adspower ONLINE
            }

            // Si es ERROR, mostrarlo también en el feed principal y alertas
            if (event.log?.level === 'ERROR' || event.log?.level === 'WARNING') {
                const rawMsg = event.log?.message ?? 'Error en agente';

                // Clasificar el error para mensaje amigable
                const friendlyMsg = rawMsg.includes('AdsPower no está disponible') || rawMsg.includes('ADSPOWER_OFFLINE')
                    ? '🔴 AdsPower no disponible — abre la aplicación en el agente'
                    : rawMsg.includes('Proxy inválido') || rawMsg.includes('PROXY_INVALID') || rawMsg.includes('Check Proxy')
                        ? '🔴 Proxy inválido o caído — ejecuta rotación de proxies'
                        : rawMsg.includes('Timeout') || rawMsg.includes('TIMEOUT')
                            ? '🟡 Timeout abriendo navegador — AdsPower tardó demasiado'
                            : rawMsg.includes('Profile does not exist') || rawMsg.includes('PROFILE_NOT_FOUND')
                                ? '🔴 Perfil no encontrado en AdsPower — puede haber sido eliminado'
                                : rawMsg;

                setEvents(prev => [{
                    id: `ws-log-${Date.now()}`,
                    type: event.log?.level === 'ERROR' ? 'ERROR' as const : 'INFO' as const,
                    message: friendlyMsg,
                    source: `Computer #${event.computer_id}`,
                    timestamp: new Date().toLocaleTimeString(),
                    meta: { raw: rawMsg }, // guardamos el original por si necesitan ver causa
                }, ...prev.slice(0, 18)]);

                if (event.log?.level === 'ERROR') {
                    setAlerts(prev => [{
                        id: Date.now(),
                        type: 'ERROR' as const,
                        message: friendlyMsg,
                        source: `agent-${event.computer_id}`,
                        read: false,
                        timestamp: new Date().toLocaleTimeString(),
                    }, ...prev]);
                    // ← AGREGAR: actualizar contador de stats
                    setStats(prev => prev ? {
                        ...prev,
                        alertsActive: (prev.alertsActive ?? 0) + 1
                    } : prev);
                }
            }
            return;
        }

        if (event.type === 'profile_created') {
            const name = event.name ?? `Perfil #${event.profile_id}`;
            setEvents(prev => [{
                id: `ws-profile-${Date.now()}`,
                type: event.adspower_id ? 'SUCCESS' as const : 'ERROR' as const,
                message: event.adspower_id
                    ? `✅ Perfil creado en AdsPower — ${name}`
                    : `❌ Error creando perfil — ${name}`,
                source: `agent-${event.computer_id ?? 1}`,
                timestamp: new Date().toLocaleTimeString(),
                meta: {},
            }, ...prev.slice(0, 18)]);
            if (autoRefreshRef.current) fetchData();
            return;
        }

        if (event.type === 'profile_ready') {
            // Actualizar adspower_id en lista local inmediatamente
            if (event.profile_id && event.adspower_id) {
                setProfiles(prev => prev.map(p =>
                    p.id === event.profile_id.toString()
                        ? { ...p, adsId: event.adspower_id }
                        : p
                ));
            }
            setEvents(prev => [{
                id: `ws-profile-ready-${Date.now()}`,
                type: 'SUCCESS' as const,
                message: `✅ Perfil listo — ${event.adspower_id}`,
                source: `agent-${event.computer_id ?? 1}`,
                timestamp: new Date().toLocaleTimeString(),
                meta: {},
            }, ...prev.slice(0, 18)]);
            if (autoRefreshRef.current) fetchData();
            return;
        }

        if (event.type === 'agent_online' || event.type === 'agent_checkin') {
            const cid = event.computer_id?.toString();
            const name = event.name ?? `Computer #${cid}`;
            if (cid) {
                markNodeOnline(cid, event.connected_since);

                setEvents(prev => [{
                    id: `ws-online-${Date.now()}`,
                    type: 'SUCCESS' as const,
                    message: `✅ Agente conectado — ${name}`,
                    source: 'agent',
                    timestamp: new Date().toLocaleTimeString(),
                    meta: {},
                }, ...prev.slice(0, 18)]);

                fetchData();
            }
            return;
        }

        if (event.type === 'agent_offline') {
            const cid = event.computer_id?.toString();
            const name = event.name ?? `Computer #${cid}`;
            if (cid) {
                markNodeOffline(cid);

                // Crear alerta visible
                setAlerts(prev => [{
                    id: Date.now(),
                    type: 'ERROR' as const,
                    message: `Agente desconectado: ${name}`,
                    source: 'agent',
                    read: false,
                    timestamp: new Date().toLocaleTimeString(),
                }, ...prev]);

                // Agregar al feed de eventos
                setEvents(prev => [{
                    id: `ws-offline-${Date.now()}`,
                    type: 'ERROR' as const,
                    message: `❌ Agente offline — ${name}`,
                    source: 'agent',
                    timestamp: new Date().toLocaleTimeString(),
                    meta: {},
                }, ...prev.slice(0, 18)]);

                // Refrescar stats para actualizar top bar
                fetchData();
            }
            return;
        }

        if (event.type === 'session_created' || event.type === 'session_active') {
            setEvents(prev => [{
                id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                type: 'SUCCESS' as const,
                message: event.message ?? `Sesión creada — ${event.profile}`,
                source: event.agent_name ?? 'Agent',
                timestamp: new Date().toLocaleTimeString(),
                meta: { session_id: event.session_id },
            }, ...prev.slice(0, 18)]);

            // Actualizar KPI optimistamente — sin esperar REST
            setStats(prev => ({
                nodesOnline: prev?.nodesOnline ?? 1,
                nodesTotal: prev?.nodesTotal ?? 1,
                profilesActive: (prev?.profilesActive ?? 0) + 1,
                browsersOpen: (prev?.browsersOpen ?? 0) + 1,
                alertsActive: prev?.alertsActive ?? 0,
                healthScore: prev?.healthScore ?? 100,
                healthRisks: prev?.healthRisks ?? [],
            }));

            // Fetch tardío para sincronizar con BD
            if (autoRefreshRef.current) setTimeout(() => fetchData(), 3000);
            return;
        }

        if (event.type === 'session_closed') {
            setEvents(prev => [{
                id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                type: 'INFO' as const,
                message: `Sesión cerrada — Perfil #${event.profile_id ?? 'None'} - ${event.duration_seconds ?? 0}s, ${(event.total_data_mb ?? 0).toFixed(1)}MB`,
                source: event.agent_name ?? 'Agent',
                timestamp: new Date().toLocaleTimeString(),
                meta: { session_id: event.session_id },
            }, ...prev.slice(0, 18)]);

            // Actualizar KPI optimistamente — sin esperar REST
            setStats(prev => ({
                nodesOnline: prev?.nodesOnline ?? 1,
                nodesTotal: prev?.nodesTotal ?? 1,
                profilesActive: Math.max(0, (prev?.profilesActive ?? 1) - 1),
                browsersOpen: Math.max(0, (prev?.browsersOpen ?? 1) - 1),
                alertsActive: prev?.alertsActive ?? 0,
                healthScore: prev?.healthScore ?? 100,
                healthRisks: prev?.healthRisks ?? [],
            }));

            // Fetch tardío para sincronizar con BD
            if (autoRefreshRef.current) setTimeout(() => fetchData(), 3000);
            return;
        }

        if (event.type === 'session_crashed') {
            const reason = event.crash_reason ?? 'Error desconocido';
            const friendlyReason = reason.includes('Proxy') || reason.includes('Check Proxy')
                ? '🔴 Proxy inválido o caído'
                : reason.includes('AdsPower')
                    ? '🔴 AdsPower no disponible'
                    : reason.includes('Timeout')
                        ? '🟡 Timeout abriendo navegador'
                        : reason;

            setEvents(prev => [{
                id: `ws-crash-${Date.now()}`,
                type: 'ERROR' as const,
                message: `Sesión crasheó — ${event.profile_name ?? `Perfil #${event.profile_id}`}: ${friendlyReason}`,
                source: event.agent_name ?? 'Agent',
                timestamp: new Date().toLocaleTimeString(),
                meta: { session_id: event.session_id },
            }, ...prev.slice(0, 18)]);

            setAlerts(prev => [{
                id: Date.now(),
                type: 'ERROR' as const,
                message: `Sesión crasheó — ${friendlyReason}`,
                source: `agent-${event.computer_id}`,
                read: false,
                timestamp: new Date().toLocaleTimeString(),
            }, ...prev]);

            setStats(prev => prev ? {
                ...prev,
                alertsActive: (prev.alertsActive ?? 0) + 1
            } : prev);

            if (autoRefreshRef.current) setTimeout(() => fetchData(), 2000);
            return;
        }

        if (event.type === 'system_event' && event.event === 'verify_profiles_start') {
            setEvents(prev => prev.map(e =>
                e.id === 'ws-verify-active'
                    ? { ...e, message: `🔍 Verificando ${event.stats?.total ?? ''} perfiles — en proceso...` }
                    : e
            ));
            return;
        }

        if (event.type === 'system_event' && event.event === 'verify_profiles_complete') {
            const s = event.stats;
            setEvents(prev => [
                {
                    id: 'ws-verify-complete',
                    type: s?.verified === s?.total ? 'SUCCESS' as const : 'WARNING' as const,
                    message: `✅ Verificación completada — ${s?.verified}/${s?.total} perfiles actualizados`,
                    source: 'verify_profiles',
                    timestamp: new Date().toLocaleTimeString(),
                    meta: {},
                },
                ...prev.filter(e => e.id !== 'ws-verify-active').slice(0, 17),
            ]);
            fetchData(); // ← actualizar scores en tabla de perfiles
            setVerifyInProgress(false);  // ← AGREGAR
            setActiveAction(null);
            return;
        }

        if (event.type === 'rotation_progress') {
            const s = event.stats;
            const icon = event.result === 'ok' ? '✓' : event.result === 'rotated' ? '↺' : '✗';
            rotationLogRef.current = [...rotationLogRef.current, `${icon} ${event.detail}`];

            setRotationInProgress(true); // ← asegurar que el estado es correcto

            setEvents(prev => {
                // Verificar si ya existe el evento de rotación
                const exists = prev.some(e =>
                    e.source === 'proxy_rotation' &&
                    (e.message.startsWith('Rotando') || e.message.includes('iniciada'))
                );

                const updatedEvent = {
                    id: 'ws-rotation-active',
                    type: 'INFO' as const,
                    message: `Rotando proxies — ${s.optimal}✓ ${s.rotated}↺ ${s.failed}✗ / ${s.total}`,
                    source: 'proxy_rotation',
                    timestamp: new Date().toLocaleTimeString(),
                    meta: { log: [...rotationLogRef.current] },
                };

                if (!exists) {
                    // Si no existe, crear uno nuevo al principio
                    return [updatedEvent, ...prev.slice(0, 18)];
                }

                // Si existe, actualizarlo
                return prev.map(e =>
                    e.source === 'proxy_rotation' &&
                        (e.message.startsWith('Rotando') || e.message.includes('iniciada'))
                        ? updatedEvent
                        : e
                );
            });
            return;
        }
        if (event.type === 'system_event' && event.event === 'proxy_auto_rotated') {
            setEvents(prev => [{
                id: `ws-autorotate-${Date.now()}`,
                type: 'INFO' as const,
                message: `🔄 ${event.message}`,
                source: 'auto_rotation',
                timestamp: new Date().toLocaleTimeString(),
                meta: {},
            }, ...prev.slice(0, 18)]);
            return;
        }

        if (event.type === 'system_event' && event.event === 'proxy_rotation_complete') {
            const s = event.stats;
            const capturedLog = [...rotationLogRef.current];
            rotationLogRef.current = [];

            const completionEvent = {
                id: 'ws-rotation-active',
                type: (s.failed === 0 ? 'SUCCESS' : 'ERROR') as const,
                message: `Rotación completada — ${s.optimal} óptimos · ${s.rotated} rotados · ${s.failed} fallidos`,
                source: 'proxy_rotation',
                timestamp: new Date().toLocaleTimeString(),
                meta: { log: capturedLog },
            };

            setEvents(prev => [
                completionEvent,
                ...prev.filter(e => !(
                    e.source === 'proxy_rotation' &&
                    (e.message.includes('iniciada') || e.message.startsWith('Rotando'))
                )).slice(0, 17),
            ]);
            setSelectedEvent(prev =>
                prev?.id === 'ws-rotation-active' ? completionEvent : prev
            );
            setRotationInProgress(false);
            setActiveAction(null);  // ← AGREGAR
            if (autoRefreshRef.current) debouncedFetch();
            return;
        }

    }, [debouncedFetch, fetchData, setStats, updateNodeLive, appendMetric, appendLog,
        markNodeOnline, markNodeOffline, setAlerts, setEvents, setProfiles, setSelectedEvent]);

    useAdminWS(handleWSEvent, autoRefresh);

    // ─── HANDLERS ────────────────────────────────────────────────
    const handleEventClick = useCallback(async (ev: SystemEvent) => {
        setSelectedEvent(ev);
        const sid = (ev as any).meta?.session_id;
        if (!sid) return;
        setEventPagesLoading(true);
        try {
            const r = await fetch(`/api/v1/admin/sessions/${sid}/events`);
            const d = await r.json();
            setEventPages(d.events ?? []);
        } catch {
            setEventPages([]);
        } finally {
            setEventPagesLoading(false);
        }
    }, [setSelectedEvent]);

    const handleEventClose = useCallback(() => {
        setSelectedEvent(null);
        setEventPages([]);
    }, [setSelectedEvent]);

    const handleConnHistory = useCallback(async (conn: ConnectionItem) => {
        setSelectedConn(conn);
        setProxyLogsLoading(true);
        try {
            const r = await fetch(`/api/v1/proxy-rotation/${conn.id}/history`);
            const d = await r.json();
            setProxyLogs(d.items ?? []);
        } catch {
            setProxyLogs([]);
        } finally {
            setProxyLogsLoading(false);
        }
    }, [setSelectedConn]);

    const handleStartSessions = async (selectedIds: string[]) => {
        const computer = nodes.find(n => n.id === selectedComputerId && n.status === 'ONLINE')
            ?? nodes.find(n => n.status === 'ONLINE');
        if (!computer) { alert('No hay agentes online'); return; }
        const results = await Promise.allSettled(
            selectedIds.map(id => {
                const p = profiles.find(prof => prof.id === id);
                if (!p) return Promise.reject(new Error('Perfil no encontrado'));
                if (p.adsId?.startsWith('pending')) {
                    return Promise.reject(new Error(`Perfil "${p.name}" aún no está listo en AdsPower`));
                }
                return orchestratorService.openBrowser({
                    profileAdsId: p.adsId,
                    computerId: parseInt(computer.id),
                    targetUrl: 'https://www.google.com',
                    agentName: 'admin-panel',
                });
            })
        );
        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                const p = profiles.find(prof => prof.id === selectedIds[i]);
                if (p?.adsId?.startsWith('pending')) {
                    setAlerts(prev => [{
                        id: Date.now(),
                        type: 'ERROR' as const,
                        message: `⚠️ Perfil "${p.name}" aún no está listo en AdsPower — espera que el agente lo procese`,
                        source: 'agent',
                        read: false,
                        timestamp: new Date().toLocaleTimeString(),
                    }, ...prev]);
                }
            }
        });
        const ok = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

        if (failed.length > 0) {
            const reasons = failed.map(f => f.reason?.message ?? 'Error desconocido').join('\n');
            alert(`❌ ${failed.length} sesión(es) fallaron:\n${reasons}`);
        }
        if (ok > 0) {
            alert(`⏳ ${ok} sesión(es) enviadas al agente — revisa la línea de tiempo.`);
        }
        setShowSessionModal(false);
        fetchData();
    };

    const handleVerifyProfile = async (profileId: string) => {
        try {
            const r = await orchestratorService.verifyProfileSecurity(profileId);
            setProfiles(prev => prev.map(p => p.id === profileId
                ? { ...p, browserScore: r.browser_score, fingerprintScore: r.fingerprint_score, cookieStatus: r.cookie_status }
                : p
            ));
            alert(`Verificado ✓  Browser: ${r.browser_score}%  |  Cookies: ${r.cookie_status}`);
            setSecurityProfile(null);
        } catch {
            alert('Error al verificar perfil.');
        }
    };

    const handleViewProfileHistory = async (profileId: string) => {
        try {
            const data = await orchestratorService.getProfileHistory(profileId);
            setProfileHistoryData(data.items.map((s: any) => ({
                id: s.id.toString(),
                type: s.status === 'closed' ? 'SUCCESS' : s.status === 'crashed' ? 'ERROR' : 'INFO',
                message: `${s.agent_name} — ${s.target_url ?? 'N/A'} (${s.duration_seconds ?? 0}s, ${(s.total_data_mb ?? 0).toFixed(1)} MB)`,
                source: `Computer #${s.computer_id}`,
                timestamp: s.requested_at,
            })));
            setSelectedProfileHistoryId(profileId);
        } catch {
            alert('No se pudo cargar el historial.');
        }
    };

    const handleAlertAck = async (id: number) => {
        await orchestratorService.ackAlert(id);
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    };

    const handleAlertSilence = async (id: number) => {
        await orchestratorService.silenceAlert(id, 30);
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
        alert('Alerta silenciada 30m');
    };

    const handleTriggerBackup = async () => {
        try { await orchestratorService.triggerBackup(); alert('Backup encolado'); }
        catch { alert('Error backup'); }
    };

    const handleRotateProxies = async () => {
        if (!window.confirm('¿Rotar proxies lentos?')) return;
        try {
            setRotationInProgress(true);
            rotationLogRef.current = [];
            setEvents(prev => [{
                id: 'ws-rotation-active',
                type: 'INFO' as const,
                message: 'Rotación de proxies iniciada...',
                source: 'proxy_rotation',
                timestamp: new Date().toLocaleTimeString(),
                meta: {},
            }, ...prev.slice(0, 18)]);
            await orchestratorService.rotateAllProxies(selectedComputerId ?? undefined);
        } catch {
            setRotationInProgress(false);
            alert('Error proxies');
        }
    };

    // ─── RENDER ──────────────────────────────────────────────────
    return (
        <div className="w-full h-full bg-[#020202] text-[#f0f0f0] flex overflow-hidden font-sans selection:bg-[#00ff88]/30">

            <aside className="w-20 bg-[#050505] border-r border-white/5 flex flex-col items-center py-6 gap-8 shrink-0 z-50 shadow-[4px_0_20px_rgba(0,0,0,0.5)]">
                <div onClick={() => navigate('/ops/operator')} className="size-12 bg-white/5 text-[#666] hover:bg-white/10 hover:text-white rounded-2xl flex items-center justify-center cursor-pointer transition-colors">
                    <TerminalIcon size={24} />
                </div>
                <nav className="flex flex-col gap-6 w-full px-2">
                    <SidebarItem label="Dash" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<LayoutDashboard size={22} />} />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <SidebarItem label="Nodes" active={activeTab === 'NODES'} onClick={() => setActiveTab('NODES')} icon={<Monitor size={22} />} />
                    <SidebarItem label="Net" active={activeTab === 'CONNECTIONS'} onClick={() => setActiveTab('CONNECTIONS')} icon={<Globe size={22} />} />
                    <SidebarItem label="Alerts" active={activeTab === 'ALERTS'} onClick={() => setActiveTab('ALERTS')} icon={<Bell size={22} />} />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <SidebarItem label="Profs" active={activeTab === 'PROFILES'} onClick={() => setActiveTab('PROFILES')} icon={<Users size={22} />} />
                </nav>
                <div className="mt-auto">
                    <button
                        onClick={() => setActiveTab('SETTINGS')}
                        className={`size-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'SETTINGS' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'text-[#444] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00ff8805] via-[#020202] to-[#020202]">

                <header className="px-8 py-5 flex justify-between items-center z-40 bg-gradient-to-b from-[#020202] to-transparent">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 italic">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-[#00b560]">WB</span>
                                <span className="text-white">ORCHESTRATOR</span>
                            </h1>
                            <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.3em] ml-1">Infraestructura & Agentes</p>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">
                            <ServiceStatusBar services={services} onServiceClick={setSelectedService} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group hidden md:block">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] group-focus-within:text-[#00ff88] transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar nodo / perfil / error..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                className="bg-[#0a0a0a] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-white placeholder:text-[#333] focus:border-[#00ff88]/30 focus:outline-none w-64 transition-all focus:w-80"
                            />
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={refreshing}
                            className={`p-3 rounded-xl border border-white/5 bg-white/5 text-[#888] hover:text-white hover:bg-white/10 transition-all ${refreshing ? 'animate-spin cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={() => navigate('/ops/operator')} className="flex items-center gap-2 px-6 py-3 bg-[#0a0a0a] border border-white/10 text-white text-[11px] font-black uppercase rounded-xl hover:bg-white/5 transition-all">
                            <ExternalLink size={16} /> Ir a Operador
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2 pb-40 scroll-smooth">
                    <div className="max-w-[1600px] mx-auto space-y-12 pb-20">

                        {activeTab === 'DASHBOARD' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-xl font-black text-white italic tracking-tight">Panel de Control</h2>
                                        <p className="text-xs text-[#666]">Vista general del estado de la infraestructura.</p>
                                    </div>
                                    <button onClick={() => setShowDashFilters(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-lg text-xs font-bold text-[#ccc] hover:text-white hover:bg-white/10 transition-colors">
                                        <Filter size={14} /> Filtros
                                        {dashFilters.severity !== 'ALL' && <span className="size-1.5 rounded-full bg-[#00ff88]" />}
                                    </button>
                                </div>

                                <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    <div className="lg:col-span-2">                                    <GlobalStatusHero
                                        status={(stats?.healthScore || 0) > 80 ? 'OK' : 'DEGRADED'}
                                        lastUpdate="2s"
                                        autoRefresh={autoRefresh}
                                        onToggleAuto={() => setAutoRefresh(v => !v)}
                                        onClick={() => setShowSystemDiag(true)}
                                        verdict={computeVerdict(stats?.healthScore ?? 0, stats?.healthRisks ?? [], services)}
                                    />
                                    </div>
                                    <div className="lg:col-span-1 h-full">
                                        <MiniCapacityPanel
                                            cpu={Math.round(nodes.reduce((a, b) => a + b.cpu, 0) / (nodes.length || 1))}
                                            ram={Math.round(nodes.reduce((a, b) => a + b.ram, 0) / (nodes.length || 1))}
                                            net={45}
                                            onClick={() => setShowResourceDetail(true)}
                                        />
                                    </div>
                                    <div className="lg:col-span-1 h-full">
                                        <JobsQueueWidget
                                            queue={stats?.pendingProfiles ?? 0}
                                            running={(stats?.browsersOpen ?? 0) + (rotationInProgress ? 1 : 0)}
                                            failed={alerts.filter(a => !a.read && a.source !== 'proxy_rotation').length}
                                            onClick={() => setShowJobQueue(true)}
                                        />
                                    </div>
                                </section>

                                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <AdminKPICard label="Computadoras Online" value={stats ? `${stats.nodesOnline}/${stats.nodesTotal}` : '-/-'} icon={<Server size={20} />} active loading={loading} trend="+2 vs 1h" tooltip="Nodos conectados" onClick={() => setDashModal({ type: 'NODES', data: nodes })} />
                                    <AdminKPICard label="Perfiles Activos" value={stats ? stats.profilesActive.toString() : '-'} icon={<Users size={20} />} loading={loading} trend="Stable" tooltip="Sesiones activas" onClick={() => setDashModal({ type: 'PROFILES', data: profiles.filter(p => p.status !== 'IDLE') })} />
                                    <AdminKPICard label="Navegadores Abiertos" value={stats ? stats.browsersOpen.toString() : '-'} icon={<CheckCircle2 size={20} />} loading={loading} tooltip="Instancias Chrome" onClick={() => setDashModal({ type: 'BROWSERS', data: nodes.map(n => ({ name: n.name, openBrowsers: n.openBrowsers })) })} />
                                    <AdminKPICard label="Alertas Activas" value={stats ? stats.alertsActive.toString() : '-'} icon={<AlertTriangle size={20} />} loading={loading} alert={(stats?.alertsActive || 0) > 0} trend={stats?.alertsActive ? '+1 Reciente' : '0'} tooltip="Alertas" onClick={() => setDashModal({ type: 'ALERTS', data: alerts.filter(a => !a.read) })} />
                                </section>

                                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                                    <div className="lg:col-span-1">
                                        <HealthOverview
                                            score={stats?.healthScore || 0}
                                            risks={stats?.healthRisks || []}
                                            healthDetails={stats?.healthDetails}
                                            onDetails={() => setShowHealthDetail(true)}
                                        />
                                    </div>
                                    <div className="lg:col-span-2 overflow-hidden">
                                        <SystemEventsFeed events={events} onEventClick={handleEventClick} />
                                    </div>
                                </section>

                                <section className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <TerminalIcon size={12} className="text-[#00ff88]" /> Panel de Agente
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className={`size-2 rounded-full ${selectedComputerId && nodes.find(n => n.id === selectedComputerId)?.status === 'ONLINE'
                                                ? 'bg-[#00ff88] animate-pulse'
                                                : selectedComputerId
                                                    ? 'bg-red-500'
                                                    : 'bg-amber-500 animate-pulse'
                                                }`} />
                                            <span className="text-[9px] text-[#555] font-mono">
                                                {(() => {
                                                    const node = nodes.find(n => n.id === selectedComputerId);
                                                    if (!node) return 'Detectando...';
                                                    if (node.status === 'ONLINE') return node.name;
                                                    return `${node.name} — offline`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {([
                                            {
                                                id: 'session',
                                                label: 'Iniciar Sesión',
                                                desc: activeAction === 'session' ? 'Enviando...' : 'Seleccionar y abrir perfiles',
                                                icon: <Monitor size={24} />,
                                                color: '#00ff88',
                                                fn: () => setShowSessionModal(true)
                                            },
                                            {
                                                id: 'profile',
                                                label: 'Nuevo Perfil',
                                                desc: 'Crear navegador y credenciales',
                                                icon: <Plus size={24} />,
                                                color: '#ffffff',
                                                fn: () => setShowCreateProfile(true)
                                            },
                                            {
                                                id: 'rotation',
                                                label: 'Monitor de Red',
                                                desc: rotationInProgress ? '⏳ Rotando proxies...' : 'Rotar proxies lentos ahora',
                                                icon: <RefreshCw size={24} className={rotationInProgress ? 'animate-spin' : ''} />,
                                                color: rotationInProgress ? '#666' : '#3b82f6',
                                                fn: rotationInProgress ? () => { } : handleRotateProxies
                                            },
                                            {
                                                id: 'logs',
                                                label: 'Logs de Sistema',
                                                desc: 'Ver alertas y eventos',
                                                icon: <History size={24} />,
                                                color: '#f59e0b',
                                                fn: () => setActiveTab('ALERTS')
                                            },
                                            {
                                                id: 'verify',
                                                label: 'Verificar Perfiles',
                                                desc: verifyInProgress ? '⏳ Verificando...' : 'Actualizar scores y cookies',
                                                icon: <Shield size={24} className={verifyInProgress ? 'animate-pulse' : ''} />,
                                                color: verifyInProgress ? '#666' : '#00ff88',
                                                fn: verifyInProgress ? () => { } : async () => {
                                                    setVerifyInProgress(true);
                                                    setActiveAction('verify');
                                                    setEvents(prev => [{
                                                        id: 'ws-verify-active',
                                                        type: 'INFO' as const,
                                                        message: '🔍 Verificando perfiles — en proceso...',
                                                        source: 'verify_profiles',
                                                        timestamp: new Date().toLocaleTimeString(),
                                                        meta: {},
                                                    }, ...prev.slice(0, 18)]);
                                                    await orchestratorService.verifyAllProfiles(selectedComputerId ?? undefined);
                                                }
                                            },
                                        ] as const).map(({ id, label, desc, icon, color, fn }) => (<div key={label} onClick={fn} className={`group cursor-pointer bg-[#0a0a0a] border border-white/5 hover:border-white/20 p-4 rounded-xl transition-all relative overflow-hidden ${(id === 'rotation' && rotationInProgress) || (id === 'verify' && verifyInProgress) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                            <div className="absolute inset-0 bg-white/[0.03] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div className="p-3 rounded-lg" style={{ background: `${color}18`, color }}>{icon}</div>
                                                <div>
                                                    <h4 className="font-black text-white uppercase text-sm">{label}</h4>
                                                    <p className="text-[10px] text-[#666] mt-1">{desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab !== 'DASHBOARD' && activeTab !== 'SETTINGS' && (
                            <section className="space-y-6 animate-in slide-in-from-bottom-4">
                                <div className="sticky top-0 z-30 flex items-center gap-4 p-2 pl-4 bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl">
                                    <h3 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        {activeTab === 'NODES' && <Monitor size={14} className="text-[#00ff88]" />}
                                        {activeTab === 'CONNECTIONS' && <Globe size={14} className="text-[#00ff88]" />}
                                        {activeTab === 'ALERTS' && <Bell size={14} className="text-[#00ff88]" />}
                                        {activeTab === 'PROFILES' && <Users size={14} className="text-[#00ff88]" />}
                                        {activeTab} VIEW
                                    </h3>
                                    <div className="h-4 w-px bg-white/10" />
                                    <div className="flex gap-1">
                                        <FilterButton label="Computadoras" active={activeTab === 'NODES'} onClick={() => setActiveTab('NODES')} />
                                        <FilterButton label="Conexiones" active={activeTab === 'CONNECTIONS'} onClick={() => setActiveTab('CONNECTIONS')} />
                                        <FilterButton label="Alertas" active={activeTab === 'ALERTS'} onClick={() => setActiveTab('ALERTS')} dotColor={(stats?.alertsActive || 0) > 0 ? 'bg-red-500' : ''} />
                                    </div>
                                    <div className="relative group">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] group-focus-within:text-[#00ff88] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Buscar item..."
                                            value={searchText}
                                            onChange={e => setSearchText(e.target.value)}
                                            className="bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white placeholder:text-[#333] focus:border-[#00ff88]/30 focus:outline-none w-48 transition-all focus:w-64"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 min-h-[400px]">
                                    {loading ? (
                                        <><SkeletonRow /><SkeletonRow /></>
                                    ) : (
                                        <>
                                            {activeTab === 'NODES' && visibleContent.map((n: any) => (
                                                <ComputerRow key={n.id} node={n} onClick={() => handleNodeClick(n)} />
                                            ))}

                                            {activeTab === 'CONNECTIONS' && visibleContent.map((c: any) => (
                                                <ConnectionRow
                                                    key={c.id}
                                                    conn={c}
                                                    linkedProfiles={profiles.filter(p => (p as any).proxyId === Number(c.id))}
                                                    onHistory={() => handleConnHistory(c)}
                                                />
                                            ))}

                                            {activeTab === 'PROFILES' && (
                                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                                                    <div className="grid grid-cols-12 gap-4 p-3 border-b border-white/5 text-[9px] font-black text-[#666] uppercase tracking-wider pl-4">
                                                        <div className="col-span-3">Perfil</div>
                                                        <div className="col-span-2 hidden md:block">Proxy</div>
                                                        <div className="col-span-2 hidden md:block">Cookies</div>
                                                        <div className="col-span-2">Score</div>
                                                        <div className="col-span-2 hidden md:block">Última Acción</div>
                                                        <div className="col-span-1 text-right pr-2">Acc.</div>
                                                    </div>
                                                    {(visibleContent as ProfileItem[]).map(p => (
                                                        <ProfileRow
                                                            key={p.id}
                                                            profile={p}
                                                            connections={connections}
                                                            onHistory={() => handleViewProfileHistory(p.id)}
                                                            onSecurity={() => setSecurityProfile(p)}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {activeTab === 'ALERTS' && [...visibleContent].reverse().map((a: any) => (
                                                <AlertItem
                                                    key={a.id}
                                                    alert={a}
                                                    onRead={() => setSelectedAlert(a)}
                                                    onAction={(action: string) => {
                                                        if (action === 'SILENCE') handleAlertSilence(a.id);
                                                        if (action === 'RETRY') fetchData();
                                                        if (action === 'VIEW_CAUSE') setSelectedAlert(a);
                                                    }}
                                                />
                                            ))}
                                            {activeTab === 'ALERTS' && <div ref={alertsEndRef} className="h-1" />}

                                            {visibleContent.length === 0 && (
                                                <div className="p-12 text-center border border-dashed border-white/5 rounded-2xl">
                                                    <p className="text-[#444] text-xs font-bold uppercase">No data found</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === 'SETTINGS' && (
                            <div className="animate-in fade-in">
                                <SettingsPanel backupStatus={backupStatus} onTriggerBackup={handleTriggerBackup} />
                            </div>
                        )}
                    </div>
                </main>

                {/* ─── MODALES Y DRAWERS ─────────────────────────── */}
                <EventDetailModal
                    event={liveSelectedEvent}
                    pages={eventPages}
                    loadingPages={eventPagesLoading}
                    onClose={handleEventClose}
                />
                <SystemDiagnosticModal
                    isOpen={showSystemDiag}
                    onClose={() => setShowSystemDiag(false)}
                    services={services}
                    healthDetails={stats?.healthDetails}
                />
                <ResourceDetailModal isOpen={showResourceDetail} onClose={() => setShowResourceDetail(false)} />
                <JobQueueModal
                    isOpen={showJobQueue}
                    onClose={() => setShowJobQueue(false)}
                    queue={stats?.pendingProfiles ?? 0}
                    running={(stats?.browsersOpen ?? 0) + (rotationInProgress ? 1 : 0)}
                    failed={alerts.filter(a => !a.read && a.source !== 'proxy_rotation').length}
                    pendingProfiles={profiles.filter(p => (p as any).status === 'IDLE' && p.adsId?.startsWith('pending'))}
                />
                <NodeItemDrawer
                    node={liveSelectedNode}
                    history={nodeHistory}
                    logs={nodeLogs}
                    onClose={closeDrawer}
                />
                <AlertModal
                    alert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                    onAck={handleAlertAck}
                />
                <DashFiltersDrawer
                    isOpen={showDashFilters}
                    onClose={() => setShowDashFilters(false)}
                    filters={dashFilters}
                    setFilters={setDashFilters}
                    onReset={() => setDashFilters({ timeRange: '1h', severity: 'ALL', owner: 'ALL', cookieStatus: 'ALL' })}
                />
                <DashKPIModal
                    type={dashModal.type}
                    data={dashModal.data}
                    onClose={() => setDashModal({ type: null, data: null })}
                />
                <HealthDetailModal
                    isOpen={showHealthDetail}
                    score={stats?.healthScore || 0}
                    onClose={() => setShowHealthDetail(false)}
                />
                <ServiceDetailModal
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
                />
                <SecurityCheckModal
                    profile={securityProfile}
                    onClose={() => setSecurityProfile(null)}
                    onVerify={handleVerifyProfile}
                />
                <SessionStartModal
                    isOpen={showSessionModal}
                    onClose={() => setShowSessionModal(false)}
                    profiles={profiles}
                    onStart={handleStartSessions}
                />
                <SessionHistoryModal
                    isOpen={selectedProfileHistoryId !== null}
                    events={profileHistoryData}
                    profileId={selectedProfileHistoryId}
                    onClose={() => { setSelectedProfileHistoryId(null); setProfileHistoryData([]); }}
                />
                <CreateProfileModal
                    isOpen={showCreateProfile}
                    onClose={() => setShowCreateProfile(false)}
                    onCreate={async (data: any) => {
                        try {
                            await orchestratorService.createProfile(data);
                            const agentOnline = nodes.some(n => n.status === 'ONLINE');
                            alert(agentOnline
                                ? `✅ Perfil "${data.name}" creado y enviado al agente.`
                                : `⏳ Perfil "${data.name}" en cola — se creará cuando el agente se conecte.`
                            );
                            setShowCreateProfile(false);
                            fetchData();
                        } catch {
                            alert('Error al crear el perfil.');
                        }
                    }}
                />
                <ProxyHistoryModal
                    conn={selectedConn}
                    logs={proxyLogs}
                    loading={proxyLogsLoading}
                    onClose={() => { setSelectedConn(null); setProxyLogs([]); }}
                />
            </div>
        </div>
    );
};

export default OrchestratorTerminal;