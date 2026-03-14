
import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Server, Users, Bell, Search, Filter,
    CheckCircle2, AlertTriangle, Monitor, X, History,
    Menu, ChevronRight, ArrowUpDown
} from 'lucide-react';
import {
    AdminKPICard, ComputerRow, ProfileRow, AlertItem,
    SkeletonRow, SkeletonKPI
} from '../components/OrchestratorComponents';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orchestratorService } from '@/services/orchestrator.service';
import { ComputerNode, ProfileItem, Alert } from '../types/orchestratorTypes';


// --- DRAWER: COMPUTER DETAILS ---
const ComputerDrawer = ({ node, onClose }: { node: ComputerNode | null, onClose: () => void }) => {
    if (!node) return null;
    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-[#0c0c0c] border-l border-white/5 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#080808]">
                <div>
                    <span className="text-[9px] font-black text-[#666] uppercase tracking-widest">Detalle de Nodo</span>
                    <h2 className="text-xl font-black italic text-white">{node.name}</h2>
                </div>
                <button onClick={onClose}><X size={20} className="text-[#666] hover:text-white" /></button>
            </div>

            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                {/* Status Badge */}
                <div className={`p-4 rounded-xl border ${node.status === 'ONLINE' ? 'bg-[#00ff88]/5 border-[#00ff88]/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${node.status === 'ONLINE' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-red-500/10 text-red-500'}`}>
                            <Monitor size={20} />
                        </div>
                        <div>
                            <p className={`text-lg font-black italic ${node.status === 'ONLINE' ? 'text-[#00ff88]' : 'text-red-500'}`}>{node.status}</p>
                            <p className="text-[10px] text-[#666] font-mono">Uptime: {node.uptime} ÔÇó Ping: {node.lastUpdate}</p>
                        </div>
                    </div>
                </div>

                {/* Resources */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest">Recursos del Sistema</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                            <p className="text-[#666] text-xs font-bold mb-2">CPU Usage</p>
                            <p className="text-2xl font-mono text-white mb-2">{node.cpu}%</p>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${node.cpu > 80 ? 'bg-red-500' : 'bg-[#00ff88]'}`} style={{ width: `${node.cpu}%` }} />
                            </div>
                        </div>
                        <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                            <p className="text-[#666] text-xs font-bold mb-2">RAM Usage</p>
                            <p className="text-2xl font-mono text-white mb-2">{node.ram}%</p>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${node.ram > 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${node.ram}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Log (Mock) */}
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest">System Log</h3>
                    <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-[10px] text-[#888] h-48 overflow-y-auto space-y-2">
                        <p><span className="text-[#00ff88]">[10:00:22]</span> Node connected successfully</p>
                        <p><span className="text-blue-400">[10:05:00]</span> Automation script started (Profile P-01)</p>
                        <p><span className="text-amber-500">[10:15:30]</span> CPU Spike observed (85%)</p>
                        <p><span className="text-[#00ff88]">[10:16:00]</span> CPU stabilized</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODAL: PROFILE HISTORY ---
const ProfileHistoryModal = ({ profile, onClose }: { profile: ProfileItem | null, onClose: () => void }) => {
    if (!profile) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#080808]">
                    <h3 className="text-sm font-black italic text-white uppercase flex items-center gap-2">
                        <History size={16} className="text-[#00ff88]" /> Historial: {profile.name}
                    </h3>
                    <button onClick={onClose}><X size={18} className="text-[#666] hover:text-white" /></button>
                </div>
                <div className="p-0 max-h-[400px] overflow-y-auto">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                        <div key={i} className="p-4 border-b border-white/5 hover:bg-white/[0.02]">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${i === 0 ? 'bg-red-500/10 text-red-500' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                                    {i === 0 ? 'ERROR' : 'OPEN'}
                                </span>
                                <span className="text-[10px] font-mono text-[#555]">Today, 10:{30 - i}:00</span>
                            </div>
                            <p className="text-xs text-[#ccc]">Triggered by <span className="text-white font-bold">System Agent</span></p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const OrchestratorAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data State
    const [nodes, setNodes] = useState<ComputerNode[]>([]);
    const [profiles, setProfiles] = useState<ProfileItem[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [selectedNode, setSelectedNode] = useState<ComputerNode | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(null);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);

    // Filters from URL
    const nodeSearch = searchParams.get('nodeSearch') || '';
    const profileSearch = searchParams.get('profileSearch') || '';
    const activeSort = searchParams.get('sort') || 'HEALTH';

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            orchestratorService.getNodes(),
            orchestratorService.getProfiles(),
            orchestratorService.getAlerts(),
        ]).then(([nodes, profiles, alerts]) => {
            setNodes(nodes);
            setProfiles(profiles);
            setAlerts(alerts);
            setIsLoading(false);
        }).catch(err => {
            console.error('[OrchestratorAdmin] Error cargando datos:', err);
            setIsLoading(false);
        });
    }, []);

    // Filter Logic
    const filteredNodes = useMemo(() => {
        return nodes.filter(n => n.name.toLowerCase().includes(nodeSearch.toLowerCase()));
    }, [nodes, nodeSearch]);

    const filteredProfiles = useMemo(() => {
        let p = profiles.filter(item => item.name.toLowerCase().includes(profileSearch.toLowerCase()));

        // Sorting
        if (activeSort === 'HEALTH') p.sort((a, b) => a.health - b.health);
        if (activeSort === 'MEMORY') p.sort((a, b) => b.memory - a.memory);

        return p;
    }, [profiles, profileSearch, activeSort]);

    // Handlers
    const handleNodeSearch = (val: string) => {
        setSearchParams(prev => {
            prev.set('nodeSearch', val);
            return prev;
        });
    };

    const handleProfileSearch = (val: string) => {
        setSearchParams(prev => {
            prev.set('profileSearch', val);
            return prev;
        });
    };

    const toggleSort = () => {
        const next = activeSort === 'HEALTH' ? 'MEMORY' : 'HEALTH';
        setSearchParams(prev => { prev.set('sort', next); return prev; });
    };

    const handleReadAlert = (id: number) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    };

    const activeAlertCount = alerts.filter(a => !a.read).length;

    return (
        <div className="w-full h-full bg-[#020202] text-[#f0f0f0] flex flex-col font-sans overflow-hidden">
            {/* TOP BAR */}
            <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-[#050505] z-40">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/orchestrator')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#888] hover:text-white transition-colors">
                        <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <div className="h-8 w-px bg-white/10" />
                    <h1 className="text-lg font-black italic text-white flex items-center gap-2">
                        <Server size={20} className="text-[#00ff88]" /> ORCHESTRATOR <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-[#ccc] not-italic">ADMIN</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4 relative">
                    <button
                        onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                        className={`relative p-2 rounded-xl transition-all ${isAlertsOpen ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white hover:bg-white/5'}`}
                    >
                        <Bell size={20} />
                        {activeAlertCount > 0 && <div className="absolute top-2 right-2 size-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                    </button>

                    {/* ALERT DROPDOWN */}
                    {isAlertsOpen && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2">
                            <div className="p-3 border-b border-white/5 bg-[#080808] flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-[#666]">Alert Center</span>
                                <span className="text-[10px] font-bold text-red-500">{activeAlertCount} Active</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {alerts.length === 0 ? (
                                    <div className="p-8 text-center text-[#444] text-xs">No alerts</div>
                                ) : (
                                    alerts.map(alert => <AlertItem key={alert.id} alert={alert} onRead={() => handleReadAlert(alert.id)} />)
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">

                {/* 1. KPIs */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AdminKPICard
                        label="Nodos Online"
                        value={`${nodes.filter(n => n.status === 'ONLINE').length}/${nodes.length}`}
                        icon={<Monitor size={20} />}
                        active
                        tooltip="Total active nodes vs provisioned nodes"
                        loading={isLoading}
                    />
                    <AdminKPICard
                        label="Perfiles Activos"
                        value={profiles.length.toString()}
                        subtext={`${profiles.filter(p => p.status === 'ERROR').length} w/ Errors`}
                        icon={<Users size={20} />}
                        tooltip="Total browser profiles managed"
                        loading={isLoading}
                    />
                    <AdminKPICard
                        label="Navegadores"
                        value={nodes.reduce((acc, curr) => acc + curr.openBrowsers, 0).toString()}
                        subtext="Currently Open"
                        icon={<CheckCircle2 size={20} />}
                        tooltip="Real-time active browser sessions"
                        loading={isLoading}
                    />
                    <AdminKPICard
                        label="Alertas Activas"
                        value={activeAlertCount.toString()}
                        subtext="Requires Attention"
                        icon={<AlertTriangle size={20} />}
                        alert={activeAlertCount > 0}
                        tooltip="Unresolved system alerts"
                        loading={isLoading}
                    />
                </section>

                {/* 2. COMPUTERS */}
                <section className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center px-1 gap-2">
                        <h3 className="text-[11px] font-black text-[#444] uppercase tracking-[0.3em]">Infraestructura (Nodos)</h3>
                        <div className="relative w-full md:w-auto">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                            <input
                                type="text"
                                placeholder="Buscar nodo..."
                                value={nodeSearch}
                                onChange={(e) => handleNodeSearch(e.target.value)}
                                className="bg-[#0a0a0a] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:border-[#00ff88]/30 outline-none w-full md:w-64"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {isLoading ? (
                            <>
                                <SkeletonRow />
                                <SkeletonRow />
                            </>
                        ) : filteredNodes.length > 0 ? (
                            filteredNodes.map(node => (
                                <ComputerRow key={node.id} node={node} onClick={() => setSelectedNode(node)} />
                            ))
                        ) : (
                            <div className="col-span-2 p-8 text-center text-[#444] text-xs bg-[#0a0a0a] border border-white/5 rounded-xl border-dashed">No nodes found</div>
                        )}
                    </div>
                </section>

                {/* 3. PROFILES */}
                <section className="space-y-4 pb-20">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center px-1 gap-2">
                        <h3 className="text-[11px] font-black text-[#444] uppercase tracking-[0.3em]">Inventario de Perfiles</h3>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Buscar perfil..."
                                value={profileSearch}
                                onChange={(e) => handleProfileSearch(e.target.value)}
                                className="bg-[#0a0a0a] border border-white/5 rounded-lg pl-4 pr-4 py-1.5 text-xs text-white focus:border-[#00ff88]/30 outline-none flex-1"
                            />
                            <button onClick={toggleSort} className="flex items-center gap-2 text-[10px] font-bold text-[#666] hover:text-white transition-colors px-3 py-1.5 bg-[#0a0a0a] rounded-lg border border-white/5 whitespace-nowrap">
                                <ArrowUpDown size={12} /> {activeSort === 'HEALTH' ? 'Sort: Health' : 'Sort: Mem usage'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 border-b border-white/5 bg-white/[0.01] text-[9px] font-black text-[#666] uppercase tracking-wider pl-4">
                            <div className="col-span-4 md:col-span-3">Perfil</div>
                            <div className="col-span-2 hidden md:block">Proxy</div>
                            <div className="col-span-2 hidden md:block">Cookies</div>
                            <div className="col-span-2">Score</div>
                            <div className="col-span-2 hidden md:block">Última Acción</div>
                            <div className="col-span-2 md:col-span-1 text-right pr-2">Acc.</div>

                        </div>
                        {/* Body */}
                        <div>
                            {isLoading ? (
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : filteredProfiles.length > 0 ? (
                                filteredProfiles.map(profile => (
                                    <ProfileRow
                                        key={profile.id}
                                        profile={profile}
                                        onHistory={() => setSelectedProfile(profile)}
                                        onSecurity={() => {}}
                                    />
                                ))
                            ) : (
                                <div className="p-8 text-center text-[#444] text-xs">No profiles found</div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* DRAWERS & MODALS */}
            <ComputerDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
            <ProfileHistoryModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
        </div>
    );
};

export default OrchestratorAdmin;
