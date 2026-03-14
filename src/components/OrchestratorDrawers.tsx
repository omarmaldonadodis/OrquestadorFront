// src/components/OrchestratorDrawers.tsx
import React from 'react';
import {
    ComputerNode, Alert, SystemEvent, ConnectionItem, ProfileItem, ServiceStatus, Job, BackupStatus
} from '../types/orchestratorTypes';
import {
    X, Activity, Cpu, HardDrive, Terminal, Clock, Shield, AlertTriangle,
    History, Cookie, Fingerprint, Play, Pause, RefreshCw, Server,
    CheckCircle2, ChevronRight, Plus, ExternalLink, Info
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface NodeDrawerProps {
    node:    ComputerNode | null;
    history: { time: string; cpu: number; ram: number }[];
    logs:    { timestamp: string; level: string; message: string }[];
    onClose: () => void;
}

// ─── EVENT DETAIL MODAL ──────────────────────────────────────────────────────
// Fetch eliminado — el padre maneja la carga y pasa pages como prop

export const EventDetailModal = ({
    event,
    pages        = [],
    loadingPages = false,
    onClose,
}: {
    event:         SystemEvent | null;
    pages?:        { id: number; url: string; timestamp: string }[];
    loadingPages?: boolean;
    onClose:       () => void;
}) => {
    if (!event) return null;

    const proxyLog: string[] = (event as any).meta?.log ?? [];
    const hasProxyLog = proxyLog.length > 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-sm relative z-[110] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white">
                    <X size={20} />
                </button>

                <div className={`size-12 rounded-xl flex items-center justify-center mb-4 ${
                    event.type === 'SUCCESS' ? 'bg-[#00ff88]/10 text-[#00ff88]' :
                    event.type === 'ERROR'   ? 'bg-red-500/10 text-red-500'     :
                                               'bg-blue-500/10 text-blue-500'
                }`}>
                    <Activity size={24} />
                </div>

                <h3 className="text-lg font-black text-white italic mb-1">Detalle del Evento</h3>
                <p className="text-xs text-[#666] mb-4 font-mono">{event.timestamp}</p>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
                    <p className="text-sm font-bold text-white mb-2">{event.message}</p>
                    <p className="text-xs text-[#888] uppercase">Origen: {event.source}</p>
                </div>

                {/* PROXY LOG */}
                {hasProxyLog && (
                    <div className="mb-4">
                        <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <RefreshCw size={10} /> Detalle de proxies
                        </p>
                        <div className="bg-[#080808] border border-white/5 rounded-xl overflow-hidden">
                            <div className="max-h-44 overflow-y-auto custom-scrollbar">
                                {proxyLog.map((line, i) => {
                                    const isOk      = line.startsWith('✓');
                                    const isRotated = line.startsWith('↺');
                                    return (
                                        <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.04] last:border-0">
                                            <p className={`text-[10px] font-mono truncate flex-1 ${
                                                isOk      ? 'text-[#888]'   :
                                                isRotated ? 'text-blue-400' : 'text-red-400'
                                            }`}>
                                                {line.slice(2)}
                                            </p>
                                            <span className={`text-[9px] font-black uppercase shrink-0 px-1.5 py-0.5 rounded ${
                                                isOk      ? 'text-[#00ff88] bg-[#00ff88]/10' :
                                                isRotated ? 'text-blue-400 bg-blue-400/10'   :
                                                            'text-red-400 bg-red-400/10'
                                            }`}>
                                                {isOk ? 'OK' : isRotated ? 'ROTADO' : 'FALLO'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* PÁGINAS VISITADAS — datos vienen del padre */}
                {(loadingPages || pages.length > 0) && (
                    <div className="mb-4">
                        <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <History size={10} /> Páginas visitadas
                        </p>
                        <div className="bg-[#080808] border border-white/5 rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
                            {loadingPages ? (
                                <p className="text-[10px] text-[#444] animate-pulse p-3">Cargando...</p>
                            ) : pages.map((p, i) => (
                                <div key={p.id ?? i} className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.04] last:border-0">
                                    <p className="text-[10px] text-[#888] truncate flex-1">
                                        {(() => { try { return new URL(p.url).hostname; } catch { return p.url; } })()}
                                    </p>
                                    <p className="text-[9px] text-[#555] font-mono shrink-0">
                                        {new Date(p.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button onClick={onClose} className="w-full py-3 bg-[#00ff88] text-black font-black uppercase rounded-xl text-xs hover:bg-[#00cc6a] transition-colors">
                    Entendido
                </button>
            </div>
        </div>
    );
};

// ─── NODE ITEM DRAWER ────────────────────────────────────────────────────────

export const NodeItemDrawer = ({ node, history, logs, onClose }: NodeDrawerProps) => {
    const logsEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, [logs]);

    if (!node) return null;

    const isOnline = node.status === 'ONLINE';
    const maxCpu   = Math.max(...history.map(p => p.cpu), 1);
    const maxRam   = Math.max(...history.map(p => p.ram), 1);

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0c0c0c] border-l border-white/10 z-[70] shadow-2xl flex flex-col animate-slide-in-right">

                {/* HEADER */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-black text-white tracking-tighter italic">{node.name}</h2>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                isOnline ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-red-500/10 text-red-500'
                            }`}>
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

                    {/* CPU CHART */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest flex items-center gap-2">
                                <Cpu size={12} /> CPU Trend
                            </h3>
                            {history.length > 0 && (
                                <span className="text-[10px] font-mono text-[#555]">
                                    {history[history.length - 1].cpu}%
                                </span>
                            )}
                        </div>
                        {history.length === 0 ? (
                            <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-lg">
                                <p className="text-[10px] text-[#333] uppercase">Sin datos aún...</p>
                            </div>
                        ) : (
                            <div className="h-24 flex items-end gap-[2px] bg-[#080808] border border-white/5 rounded-lg px-2 pt-2 pb-1 overflow-hidden">
                                {history.map((pt, i) => {
                                    const heightPct = Math.max((pt.cpu / maxCpu) * 100, 4);
                                    const isLast    = i === history.length - 1;
                                    return (
                                        <div
                                            key={i}
                                            title={`${pt.time}: ${pt.cpu}%`}
                                            className={`flex-1 rounded-t-[2px] transition-all ${
                                                isLast
                                                    ? 'bg-[#3b82f6]'
                                                    : pt.cpu > 80 ? 'bg-red-500/70' : 'bg-[#3b82f6]/50'
                                            }`}
                                            style={{ height: `${heightPct}%` }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RAM CHART */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest flex items-center gap-2">
                                <HardDrive size={12} /> RAM Trend
                            </h3>
                            {history.length > 0 && (
                                <span className="text-[10px] font-mono text-[#555]">
                                    {history[history.length - 1].ram}%
                                </span>
                            )}
                        </div>
                        {history.length === 0 ? (
                            <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-lg">
                                <p className="text-[10px] text-[#333] uppercase">Sin datos aún...</p>
                            </div>
                        ) : (
                            <div className="h-24 flex items-end gap-[2px] bg-[#080808] border border-white/5 rounded-lg px-2 pt-2 pb-1 overflow-hidden">
                                {history.map((pt, i) => {
                                    const heightPct = Math.max((pt.ram / maxRam) * 100, 4);
                                    const isLast    = i === history.length - 1;
                                    return (
                                        <div
                                            key={i}
                                            title={`${pt.time}: ${pt.ram}%`}
                                            className={`flex-1 rounded-t-[2px] transition-all ${
                                                isLast
                                                    ? 'bg-purple-500'
                                                    : pt.ram > 85 ? 'bg-red-500/70' : 'bg-purple-500/50'
                                            }`}
                                            style={{ height: `${heightPct}%` }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* LOGS */}
                    <div>
                        <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Terminal size={12} /> Node Events
                        </h3>
                        <div className="space-y-1 font-mono text-[9px] bg-[#050505] p-4 rounded-lg border border-white/5 h-48 overflow-y-auto custom-scrollbar">
                            {logs.length === 0 ? (
                                <p className="text-[#444]">&gt; Sin logs disponibles...</p>
                            ) : (
                                logs.map((log, i) => (
                                    <p key={i} className={
                                        log.level === 'WARNING' ? 'text-amber-500' :
                                        log.level === 'ERROR'   ? 'text-red-500'   :
                                        log.level === 'SUCCESS' ? 'text-[#00ff88]' : 'text-[#666]'
                                    }>
                                        &gt; [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                                    </p>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                    <button className="w-full py-3 bg-[#00ff88] text-black font-black uppercase rounded-xl hover:bg-[#00cc6a] transition-colors text-xs flex items-center justify-center gap-2">
                        <Activity size={16} /> Run Diagnostics
                    </button>
                </div>
            </div>
        </>
    );
};

// ─── ALERT MODAL ─────────────────────────────────────────────────────────────

export const AlertModal = ({
    alert,
    onClose,
    onAck,
}: {
    alert:   Alert | null;
    onClose: () => void;
    onAck:   (id: number) => void;
}) => {
    if (!alert) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-md relative z-[90] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${
                        alert.severity === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
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
                    {alert.nodeId && (
                        <p className="text-[10px] text-[#555] font-mono mt-4 uppercase">Source: {alert.nodeId}</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                        Close
                    </button>
                    <button
                        onClick={() => { onAck(alert.id); onClose(); }}
                        className="flex-1 py-3 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-black rounded-xl text-xs uppercase transition-colors"
                    >
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── SESSION HISTORY MODAL ───────────────────────────────────────────────────
// Bug corregido: usaba `event` (singular) en lugar de `ev` dentro del .map()

export const SessionHistoryModal = ({
    isOpen,
    events,
    profileId,
    onClose,
}: {
    isOpen:    boolean;
    events:    SystemEvent[];
    profileId: string | null;
    onClose:   () => void;
}) => {
    if (!isOpen || !profileId) return null;

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
                        <p className="text-xs text-[#666] font-mono">Profile ID: {profileId}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 mb-6">
                    {events.length === 0 ? (
                        <div className="text-center py-8 text-[#444] text-xs font-bold uppercase">
                            No history events found
                        </div>
                    ) : (
                        events.map((ev, i) => (
                            <div key={ev.id} className="flex gap-4 relative">
                                <div className="flex flex-col items-center">
                                    <div className={`size-3 rounded-full border-2 border-[#0c0c0c] z-10 ${
                                        ev.type === 'SUCCESS' ? 'bg-[#00ff88]' :
                                        ev.type === 'ERROR'   ? 'bg-red-500'   : 'bg-blue-500'
                                    }`} />
                                    {i < events.length - 1 && (
                                        <div className="w-px flex-1 bg-white/10 my-1" />
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-[#ccc]">{ev.message}</p>
                                        <span className="text-[9px] text-[#555] font-mono shrink-0 ml-2">{ev.timestamp}</span>
                                    </div>
                                    <p className="text-[10px] text-[#666] mt-0.5 font-mono uppercase">
                                        {ev.type} • {ev.source}
                                    </p>

                                    {/* ✅ Bug corregido: ev en lugar de event */}
                                    {ev?.meta?.log && (ev.meta.log as string[]).length > 0 && (
                                        <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/5">
                                            <p className="text-[9px] font-black text-[#444] uppercase mb-2">Detalle por proxy</p>
                                            <div className="space-y-0.5 font-mono text-[10px]">
                                                {(ev.meta.log as string[]).map((line: string, li: number) => (
                                                    <div key={li} className={
                                                        line.startsWith('✓') ? 'text-green-500' :
                                                        line.startsWith('↺') ? 'text-blue-400'  : 'text-red-400'
                                                    }>
                                                        {line}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {ev?.meta?.message && (
                                        <p className="mt-2 text-xs text-[#888] font-mono">{ev.meta.message as string}</p>
                                    )}

                                    {ev.type === 'ERROR' && (
                                        <p className="mt-1 text-[9px] font-black text-red-500 uppercase flex items-center gap-1">
                                            <AlertTriangle size={10} /> Error en sesión
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── JOB DRAWER ──────────────────────────────────────────────────────────────

export const JobDrawer = ({ job, onClose }: { job: Job | null; onClose: () => void }) => {
    if (!job) return null;

    const isRunning   = job.status === 'RUNNING';
    const isFailed    = job.status === 'FAILED';

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-[#0c0c0c] border-l border-white/10 z-[70] shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-black text-white tracking-tighter italic">{job.name}</h2>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                isRunning ? 'bg-blue-500/10 text-blue-500' :
                                isFailed  ? 'bg-red-500/10 text-red-500'  :
                                            'bg-[#00ff88]/10 text-[#00ff88]'
                            }`}>
                                {job.status}
                            </span>
                        </div>
                        <p className="text-[10px] text-[#666] font-mono uppercase">{job.type} • {job.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-[#666] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-[#666] uppercase">Progress</span>
                            <span className="text-lg font-mono text-white">{job.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                            <div
                                className={`h-full rounded-full transition-all ${isFailed ? 'bg-red-500' : 'bg-[#00ff88]'}`}
                                style={{ width: `${job.progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-[#555] border-t border-white/5 pt-2">
                            <span>Tasks: {job.completedTasks}/{job.totalTasks}</span>
                            <span>Start: {job.startTime}</span>
                        </div>
                        {job.barrierStatus && (
                            <div className={`mt-4 p-3 rounded-lg border flex items-center gap-3 ${
                                job.barrierStatus === 'SYNCED'  ? 'bg-[#00ff88]/5 border-[#00ff88]/20 text-[#00ff88]' :
                                job.barrierStatus === 'TIMEOUT' ? 'bg-red-500/5 border-red-500/20 text-red-500'       :
                                                                   'bg-blue-500/5 border-blue-500/20 text-blue-500'
                            }`}>
                                <Activity size={16} />
                                <div>
                                    <p className="text-[10px] font-black uppercase">Barrier Status: {job.barrierStatus}</p>
                                    <p className="text-[9px] opacity-70">Waiting for all threads to synchronize...</p>
                                </div>
                            </div>
                        )}
                    </div>

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

                <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                    <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                        Download Report
                    </button>
                </div>
            </div>
        </>
    );
};

// ─── DASH KPI MODAL ──────────────────────────────────────────────────────────

export const DashKPIModal = ({
    type,
    data,
    onClose,
}: {
    type:    string | null;
    data:    any;
    onClose: () => void;
}) => {
    if (!type) return null;

    const getTitle = () => {
        switch (type) {
            case 'NODES':           return 'Computadoras Online';
            case 'PROFILES':        return 'Perfiles Activos';
            case 'BROWSERS':        return 'Navegadores Abiertos';
            case 'ALERTS':          return 'Alertas Activas';
            case 'NETWORK_MONITOR': return 'Monitor de Red (Proxy/IP)';
            default:                return 'Detalle';
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
                    {data && data.length > 0 ? (
                        data.map((item: any, i: number) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-white">{item.name || item.message || item.url}</p>
                                    <p className="text-[10px] text-[#666] uppercase">{item.status || item.severity || item.id}</p>
                                </div>
                                <div className="text-right">
                                    {type === 'NODES'    && <span className="text-[#00ff88] text-xs font-mono">{item.cpu}% CPU</span>}
                                    {type === 'PROFILES' && <span className="text-blue-500 text-xs font-mono">{item.memory}MB</span>}
                                    {type === 'ALERTS'   && <span className="text-red-500 text-xs font-bold">{item.severity}</span>}
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

// ─── DASH FILTERS DRAWER ─────────────────────────────────────────────────────

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
                                    className={`py-2 text-xs font-bold rounded border ${
                                        filters.timeRange === t
                                            ? 'bg-[#00ff88] text-black border-[#00ff88]'
                                            : 'bg-white/5 text-[#ccc] border-white/5'
                                    }`}
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
                            onChange={e => setFilters({ ...filters, severity: e.target.value })}
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
                            onChange={e => setFilters({ ...filters, owner: e.target.value })}
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
                            onChange={e => setFilters({ ...filters, cookieStatus: e.target.value })}
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

// ─── HEALTH DETAIL MODAL ─────────────────────────────────────────────────────

export const HealthDetailModal = ({
    isOpen,
    score,
    onClose,
}: {
    isOpen:  boolean;
    score:   number;
    onClose: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-md relative z-[90] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white">
                    <X size={20} />
                </button>

                <h3 className="text-lg font-black text-white italic mb-1">Detalle de Salud</h3>
                <p className="text-xs text-[#666] mb-6">Cálculo en tiempo real basado en 3 factores.</p>

                <div className="space-y-4 mb-6">
                    {[
                        { label: 'Tiempo de Respuesta',    value: '45ms',   color: 'text-[#00ff88]', impact: 'Alto' },
                        { label: 'Tasa de Errores',        value: '0.02%',  color: 'text-green-500', impact: 'Crítico' },
                        { label: 'Disponibilidad (Uptime)', value: '99.9%', color: 'text-[#00ff88]', impact: 'Medio' },
                    ].map(item => (
                        <div key={item.label} className="p-4 bg-white/5 rounded-xl flex justify-between items-center border border-white/5">
                            <span className="text-xs font-bold text-[#ccc]">{item.label}</span>
                            <div className="text-right">
                                <span className={`block font-mono font-bold ${item.color}`}>{item.value}</span>
                                <span className="text-[9px] text-[#555]">Impacto: {item.impact}</span>
                            </div>
                        </div>
                    ))}
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

// ─── SERVICE DETAIL MODAL ────────────────────────────────────────────────────

export const ServiceDetailModal = ({
    service,
    onClose,
}: {
    service: ServiceStatus | null;
    onClose: () => void;
}) => {
    if (!service) return null;

    const isOnline = service.status === 'ONLINE';

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg relative z-[90] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white">
                    <X size={20} />
                </button>

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
                        <span className={`text-xl font-mono font-bold ${service.latency < 100 ? 'text-[#00ff88]' : 'text-amber-500'}`}>
                            {service.latency}ms
                        </span>
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

// ─── SECURITY CHECK MODAL ────────────────────────────────────────────────────

export const SecurityCheckModal = ({
    profile,
    onClose,
    onVerify,
}: {
    profile:  ProfileItem | null;
    onClose:  () => void;
    onVerify: (id: string) => void;
}) => {
    if (!profile) return null;

    const browserScore     = profile.browserScore     || 0;
    const fingerprintScore = profile.fingerprintScore || 0;
    const isCookiesOk      = profile.cookieStatus === 'OK';

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-lg relative z-[90] p-6 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-blue-500/10 text-blue-500">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter">Seguridad & Cookies</h3>
                        <p className="text-xs text-[#666]">
                            Verificación de integridad para: <span className="text-white font-bold">{profile.name}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-xl border ${
                        browserScore >= 80 ? 'bg-[#00ff88]/5 border-[#00ff88]/20' :
                        browserScore >= 60 ? 'bg-amber-500/5 border-amber-500/20'  :
                                             'bg-red-500/5 border-red-500/20'
                    }`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase text-[#888]">Browser Score</span>
                            <Fingerprint size={16} className={
                                browserScore >= 80 ? 'text-[#00ff88]' :
                                browserScore >= 60 ? 'text-amber-500' : 'text-red-500'
                            } />
                        </div>
                        <p className={`text-3xl font-black ${
                            browserScore >= 80 ? 'text-[#00ff88]' :
                            browserScore >= 60 ? 'text-amber-500' : 'text-red-500'
                        }`}>
                            {browserScore}%
                        </p>
                        <p className="text-[9px] text-[#666] mt-1">Integridad de huella digital</p>
                    </div>

                    <div className={`p-4 rounded-xl border ${isCookiesOk ? 'bg-[#00ff88]/5 border-[#00ff88]/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase text-[#888]">Cookie Status</span>
                            <Cookie size={16} className={isCookiesOk ? 'text-[#00ff88]' : 'text-red-500'} />
                        </div>
                        <p className={`text-xl font-black mt-1 ${isCookiesOk ? 'text-[#00ff88]' : 'text-red-500'}`}>
                            {isCookiesOk ? 'ACTIVE' : 'EXPIRED'}
                        </p>
                        <p className="text-[9px] text-[#666] mt-2">Sesión persistente</p>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        {isCookiesOk && browserScore > 60
                            ? <CheckCircle2 size={16} className="text-[#00ff88]" />
                            : <AlertTriangle size={16} className="text-amber-500" />
                        }
                        <span className="text-xs text-[#ccc]">
                            {isCookiesOk && browserScore >= 60
                                ? 'Perfil verificado y seguro. Navega para subir el score'
                                : !isCookiesOk
                                    ? 'Acción Requerida: Actualizar Cookies'
                                    : `Score bajo (${browserScore}%) — Usar el perfil para subir score`
                            }
                        </span>
                    </div>
                    {(!isCookiesOk || browserScore < 60) && (
                        <div className="bg-red-500/10 text-red-500 text-[10px] p-2 rounded border border-red-500/20 font-bold uppercase">
                            Acción Requerida: {!isCookiesOk ? 'Actualizar Cookies' : 'Usar perfil para subir score'}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onVerify(profile.id)}
                        className="flex-1 py-3 bg-[#00ff88] text-black font-black uppercase text-xs rounded-xl hover:bg-[#00cc6a] transition-colors flex items-center justify-center gap-2"
                    >
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

// ─── SESSION START MODAL ─────────────────────────────────────────────────────

export const SessionStartModal = ({
    isOpen,
    onClose,
    profiles,
    onStart,
}: {
    isOpen:    boolean;
    onClose:   () => void;
    profiles:  ProfileItem[];
    onStart:   (ids: string[]) => void;
}) => {
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [filterMode, setFilterMode]   = React.useState<'ALL' | 'OWNER' | 'BOOKIE'>('ALL');
    const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

    const owners  = Array.from(new Set(profiles.map(p => p.owner).filter(Boolean))) as string[];
    const bookies = Array.from(new Set(profiles.map(p => p.bookie).filter(Boolean))) as string[];

    if (!isOpen) return null;

    const filteredProfiles = profiles.filter(p => {
        if (filterMode === 'ALL')   return true;
        if (filterMode === 'OWNER'  && activeFilter) return p.owner  === activeFilter;
        if (filterMode === 'BOOKIE' && activeFilter) return p.bookie === activeFilter;
        return true;
    });

    const toggleProfile = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSelectedIds(
            selectedIds.length === filteredProfiles.length ? [] : filteredProfiles.map(p => p.id)
        );
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-4xl relative z-[90] p-0 shadow-2xl animate-fade-in-up max-h-[85vh] flex overflow-hidden">

                {/* SIDEBAR */}
                <div className="w-1/3 bg-[#050505] border-r border-white/5 p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-black text-white italic tracking-tighter mb-1">Filtrar Por</h3>
                        <p className="text-[10px] text-[#666]">Selecciona el criterio de búsqueda</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex bg-black p-1 rounded-xl border border-white/10">
                            {(['OWNER', 'BOOKIE'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => { setFilterMode(mode); setActiveFilter(null); }}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-colors ${
                                        filterMode === mode ? 'bg-[#00ff88] text-black' : 'text-[#666] hover:text-white'
                                    }`}
                                >
                                    {mode === 'OWNER' ? 'Dueños' : 'Bookies'}
                                </button>
                            ))}
                        </div>
                        <div className="overflow-y-auto custom-scrollbar h-[300px] pr-2 space-y-1">
                            {filterMode === 'ALL' && (
                                <div className="p-4 text-center text-[#444] text-xs italic">
                                    Selecciona un modo arriba.
                                </div>
                            )}
                            {filterMode === 'OWNER' && owners.map(owner => (
                                <button
                                    key={owner}
                                    onClick={() => setActiveFilter(owner)}
                                    className={`w-full text-left p-3 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                                        activeFilter === owner
                                            ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]'
                                            : 'bg-white/5 border-transparent text-[#aaa] hover:bg-white/10'
                                    }`}
                                >
                                    {owner}
                                </button>
                            ))}
                            {filterMode === 'BOOKIE' && bookies.map(bookie => (
                                <button
                                    key={bookie}
                                    onClick={() => setActiveFilter(bookie)}
                                    className={`w-full text-left p-3 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                                        activeFilter === bookie
                                            ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]'
                                            : 'bg-white/5 border-transparent text-[#aaa] hover:bg-white/10'
                                    }`}
                                >
                                    {bookie}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MAIN */}
                <div className="flex-1 p-6 flex flex-col bg-[#0c0c0c]">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tighter">Perfiles Disponibles</h3>
                            <p className="text-xs text-[#666]">
                                {filterMode === 'ALL' ? 'Mostrando todos' : `Filtrado por: ${activeFilter || 'Ninguno'}`}
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
                        ) : filteredProfiles.map(p => (
                            <div
                                key={p.id}
                                onClick={() => toggleProfile(p.id)}
                                className={`grid grid-cols-12 gap-2 p-3 border-b border-white/5 items-center hover:bg-white/5 cursor-pointer transition-colors ${
                                    selectedIds.includes(p.id) ? 'bg-[#00ff88]/5' : ''
                                }`}
                            >
                                <div className="col-span-1 flex justify-center">
                                    <div className={`size-4 rounded border flex items-center justify-center ${
                                        selectedIds.includes(p.id) ? 'bg-[#00ff88] border-[#00ff88]' : 'border-white/20'
                                    }`}>
                                        {selectedIds.includes(p.id) && <CheckCircle2 size={12} className="text-black" />}
                                    </div>
                                </div>
                                <div className="col-span-4 font-bold text-white text-xs truncate">{p.name}</div>
                                <div className="col-span-3 text-[10px] text-[#888] truncate">{p.owner || '-'}</div>
                                <div className="col-span-2 flex justify-center">
                                    <span className={`text-[10px] font-bold ${p.health > 80 ? 'text-[#00ff88]' : 'text-red-500'}`}>
                                        {p.health}%
                                    </span>
                                </div>
                                <div className="col-span-2 flex justify-center gap-1">
                                    {(p.browserScore || 0) > 60
                                        ? <Shield size={12} className="text-[#00ff88]" />
                                        : <AlertTriangle size={12} className="text-amber-500" />
                                    }
                                </div>
                            </div>
                        ))}
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

// ─── CREATE PROFILE MODAL ────────────────────────────────────────────────────

export const CreateProfileModal = ({
    isOpen,
    onClose,
    onCreate,
}: {
    isOpen:   boolean;
    onClose:  () => void;
    onCreate: (data: any) => void;
}) => {
    const [step, setStep]           = React.useState(1);
    const [submitting, setSubmitting] = React.useState(false);
    const [form, setForm]           = React.useState({
        name: '', owner: '', bookie: 'Bet365', sport: 'Fútbol',
        proxyType: 'RESIDENTIAL', country: 'ES', city: '', rotationMinutes: 30,
        warmupUrls: 'https://www.google.com\nhttps://www.youtube.com',
        deviceType: 'DESKTOP', os: 'Windows', screenRes: '1920x1080',
        language: 'es-ES', autoFingerprint: true, openOnCreate: false,
    });

    const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

    const STEPS    = ['Info General', 'Proxy / Red', 'Dispositivo', 'Resumen'];
    const BOOKIES  = ['Bet365', '1xBet', 'Betfair', 'Pinnacle', 'William Hill', 'Bwin', 'Unibet', 'Codere', 'Betway'];
    const SPORTS   = ['Fútbol', 'Tenis', 'Baloncesto', 'Béisbol', 'Hockey', 'Fórmula 1', 'eSports'];
    const COUNTRIES = [
        { code: 'ES', name: '🇪🇸 España' }, { code: 'IT', name: '🇮🇹 Italia' },
        { code: 'GB', name: '🇬🇧 Reino Unido' }, { code: 'DE', name: '🇩🇪 Alemania' },
        { code: 'FR', name: '🇫🇷 Francia' }, { code: 'BR', name: '🇧🇷 Brasil' },
        { code: 'MX', name: '🇲🇽 México' }, { code: 'US', name: '🇺🇸 Estados Unidos' },
        { code: 'AR', name: '🇦🇷 Argentina' },
    ];
    const SCREENS_BY_DEVICE: Record<string, string[]> = {
        DESKTOP: ['1920x1080', '2560x1440', '1440x900', '1366x768'],
        TABLET:  ['1280x800', '1024x768', '768x1024'],
        MOBILE:  ['390x844', '414x896', '375x812', '360x780'],
    };

    const fieldCls = 'w-full bg-[#080808] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#00ff88] outline-none transition-colors';
    const labelCls = 'text-[10px] font-black text-[#555] uppercase tracking-widest';

    const canNext = () => {
        if (step === 1) return form.name.trim().length > 0 && form.owner.trim().length > 0;
        if (step === 2) return form.country.length > 0;
        return true;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onCreate({
                name: form.name, owner: form.owner, bookie: form.bookie, sport: form.sport,
                proxy_type: form.proxyType, country: form.country, city: form.city || null,
                rotation_minutes: form.rotationMinutes,
                warmup_urls: form.warmupUrls.split('\n').map(u => u.trim()).filter(Boolean),
                device_type: form.deviceType, os: form.os, screen_res: form.screenRes,
                language: form.language, auto_fingerprint: form.autoFingerprint,
                open_on_create: form.openOnCreate,
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-2xl relative z-[90] shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white z-10">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="p-8 pb-4">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter mb-4">Nuevo Perfil</h3>
                    <div className="flex gap-2 mb-1">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                step > i ? 'bg-[#00ff88]' : step === i + 1 ? 'bg-[#00ff88]/60' : 'bg-white/10'
                            }`} />
                        ))}
                    </div>
                    <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mt-2">
                        Paso {step} de {STEPS.length} — {STEPS[step - 1]}
                    </p>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-8 pb-2">

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelCls}>Nombre del Perfil *</label>
                                    <input className={fieldCls} placeholder="Ej: Bet365-ES-Jose" value={form.name} onChange={e => set('name', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Propietario *</label>
                                    <input className={fieldCls} placeholder="Nombre del dueño" value={form.owner} onChange={e => set('owner', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Casa de Apuestas</label>
                                    <select className={fieldCls} value={form.bookie} onChange={e => set('bookie', e.target.value)}>
                                        {BOOKIES.map(b => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Deporte</label>
                                    <select className={fieldCls} value={form.sport} onChange={e => set('sport', e.target.value)}>
                                        {SPORTS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className={labelCls}>Tipo de Proxy</label>
                                <div className="flex gap-2">
                                    {[
                                        { val: 'RESIDENTIAL', label: 'Residencial', desc: 'Mayor confianza' },
                                        { val: 'MOBILE_4G',   label: 'Móvil 4G',   desc: 'Anti-detección' },
                                        { val: 'DATACENTER',  label: 'Datacenter',  desc: 'Alta velocidad' },
                                    ].map(t => (
                                        <button
                                            key={t.val}
                                            onClick={() => set('proxyType', t.val)}
                                            className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                                                form.proxyType === t.val
                                                    ? 'border-[#00ff88]/50 bg-[#00ff88]/5'
                                                    : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                                            }`}
                                        >
                                            <p className={`text-xs font-black uppercase ${form.proxyType === t.val ? 'text-[#00ff88]' : 'text-white'}`}>{t.label}</p>
                                            <p className="text-[10px] text-[#555] mt-0.5">{t.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelCls}>País de la IP *</label>
                                    <select className={fieldCls} value={form.country} onChange={e => set('country', e.target.value)}>
                                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Ciudad (opcional)</label>
                                    <input className={fieldCls} placeholder="Ej: Madrid, Barcelona..." value={form.city} onChange={e => set('city', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={labelCls}>Rotación automática de IP</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[{ val: 0, label: 'Manual' }, { val: 10, label: '10 min' }, { val: 30, label: '30 min' }, { val: 60, label: '1 hora' }, { val: 120, label: '2 horas' }].map(r => (
                                        <button
                                            key={r.val}
                                            onClick={() => set('rotationMinutes', r.val)}
                                            className={`px-4 py-2 rounded-lg border text-xs font-black uppercase transition-all ${
                                                form.rotationMinutes === r.val
                                                    ? 'border-[#00ff88]/50 bg-[#00ff88]/10 text-[#00ff88]'
                                                    : 'border-white/10 bg-white/[0.02] text-[#666] hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={labelCls}>URLs de Warm-up (una por línea)</label>
                                <p className="text-[10px] text-[#444]">El navegador visitará estas URLs al crearse para generar historial natural.</p>
                                <textarea
                                    className={`${fieldCls} resize-none font-mono text-xs`}
                                    rows={4}
                                    value={form.warmupUrls}
                                    onChange={e => set('warmupUrls', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className={labelCls}>Tipo de Dispositivo</label>
                                <div className="flex gap-3">
                                    {[
                                        { val: 'DESKTOP', icon: '🖥️', label: 'Desktop' },
                                        { val: 'TABLET',  icon: '📱', label: 'Tablet' },
                                        { val: 'MOBILE',  icon: '📲', label: 'Mobile' },
                                    ].map(d => (
                                        <button
                                            key={d.val}
                                            onClick={() => {
                                                set('deviceType', d.val);
                                                if (d.val === 'MOBILE')  { set('os', 'Android'); set('screenRes', '390x844'); }
                                                if (d.val === 'TABLET')  { set('os', 'Android'); set('screenRes', '1280x800'); }
                                                if (d.val === 'DESKTOP') { set('os', 'Windows'); set('screenRes', '1920x1080'); }
                                            }}
                                            className={`flex-1 py-4 rounded-xl border text-center transition-all ${
                                                form.deviceType === d.val
                                                    ? 'border-[#00ff88]/50 bg-[#00ff88]/5'
                                                    : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="text-2xl mb-1">{d.icon}</div>
                                            <p className={`text-xs font-black uppercase ${form.deviceType === d.val ? 'text-[#00ff88]' : 'text-[#888]'}`}>{d.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelCls}>Sistema Operativo</label>
                                    <select className={fieldCls} value={form.os} onChange={e => set('os', e.target.value)}>
                                        {(form.deviceType === 'DESKTOP' ? ['Windows', 'macOS', 'Linux'] : ['Android', 'iOS'])
                                            .map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Resolución de Pantalla</label>
                                    <select className={fieldCls} value={form.screenRes} onChange={e => set('screenRes', e.target.value)}>
                                        {(SCREENS_BY_DEVICE[form.deviceType] || []).map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Idioma del Navegador</label>
                                    <select className={fieldCls} value={form.language} onChange={e => set('language', e.target.value)}>
                                        {['es-ES', 'es-MX', 'en-US', 'en-GB', 'it-IT', 'de-DE', 'fr-FR', 'pt-BR'].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className={labelCls}>Opciones</label>
                                {[
                                    { key: 'autoFingerprint', label: 'Huella digital automática', desc: 'Canvas, WebGL y AudioContext generados basados en la IP asignada' },
                                    { key: 'openOnCreate',    label: 'Abrir navegador al crear',  desc: 'Lanza el navegador en la primera computadora disponible' },
                                ].map(opt => (
                                    <label key={opt.key} className="flex items-start gap-3 cursor-pointer group">
                                        <div
                                            className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-all ${
                                                (form as any)[opt.key]
                                                    ? 'bg-[#00ff88] border-[#00ff88]'
                                                    : 'border-white/20 bg-white/5 group-hover:border-white/40'
                                            }`}
                                            onClick={() => set(opt.key, !(form as any)[opt.key])}
                                        >
                                            {(form as any)[opt.key] && (
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{opt.label}</p>
                                            <p className="text-[10px] text-[#555]">{opt.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl p-4">
                                <p className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-3">Resumen de configuración</p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                    {[
                                        ['Perfil',       form.name],
                                        ['Propietario',  form.owner],
                                        ['Bookie',       form.bookie],
                                        ['Deporte',      form.sport],
                                        ['Proxy',        form.proxyType.replace('_', ' ')],
                                        ['País / Ciudad', `${form.country}${form.city ? ' / ' + form.city : ''}`],
                                        ['Rotación IP',  form.rotationMinutes === 0 ? 'Manual' : `${form.rotationMinutes} min`],
                                        ['Dispositivo',  `${form.deviceType} · ${form.os}`],
                                        ['Resolución',   form.screenRes],
                                        ['Idioma',       form.language],
                                        ['URLs warm-up', `${form.warmupUrls.split('\n').filter(Boolean).length} URL(s)`],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between border-b border-white/5 py-1">
                                            <span className="text-[#555] font-bold">{k}</span>
                                            <span className="text-white font-black truncate max-w-[120px]">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {form.openOnCreate && (
                                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <Play size={14} className="text-blue-400 flex-shrink-0" />
                                    <p className="text-xs text-blue-300">El navegador se abrirá automáticamente en la primera computadora online.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 pt-4 flex justify-between items-center border-t border-white/5 mt-4">
                    {step > 1 ? (
                        <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase rounded-xl text-xs transition-colors">
                            ← Atrás
                        </button>
                    ) : <div />}

                    {step < 4 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canNext()}
                            className={`px-8 py-3 font-black uppercase rounded-xl text-xs transition-all flex items-center gap-2 ${
                                canNext() ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-[#444] cursor-not-allowed'
                            }`}
                        >
                            Siguiente <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-8 py-3 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-black uppercase rounded-xl text-xs transition-colors shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <><RefreshCw size={14} className="animate-spin" /> Creando...</> : '✓ Crear Perfil'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── SYSTEM DIAGNOSTIC MODAL ─────────────────────────────────────────────────

export const SystemDiagnosticModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    const services = [
        { name: 'Base de Datos',   latency: '2ms' },
        { name: 'API Gateway',     latency: '45ms' },
        { name: 'Proxy Manager',   latency: '120ms' },
        { name: 'Node Controller', latency: '15ms' },
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
                        <p className="text-[10px] text-[#888] mt-1">El sistema responde dentro de los parámetros normales.</p>
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

// ─── RESOURCE DETAIL MODAL ───────────────────────────────────────────────────

export const ResourceDetailModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
                    {[
                        { label: 'CPU Total', value: '42%',    color: 'text-[#00ff88]' },
                        { label: 'RAM Uso',   value: '12GB',   color: 'text-blue-500' },
                        { label: 'Red',       value: '45mbps', color: 'text-amber-500' },
                    ].map(m => (
                        <div key={m.label} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-center">
                            <p className="text-[10px] font-bold text-[#666] uppercase mb-1">{m.label}</p>
                            <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                        </div>
                    ))}
                </div>
                <h4 className="text-[10px] font-black text-[#666] uppercase mb-3">Mayores Consumidores</h4>
                <div className="space-y-2 mb-6">
                    {[
                        { name: 'Node-01 (Main)',       value: '85% CPU', color: 'text-red-500' },
                        { name: 'Node-04 (Incubator)',  value: '60% CPU', color: 'text-amber-500' },
                        { name: 'DB Server',            value: '15% CPU', color: 'text-[#00ff88]' },
                    ].map(item => (
                        <div key={item.name} className="flex justify-between items-center p-2 border-b border-white/5 text-xs text-[#ccc]">
                            <span>{item.name}</span>
                            <span className={`font-mono ${item.color}`}>{item.value}</span>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 text-xs uppercase transition-colors">
                    Optimizar Memoria (GC)
                </button>
            </div>
        </div>
    );
};

// ─── JOB QUEUE MODAL ─────────────────────────────────────────────────────────

export const JobQueueModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
                    {[
                        { val: '1', label: 'En Espera',   cls: 'bg-white/5 border-white/5 text-white' },
                        { val: '8', label: 'Procesando',  cls: 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]' },
                        { val: '0', label: 'Fallidas',    cls: 'bg-red-500/10 border-red-500/20 text-red-500' },
                    ].map(item => (
                        <div key={item.label} className={`flex-1 p-4 border rounded-xl text-center ${item.cls}`}>
                            <span className="block text-2xl font-black">{item.val}</span>
                            <span className="text-[9px] uppercase">{item.label}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 mb-6 h-40 overflow-y-auto custom-scrollbar space-y-2">
                    <p className="text-[10px] font-bold text-[#444] uppercase mb-2">Próximas Tareas</p>
                    {[{ name: 'Sync Odds #2912' }, { name: 'Health Check #991' }].map(t => (
                        <div key={t.name} className="flex justify-between items-center text-xs text-[#ccc] p-2 bg-white/5 rounded">
                            <span>{t.name}</span>
                            <span className="text-[10px] text-[#666]">Pendiente</span>
                        </div>
                    ))}
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

// ─── PROXY HISTORY MODAL ─────────────────────────────────────────────────────
// Fetch eliminado — el padre maneja la carga y pasa logs como prop

export const ProxyHistoryModal = ({
    conn,
    logs    = [],
    loading = false,
    onClose,
}: {
    conn:     ConnectionItem | null;
    logs?:    any[];
    loading?: boolean;
    onClose:  () => void;
}) => {
    if (!conn) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-md relative z-[110] p-6 shadow-2xl animate-fade-in-up flex flex-col max-h-[80vh]">
                <button onClick={onClose} className="absolute right-4 top-4 text-[#666] hover:text-white">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-1">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                        <RefreshCw size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white italic">Historial de Rotación</h3>
                        <p className="text-[10px] text-[#555] font-mono">{conn.url}</p>
                    </div>
                </div>

                <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-4 ml-1">
                    {logs.length} rotaciones registradas
                </p>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-12 text-center">
                            <p className="text-[10px] text-[#444] animate-pulse uppercase tracking-widest">Cargando...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-white/5 rounded-xl">
                            <RefreshCw size={20} className="text-[#333] mx-auto mb-2" />
                            <p className="text-[10px] text-[#333] uppercase">Sin rotaciones registradas</p>
                        </div>
                    ) : (
                        <div className="border border-white/5 rounded-xl overflow-hidden">
                            {logs.map((log, i) => (
                                <div key={log.id ?? i} className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <div className={`shrink-0 size-7 rounded-lg flex items-center justify-center mt-0.5 ${
                                        log.success ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                        {log.success ? <RefreshCw size={12} /> : <AlertTriangle size={12} />}
                                    </div>
                                    <div className="flex-1">
                                        {log.success ? (
                                            <>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] text-[#888] font-mono break-all">{log.old_proxy}</span>
                                                    <span className="text-[10px] text-blue-400 font-mono break-all">{log.new_proxy}</span>
                                                </div>
                                                {log.latency_ms && (
                                                    <p className="text-[9px] text-[#555] mt-0.5">
                                                        latencia previa: {Math.round(log.latency_ms)}ms
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-[10px] font-black text-red-400 uppercase">Falló</p>
                                                <p className="text-[9px] text-[#555] mt-0.5 font-mono truncate">
                                                    {log.error_message ?? 'Error desconocido'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[9px] text-[#555] font-mono">
                                            {new Date(log.rotated_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-[9px] text-[#444] font-mono">
                                            {new Date(log.rotated_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={onClose} className="mt-4 w-full py-3 bg-[#00ff88] text-black font-black uppercase rounded-xl text-xs hover:bg-[#00cc6a] transition-colors">
                    Entendido
                </button>
            </div>
        </div>
    );
};