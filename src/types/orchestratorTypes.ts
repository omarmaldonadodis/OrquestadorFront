
// --- ORCHESTRATOR TYPES ---

export type NodeGroup = 'ELITE' | 'STANDARD' | 'INCUBATOR';
export type NodeStatus = 'ONLINE' | 'OFFLINE' | 'WARNING';
export type ProfileStatus = 'HEALTHY' | 'SLOW' | 'ERROR' | 'IDLE' | 'RUNNING' | 'WARMING';
export type ProxyType = 'SOAX-RES' | 'SOAX-MOB' | 'DATACENTER';

export interface ProxyInfo {
    ip: string;
    location: string;
    type: ProxyType;
    latency: number;
    rotationTime: number; // minutes remaining
}

export interface ComputerNode {
    id: string;
    name: string;
    group: NodeGroup;
    status: NodeStatus;
    openBrowsers: number;
    cpu: number;
    ram: number;
    uptime: string;
    lastUpdate: string;
}

export interface ProfileItem {
    id: string;
    adsId: string;
    name: string;
    group: NodeGroup;
    sport: 'Fútbol' | 'Tenis' | 'Basket' | 'Esports';
    bookie: string;
    status: ProfileStatus;
    health: number; // 0-100
    trustScore: number; // 0-100
    latency: number;
    memory: number; // MB
    nodeId: string;
    lastAction: string;
    proxy: ProxyInfo;
    owner?: string; // New field for AdsPower profile owner
    browserScore?: number; // 0-100
    fingerprintScore?: number; // 0-100
    cookieStatus?: 'OK' | 'EXPIRED' | 'MISSING';
}

export interface Alert {
    id: number;
    type: string;
    message: string;
    severity: 'Critical' | 'Warning' | 'Info';
    time: string;
    nodeId?: string;
    read: boolean;
}

export interface KPIStats {
    nodesOnline: number;
    nodesTotal: number;
    profilesActive: number;
    profilesTotal: number;
    browsersOpen: number;
    alertsActive: number;
    healthScore: number;
    healthRisks: string[];
}

export interface SystemEvent {
    id: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    message: string;
    source: string;
    timestamp: string;
}

export interface Job {
    id: string;
    name: string;
    type: 'PARALLEL' | 'BATCH' | 'SYNC';
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING';
    barrierStatus?: 'WAITING' | 'SYNCED' | 'TIMEOUT'; // PARALLEL SPECIFIC
    progress: number;
    totalTasks: number;
    completedTasks: number;
    startTime: string;
    logs: string[];
}

export interface BackupStatus {
    lastBackupTime: string;
    status: 'OK' | 'ERROR';
    nextBackupTime: string;
    size: string;
}

export interface AgentActionPayload {
    action: 'OPEN_BROWSER' | 'CLOSE_BROWSER' | 'ROTATE_PROXY';
    targetIds: string[]; // Profile IDs
    nodeId?: string;
    force?: boolean;
}

export interface ServiceStatus {
    name: string;
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    lastCheck: string;
    latency: number;
}

export interface ConnectionItem {
    id: string;
    url: string;
    status: 'OK' | 'WARN' | 'DOWN';
    latency: number;
    latencyHistory: number[];
    nodeId: string;
    sessionId?: string;
    lastChecked: string;
}
