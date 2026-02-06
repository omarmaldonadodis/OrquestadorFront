
import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Server, Users, Bell, Search, Filter,
    CheckCircle2, AlertTriangle, Monitor, X, History,
    Menu, ChevronRight, ArrowUpDown, Terminal as TerminalIcon,
    Settings, Radio, Calendar, Plus, ExternalLink, RefreshCw,
    Activity, HardDrive, Cpu, Globe, Target
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orchestratorService } from '@/services/orchestrator.service';
import { ComputerNode, ProfileItem, Alert, KPIStats, Job, SystemEvent, ServiceStatus, ConnectionItem } from '@/types/orchestratorTypes';
import { AdminKPICard, ComputerRow, AlertItem, SkeletonKPI, SkeletonRow, HealthOverview, SystemEventsFeed, ServiceStatusBar, JobRow, SettingsPanel, ConnectionRow, AgentActionButton, FilterButton, ProfileRow, GlobalStatusHero, MiniCapacityPanel, JobsQueueWidget } from '@/components/OrchestratorComponents';
import { NodeItemDrawer, AlertModal, SessionHistoryModal, JobDrawer, DashKPIModal, DashFiltersDrawer, HealthDetailModal, ServiceDetailModal, SecurityCheckModal, SessionStartModal, CreateProfileModal, EventDetailModal, SystemDiagnosticModal, ResourceDetailModal, JobQueueModal } from '@/components/OrchestratorDrawers';
// --- SUB-COMPONENT: SIDEBAR (Shared with Operator but active item changes) ---
const SidebarItem = ({ label, active, onClick, icon }: any) => (
    <button onClick={onClick} className={`w-full aspect-square rounded-2xl flex flex-col gap-1 items-center justify-center transition-all group relative ${active ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.1)]' : 'text-[#444] hover:text-white hover:bg-white/5'}`}>
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00ff88] rounded-r-full shadow-[0_0_10px_rgba(0,255,136,0.5)]" />}
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
);

// --- MAIN SCREEN ---
const OrchestratorTerminal: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // STATE
    const [stats, setStats] = useState<KPIStats | null>(null);
    const [nodes, setNodes] = useState<ComputerNode[]>([]);
    const [profiles, setProfiles] = useState<ProfileItem[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [events, setEvents] = useState<SystemEvent[]>([]);
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [connections, setConnections] = useState<ConnectionItem[]>([]);

    // DRAWER STATE
    const [selectedNode, setSelectedNode] = useState<ComputerNode | null>(null);
    const [nodeHistory, setNodeHistory] = useState<{ time: string, cpu: number, ram: number }[]>([]);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [backupStatus, setBackupStatus] = useState<import('../types/orchestratorTypes').BackupStatus | undefined>(undefined);
    const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null);
    const [securityProfile, setSecurityProfile] = useState<ProfileItem | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);

    // DASHBOARD SPECIFIC STATE
    const [dashFilters, setDashFilters] = useState({ timeRange: '1h', severity: 'ALL', owner: 'ALL', cookieStatus: 'ALL' });
    const [showDashFilters, setShowDashFilters] = useState(false);
    const [dashModal, setDashModal] = useState<{ type: string | null, data: any }>({ type: null, data: null });
    const [showHealthDetail, setShowHealthDetail] = useState(false);
    const [showSystemDiag, setShowSystemDiag] = useState(false);
    const [showResourceDetail, setShowResourceDetail] = useState(false);
    const [showJobQueue, setShowJobQueue] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // URL PERSISTENCE HELPER
    const getInitialTab = () => {
        const tab = searchParams.get('tab');
        return (tab === 'NODES' || tab === 'PROFILES' || tab === 'ALERTS' || tab === 'CONNECTIONS' || tab === 'JOBS' || tab === 'SETTINGS') ? tab : 'DASHBOARD';
    };

    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'NODES' | 'PROFILES' | 'ALERTS' | 'CONNECTIONS' | 'JOBS' | 'SETTINGS'>(getInitialTab());
    const [searchText, setSearchText] = useState(searchParams.get('q') || '');

    const getInitialFilters = () => ({
        status: searchParams.get('status') || 'ALL',
        minLatency: Number(searchParams.get('minLat')) || 0,
        minMem: Number(searchParams.get('minMem')) || 0,
    });

    const [filters, setFilters] = useState(getInitialFilters());

    // PERSIST FILTERS
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (currentTab !== activeTab) {
            setSearchParams(prev => {
                prev.set('tab', activeTab);
                return prev;
            });
        }
    }, [activeTab]);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            setSearchParams(prev => {
                if (searchText) prev.set('q', searchText);
                else prev.delete('q');

                if (filters.status !== 'ALL') prev.set('status', filters.status);
                else prev.delete('status');

                if (filters.minLatency > 0) prev.set('minLat', filters.minLatency.toString());
                else prev.delete('minLat');

                if (filters.minMem > 0) prev.set('minMem', filters.minMem.toString());
                else prev.delete('minMem');

                return prev;
            });
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [searchText, filters]);

    // INITIAL DATA FETCH
    const fetchData = async () => {
        setRefreshing(true);
        try {
            const [s, n, p, a, j, e, svc, c, b] = await Promise.all([
                orchestratorService.getDashboardStats(),
                orchestratorService.getNodes(),
                orchestratorService.getProfiles(),
                orchestratorService.getAlerts(),
                orchestratorService.getJobs(),
                orchestratorService.getSystemEvents(),
                orchestratorService.getServicesStatus(),
                orchestratorService.getConnections(),
                orchestratorService.getBackups()
            ]);
            setStats(s);
            setNodes(n);
            setProfiles(p);
            setAlerts(a);
            setJobs(j);
            setEvents(e);
            setServices(svc);
            setConnections(c);
            setBackupStatus(b);
        } catch (e) {
            console.error("Failed to fetch orchestrator data", e);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            if (autoRefresh) fetchData();
        }, 8000); // Polling every 8s as per "hace 8s" hint
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // DRAWER LOGIC
    const handleNodeClick = async (node: ComputerNode) => {
        setSelectedNode(node);
        const history = await orchestratorService.getNodeHistory(node.id);
        setNodeHistory(history);
    };

    const handleAlertAck = async (id: number) => {
        await orchestratorService.ackAlert(id);
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    };

    const handleAgentAction = async (action: 'OPEN' | 'CLOSE' | 'ROTATE') => {
        const confirmMsg = action === 'OPEN' ? 'Open Chrome on all standby nodes?' : action === 'CLOSE' ? 'Force close all browsers?' : 'Rotate IP proxies?';
        if (!window.confirm(confirmMsg)) return;

        try {
            // In a real scenario, this would select specific profiles. For specific dashboard buttons, we might target updated "active" profiles.
            const result = await orchestratorService.executeAgentAction(action, { profileId: 'ALL', nodeId: 'ALL' });
            if (result.success) {
                alert(`SUCCESS: ${result.message}`);
                // Refresh data to reflect changes
                fetchData();
            }
        } catch (error) {
            alert('ERROR: Failed to execute action.');
        }
    };

    // FILTER LOGIC
    const visibleContent = useMemo(() => {
        if (activeTab === 'NODES') return nodes.filter(n => n.name.toLowerCase().includes(searchText.toLowerCase()));
        if (activeTab === 'PROFILES') {
            return profiles.filter(p => {
                const nameMatch = p.name.toLowerCase().includes(searchText.toLowerCase());
                const ownerMatch = dashFilters.owner === 'ALL' || p.owner === dashFilters.owner;
                const cookieMatch = dashFilters.cookieStatus === 'ALL' || (dashFilters.cookieStatus === 'OK' && p.cookieStatus === 'OK') || (dashFilters.cookieStatus === 'EXPIRED' && p.cookieStatus === 'EXPIRED') || (dashFilters.cookieStatus === 'MISSING' && p.cookieStatus === 'MISSING');
                return nameMatch && ownerMatch && cookieMatch;
            });
        }
        if (activeTab === 'ALERTS') return alerts.filter(a => a.message.toLowerCase().includes(searchText.toLowerCase()));
        if (activeTab === 'JOBS') {
            return jobs.filter(j => {
                const nameMatch = j.name.toLowerCase().includes(searchText.toLowerCase());
                const statusMatch = filters.status === 'ALL' || j.status === filters.status;
                return nameMatch && statusMatch;
            });
        }
        if (activeTab === 'CONNECTIONS') return connections.filter(c => c.url.toLowerCase().includes(searchText.toLowerCase()));
        return [];
    }, [activeTab, nodes, profiles, alerts, jobs, connections, searchText]);

    return (
        <div className="w-full h-full bg-[#020202] text-[#f0f0f0] flex overflow-hidden font-sans selection:bg-[#00ff88]/30">
            {/* SIDEBAR NAVIGATION */}
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
                    <SidebarItem label="Jobs" active={activeTab === 'JOBS'} onClick={() => setActiveTab('JOBS')} icon={<Cpu size={22} />} />
                </nav>
                <div className="mt-auto flex flex-col gap-4">
                    <button onClick={() => setActiveTab('SETTINGS')} className={`size-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'SETTINGS' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'text-[#444] hover:text-white hover:bg-white/5'}`}>
                        <Settings size={20} />
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00ff8805] via-[#020202] to-[#020202]">

                {/* HEADER */}
                <header className="px-8 py-5 flex justify-between items-center z-40 bg-gradient-to-b from-[#020202] to-transparent">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 italic">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-[#00b560]">WB</span>
                                <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">ORCHESTRATOR</span>
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

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2 pb-40 scroll-smooth">
                    <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-20">

                        {/* DASHBOARD VIEW */}
                        {activeTab === 'DASHBOARD' && (
                            <div className="space-y-8 animate-in fade-in">
                                {/* DASH HEADER WITH FILTERS */}
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-xl font-black text-white italic tracking-tight">Panel de Control</h2>
                                        <p className="text-xs text-[#666]">Vista general del estado de la infraestructura.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDashFilters(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-lg text-xs font-bold text-[#ccc] hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <Filter size={14} /> Filtros {dashFilters.severity !== 'ALL' && <span className="size-1.5 rounded-full bg-[#00ff88]" />}
                                    </button>
                                </div>

                                {/* HERO & WIDGETS SECTION */}
                                <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    <div className="lg:col-span-2">
                                        <GlobalStatusHero
                                            status={(stats?.healthScore || 0) > 80 ? 'OK' : 'DEGRADED'}
                                            lastUpdate="2s"
                                            autoRefresh={autoRefresh}
                                            onToggleAuto={() => setAutoRefresh(!autoRefresh)}
                                            onClick={() => setShowSystemDiag(true)}
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
                                            queue={jobs.filter(j => j.status === 'WAITING').length}
                                            running={jobs.filter(j => j.status === 'RUNNING').length}
                                            failed={jobs.filter(j => j.status === 'FAILED').length}
                                            onClick={() => setShowJobQueue(true)}
                                        />
                                    </div>
                                </section>

                                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <AdminKPICard
                                        label="Computadoras Online"
                                        value={stats ? `${stats.nodesOnline}/${stats.nodesTotal}` : '-/-'}
                                        icon={<Server size={20} />}
                                        active
                                        loading={loading}
                                        trend="+2 vs 1h"
                                        tooltip="Nodos conectados y respondiendo"
                                        onClick={() => setDashModal({ type: 'NODES', data: nodes })}
                                    />
                                    <AdminKPICard
                                        label="Perfiles Activos"
                                        value={stats ? stats.profilesActive.toString() : '-'}
                                        icon={<Users size={20} />}
                                        loading={loading}
                                        trend="Stable"
                                        tooltip="Sesiones de usuario actualmente activas"
                                        onClick={() => setDashModal({ type: 'PROFILES', data: profiles.filter(p => p.status !== 'IDLE') })}
                                    />
                                    <AdminKPICard
                                        label="Navegadores Abiertos"
                                        value={stats ? stats.browsersOpen.toString() : '-'}
                                        icon={<CheckCircle2 size={20} />}
                                        loading={loading}
                                        tooltip="Instancias de Chrome ejecutándose"
                                        onClick={() => setDashModal({ type: 'BROWSERS', data: nodes.map(n => ({ name: n.name, openBrowsers: n.openBrowsers })) })}
                                    />
                                    <AdminKPICard
                                        label="Alertas Activas"
                                        value={stats ? stats.alertsActive.toString() : '-'}
                                        icon={<AlertTriangle size={20} />}
                                        alert={(stats?.alertsActive || 0) > 0}
                                        loading={loading}
                                        trend={stats?.alertsActive ? "+1 Reciente" : "0"}
                                        tooltip="Alertas que requieren atención inmediata"
                                        onClick={() => setDashModal({ type: 'ALERTS', data: alerts.filter(a => !a.read) })}
                                    />
                                </section>
                                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                                    <div className="lg:col-span-1">
                                        <HealthOverview
                                            score={stats?.healthScore || 0}
                                            risks={stats?.healthRisks || []}
                                            onDetails={() => setShowHealthDetail(true)}
                                        />
                                    </div>
                                    <div className="lg:col-span-2">
                                        <SystemEventsFeed
                                            events={events}
                                            onEventClick={(ev) => setSelectedEvent(ev)}
                                        />
                                    </div>
                                </section>
                                <section className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <TerminalIcon size={12} className="text-[#00ff88]" /> Panel de Agente
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div onClick={() => setShowSessionModal(true)} className="group cursor-pointer bg-[#0a0a0a] border border-white/5 hover:border-[#00ff88]/50 p-4 rounded-xl transition-all relative overflow-hidden">
                                            <div className="absolute inset-0 bg-[#00ff88]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div className="bg-[#00ff88]/10 text-[#00ff88] p-3 rounded-lg group-hover:scale-110 transition-transform">
                                                    <Monitor size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white uppercase text-sm">Iniciar Sesión</h4>
                                                    <p className="text-[10px] text-[#666] mt-1">Seleccionar y abrir perfiles</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div onClick={() => setShowCreateProfileModal(true)} className="group cursor-pointer bg-[#0a0a0a] border border-white/5 hover:border-white/30 p-4 rounded-xl transition-all relative overflow-hidden">
                                            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div className="bg-white/10 text-white p-3 rounded-lg group-hover:scale-110 transition-transform">
                                                    <Plus size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white uppercase text-sm">Nuevo Perfil</h4>
                                                    <p className="text-[10px] text-[#666] mt-1">Crear navegador y credenciales</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div onClick={() => setDashModal({ type: 'NETWORK_MONITOR', data: connections })} className="group cursor-pointer bg-[#0a0a0a] border border-white/5 hover:border-blue-500/50 p-4 rounded-xl transition-all relative overflow-hidden">
                                            <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div className="bg-blue-500/10 text-blue-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                                    <RefreshCw size={24} className="animate-spin-slow" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white uppercase text-sm">Monitor de Red</h4>
                                                    <p className="text-[10px] text-[#666] mt-1">Gestión automática de IPs activa</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group cursor-pointer bg-[#0a0a0a] border border-white/5 hover:border-amber-500/50 p-4 rounded-xl transition-all relative overflow-hidden" onClick={() => alert('Mostrando logs completos...')}>
                                            <div className="absolute inset-0 bg-amber-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div className="bg-amber-500/10 text-amber-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                                    <History size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white uppercase text-sm">Logs de Sistema</h4>
                                                    <p className="text-[10px] text-[#666] mt-1">Ver registro histórico completo</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* LIST VIEWS */}
                        {activeTab !== 'DASHBOARD' && activeTab !== 'SETTINGS' && (
                            <section className="space-y-6 animate-in slide-in-from-bottom-4">
                                <div className="sticky top-0 z-30 flex items-center justify-between p-2 bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl">
                                    <div className="flex items-center gap-4 pl-4">
                                        <h3 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            {activeTab === 'NODES' && <Monitor size={14} className="text-[#00ff88]" />}
                                            {activeTab === 'CONNECTIONS' && <Globe size={14} className="text-[#00ff88]" />}
                                            {activeTab === 'ALERTS' && <Bell size={14} className="text-[#00ff88]" />}
                                            {activeTab === 'JOBS' && <Cpu size={14} className="text-[#00ff88]" />}
                                            {activeTab === 'PROFILES' && <Users size={14} className="text-[#00ff88]" />}
                                            {activeTab} VIEW
                                        </h3>
                                        <div className="h-4 w-px bg-white/10" />
                                        <div className="flex gap-1">
                                            <FilterButton label="Computadoras" active={activeTab === 'NODES'} onClick={() => setActiveTab('NODES')} />
                                            <FilterButton label="Conexiones" active={activeTab === 'CONNECTIONS'} onClick={() => setActiveTab('CONNECTIONS')} />
                                            <FilterButton label="Alertas" active={activeTab === 'ALERTS'} onClick={() => setActiveTab('ALERTS')} dotColor={(stats?.alertsActive || 0) > 0 ? 'bg-red-500' : ''} />
                                        </div>
                                        {activeTab === 'JOBS' && (
                                            <div className="flex gap-2">
                                                <select
                                                    value={filters.status}
                                                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                                    className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#00ff88]"
                                                >
                                                    <option value="ALL">All Jobs</option>
                                                    <option value="RUNNING">Running</option>
                                                    <option value="COMPLETED">Completed</option>
                                                    <option value="FAILED">Failed</option>
                                                </select>
                                            </div>
                                        )}
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
                                </div>
                                <div className="space-y-4 min-h-[400px]">
                                    {loading ? (
                                        <>
                                            <SkeletonRow />
                                            <SkeletonRow />
                                        </>
                                    ) : (
                                        <>
                                            {activeTab === 'NODES' && visibleContent.map((node: any) => (
                                                <ComputerRow key={node.id} node={node} onClick={() => handleNodeClick(node)} />
                                            ))}
                                            {activeTab === 'CONNECTIONS' && visibleContent.map((conn: any) => (
                                                <ConnectionRow key={conn.id} conn={conn} />
                                            ))}
                                            {activeTab === 'PROFILES' && (
                                                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                                                    <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 border-b border-white/5 bg-white/[0.01] text-[9px] font-black text-[#666] uppercase tracking-wider pl-4">
                                                        <div className="col-span-4 md:col-span-3">Perfil</div>
                                                        <div className="col-span-2 hidden md:block">Proxy Speed</div>
                                                        <div className="col-span-2 hidden md:block">Memoria</div>
                                                        <div className="col-span-3 md:col-span-2">Nodo</div>
                                                        <div className="col-span-3 md:col-span-2 text-right pr-4">Acciones</div>
                                                    </div>
                                                    {visibleContent.map((profile: any) => (
                                                        <ProfileRow key={profile.id} profile={profile} onHistory={() => { }} onSecurity={() => setSecurityProfile(profile)} />
                                                    ))}
                                                </div>
                                            )}
                                            {activeTab === 'ALERTS' && visibleContent.map((alert: any) => (
                                                <AlertItem
                                                    key={alert.id}
                                                    alert={alert}
                                                    onRead={() => setSelectedAlert(alert)}
                                                    onAction={(action) => {
                                                        console.log(`Alert Action: ${action} on ${alert.id}`);
                                                        if (action === 'SILENCE') alert('Alerta silenciada por 30m');
                                                        if (action === 'RETRY') alert('Reintentando operación...');
                                                        if (action === 'VIEW_CAUSE') alert(`Causa: ${alert.message} - [Details Log]`);
                                                    }}
                                                />
                                            ))}
                                            {activeTab === 'JOBS' && visibleContent.map((job: any) => (
                                                <JobRow key={job.id} job={job} onClick={() => setSelectedJob(job)} />
                                            ))}
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

                        {/* SETTINGS VIEW */}
                        {activeTab === 'SETTINGS' && (
                            <div className="animate-in fade-in">
                                <SettingsPanel
                                    backupStatus={backupStatus}
                                    onTriggerBackup={() => alert('Backup Triggered via Service!')}
                                />
                            </div>
                        )}
                    </div>
                </main>

                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />

                <SystemDiagnosticModal isOpen={showSystemDiag} onClose={() => setShowSystemDiag(false)} />
                <ResourceDetailModal isOpen={showResourceDetail} onClose={() => setShowResourceDetail(false)} />
                <JobQueueModal isOpen={showJobQueue} onClose={() => setShowJobQueue(false)} />

                {/* DRAWERS & MODALS */}
                <NodeItemDrawer
                    node={selectedNode}
                    history={nodeHistory}
                    onClose={() => setSelectedNode(null)}
                />

                <JobDrawer
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
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
                    onVerify={() => { alert('Verificación iniciada...'); setSecurityProfile(null); }}
                />

                <SessionStartModal
                    isOpen={showSessionModal}
                    onClose={() => setShowSessionModal(false)}
                    profiles={profiles}
                    onStart={(ids) => {
                        alert(`Iniciando sesión en ${ids.length} perfiles: ${ids.join(', ')}`);
                        setShowSessionModal(false);
                        // handleAgentAction('OPEN', ids) -- implementation
                    }}
                />

                <CreateProfileModal
                    isOpen={showCreateProfileModal}
                    onClose={() => setShowCreateProfileModal(false)}
                    onCreate={(data) => {
                        console.log("New Profile Data:", data);
                        alert(`Perfil ${data.name} creado correctamente.`);
                        setShowCreateProfileModal(false);
                    }}
                />
            </div>
        </div>
    );
};


export default OrchestratorTerminal;
