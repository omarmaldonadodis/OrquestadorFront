import React from 'react';
import { ComputerNode, Alert } from '../types/orchestratorTypes';
import { X, Activity, Cpu, HardDrive, Terminal, Clock, Shield, AlertTriangle, History, Cookie, Fingerprint, Play, Pause, RefreshCw, Server, CheckCircle2, ChevronRight, Plus, ExternalLink, Info } from 'lucide-react';

interface NodeDrawerProps {
    node: ComputerNode | null;
    history: { time: string, cpu: number, ram: number }[];
    onClose: () => void;
}

export const EventDetailModal = ({ event, onClose }: { event: import('../types/orchestratorTypes').SystemEvent | null, onClose: () => void }) => {
    if (!event) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-sm relative z-[110] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white"><X size={20} /></button>
                <div className={`size-12 rounded-xl flex items-center justify-center mb-4 ${event.type === 'SUCCESS' ? 'bg-[#00ff88]/10 text-[#00ff88]' : event.type === 'ERROR' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    <Activity size={24} />
                </div>
                <h3 className="text-lg font-black text-white italic mb-1">Detalle del Evento</h3>
                <p className="text-xs text-[#666] mb-4 font-mono">{event.timestamp}</p>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
                    <p className="text-sm font-bold text-white mb-2">{event.message}</p>
                    <p className="text-xs text-[#888] uppercase">Origen: {event.source}</p>
                </div>

                <button onClick={onClose} className="w-full py-3 bg-[#00ff88] text-black font-black uppercase rounded-xl text-xs hover:bg-[#00cc6a] transition-colors">
                    Entendido
                </button>
            </div>
        </div>
    );
};

export const NodeItemDrawer = ({ node, history, onClose }: NodeDrawerProps) => {
    if (!node) return null;

    const isOnline = node.status === 'ONLINE';

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0c0c0c] border-l border-white/10 z-[70] shadow-2xl flex flex-col animate-slide-in-right">
                {/* HEADER */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-black text-white tracking-tighter italic">{node.name}</h2>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${isOnline ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-red-500/10 text-red-500'}`}>
                                {node.status}
                            </span>
                        </div>
                        <p className="text-[10px] text-[#666] font-mono uppercase">{node.group} • {node.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-[#666] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                    {/* KEY METRICS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-[#666] uppercase">
                                <Clock size={12} /> Uptime
                            </div>
                            <p className="text-lg font-mono text-white">{node.uptime}</p>
                        </div>
                        <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-[#666] uppercase">
                                <Shield size={12} /> Browsers
                            </div>
                            <p className="text-lg font-mono text-[#00ff88]">{node.openBrowsers}</p>
                        </div>
                    </div>

                    {/* CHARTS (Simulated with simple bars for now) */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Cpu size={12} /> CPU Trend
                            </h3>
                            <div className="h-24 flex items-end gap-1 border-b border-white/5 pb-1">
                                {history.map((pt, i) => (
                                    <div key={i} className="flex-1 bg-blue-500/20 hover:bg-blue-500 rounded-t-sm transition-colors group relative" style={{ height: `${pt.cpu}%` }}>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] bg-black px-1 rounded hidden group-hover:block whitespace-nowrap z-10 border border-white/10">
                                            {pt.cpu.toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <HardDrive size={12} /> RAM Trend
                            </h3>
                            <div className="h-24 flex items-end gap-1 border-b border-white/5 pb-1">
                                {history.map((pt, i) => (
                                    <div key={i} className="flex-1 bg-purple-500/20 hover:bg-purple-500 rounded-t-sm transition-colors group relative" style={{ height: `${pt.ram}%` }}>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] bg-black px-1 rounded hidden group-hover:block whitespace-nowrap z-10 border border-white/10">
                                            {pt.ram.toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RECENT EVENTS */}
                    <div>
                        <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Terminal size={12} /> Node Events
                        </h3>
                        <div className="space-y-2 font-mono text-[9px] text-[#666] bg-[#050505] p-4 rounded-lg border border-white/5">
                            <p>&gt; [10:00:01] System checks initiated...</p>
                            <p>&gt; [10:00:02] CPU load nominal (23%)</p>
                            <p className="text-amber-500">&gt; [10:05:00] Warning: Latency spike detected</p>
                            <p>&gt; [10:05:05] Connection restored</p>
                        </div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                    <button className="w-full py-3 bg-[#00ff88] text-black font-black uppercase rounded-xl hover:bg-[#00cc6a] transition-colors text-xs flex items-center justify-center gap-2">
                        <Activity size={16} /> Run Diagnostics
                    </button>
                </div>
            </div>
        </>
    );
};

export const AlertModal = ({ alert, onClose, onAck }: { alert: Alert | null, onClose: () => void, onAck: (id: number) => void }) => {
    if (!alert) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-md relative z-[90] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${alert.severity === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">System Alert</h3>
                        <p className="text-xs text-[#666] font-mono">{alert.time}</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6">
                    <p className="text-sm font-bold text-[#ccc] mb-2">{alert.type}</p>
                    <p className="text-xs text-[#888]">{alert.message}</p>
                    {alert.nodeId && <p className="text-[10px] text-[#555] font-mono mt-4 uppercase">Source: {alert.nodeId}</p>}
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                        Close
                    </button>
                    <button onClick={() => { onAck(alert.id); onClose(); }} className="flex-1 py-3 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-black rounded-xl text-xs uppercase transition-colors">
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- SESSION HISTORY MODAL ---
export const SessionHistoryModal = ({ sessionId, history, onClose, onAction }: { sessionId: string | null, history: import('../types/orchestratorTypes').SystemEvent[], onClose: () => void, onAction: (type: 'NODE' | 'ALERT', id: string) => void }) => {
    if (!sessionId) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg relative z-[90] p-6 shadow-2xl animate-fade-in-up flex flex-col max-h-[80vh]">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                        <History size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Session History</h3>
                        <p className="text-xs text-[#666] font-mono">ID: {sessionId}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 mb-6">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-[#444] text-xs font-bold uppercase">No history events found</div>
                    ) : (
                        history.map((ev, i) => (
                            <div key={ev.id} className="flex gap-4 relative">
                                <div className="flex flex-col items-center">
                                    <div className={`size-3 rounded-full border-2 border-[#0c0c0c] z-10 ${ev.type === 'SUCCESS' ? 'bg-[#00ff88]' : ev.type === 'ERROR' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                    {i < history.length - 1 && <div className="w-px flex-1 bg-white/10 my-1" />}
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-[#ccc]">{ev.message}</p>
                                        <span className="text-[9px] text-[#555] font-mono">{ev.timestamp}</span>
                                    </div>
                                    <p className="text-[10px] text-[#666] mt-0.5 font-mono uppercase">{ev.type} • {ev.source}</p>

                                    {ev.type === 'ERROR' && (
                                        <button onClick={() => onAction('ALERT', ev.id)} className="mt-2 text-[9px] font-black text-red-500 hover:underline uppercase flex items-center gap-1">
                                            <AlertTriangle size={10} /> View Alert
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                        Close
                    </button>
                    <button onClick={() => onAction('NODE', sessionId)} className="flex-1 py-3 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-black rounded-xl text-xs uppercase transition-colors">
                        Go to Node
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- JOB DRAWER ---
export const JobDrawer = ({ job, onClose }: { job: import('../types/orchestratorTypes').Job | null, onClose: () => void }) => {
    if (!job) return null;

    const isRunning = job.status === 'RUNNING';
    const isFailed = job.status === 'FAILED';
    const isCompleted = job.status === 'COMPLETED';

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-[#0c0c0c] border-l border-white/10 z-[70] shadow-2xl flex flex-col animate-slide-in-right">
                {/* HEAD */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-black text-white tracking-tighter italic">{job.name}</h2>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${isRunning ? 'bg-blue-500/10 text-blue-500' : isFailed ? 'bg-red-500/10 text-red-500' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                                {job.status}
                            </span>
                        </div>
                        <p className="text-[10px] text-[#666] font-mono uppercase">{job.type} • {job.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-[#666] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                    {/* BARRIER & PROGRESS */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-[#666] uppercase">Progress</span>
                            <span className="text-lg font-mono text-white">{job.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                            <div className={`h-full rounded-full transition-all ${isFailed ? 'bg-red-500' : 'bg-[#00ff88]'}`} style={{ width: `${job.progress}%` }} />
                        </div>

                        <div className="flex justify-between text-[10px] font-mono text-[#555] border-t border-white/5 pt-2">
                            <span>Tasks: {job.completedTasks}/{job.totalTasks}</span>
                            <span>Start: {job.startTime}</span>
                        </div>

                        {/* BARRIER WAIT STATUS */}
                        {job.barrierStatus && (
                            <div className={`mt-4 p-3 rounded-lg border flex items-center gap-3 ${job.barrierStatus === 'SYNCED' ? 'bg-[#00ff88]/5 border-[#00ff88]/20 text-[#00ff88]' : job.barrierStatus === 'TIMEOUT' ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-blue-500/5 border-blue-500/20 text-blue-500'}`}>
                                <Activity size={16} />
                                <div>
                                    <p className="text-[10px] font-black uppercase">Barrier Status: {job.barrierStatus}</p>
                                    <p className="text-[9px] opacity-70">Waiting for all threads to synchronize...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LOGS */}
                    <div>
                        <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Terminal size={12} /> Execution Logs
                        </h3>
                        <div className="bg-[#050505] p-4 rounded-lg border border-white/5 font-mono text-[10px] space-y-1.5 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
                            {job.logs.length === 0 ? (
                                <p className="text-[#444]">No logs available...</p>
                            ) : (
                                job.logs.map((log, i) => (
                                    <p key={i} className="text-[#888] border-b border-white/[0.02] pb-1 last:border-0">
                                        <span className="text-[#444] mr-2">[{i + 1}]</span>
                                        {log}
                                    </p>
                                ))
                            )}
                            {isRunning && <p className="animate-pulse text-[#00ff88]">&gt;_</p>}
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                    <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                        Download Report
                    </button>
                </div>
            </div>
        </>
    );
};

// --- DASHBOARD SPECIFIC MODALS ---

// 1. DASHBOARD KPI MODAL (Generic for all 4 KPI cards)
export const DashKPIModal = ({ type, data, onClose }: { type: string | null, data: any, onClose: () => void }) => {
    if (!type) return null;

    const getTitle = () => {
        switch (type) {
            case 'NODES': return 'Computadoras Online';
            case 'PROFILES': return 'Perfiles Activos';
            case 'BROWSERS': return 'Navegadores Abiertos';
            case 'ALERTS': return 'Alertas Activas';
            case 'NETWORK_MONITOR': return 'Monitor de Red (Proxy/IP)';
            default: return 'Detalle';
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg relative z-[90] p-6 shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black text-white italic">{getTitle()}</h3>
                        <p className="text-xs text-[#666]">Vista detallada y métricas rápidas</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-[#666] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {/* INFO: This is a simplified list for the modal. In real app, reuse row components. */}
                    {data && data.length > 0 ? (
                        data.map((item: any, i: number) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-white">{item.name || item.message || item.url}</p>
                                    <p className="text-[10px] text-[#666] uppercase">{item.status || item.severity || item.id}</p>
                                </div>
                                <div className="text-right">
                                    {type === 'NODES' && <span className="text-[#00ff88] text-xs font-mono">{item.cpu}% CPU</span>}
                                    {type === 'PROFILES' && <span className="text-blue-500 text-xs font-mono">{item.memory}MB</span>}
                                    {type === 'ALERTS' && <span className="text-red-500 text-xs font-bold">{item.severity}</span>}
                                    {type === 'BROWSERS' && <span className="text-amber-500 text-xs font-mono">{item.openBrowsers} Tabs</span>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-[#444] italic">No hay datos disponibles</div>
                    )}
                </div>

                <div className="pt-4 mt-4 border-t border-white/5">
                    <button onClick={onClose} className="w-full py-3 bg-[#00ff88]/10 text-[#00ff88] font-bold rounded-xl border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-all uppercase text-xs">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// 2. DASHBOARD FILTERS DRAWER
export const DashFiltersDrawer = ({ isOpen, onClose, filters, setFilters, onReset }: any) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-[300px] bg-[#0c0c0c] border-l border-white/10 z-[70] shadow-2xl flex flex-col animate-slide-in-right p-6">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Filtros Dash</h3>
                    <button onClick={onClose}><X size={20} className="text-[#666] hover:text-white" /></button>
                </div>

                <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#666] uppercase">Rango de Tiempo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['15m', '1h', '24h'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilters({ ...filters, timeRange: t })}
                                    className={`py-2 text-xs font-bold rounded border ${filters.timeRange === t ? 'bg-[#00ff88] text-black border-[#00ff88]' : 'bg-white/5 text-[#ccc] border-white/5'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#666] uppercase">Severidad Alertas</label>
                        <select
                            value={filters.severity}
                            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#00ff88]"
                        >
                            <option value="ALL">Todas</option>
                            <option value="Critical">Críticas</option>
                            <option value="Warning">Advertencias</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#666] uppercase">Propietario</label>
                        <select
                            value={filters.owner || 'ALL'}
                            onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#00ff88]"
                        >
                            <option value="ALL">Todos</option>
                            <option value="Jonathan Ayala - Loja">Jonathan Ayala - Loja</option>
                            <option value="Gabriel Guaman- Azoques">Gabriel Guaman- Azoques</option>
                            <option value="Josue Correa- Quito">Josue Correa- Quito</option>
                            <option value="William Muñoz - Cuenca">William Muñoz - Cuenca</option>
                            <option value="Nicolas Ullauri - Loja">Nicolas Ullauri - Loja</option>
                            <option value="Paul Jimenez - Cuenca">Paul Jimenez - Cuenca</option>
                            <option value="David - Cuenca">David - Cuenca</option>
                            <option value="LUIS GUERRERO - Cuenca">LUIS GUERRERO - Cuenca</option>
                            <option value="Stalin Arauz- Quito">Stalin Arauz- Quito</option>
                            <option value="Adrian Cevallos - Manta">Adrian Cevallos - Manta</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#666] uppercase">Estado Cookies</label>
                        <select
                            value={filters.cookieStatus || 'ALL'}
                            onChange={(e) => setFilters({ ...filters, cookieStatus: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#00ff88]"
                        >
                            <option value="ALL">Cualquiera</option>
                            <option value="OK">Seguras (OK)</option>
                            <option value="EXPIRED">Expiradas</option>
                            <option value="MISSING">Faltantes</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <button onClick={onReset} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                        Reestablecer
                    </button>
                    <button onClick={onClose} className="w-full py-3 bg-[#00ff88] text-black font-black rounded-xl text-xs uppercase transition-colors">
                        Aplicar Filtros
                    </button>
                </div>
            </div>
        </>
    );
};

// 3. HEALTH DETAIL MODAL
export const HealthDetailModal = ({ isOpen, score, onClose }: { isOpen: boolean, score: number, onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-md relative z-[90] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white"><X size={20} /></button>

                <h3 className="text-lg font-black text-white italic mb-1">Detalle de Salud</h3>
                <p className="text-xs text-[#666] mb-6">Cálculo en tiempo real basado en 3 factores.</p>

                <div className="space-y-4 mb-6">
                    <div className="p-4 bg-white/5 rounded-xl flex justify-between items-center border border-white/5">
                        <span className="text-xs font-bold text-[#ccc]">Tiempo de Respuesta</span>
                        <div className="text-right">
                            <span className="block text-[#00ff88] font-mono font-bold">45ms</span>
                            <span className="text-[9px] text-[#555]">Impacto: Alto</span>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl flex justify-between items-center border border-white/5">
                        <span className="text-xs font-bold text-[#ccc]">Tasa de Errores</span>
                        <div className="text-right">
                            <span className="block text-green-500 font-mono font-bold">0.02%</span>
                            <span className="text-[9px] text-[#555]">Impacto: Crítico</span>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl flex justify-between items-center border border-white/5">
                        <span className="text-xs font-bold text-[#ccc]">Disponibilidad (Uptime)</span>
                        <div className="text-right">
                            <span className="block text-[#00ff88] font-mono font-bold">99.9%</span>
                            <span className="text-[9px] text-[#555]">Impacto: Medio</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 p-4 rounded-xl">
                    <h4 className="text-[10px] font-black text-[#00ff88] uppercase mb-2">Recomendaciones</h4>
                    <ul className="text-[10px] text-[#ccc] space-y-1 list-disc pl-4">
                        <li>El sistema opera nominalmente.</li>
                        <li>Revisar Node-02 por picos ocasionales de latencia.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

// 4. SERVICE DETAIL MODAL
export const ServiceDetailModal = ({ service, onClose }: { service: import('../types/orchestratorTypes').ServiceStatus | null, onClose: () => void }) => {
    if (!service) return null;

    const isOnline = service.status === 'ONLINE';

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg relative z-[90] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white"><X size={20} /></button>

                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-xl ${isOnline ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-red-500/10 text-red-500'}`}>
                        <Server size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter">{service.name}</h3>
                        <p className="text-xs text-[#666] font-mono uppercase">Version 2.4.0 • {service.status}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] text-[#666] uppercase block mb-1">Latencia</span>
                        <span className={`text-xl font-mono font-bold ${service.latency < 100 ? 'text-[#00ff88]' : 'text-amber-500'}`}>{service.latency}ms</span>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] text-[#666] uppercase block mb-1">Uptime</span>
                        <span className="text-xl font-mono font-bold text-white">99.98%</span>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-[10px] font-black text-[#555] uppercase mb-2">Service Logs</h4>
                    <div className="bg-black border border-white/10 rounded-lg p-3 font-mono text-[10px] text-[#888] h-32 overflow-y-auto">
                        <p className="text-[#00ff88]">&gt; [10:00:00] Service heartbeat OK</p>
                        <p>&gt; [10:05:00] Processing batch job #2991</p>
                        <p>&gt; [10:10:00] Cache validation successful</p>
                        <p className="text-amber-500">&gt; [10:15:20] Warning: Connection pool &gt; 80%</p>
                        <p>&gt; [10:20:00] Service heartbeat OK</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="flex-1 py-3 bg-[#00ff88]/10 text-[#00ff88] font-bold uppercase text-xs rounded-xl hover:bg-[#00ff88]/20 transition-colors flex items-center justify-center gap-2">
                        <RefreshCw size={14} /> Restart
                    </button>
                    <button className="flex-1 py-3 bg-red-500/10 text-red-500 font-bold uppercase text-xs rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                        <Pause size={14} /> Stop Service
                    </button>
                    <button className="flex-1 py-3 bg-white/5 text-white font-bold uppercase text-xs rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                        <Terminal size={14} /> Config
                    </button>
                </div>
            </div>
        </div>
    );
};

// 5. SECURITY CHECK MODAL
export const SecurityCheckModal = ({ profile, onClose, onVerify }: { profile: import('../types/orchestratorTypes').ProfileItem | null, onClose: () => void, onVerify: (id: string) => void }) => {
    if (!profile) return null;

    const browserScore = profile.browserScore || 0;
    const fingerprintScore = profile.fingerprintScore || 0;
    const isCookiesOk = profile.cookieStatus === 'OK';

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg relative z-[90] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white"><X size={20} /></button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-blue-500/10 text-blue-500">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter">Seguridad & Cookies</h3>
                        <p className="text-xs text-[#666]">Verificación de integridad para: <span className="text-white font-bold">{profile.name}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-xl border ${browserScore > 90 ? 'bg-[#00ff88]/5 border-[#00ff88]/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase text-[#888]">Browser Score</span>
                            <Fingerprint size={16} className={browserScore > 90 ? 'text-[#00ff88]' : 'text-red-500'} />
                        </div>
                        <p className={`text-3xl font-black ${browserScore > 90 ? 'text-[#00ff88]' : 'text-red-500'}`}>{browserScore}%</p>
                        <p className="text-[9px] text-[#666] mt-1">Integridad de huella digital</p>
                    </div>

                    <div className={`p-4 rounded-xl border ${isCookiesOk ? 'bg-[#00ff88]/5 border-[#00ff88]/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase text-[#888]">Cookie Status</span>
                            <Cookie size={16} className={isCookiesOk ? 'text-[#00ff88]' : 'text-red-500'} />
                        </div>
                        <p className={`text-xl font-black ${isCookiesOk ? 'text-[#00ff88]' : 'text-red-500'} mt-1`}>{isCookiesOk ? 'ACTIVE' : 'EXPIRED'}</p>
                        <p className="text-[9px] text-[#666] mt-2">Sesión persistente</p>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        {isCookiesOk && browserScore > 90 ? <CheckCircle2 size={16} className="text-[#00ff88]" /> : <AlertTriangle size={16} className="text-amber-500" />}
                        <span className="text-xs font-bold text-[#ccc]">
                            {isCookiesOk && browserScore > 90 ? 'Perfil verificado y seguro.' : 'Se requiere atención manual.'}
                        </span>
                    </div>
                    {(!isCookiesOk || browserScore < 90) && (
                        <div className="bg-red-500/10 text-red-500 text-[10px] p-2 rounded border border-red-500/20 font-bold uppercase">
                            Acción Requerida: Actualizar Cookies
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button onClick={() => onVerify(profile.id)} className="flex-1 py-3 bg-[#00ff88] text-black font-black uppercase text-xs rounded-xl hover:bg-[#00cc6a] transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} /> Verificar & Aprobar
                    </button>
                    <button className="px-4 py-3 bg-white/5 text-white font-bold uppercase text-xs rounded-xl hover:bg-white/10 transition-colors" title="Ver logs">
                        <History size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// 6. SESSION START MODAL
export const SessionStartModal = ({ isOpen, onClose, profiles, onStart }: { isOpen: boolean, onClose: () => void, profiles: import('../types/orchestratorTypes').ProfileItem[], onStart: (ids: string[]) => void }) => {
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [filterMode, setFilterMode] = React.useState<'ALL' | 'OWNER' | 'BOOKIE'>('ALL');
    const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

    // Get unique owners and bookies
    const owners = Array.from(new Set(profiles.map(p => p.owner).filter(Boolean)));
    const bookies = Array.from(new Set(profiles.map(p => p.bookie).filter(Boolean)));

    if (!isOpen) return null;

    const filteredProfiles = profiles.filter(p => {
        if (filterMode === 'ALL') return true;
        if (filterMode === 'OWNER' && activeFilter) return p.owner === activeFilter;
        if (filterMode === 'BOOKIE' && activeFilter) return p.bookie === activeFilter;
        return true;
    });

    const toggleProfile = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === filteredProfiles.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProfiles.map(p => p.id));
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-4xl relative z-[90] p-0 shadow-2xl animate-fade-in-up max-h-[85vh] flex overflow-hidden">

                {/* SIDEBAR FILTERS */}
                <div className="w-1/3 bg-[#050505] border-r border-white/5 p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-black text-white italic tracking-tighter mb-1">Filtrar Por</h3>
                        <p className="text-[10px] text-[#666]">Selecciona el criterio de búsqueda</p>
                    </div>

                    <div className="space-y-4">
                        {/* MODE SELECTOR */}
                        <div className="flex bg-black p-1 rounded-xl border border-white/10">
                            <button
                                onClick={() => { setFilterMode('OWNER'); setActiveFilter(null); }}
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-colors ${filterMode === 'OWNER' ? 'bg-[#00ff88] text-black' : 'text-[#666] hover:text-white'}`}
                            >
                                Dueños
                            </button>
                            <button
                                onClick={() => { setFilterMode('BOOKIE'); setActiveFilter(null); }}
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-colors ${filterMode === 'BOOKIE' ? 'bg-[#00ff88] text-black' : 'text-[#666] hover:text-white'}`}
                            >
                                Bookies
                            </button>
                        </div>

                        {/* LISTS */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar h-[300px] pr-2 space-y-1">
                            {filterMode === 'ALL' && (
                                <div className="p-4 text-center text-[#444] text-xs italic">
                                    Selecciona un modo arriba para ver opciones.
                                    <br />
                                    <button onClick={() => setActiveFilter(null)} className="mt-4 text-[#00ff88] underline">Ver Todos</button>
                                </div>
                            )}

                            {filterMode === 'OWNER' && owners.map(owner => (
                                <button
                                    key={owner}
                                    onClick={() => setActiveFilter(owner)}
                                    className={`w-full text-left p-3 rounded-lg border text-[10px] font-bold uppercase transition-all ${activeFilter === owner ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'bg-white/5 border-transparent text-[#aaa] hover:bg-white/10'}`}
                                >
                                    {owner}
                                </button>
                            ))}

                            {filterMode === 'BOOKIE' && bookies.map(bookie => (
                                <button
                                    key={bookie}
                                    onClick={() => setActiveFilter(bookie)}
                                    className={`w-full text-left p-3 rounded-lg border text-[10px] font-bold uppercase transition-all ${activeFilter === bookie ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'bg-white/5 border-transparent text-[#aaa] hover:bg-white/10'}`}
                                >
                                    {bookie}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 p-6 flex flex-col bg-[#0c0c0c]">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tighter">Perfiles Disponibles</h3>
                            <p className="text-xs text-[#666]">
                                {filterMode === 'ALL' ? 'Mostrando todos los perfiles' : `Filtrado por: ${activeFilter || 'Ninguno'}`}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-[#666] hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl bg-[#0a0a0a]">
                        <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/5 text-[9px] font-black uppercase text-[#666] sticky top-0 bg-[#0a0a0a] z-10">
                            <div className="col-span-1 text-center">Sel</div>
                            <div className="col-span-4">Perfil</div>
                            <div className="col-span-3">Dueño</div>
                            <div className="col-span-2 text-center">Salud</div>
                            <div className="col-span-2 text-center">Score</div>
                        </div>
                        {filteredProfiles.length === 0 ? (
                            <div className="p-8 text-center text-[#444] text-xs uppercase italic">
                                No hay perfiles con este filtro
                            </div>
                        ) : (
                            filteredProfiles.map(p => (
                                <div key={p.id} onClick={() => toggleProfile(p.id)} className={`grid grid-cols-12 gap-2 p-3 border-b border-white/5 items-center hover:bg-white/5 cursor-pointer transition-colors ${selectedIds.includes(p.id) ? 'bg-[#00ff88]/5' : ''}`}>
                                    <div className="col-span-1 flex justify-center">
                                        <div className={`size-4 rounded border flex items-center justify-center ${selectedIds.includes(p.id) ? 'bg-[#00ff88] border-[#00ff88]' : 'border-white/20'}`}>
                                            {selectedIds.includes(p.id) && <CheckCircle2 size={12} className="text-black" />}
                                        </div>
                                    </div>
                                    <div className="col-span-4 font-bold text-white text-xs truncate">{p.name}</div>
                                    <div className="col-span-3 text-[10px] text-[#888] truncate">{p.owner || '-'}</div>
                                    <div className="col-span-2 flex justify-center">
                                        <span className={`text-[10px] font-bold ${p.health > 80 ? 'text-[#00ff88]' : 'text-red-500'}`}>{p.health}%</span>
                                    </div>
                                    <div className="col-span-2 flex justify-center gap-1">
                                        {(p.browserScore || 0) > 90 ? <Shield size={12} className="text-[#00ff88]" /> : <AlertTriangle size={12} className="text-amber-500" />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <div className="flex bg-black p-1 rounded-lg border border-white/10">
                            <button className="px-3 py-1 bg-[#00ff88] text-black text-[9px] font-black rounded uppercase">Login Directo</button>
                            <button className="px-3 py-1 text-[#666] text-[9px] font-black rounded uppercase hover:text-white">Normal</button>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleAll} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/5">
                                {selectedIds.length === filteredProfiles.length && filteredProfiles.length > 0 ? 'Nada' : 'Todos'}
                            </button>
                            <button
                                onClick={() => onStart(selectedIds)}
                                disabled={selectedIds.length === 0}
                                className="px-6 py-2 bg-[#00ff88] text-black font-black uppercase rounded-lg text-xs hover:bg-[#00cc6a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Play size={14} /> Iniciar ({selectedIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 7. CREATE PROFILE MODAL
export const CreateProfileModal = ({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (data: any) => void }) => {
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
        name: '', owner: '', bookie: '', country: '', proxyType: 'RESIDENTIAL', os: 'Windows', screen: '1920x1080'
    });

    if (!isOpen) return null;

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-2xl relative z-[90] p-8 shadow-2xl animate-fade-in-up flex flex-col">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white"><X size={20} /></button>

                <div className="mb-8">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Nuevo Perfil</h3>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-[#00ff88]' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>

                <div className="flex-1 space-y-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h4 className="text-sm font-black text-[#666] uppercase tracking-widest">1. Información General</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#666] uppercase">Nombre del Perfil</label>
                                    <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#00ff88] outline-none" placeholder="Ej: Bet365-ES-Jose" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#666] uppercase">Propietario</label>
                                    <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#00ff88] outline-none" placeholder="Nombre del dueño" value={formData.owner} onChange={e => setFormData({ ...formData, owner: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#666] uppercase">Casa de Apuestas</label>
                                    <select className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#00ff88] outline-none" value={formData.bookie} onChange={e => setFormData({ ...formData, bookie: e.target.value })}>
                                        <option value="">Seleccionar...</option>
                                        <option value="Bet365">Bet365</option>
                                        <option value="1xBet">1xBet</option>
                                        <option value="Betfair">Betfair</option>
                                        <option value="Pinnacle">Pinnacle</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h4 className="text-sm font-black text-[#666] uppercase tracking-widest">2. Configuración de Red</h4>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 border border-white/5 rounded-xl cursor-not-allowed opacity-50">
                                    <p className="text-xs text-[#666] mb-2 font-bold uppercase">Tipo de Proxy</p>
                                    <div className="flex gap-2">
                                        <div className="px-4 py-2 bg-[#00ff88]/20 text-[#00ff88] rounded-lg text-xs font-black uppercase border border-[#00ff88]/20">Residencial (Auto)</div>
                                        <div className="px-4 py-2 bg-black border border-white/10 text-[#666] rounded-lg text-xs font-black uppercase">Móvil 4G</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#666] uppercase">Ubicación IP</label>
                                    <select className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#00ff88] outline-none">
                                        <option>España (Automatica)</option>
                                        <option>Italia</option>
                                        <option>UK</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h4 className="text-sm font-black text-[#666] uppercase tracking-widest">3. Huella Digital</h4>
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 text-center">
                                <Fingerprint size={48} className="mx-auto text-[#00ff88] mb-4" />
                                <h3 className="text-lg font-black text-white italic">Generación Automática</h3>
                                <p className="text-xs text-[#666] mt-2 mb-6">El sistema configurará Canvas, WebGL y AudioContext automáticamente basado en la IP.</p>
                                <button onClick={() => window.open('https://adspower.com/config', '_blank')} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg text-xs uppercase transition-colors flex items-center gap-2 mx-auto border border-white/5">
                                    <ExternalLink size={14} /> Config en AdsPower
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-between">
                    {step > 1 ? (
                        <button onClick={handleBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase rounded-xl text-xs transition-colors">Atrás</button>
                    ) : <div />}

                    {step < 3 ? (
                        <button onClick={handleNext} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-black uppercase rounded-xl text-xs transition-colors flex items-center gap-2">
                            Siguiente <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button onClick={() => onCreate(formData)} className="px-8 py-3 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-black uppercase rounded-xl text-xs transition-colors shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                            Crear Perfil
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// 8. SYSTEM DIAGNOSTIC MODAL (NEW)
export const SystemDiagnosticModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;

    const services = [
        { name: 'Base de Datos', status: 'OK', latency: '2ms' },
        { name: 'API Gateway', status: 'OK', latency: '45ms' },
        { name: 'Proxy Manager', status: 'OK', latency: '120ms' },
        { name: 'Node Controller', status: 'OK', latency: '15ms' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg relative z-[110] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white"><X size={20} /></button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#00ff88]/10 text-[#00ff88] rounded-xl"><Activity size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter">Diagnóstico de Sistema</h3>
                        <p className="text-xs text-[#666]">Estado detallado de la infraestructura</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {services.map((svc, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="size-2 rounded-full bg-[#00ff88] animate-pulse" />
                                <span className="text-sm font-bold text-white">{svc.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs font-black text-[#00ff88]">OPERATIVO</span>
                                <span className="text-[10px] text-[#666] font-mono">{svc.latency}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-6 flex gap-3">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-blue-500">Todo parece correcto</p>
                        <p className="text-[10px] text-[#888] mt-1">El sistema responde dentro de los parámetros normales. No se detectan anomalías críticas.</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                        Ver Logs
                    </button>
                    <button onClick={onClose} className="flex-1 py-3 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-black rounded-xl text-xs uppercase transition-colors">
                        Cerrar Diagnóstico
                    </button>
                </div>
            </div>
        </div>
    );
};

// 9. RESOURCE DETAIL MODAL (NEW)
export const ResourceDetailModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-md relative z-[110] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white"><X size={20} /></button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Cpu size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter">Monitor de Recursos</h3>
                        <p className="text-xs text-[#666]">Consumo actual de hardware</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-[#666] uppercase mb-1">CPU Total</p>
                        <p className="text-2xl font-black text-[#00ff88]">42%</p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-[#666] uppercase mb-1">RAM Uso</p>
                        <p className="text-2xl font-black text-blue-500">12GB</p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-[#666] uppercase mb-1">Red</p>
                        <p className="text-2xl font-black text-amber-500">45mbps</p>
                    </div>
                </div>

                <h4 className="text-[10px] font-black text-[#666] uppercase mb-3">Mayores Consumidores</h4>
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center p-2 border-b border-white/5 text-xs text-[#ccc]">
                        <span>Node-01 (Main)</span>
                        <span className="font-mono text-red-500">85% CPU</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border-b border-white/5 text-xs text-[#ccc]">
                        <span>Node-04 (Incubator)</span>
                        <span className="font-mono text-amber-500">60% CPU</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border-b border-white/5 text-xs text-[#ccc]">
                        <span>DB Server</span>
                        <span className="font-mono text-[#00ff88]">15% CPU</span>
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                    Optimizar Memoria (GC)
                </button>
            </div>
        </div>
    );
};

// 10. JOB QUEUE MODAL (NEW)
export const JobQueueModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg relative z-[110] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white"><X size={20} /></button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-white/10 text-white rounded-xl"><Server size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter">Gestor de Tareas</h3>
                        <p className="text-xs text-[#666]">Cola de procesamiento en tiempo real</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="flex-1 p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                        <span className="block text-2xl font-black text-white">1</span>
                        <span className="text-[9px] uppercase text-[#666]">En Espera</span>
                    </div>
                    <div className="flex-1 p-4 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl text-center">
                        <span className="block text-2xl font-black text-[#00ff88]">8</span>
                        <span className="text-[9px] uppercase text-[#00ff88]">Procesando</span>
                    </div>
                    <div className="flex-1 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <span className="block text-2xl font-black text-red-500">0</span>
                        <span className="text-[9px] uppercase text-red-500">Fallidas</span>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 mb-6 h-40 overflow-y-auto custom-scrollbar space-y-2">
                    <p className="text-[10px] font-bold text-[#444] uppercase mb-2">Próximas Tareas</p>
                    <div className="flex justify-between items-center text-xs text-[#ccc] p-2 bg-white/5 rounded">
                        <span>Sync Odds #2912</span>
                        <span className="text-[10px] text-[#666]">Pendiente</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-[#ccc] p-2 bg-white/5 rounded">
                        <span>Health Check #991</span>
                        <span className="text-[10px] text-[#666]">Pendiente</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold rounded-xl border border-amber-500/20 text-xs uppercase transition-colors">
                        Pausar Cola
                    </button>
                    <button className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/20 text-xs uppercase transition-colors">
                        Limpiar Fallidos
                    </button>
                </div>
            </div>
        </div>
    );
};
