
import React from 'react';
import {
    Monitor, Users, AlertTriangle, Activity,
    Wifi, WifiOff, Cpu, HardDrive, Clock,
    MoreHorizontal, CheckCircle2, History, Info, Globe, Terminal, ChevronRight,
    Shield, Cookie, Fingerprint, RefreshCw, Server, Trash2
} from 'lucide-react';
import { ComputerNode, ProfileItem, Alert, Job, SystemEvent, ServiceStatus } from '../types/orchestratorTypes';
import { timeAgo } from '../utils/time';
import { ConnectionItem } from '../types/orchestratorTypes';



// --- SKELETON COMPONENTS ---
export const SkeletonKPI = () => (
    <div className="p-5 rounded-2xl border border-white/5 bg-[#0a0a0a] animate-pulse">
        <div className="flex justify-between items-start mb-2">
            <div className="size-8 bg-white/10 rounded-lg" />
        </div>
        <div className="h-8 w-24 bg-white/10 rounded mb-2" />
        <div className="h-3 w-16 bg-white/10 rounded" />
    </div>
);

export const SkeletonRow = () => (
    <div className="flex items-center justify-between p-4 border-b border-white/5 animate-pulse bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
            <div className="size-10 bg-white/10 rounded-lg" />
            <div className="space-y-2">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-2 w-20 bg-white/10 rounded" />
            </div>
        </div>
        <div className="h-4 w-24 bg-white/10 rounded" />
    </div>
);

// --- KPI CARD WITH TOOLTIP ---
export const AdminKPICard = ({ label, value, subtext, icon, alert, active, tooltip, loading, trend, onClick }: any) => {
    if (loading) return <SkeletonKPI />;

    return (
        <div
            onClick={onClick}
            className={`group relative p-5 rounded-2xl border transition-all cursor-pointer hover:bg-white/[0.03] ${alert ? 'bg-red-500/5 border-red-500/20' : active ? 'bg-[#00ff88]/5 border-[#00ff88]/30' : 'bg-[#0a0a0a] border-white/5'}`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${alert ? 'bg-red-500/10 text-red-500' : active ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-white/5 text-[#666]'}`}>
                    {icon}
                </div>
                {alert && <div className="size-2 rounded-full bg-red-500 animate-pulse" />}
                {tooltip && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative group/tip cursor-help">
                            <Info size={14} className="text-[#666]" />
                            <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-[#ccc] z-50 hidden group-hover/tip:block shadow-xl">
                                {tooltip}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-end gap-2 mb-1">
                <p className="text-3xl font-black italic text-white tracking-tighter tabular-nums">{value}</p>
                {trend && (
                    <span className={`text-[10px] font-bold mb-1.5 ${trend.includes('+') ? 'text-[#00ff88]' : 'text-red-500'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">{label}</p>
            {subtext && <p className="text-[9px] text-[#444] mt-1">{subtext}</p>}
        </div>
    );
};

// --- COMPUTER ROW ---
export const ComputerRow = ({ node, onClick }: { node: ComputerNode, onClick: () => void }) => {
    const isOnline = node.status === 'ONLINE' || node.status === 'WARNING';
    const isWarning = node.status === 'WARNING';

    return (
        <div onClick={onClick} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 hover:border-[#00ff88]/30 rounded-xl cursor-pointer hover:bg-white/[0.02] transition-all gap-4">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${isWarning ? 'bg-amber-500/10 text-amber-500' : isOnline ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-red-500/10 text-red-500'}`}>
                    {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                </div>
                <div>
                    <h4 className="text-sm font-black text-white italic tracking-wide">{node.name}</h4>
                    <span className="text-[9px] font-mono text-[#666] uppercase">{node.group} • {node.uptime} UP</span>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
                {/* RESOURCES */}
                <div className="flex gap-4">
                    <div className="w-20 md:w-24">
                        <div className="flex justify-between text-[8px] font-bold text-[#555] mb-1">
                            <span>CPU</span>
                            <span>{node.cpu}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${node.cpu > 80 ? 'bg-red-500' : 'bg-[#00ff88]'}`} style={{ width: `${node.cpu}%` }} />
                        </div>
                    </div>
                    <div className="w-20 md:w-24">
                        <div className="flex justify-between text-[8px] font-bold text-[#555] mb-1">
                            <span>RAM</span>
                            <span>{node.ram}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${node.ram > 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${node.ram}%` }} />
                        </div>
                    </div>
                </div>

                {/* SESSIONS */}
                <div className="text-center w-12 md:w-16 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                    <span className="block text-lg font-black text-white tabular-nums leading-none">{node.openBrowsers}</span>
                    <span className="text-[8px] text-[#555] uppercase hidden md:inline">Browsers</span>
                </div>
            </div>
        </div>
    );
};

// --- PROFILE ROW (TABLE STYLE) ---
export const ProfileRow = ({
    profile,
    connections = [],
    onHistory,
    onSecurity,
    onRotateProxy,
    onDelete,
}: {
    profile: ProfileItem;
    connections?: ConnectionItem[];
    onHistory: () => void;
    onSecurity: () => void;
    onRotateProxy?: () => void;
    onDelete?: () => void;
}) => {
    const activeConn = connections.find(c => c.id === String(profile.proxyId));

    const getStatusStyle = (s: string) => {
        if (s === 'HEALTHY' || s === 'RUNNING') return 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20';
        if (s === 'SLOW' || s === 'WARMING') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    const isSecure = (profile.browserScore || 0) > 90 && (profile.fingerprintScore || 0) > 90 && profile.cookieStatus === 'OK';

    return (
        <div className="grid grid-cols-12 items-center gap-2 md:gap-4 p-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors font-mono text-xs group">
            <div className="col-span-3 font-bold text-white pl-2 truncate flex flex-col">
                <span>{profile.name}</span>
                <span className="text-[9px] text-[#666] font-normal uppercase">{profile.owner || profile.id}</span>
            </div>
            <div className="col-span-2 hidden md:block">
                {profile.proxyId ? (
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[#00ff88] font-mono">{profile.adsId}</span>
                        <span className="text-[9px] text-[#555] uppercase">{profile.proxy?.location ?? 'N/A'}</span>
                    </div>
                ) : (
                    <span className="text-[10px] text-[#444]">Sin proxy</span>
                )}
            </div>

            <div className="col-span-2 hidden md:block">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    profile.cookieStatus === 'OK'
                        ? 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20'
                        : profile.cookieStatus === 'EXPIRED'
                        ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                        : 'text-red-500 bg-red-500/10 border-red-500/20'
                }`}>
                    {profile.cookieStatus ?? 'N/A'}
                </span>
            </div>

            <div className="col-span-2 hidden md:block">
                <div className="flex items-center gap-1">
                    <span className={`text-xs font-black ${
                        (profile.browserScore || 0) >= 80 ? 'text-[#00ff88]' :
                        (profile.browserScore || 0) >= 60 ? 'text-amber-500' : 'text-red-500'
                    }`}>{profile.browserScore || 0}%</span>
                    <span className="text-[9px] text-[#444] uppercase"></span>
                </div>
            </div>
            <div className="col-span-2 hidden md:block text-[10px] text-[#666]">
                {profile.lastAction}
            </div>
            <div className="col-span-1 text-right pr-2 flex justify-end gap-1">
                <button onClick={onSecurity} className={`p-1 rounded transition-colors ${isSecure ? 'text-[#00ff88] hover:bg-[#00ff88]/10' : 'text-red-500 hover:bg-red-500/10 animate-pulse'}`} title="Security Check">
                    <Shield size={14} />
                </button>
                     {onRotateProxy && (
                       <button
                         onClick={onRotateProxy}
                         title="Rotar proxy ahora"
                         className="p-1 hover:bg-blue-500/10 rounded text-[#666] hover:text-blue-400 transition-colors"
                       >
                         <RefreshCw size={14} />
                       </button>
                     )}
                                {onDelete && (
                    <button
                        onClick={onDelete}
                        title="Eliminar perfil"
                        className="p-1 hover:bg-red-500/10 rounded text-[#666] hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
                <button onClick={onHistory} className="p-1 hover:bg-white/10 rounded text-[#666] hover:text-white transition-colors" title="View History">
                    <History size={14} />
                </button>
            </div>
        </div>
    );
};

// --- ALERT DROPDOWN ITEM ---
export const AlertItem = ({ alert, onRead, onAction }: { alert: Alert, onRead: () => void, onAction?: (action: string) => void }) => {
    const color = alert.severity === 'Critical' ? 'red' : alert.severity === 'Warning' ? 'amber' : 'blue';
    return (
        <div className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors group ${alert.read ? 'opacity-50' : 'opacity-100 bg-white/[0.02]'}`}>
            <div onClick={onRead} className="cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider text-${color}-500 bg-${color}-500/10 px-1.5 py-0.5 rounded`}>
                        {alert.severity}
                    </span>
                    <span className="text-[9px] text-[#555] font-mono">{alert.time}</span>
                </div>
                <p className="text-xs font-bold text-[#ccc] group-hover:text-white transition-colors">{alert.type}</p>
                <p className="text-[10px] text-[#666] leading-tight mt-0.5">{alert.message}</p>
            </div>

            {onAction && !alert.read && (
                <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-left-2">
                    <button onClick={(e) => { e.stopPropagation(); onAction('VIEW_CAUSE'); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-bold text-[#ccc] rounded border border-white/5 hover:border-white/20 transition-colors uppercase">Ver Causa</button>
                    <button onClick={(e) => { e.stopPropagation(); onAction('RETRY'); }} className="px-2 py-1 bg-[#00ff88]/5 hover:bg-[#00ff88]/10 text-[9px] font-bold text-[#00ff88] rounded border border-[#00ff88]/10 hover:border-[#00ff88]/30 transition-colors uppercase">Reintentar</button>
                    <button onClick={(e) => { e.stopPropagation(); onAction('SILENCE'); }} className="px-2 py-1 bg-transparent hover:bg-white/5 text-[9px] font-bold text-[#666] hover:text-[#aaa] rounded transition-colors uppercase">Silenciar 30m</button>
                </div>
            )}
        </div>
    );
};

// --- NEW COMPONENTS ---

export const GlobalStatusHero = ({
    status, lastUpdate, autoRefresh, onToggleAuto, onClick, verdict,
}: {
    status: string;
    lastUpdate: string;
    autoRefresh: boolean;
    onToggleAuto: () => void;
    onClick: () => void;
    verdict?: string;
}) => {
    const isOk = status === 'OK';
    const isCrit = status === 'CRITICAL';

    const defaultVerdict = isOk
        ? '"Todos los servicios operativos. Latencia estable."'
        : isCrit
            ? '"Estado crítico — intervención requerida."'
            : '"Degradación detectada — revisa proxies y agentes."';

    return (
        <div onClick={onClick} className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex justify-between items-center group cursor-pointer hover:border-white/10 transition-colors">
            <div className={`absolute left-0 top-0 bottom-0 w-2 transition-all duration-300 ${isOk ? 'bg-[#00ff88] group-hover:w-3' : isCrit ? 'bg-red-500 group-hover:w-3' : 'bg-amber-500 group-hover:w-3'}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-50" />

            <div className="relative z-10 flex items-center gap-6">
                <div className={`size-16 rounded-2xl flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 ${isOk ? 'bg-[#00ff88]/10 text-[#00ff88]' : isCrit ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {isOk ? <CheckCircle2 size={40} /> : <AlertTriangle size={40} />}
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        SISTEMA {status}
                        {isOk && (
                            <span className="text-xs not-italic bg-[#00ff88]/20 text-[#00ff88] px-2 py-0.5 rounded font-bold tracking-normal group-hover:bg-[#00ff88] group-hover:text-black transition-colors">
                                OPERATIVO
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-[#666] font-mono flex items-center gap-1 group-hover:text-[#888] transition-colors">
                            <Clock size={12} /> Actualizado hace {lastUpdate}
                        </p>
                        <button
                            onClick={e => { e.stopPropagation(); onToggleAuto(); }}
                            className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded transition-colors border ${autoRefresh ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88] hover:text-black' : 'bg-white/5 border-white/5 text-[#666] hover:text-white'}`}
                        >
                            <RefreshCw size={10} className={autoRefresh ? 'animate-spin' : ''} />
                            {autoRefresh ? 'Auto Sync ON' : 'Manual'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 hidden md:block text-right opacity-80 group-hover:opacity-100 transition-opacity max-w-[260px]">
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-1 group-hover:text-[#00ff88] transition-colors">
                    Veredicto del Sistema
                </p>
                <p className="text-sm text-[#888] italic leading-snug">
                    {verdict ?? defaultVerdict}
                </p>
            </div>
        </div>
    );
};
export const MiniCapacityPanel = ({ cpu, ram, net, onClick }: any) => (
    <div onClick={onClick} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col justify-center h-full cursor-pointer hover:bg-white/5 transition-colors group">
        <h3 className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] mb-3 flex items-center justify-between group-hover:text-white transition-colors">
            Capacidad <Activity size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00ff88]" />
        </h3>
        <div className="space-y-3">
            {[
                { label: 'CPU', val: cpu, color: 'bg-[#00ff88]' },
                { label: 'RAM', val: ram, color: 'bg-blue-500' },
                { label: 'RED/LAT', val: net, color: 'bg-amber-500' }
            ].map(m => (
                <div key={m.label}>
                    <div className="flex justify-between text-[9px] font-bold text-[#ccc] mb-1">
                        <span>{m.label}</span>
                        <span>{m.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${m.color}`} style={{ width: `${m.val}%` }} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const JobsQueueWidget = ({ queue, running, failed, onClick }: any) => (
    <div onClick={onClick} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col justify-center h-full cursor-pointer hover:bg-white/5 transition-colors group">
        <h3 className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] mb-4 flex items-center justify-between group-hover:text-white transition-colors">
            Cola de Tareas <Server size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00ff88]" />
        </h3>
        <div className="flex justify-between items-center text-center">
            <div>
                <span className="block text-xl font-black text-white group-hover:scale-110 transition-transform">{queue}</span>
                <span className="text-[8px] font-bold text-[#666] uppercase">En Cola</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div>
                <span className="block text-xl font-black text-[#00ff88] group-hover:scale-110 transition-transform">{running}</span>
                <span className="text-[8px] font-bold text-[#666] uppercase">Corriendo</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div>
                <span className="block text-xl font-black text-red-500 group-hover:scale-110 transition-transform">{failed}</span>
                <span className="text-[8px] font-bold text-[#666] uppercase">Fallidas</span>
            </div>
        </div>
    </div>
);

// --- HEALTH OVERVIEW ---
export const HealthOverview = ({
    score, risks, healthDetails, onDetails,
}: {
    score: number;
    risks: string[];
    healthDetails?: import('../types/orchestratorTypes').HealthDetails;
    onDetails?: () => void;
}) => {
    const f = healthDetails?.factors;

    const factors = healthDetails ? [
        {
            label: 'Nodos',
            score: healthDetails.nodeScore,
            detail: f ? `${f.nodesOnline}/${f.nodesTotal} online` : '—',
            color: healthDetails.nodeScore > 80 ? '#00ff88' : healthDetails.nodeScore > 50 ? '#f59e0b' : '#ef4444',
        },
        {
            label: 'Proxies SOAX',
            score: healthDetails.proxyScore,
            detail: f ? `${Math.round(f.proxySuccessRate)}% éxito · ${f.avgProxyLatency}ms` : '—',
            color: healthDetails.proxyScore > 80 ? '#00ff88' : healthDetails.proxyScore > 50 ? '#f59e0b' : '#ef4444',
        },
        {
            label: 'Alertas',
            score: healthDetails.alertScore,
            detail: f ? `${f.criticalAlerts} críticas · ${f.warningAlerts} warns` : '—',
            color: healthDetails.alertScore > 80 ? '#00ff88' : healthDetails.alertScore > 50 ? '#f59e0b' : '#ef4444',
        },
        {
            label: 'AdsPower',
            score: healthDetails.adspowerScore,
            detail: f ? (f.adspowerHealthy ? 'Operativo' : 'Sin conexión') : '—',
            color: healthDetails.adspowerScore === 100 ? '#00ff88' : '#ef4444',
        },
        {
            label: 'Infraestructura',
            score: healthDetails.infraScore,
            detail: f ? `DB ${f.dbHealthy ? '✓' : '✗'} · Redis ${f.redisHealthy ? '✓' : '✗'}` : '—',
            color: healthDetails.infraScore > 80 ? '#00ff88' : healthDetails.infraScore > 50 ? '#f59e0b' : '#ef4444',
        },
    ] : [];

    return (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden group/card">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-[#666] uppercase tracking-[0.3em] flex items-center gap-2">
                    <Activity size={14} className="text-[#00ff88]" /> Salud General
                </h3>
                <div className="relative group cursor-help">
                    <Info size={12} className="text-[#444] hover:text-[#ccc]" />
                    <div className="absolute right-0 top-full mt-2 w-52 p-3 bg-black border border-white/10 rounded-lg z-50 hidden group-hover:block shadow-xl">
                        <p className="text-[10px] text-[#ccc] leading-relaxed font-bold mb-1">5 factores ponderados:</p>
                        <p className="text-[9px] text-[#888] space-y-0.5">
                            Nodos 30% · Proxies 25%<br />
                            Alertas 20% · AdsPower 15%<br />
                            Infraestructura 10%
                        </p>
                    </div>
                </div>
            </div>

            {/* Score circle */}
            <div className="flex items-center gap-5 mb-5">
                <div className="relative size-20 flex items-center justify-center shrink-0">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-white/5"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="currentColor" strokeWidth="3" />
                        <path
                            className={score > 80 ? 'text-[#00ff88]' : score > 50 ? 'text-amber-500' : 'text-red-500'}
                            strokeDasharray={`${score}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="currentColor" strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute text-xl font-black text-white">{score}%</span>
                </div>

                <div className="flex-1 space-y-1.5">
                    {factors.length > 0 ? factors.map(f => (
                        <div key={f.label}>
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[9px] font-bold text-[#666] uppercase">{f.label}</span>
                                <span className="text-[9px] font-black" style={{ color: f.color }}>{f.score}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${f.score}%`, background: f.color }}
                                />
                            </div>
                        </div>
                    )) : (
                        // Fallback si no hay healthDetails (cargando)
                        ['Nodos', 'Proxies', 'Alertas', 'AdsPower', 'Infraestructura'].map(l => (
                            <div key={l} className="h-3 bg-white/5 rounded animate-pulse" />
                        ))
                    )}
                </div>
            </div>

            {/* Factors detail */}
            {factors.length > 0 && (
                <div className="mb-3 grid grid-cols-1 gap-1">
                    {factors.map(f => (
                        <div key={f.label} className="flex justify-between items-center text-[9px] border-b border-white/[0.04] py-0.5">
                            <span className="text-[#555]">{f.label}</span>
                            <span className="text-[#888] font-mono">{f.detail}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Risks */}
            <div className="flex-1 overflow-auto custom-scrollbar mb-3">
                <p className="text-[9px] font-black text-[#555] uppercase mb-1.5">Riesgos detectados</p>
                {risks.length === 0 ? (
                    <p className="text-[10px] text-[#444] italic">Todo sistema nominal ✓</p>
                ) : risks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5 bg-white/5 px-2 py-1.5 rounded text-[9px] border border-white/5 hover:border-white/15 transition-colors">
                        <AlertTriangle size={10} className="text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-[#bbb] leading-tight">{risk}</span>
                    </div>
                ))}
            </div>

        </div>
    );
};

// --- ACTIVITY FEED ---

export const SystemEventsFeed = ({ events, onEventClick }: { events: SystemEvent[], onEventClick?: (ev: SystemEvent) => void }) => (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 h-full flex flex-col">
        <h3 className="text-[10px] font-black text-[#666] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <History size={14} className="text-[#00ff88]" /> Línea de Tiempo
        </h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />
            {events.map((ev) => {
                const meta = (ev as any).meta;
                const domain = meta?.target_url
                    ? (() => { try { return new URL(meta.target_url).hostname; } catch { return meta.target_url; } })()
                    : null;

                return (
                    <div
                        key={ev.id}
                        onClick={() => onEventClick && onEventClick(ev)}
                        className="flex gap-4 relative pl-8 py-3 group cursor-pointer hover:bg-white/[0.02] rounded-r-xl transition-colors"
                    >
                        <div className={`absolute left-[7px] top-4 size-2.5 rounded-full border-2 border-[#0a0a0a] z-10 transition-transform group-hover:scale-125 ${
                            ev.type === 'SUCCESS' ? 'bg-[#00ff88]' :
                            ev.type === 'ERROR'   ? 'bg-red-500'   :
                            ev.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <p className="text-[11px] font-bold text-[#e0e0e0] group-hover:text-white transition-colors truncate">
                                    {ev.message}
                                </p>
                                <span className="text-[9px] text-[#555] font-mono whitespace-nowrap shrink-0">
                                    hace {timeAgo(ev.timestamp)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <p className="text-[10px] text-[#666]">{ev.source}</p>
                                {domain && (<><span className="text-[#333]">·</span><p className="text-[10px] text-[#555] font-mono">{domain}</p></>)}
                                {meta?.duration_s != null && (<><span className="text-[#333]">·</span><p className="text-[10px] text-[#555]">{meta.duration_s}s</p></>)}
                            </div>

                            {/* ← FUERA del flex div, aquí abajo */}
                            {meta?.log && meta.log.length > 0 && (
                                <div className="mt-2 border border-white/5 rounded-lg overflow-hidden">
                                    <div className="px-2 py-1 bg-white/[0.03] border-b border-white/5">
                                        <span className="text-[8px] font-black text-[#444] uppercase tracking-widest">
                                            Detalle de proxies ({meta.log.length})
                                        </span>
                                    </div>
                                    <div className="p-2 space-y-0.5 font-mono text-[10px] max-h-32 overflow-y-auto custom-scrollbar">
                                        {meta.log.map((line: string, i: number) => (
                                            <div key={i} className={`flex items-start gap-1.5 ${
                                                line.startsWith('✓') ? 'text-green-500' :
                                                line.startsWith('↺') ? 'text-blue-400' :
                                                'text-red-400'
                                            }`}>
                                                <span className="shrink-0 text-[#333] tabular-nums">{String(i+1).padStart(2,'0')}</span>
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center pr-2">
                            <ChevronRight size={14} className="text-[#444]" />
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
// --- SERVICE STATUS BAR ---

const EXPECTED_SERVICES = [
    { name: 'Database', status: 'UNKNOWN', latency: 0 },
    { name: 'Redis', status: 'UNKNOWN', latency: 0 },
    { name: 'Proxies', status: 'UNKNOWN', latency: 0 },
    { name: 'Agents', status: 'UNKNOWN', latency: 0 },
    { name: 'AdsPower', status: 'UNKNOWN', latency: 0 },
    { name: 'SOAX', status: 'UNKNOWN', latency: 0 },
];

function mergeServices(live: ServiceStatus[]): ServiceStatus[] {
    return EXPECTED_SERVICES.map((base) => {
        const found = live.find(
            (s) => s.name.toLowerCase() === base.name.toLowerCase(),
        );
        return found ?? base;
    });
}
export const ServiceStatusBar = ({ services = [], onServiceClick }: { services: ServiceStatus[], onServiceClick: (svc: ServiceStatus) => void }) => {
    const merged = mergeServices(services);

    return (
        <div className="flex flex-wrap gap-2">
            {merged.map((svc) => {
                const isOnline = svc.status === 'ONLINE';
                const isUnknown = svc.status === 'UNKNOWN';

                const ringClass = isOnline
                    ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]'
                    : isUnknown
                        ? 'bg-white/5 border-white/10 text-white/30'
                        : 'bg-red-500/10 border-red-500/20 text-red-400';

                const dotClass = isOnline
                    ? 'bg-[#00ff88] animate-pulse'
                    : isUnknown
                        ? 'bg-white/20'
                        : 'bg-red-500';

                return (
                    <button
                        key={svc.name}
                        onClick={() => onServiceClick(svc)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider hover:bg-white/5 transition-colors ${ringClass}`}
                    >
                        <div className={`size-1.5 rounded-full ${dotClass}`} />
                        {svc.name}
                        {!isUnknown && svc.latency > 0 && (
                            <span className="text-white/30 ml-1 font-mono">
                                {svc.latency}ms
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

// --- JOB ROW ---
export const JobRow = ({ job, onClick }: { job: import('../types/orchestratorTypes').Job, onClick: () => void }) => {
    const isRunning = job.status === 'RUNNING';
    const isFailed = job.status === 'FAILED';
    const isCompleted = job.status === 'COMPLETED';

    return (
        <div onClick={onClick} className="group p-4 bg-[#0a0a0a] border border-white/5 hover:border-white/20 rounded-xl transition-all mb-2 cursor-pointer hover:bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isRunning ? 'bg-blue-500/10 text-blue-500 animate-pulse' : isFailed ? 'bg-red-500/10 text-red-500' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                        <Cpu size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors">{job.name}</h4>
                        <p className="text-[10px] text-[#666] font-mono uppercase">{job.type} • {job.id}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${isRunning ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' : isFailed ? 'border-red-500/20 text-red-500 bg-red-500/5' : 'border-[#00ff88]/20 text-[#00ff88] bg-[#00ff88]/5'}`}>
                        {job.status}
                    </span>
                    {job.barrierStatus && job.barrierStatus !== 'SYNCED' && <div className="text-[8px] font-bold text-amber-500 mt-1 animate-pulse">BARRIER: {job.barrierStatus}</div>}
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-[#666]">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${isFailed ? 'bg-red-500' : 'bg-[#00ff88]'}`} style={{ width: `${job.progress}%` }} />
                </div>
            </div>

            {job.logs.length > 0 && (
                <p className="mt-3 text-[10px] text-[#555] font-mono truncate border-t border-white/5 pt-2">
                    &gt; {job.logs[job.logs.length - 1]}
                </p>
            )}
        </div>
    );
};


// --- CONNECTION ROW ---
export const ConnectionRow = ({ conn, linkedProfiles = [], onHistory }: {
    conn: import('../types/orchestratorTypes').ConnectionItem;
    linkedProfiles?: import('../types/orchestratorTypes').ProfileItem[];
    onHistory?: () => void;  // ← AGREGAR
}) => {

    const isOk   = conn.status === 'OK';
    const isDown = conn.status === 'DOWN';
    const historyMax = Math.max(...conn.latencyHistory, 1);

    return (
        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 hover:border-[#00ff88]/30 rounded-xl transition-all mb-2">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${isOk ? 'bg-[#00ff88]/10 text-[#00ff88]' : isDown ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {isOk ? <Globe size={18} /> : isDown ? <WifiOff size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-wide">{conn.url}</h4>
                    <p className="text-[9px] text-[#666] font-mono mt-0.5">
                        ID: {conn.id} • Node: {conn.nodeId}
                        {conn.sessionId && <> • Sesión: <span className="text-[#444]">{conn.sessionId.slice(0, 8)}</span></>}
                    </p>
                    {/* ← PERFILES ENLAZADOS */}
                    {linkedProfiles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {linkedProfiles.map(p => (
                                <span key={p.id} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-[#888] font-mono">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    )}
                    {linkedProfiles.length === 0 && (
                        <p className="text-[9px] text-[#333] mt-1 italic">Sin perfiles enlazados</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-6 shrink-0">
                <div className="flex items-end gap-0.5 h-6 w-16">
                    {conn.latencyHistory.map((val, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-t-sm ${isOk ? 'bg-[#00ff88]/30' : 'bg-red-500/30'}`}
                            style={{ height: `${(val / historyMax) * 100}%` }}
                        />
                    ))}
                </div>
                <div className="text-right min-w-[60px]">
                    <div className={`text-xs font-black ${isOk ? 'text-[#00ff88]' : 'text-red-500'}`}>
                        {conn.latency}ms
                    </div>
                    <div className="text-[9px] text-[#555] uppercase">{conn.status}</div>
                </div>
                    <button
                        onClick={onHistory}  // ← CONECTAR
                        className="p-2 hover:bg-white/10 rounded-lg text-[#666] hover:text-white transition-colors"
                    >
                        <MoreHorizontal size={16} />
                    </button>
            </div>
        </div>
    );
};

    // ... resto igual, solo cambiar el botón:



// --- AGENT ACTION BUTTON ---
export const AgentActionButton = ({ label, icon, onClick, color, bg, desc }: any) => (
    <button onClick={onClick} className="group p-4 bg-[#0a0a0a] border border-white/5 hover:border-white/20 rounded-xl transition-all hover:-translate-y-1 text-left relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-10 bg-gradient-to-br from-transparent to-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />

        <div className={`size-10 rounded-lg ${bg} ${color} flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
            {icon}
        </div>

        <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1">{label}</h4>
        <p className="text-[9px] text-[#666] font-mono leading-tight">{desc}</p>
    </button>
);

// --- FILTER BUTTON ---
export const FilterButton = ({ label, active, onClick, dotColor }: any) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${active ? 'bg-[#00ff88] border-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]' : 'bg-black/40 border-white/10 text-[#666] hover:text-white hover:border-white/30'}`}
    >
        {label}
        {dotColor && <div className={`size-1.5 rounded-full ${dotColor} animate-pulse`} />}
    </button>
);
