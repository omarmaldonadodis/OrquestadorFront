
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
    connected_since_ts?: number | null;
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
    proxyId?: number;
    verifyResult?: VerifyResult;
}

export interface VerifyResult {
    browser_score:     number;
    fingerprint_score: number;
    cookie_status:     string;
    has_cookies:       boolean;
    cookie_count:      number;
    grade:             string;
    issues:            string[];
    warnings:          string[];
    error?:            string;
    breakdown?: {
        automation_clean: boolean | null;
        webrtc_clean:     boolean | null;
        webgl_real:       boolean | null;
        has_plugins:      boolean | null;
        has_cookies:      boolean | null;
        timezone_match:   boolean | null;
    };
    raw_fingerprint?: {
        userAgent:           string | null;
        platform:            string | null;
        timezone:            string | null;
        hardwareConcurrency: number | null;
        deviceMemory:        number | null;
        webdriver:           boolean | null;
        webrtcLeak:          boolean | null;
        automationProps:     string[];
    };
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

export interface HealthDetails {
  nodeScore: number; // 0-100
  proxyScore: number; // 0-100
  alertScore: number; // 0-100
  adspowerScore: number; // 0-100
  infraScore: number; // 0-100
  factors: {
    nodesOnline: number;
    nodesTotal: number;
    proxySuccessRate: number; // 0-100
    avgProxyLatency: number; // ms
    criticalAlerts: number;
    warningAlerts: number;
    adspowerHealthy: boolean;
    dbHealthy: boolean;
    redisHealthy: boolean;
    activeSessions: number;
  };
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
    healthDetails?: HealthDetails;
}

export interface SystemEvent {
    id:        string;
    type:      'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
    message:   string;
    source:    string;
    timestamp: string;
    meta?:     { session_id?: number };   // ← ADD
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