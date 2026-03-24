import axios, { AxiosInstance } from 'axios';
import {
    ComputerNode,
    ProfileItem,
    Alert,
    KPIStats,
    SystemEvent,
    Job,
    ServiceStatus,
    ConnectionItem,
    BackupStatus
} from '../types/orchestratorTypes';
import { timeAgo } from '../utils/time';


const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const API = '/api/v1';


const fetchJSON = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};


class OrchestratorService {

  async getDashboardStats() {
    const [metrics, computers, alerts, adminDash, profiles, health, proxyStats] = await Promise.all([
      fetchJSON(`${API}/metrics/dashboard`),
      fetchJSON(`${API}/computers/with-metrics`),
      fetchJSON(`${API}/alerts/?status=active&limit=100`),
      fetchJSON(`${API}/admin/dashboard`),
      fetchJSON(`${API}/profiles/?limit=500`),
      fetchJSON(`${API}/health/system`).catch(() => ({ components: {} })),
      fetchJSON(`${API}/proxy-rotation/stats`).catch(() => ({ avg_latency_ms: 0, avg_success_rate: 0 })),
    ]);

    const onlineComputers = computers.items.filter((c: any) => c.status === 'ONLINE').length;
    const { score: healthScore, details: healthDetails } = _computeHealth(
      computers.items, alerts.items, health.components, proxyStats, adminDash.active_sessions ?? 0
    );
    const pendingProfiles = profiles.items.filter((p: any) => p.status === 'creating').length;

    return {
      nodesOnline:    onlineComputers,
      nodesTotal:     computers.total,
      profilesActive: adminDash.active_sessions,
      profilesTotal:  metrics.profiles?.total ?? 0,
      browsersOpen:   adminDash.active_sessions,
      alertsActive:   alerts.total,
      pendingProfiles,
      healthScore,
      healthDetails,
      healthRisks: _extractRisks(computers.items, alerts.items, health.components, proxyStats),
    };
  }

  async getNodes() {
    const data = await fetchJSON(`${API}/computers/with-metrics`);
    return data.items.map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      hostname: c.hostname,
      group: c.group ?? "DEFAULT",
      status: c.status?.toUpperCase() ?? "OFFLINE",
      uptime: c.uptime ?? "—",
      // FIX: cpu/ram vienen como c.cpu y c.ram en /with-metrics (no cpu_percent/memory_percent)
      cpu: Math.round(c.cpu_percent ?? c.cpu ?? 0),
      ram: Math.round(c.memory_percent ?? c.ram ?? 0),
      disk: Math.round(c.disk_percent ?? c.disk ?? 0),
      openBrowsers:
        c.active_browsers_count ?? c.openBrowsers ?? c.open_browsers ?? 0,
      max_profiles: c.max_profiles,
      adspower_api_url: c.adspower_api_url,
      ip_address: c.ip_address,
      lastUpdate: c.lastUpdate ?? c.last_update ?? "—",
      // FIX: pasar connected_since para que OrchestratorTerminal siembre connectedAtRef
      // Sin esto el uptime siempre muestra "0m" porque el ref nunca se inicializa
      connected_since_ts: c.connected_since
        ? new Date(c.connected_since).getTime()
        : null,
    }));
  }

  async getNodeHistory(nodeId: string) {
    const data = await fetchJSON(`${API}/computers/${nodeId}/metrics?hours=2`);

    console.log("📊 HISTORY RAW:", JSON.stringify(data).slice(0, 500));

    // FIX: el endpoint puede devolver array directo o {items: [...]}
    const items: any[] = Array.isArray(data)
      ? data
      : (data.items ?? data.metrics ?? []);

    return items
      .map((h: any) => ({
        // Soportar ambos formatos: backend viejo (cpu_usage/memory_usage)
        // y backend nuevo (cpu_percent/memory_percent + campo "time" pre-formateado)
        time:
          h.time ??
          (h.recorded_at
            ? new Date(h.recorded_at).toLocaleTimeString()
            : null) ??
          (h.checked_at ? new Date(h.checked_at).toLocaleTimeString() : "—"),
        cpu: Math.round(h.cpu ?? h.cpu_percent ?? h.cpu_usage ?? 0),
        ram: Math.round(h.ram ?? h.memory_percent ?? h.memory_usage ?? 0),
      }))
      .filter((pt) => pt.cpu > 0 || pt.ram > 0); // descartar entradas fantasma (AdsPower sin datos del SO)
  }

  async getProfiles() {
    const data = await fetchJSON(`${API}/profiles/?limit=500`);
    return data.items.map(mapProfile);
  }

  async getAlerts() {
    const data = await fetchJSON(`${API}/alerts/?limit=500`);
    return data.items.map(mapAlert);
  }

  async ackAlert(id: number) {
    await fetchJSON(`${API}/alerts/${id}/ack?acknowledged_by=admin`, {
      method: "POST",
    });
  }

  async silenceAlert(id: number, minutes = 30) {
    await fetchJSON(`${API}/alerts/${id}/silence?minutes=${minutes}`, {
      method: "POST",
    });
  }

  async getSystemEvents() {
    const data = await fetchJSON(`${API}/admin/activity-feed?limit=20`);
    return data.items;
  }

  async getServicesStatus() {
    const [health, proxyStats] = await Promise.all([
      fetchJSON(`${API}/health/system`),
      fetchJSON(`${API}/proxy-rotation/stats`).catch(() => ({
        avg_latency_ms: 0,
        avg_success_rate: 0,
      })),
    ]);
    return mapServices(health.components, proxyStats);
  }

  async getConnections() {
    const data = await fetchJSON(`${API}/proxies/?status=active&limit=100`);
    return data.items.map(mapProxy);
  }

  async getBackups() {
    const data = await fetchJSON(`${API}/backups/`);
    const latest = data.items[0];
    return {
      lastBackupTime: latest?.created_at
        ? new Date(latest.created_at).toLocaleString()
        : "Never",
      status: latest ? "OK" : "UNKNOWN",
      nextBackupTime: "Scheduled 04:00 AM",
      size: latest ? `${latest.size_mb} MB` : "-",
    };
  }

  async getNodeLogs(nodeId: string) {
    const data = await fetchJSON(`${API}/computers/${nodeId}/logs?lines=50`);
    return data.logs ?? [];
  }

  async triggerBackup() {
    return fetchJSON(`${API}/backups/trigger`, { method: "POST" });
  }

  async getNodeDiagnostics(computerId: number) {
    return fetchJSON(`${API}/computers/${computerId}/diagnostics`, {
      method: "POST",
    });
  }

  async rotateAllProxies(computerId?: string) {
    const params = computerId ? `?computer_id=${computerId}` : "";
    return fetchJSON(`${API}/proxy-rotation/check-and-rotate-all${params}`, {
      method: "POST",
    });
  }

  async openBrowser(params: {
    profileAdsId: string;
    computerId: number;
    targetUrl?: string;
    agentName: string;
  }) {
    return fetchJSON(
      `${API}/agent/open-browser/direct?` +
        `profile_adspower_id=${params.profileAdsId}` +
        `&computer_id=${params.computerId}` +
        `&target_url=${encodeURIComponent(params.targetUrl ?? "https://www.google.com")}` +
        `&agent_name=${encodeURIComponent(params.agentName)}`,
      { method: "POST" },
    );
  }

  async openBrowserLocal(url: string) {
    return fetchJSON(
      `${API}/agent/open-browser?url=${encodeURIComponent(url)}`,
      { method: "POST" },
    );
  }

  async createProfileWithProxy(data: {
    name: string;
    owner: string;
    bookie: string;
    sport: string;
    proxy_type: "RESIDENTIAL" | "MOBILE_4G" | "DATACENTER";
    country: string;
    city?: string | null;
    rotation_minutes: number;
    warmup_urls: string[];
    device_type: "DESKTOP" | "TABLET" | "MOBILE";
    os: string;
    screen_res: string;
    language: string;
    auto_fingerprint: boolean;
    open_on_create: boolean;
  }) {
    return fetchJSON(`${API}/profiles/create-with-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async createProfile(data: any) {
    if (data.proxy_type !== undefined) {
      return this.createProfileWithProxy(data);
    }
    return fetchJSON(`${API}/profiles/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async verifyProfileSecurity(profileId: string) {
    return fetchJSON(`${API}/profiles/${profileId}/verify-security`, {
      method: "POST",
    });
  }

  async verifyAllProfiles(computerId?: string) {
    const params = computerId ? `?computer_id=${computerId}` : "";
    return fetchJSON(`${API}/profiles/verify-all${params}`, {
      method: "POST",
    });
  }

  async getMyComputer() {
    return fetchJSON(`${API}/admin/my-computer`);
  }

  async cleanupStaleSessions(computerId?: string) {
    const params = computerId ? `?computer_id=${computerId}` : "";
    return fetchJSON(`${API}/admin/sessions/cleanup-stale${params}`, {
      method: "POST",
    });
  }
  async getProfileHistory(profileId: string) {
    return fetchJSON(`${API}/admin/sessions/by-profile/${profileId}?limit=20`);
  }

  async getActiveSessions() {
    return fetchJSON(`${API}/admin/sessions/active`);
  }

  async getProxyRotationHistory(proxyId: string) {
    return fetchJSON(`${API}/proxy-rotation/${proxyId}/history`);
  }
}

// ─── MAPPERS ────────────────────────────────────────────────────

function mapProfile(p: any) {
    return {
        id:               p.id.toString(),
        adsId:            p.adspower_id,
        name:             p.name,
        group:            p.tags?.includes('elite') ? 'ELITE' : 'STANDARD',
        sport:            p.sport ?? 'Fútbol',
        bookie:           p.bookie ?? '-',
        status:           mapProfileStatus(p.status),
        health:           p.health_score ?? 100,
        trustScore:       p.trust_score  ?? 100,
        latency:          p.avg_latency  ?? 0,
        memory:           p.memory_mb    ?? 0,
        nodeId:           p.computer_id?.toString() ?? 'N/A',
        lastAction:       p.last_action  ?? '-',
        proxy: {
            ip:           '-',
            location:     p.country ? `${p.country}` : 'N/A',
            type:         'SOAX-RES',
            latency:      0,
            rotationTime: p.rotation_minutes ?? 0,
        },
        owner:            p.owner            ?? '-',
        browserScore:     p.browser_score    ?? 0,
        fingerprintScore: p.fingerprint_score ?? 0,
        cookieStatus:     p.cookie_status    ?? 'MISSING',
        proxyId:          p.proxy_id         ?? null,   // ← para el join con ConnectionRow
    };
}
function mapAlert(a: any) {
  return {
    id:       a.id,
    type:     a.title,
    message:  a.message ?? '',
    severity: ({ critical: 'Critical', warning: 'Warning', info: 'Info', error: 'Critical' } as any)[a.severity] ?? 'Info',
    time:     timeAgo(a.created_at),
    nodeId:   a.source_id?.toString(),
    read:     a.status !== 'active',
  };
}

function mapServices(components: any, proxyStats?: any) {
  const proxySuccessRate = proxyStats?.avg_success_rate ?? 0;
  const soaxOnline = proxySuccessRate > 50;
  const soaxLatency = Math.round(proxyStats?.avg_latency_ms ?? 0);

  return [
    { name: 'Database', status: components?.database?.healthy  ? 'ONLINE' : 'DEGRADED', latency: 2,           lastCheck: 'now' },
    { name: 'Redis',    status: components?.redis?.healthy     ? 'ONLINE' : 'DEGRADED', latency: 1,           lastCheck: 'now' },
    { name: 'Proxies',  status: proxySuccessRate > 70          ? 'ONLINE' : 'DEGRADED', latency: soaxLatency, lastCheck: 'now' },
    { name: 'Agents',   status: components?.computers?.online > 0 ? 'ONLINE' : 'DEGRADED', latency: 45,      lastCheck: 'now' },
    { name: 'AdsPower', status: components?.adspower?.healthy  ? 'ONLINE' : 'DEGRADED', latency: 0,           lastCheck: 'now' },
    { name: 'SOAX',     status: soaxOnline                     ? 'ONLINE' : 'DEGRADED', latency: soaxLatency, lastCheck: 'now' },
  ];
}

function mapProxy(p: any) {
  return {
    id:             p.id.toString(),
    url:            `${p.host}:${p.port} (${p.city ?? p.country})`,
    status:         p.status === 'active' ? 'OK' : p.status === 'failed' ? 'DOWN' : 'WARN',
    latency:        p.avg_response_time ?? 0,
    latencyHistory: [],
    nodeId:         p.detected_city ?? p.country ?? '-',
    lastChecked:    timeAgo(p.last_check_at),
  };
}

function mapProfileStatus(s: string) {
  const map: any = { ready: 'IDLE', active: 'RUNNING', busy: 'RUNNING', warming: 'WARMING', error: 'ERROR', creating: 'IDLE' };
  return map[s] ?? 'IDLE';
}

// ─── REEMPLAZAR _computeHealth ───────────────────────────────────────────────

function _computeHealth(
  nodes: any[], alerts: any[],
  components: any = {}, proxyStats: any = {},
  activeSessions = 0,
): { score: number; details: import('../types/orchestratorTypes').HealthDetails } {

  // 1. NODE SCORE (30%)
  const nodesOnline = nodes.filter(n => n.status === 'ONLINE').length;
  const nodesTotal  = nodes.length;
  const nodeScore   = nodesTotal ? Math.round((nodesOnline / nodesTotal) * 100) : 0;

  // 2. PROXY SCORE (25%)
  const proxySuccessRate = proxyStats?.avg_success_rate ?? 0;
  const avgProxyLatency  = Math.round(proxyStats?.avg_latency_ms ?? 0);
  // Penalizar latencia > 500ms
  const latencyPenalty   = avgProxyLatency > 500 ? 20 : avgProxyLatency > 300 ? 10 : 0;
  const proxyScore       = Math.max(0, Math.min(100, Math.round(proxySuccessRate) - latencyPenalty));

  // 3. ALERT SCORE (20%)
  const criticalAlerts = (alerts ?? []).filter(
    (a: any) => (a.severity === 'critical' || a.severity === 'error') && a.source !== 'proxy_rotation'
  ).length;
  const warningAlerts = (alerts ?? []).filter((a: any) => a.severity === 'warning').length;
  const alertScore    = Math.max(0, 100 - criticalAlerts * 25 - warningAlerts * 8);

  // 4. ADSPOWER SCORE (15%)
  const adspowerHealthy = !!components?.adspower?.healthy;
  const adspowerScore   = adspowerHealthy ? 100 : 0;

  // 5. INFRA SCORE (10%) — DB + Redis
  const dbHealthy    = !!components?.database?.healthy;
  const redisHealthy = !!components?.redis?.healthy;
  const infraScore   = Math.round(((dbHealthy ? 1 : 0) + (redisHealthy ? 1 : 0)) / 2 * 100);

  const score = Math.max(0, Math.min(100, Math.round(
    nodeScore    * 0.30 +
    proxyScore   * 0.25 +
    alertScore   * 0.20 +
    adspowerScore* 0.15 +
    infraScore   * 0.10
  )));

  return {
    score,
    details: {
      nodeScore, proxyScore, alertScore, adspowerScore, infraScore,
      factors: {
        nodesOnline, nodesTotal,
        proxySuccessRate, avgProxyLatency,
        criticalAlerts, warningAlerts,
        adspowerHealthy, dbHealthy, redisHealthy,
        activeSessions,
      },
    },
  };
}

// ─── REEMPLAZAR _extractRisks ────────────────────────────────────────────────

function _extractRisks(nodes: any[], alerts: any[], components: any = {}, proxyStats: any = {}): string[] {
  const risks: string[] = [];

  // Nodos problemáticos
  nodes.filter(n => n.cpu > 80).forEach(n => risks.push(`CPU alta: ${n.name} (${n.cpu}%)`));
  nodes.filter(n => n.status !== 'ONLINE').forEach(n => risks.push(`Offline: ${n.name}`));

  // Proxies
  const successRate = proxyStats?.avg_success_rate ?? 100;
  if (successRate < 70) risks.push(`Proxies degradados — éxito: ${Math.round(successRate)}%`);
  const latency = proxyStats?.avg_latency_ms ?? 0;
  if (latency > 400) risks.push(`Latencia proxy alta: ${Math.round(latency)}ms`);

  // Servicios
  if (!components?.adspower?.healthy) risks.push('AdsPower no disponible en agente');
  if (!components?.database?.healthy) risks.push('Base de datos con errores');
  if (!components?.redis?.healthy)    risks.push('Redis no responde');

  // Alertas críticas
  alerts.filter(a => a.severity === 'critical').forEach(a => risks.push(a.title ?? a.type ?? 'Alerta crítica'));

  return risks.slice(0, 6);
}



export const orchestratorService = new OrchestratorService();