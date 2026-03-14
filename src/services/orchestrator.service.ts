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
    const [metrics, computers, alerts, adminDash] = await Promise.all([
      fetchJSON(`${API}/metrics/dashboard`),
      fetchJSON(`${API}/computers/with-metrics`),
      fetchJSON(`${API}/alerts/?status=active&limit=100`),
      fetchJSON(`${API}/admin/dashboard`),
    ]);

    const onlineComputers = computers.items.filter((c: any) => c.status === 'ONLINE').length;
    const healthScore = _computeHealth(computers.items, alerts.items);

    return {
      nodesOnline:    onlineComputers,
      nodesTotal:     computers.total,
      profilesActive: adminDash.active_sessions,
      profilesTotal:  metrics.profiles?.total ?? 0,
      browsersOpen:   adminDash.active_sessions,
      alertsActive:   alerts.total,
      healthScore,
      healthRisks:    _extractRisks(computers.items, alerts.items),
    };
  }

  async getNodes() {
    const data = await fetchJSON(`${API}/computers/with-metrics`);
    return data.items.map((c: any) => ({
        id:             c.id.toString(),
        name:           c.name,
        hostname:       c.hostname,
        group:          c.group ?? 'DEFAULT',
        status:         c.status?.toUpperCase() ?? 'OFFLINE',
        uptime:         c.uptime ?? '—',
        // FIX: cpu/ram vienen como c.cpu y c.ram en /with-metrics (no cpu_percent/memory_percent)
        cpu:            Math.round(c.cpu_percent   ?? c.cpu  ?? 0),
        ram:            Math.round(c.memory_percent ?? c.ram  ?? 0),
        disk:           Math.round(c.disk_percent  ?? c.disk ?? 0),
        openBrowsers:   c.active_browsers_count ?? c.openBrowsers ?? c.open_browsers ?? 0,
        max_profiles:   c.max_profiles,
        adspower_api_url: c.adspower_api_url,
        ip_address:     c.ip_address,
        lastUpdate:     c.lastUpdate ?? c.last_update ?? '—',
        // FIX: pasar connected_since para que OrchestratorTerminal siembre connectedAtRef
        // Sin esto el uptime siempre muestra "0m" porque el ref nunca se inicializa
        connected_since_ts: c.connected_since
            ? new Date(c.connected_since).getTime()
            : null, 
    }));
  }

  async getNodeHistory(nodeId: string) {
    const data = await fetchJSON(`${API}/computers/${nodeId}/metrics?hours=2`);

    console.log('📊 HISTORY RAW:', JSON.stringify(data).slice(0, 500));


    // FIX: el endpoint puede devolver array directo o {items: [...]}
    const items: any[] = Array.isArray(data) ? data : (data.items ?? data.metrics ?? []);

    return items.map((h: any) => ({
        // Soportar ambos formatos: backend viejo (cpu_usage/memory_usage)
        // y backend nuevo (cpu_percent/memory_percent + campo "time" pre-formateado)
        time: h.time
            ?? (h.recorded_at ? new Date(h.recorded_at).toLocaleTimeString() : null)
            ?? (h.checked_at  ? new Date(h.checked_at).toLocaleTimeString()  : '—'),
        cpu:  Math.round(h.cpu  ?? h.cpu_percent    ?? h.cpu_usage    ?? 0),
        ram:  Math.round(h.ram  ?? h.memory_percent ?? h.memory_usage ?? 0),
    })).filter(pt => pt.cpu > 0 || pt.ram > 0); // descartar entradas fantasma (AdsPower sin datos del SO)
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
    await fetchJSON(`${API}/alerts/${id}/ack?acknowledged_by=admin`, { method: 'POST' });
  }

  async silenceAlert(id: number, minutes = 30) {
    await fetchJSON(`${API}/alerts/${id}/silence?minutes=${minutes}`, { method: 'POST' });
  }

  async getSystemEvents() {
    const data = await fetchJSON(`${API}/admin/activity-feed?limit=20`);
    return data.items;
  }

  async getServicesStatus() {
    const data = await fetchJSON(`${API}/health/system`);
    return mapServices(data.components);
  }

  async getConnections() {
    const data = await fetchJSON(`${API}/proxies/?status=active&limit=100`);
    return data.items.map(mapProxy);
  }

  async getBackups() {
    const data = await fetchJSON(`${API}/backups/`);
    const latest = data.items[0];
    return {
      lastBackupTime: latest?.created_at ? new Date(latest.created_at).toLocaleString() : 'Never',
      status:         latest ? 'OK' : 'UNKNOWN',
      nextBackupTime: 'Scheduled 04:00 AM',
      size:           latest ? `${latest.size_mb} MB` : '-',
    };
  }

  async getNodeLogs(nodeId: string) {
    const data = await fetchJSON(`${API}/computers/${nodeId}/logs?lines=50`);
    return data.logs ?? [];
  }

  async triggerBackup() {
    return fetchJSON(`${API}/backups/trigger`, { method: 'POST' });
  }

  async getNodeDiagnostics(computerId: number) {
    return fetchJSON(`${API}/computers/${computerId}/diagnostics`, { method: 'POST' });
  }

  async rotateAllProxies() {
    return fetchJSON(`${API}/proxy-rotation/check-and-rotate-all`, { method: 'POST' });
  }
  

  async openBrowser(params: {
    profileAdsId: string;
    computerId:   number;
    targetUrl?:   string;
    agentName:    string;
  }) {
    return fetchJSON(
      `${API}/agent/open-browser/direct?` +
      `profile_adspower_id=${params.profileAdsId}` +
      `&computer_id=${params.computerId}` +
      `&target_url=${encodeURIComponent(params.targetUrl ?? 'https://www.google.com')}` +
      `&agent_name=${encodeURIComponent(params.agentName)}`,
      { method: 'POST' }
    );
  }

  async openBrowserLocal(url: string) {
    return fetchJSON(
      `${API}/agent/open-browser?url=${encodeURIComponent(url)}`,
      { method: 'POST' }
    );
  }

  async createProfileWithProxy(data: {
    name:             string;
    owner:            string;
    bookie:           string;
    sport:            string;
    proxy_type:       'RESIDENTIAL' | 'MOBILE_4G' | 'DATACENTER';
    country:          string;
    city?:            string | null;
    rotation_minutes: number;
    warmup_urls:      string[];
    device_type:      'DESKTOP' | 'TABLET' | 'MOBILE';
    os:               string;
    screen_res:       string;
    language:         string;
    auto_fingerprint: boolean;
    open_on_create:   boolean;
  }) {
    return fetchJSON(`${API}/profiles/create-with-proxy`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
  }

  async createProfile(data: any) {
    if (data.proxy_type !== undefined) {
      return this.createProfileWithProxy(data);
    }
    return fetchJSON(`${API}/profiles/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
  }

  async verifyProfileSecurity(profileId: string) {
    return fetchJSON(`${API}/profiles/${profileId}/verify-security`, { method: 'POST' });
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

function mapServices(components: any) {
  return [
    { name: 'Database', status: components?.database?.healthy  ? 'ONLINE' : 'DEGRADED', latency: 2,   lastCheck: 'now' },
    { name: 'Redis',    status: components?.redis?.healthy     ? 'ONLINE' : 'DEGRADED', latency: 1,   lastCheck: 'now' },
    { name: 'Proxies',  status: components?.proxies?.avg_success_rate > 70 ? 'ONLINE' : 'DEGRADED', latency: 120, lastCheck: 'now' },
    { name: 'Agents',   status: components?.computers?.online > 0 ? 'ONLINE' : 'DEGRADED', latency: 45, lastCheck: 'now' },
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

function _computeHealth(nodes: any[], alerts: any[]): number {
  if (!nodes.length) return 0;
  const onlineRatio = nodes.filter(n => n.status === 'ONLINE').length / nodes.length;
  const criticalAlerts = (alerts ?? []).filter((a: any) =>
    (a.severity === 'critical' || a.severity === 'error') &&
    a.source !== 'proxy_rotation'
  );
  const alertPenalty = Math.min(criticalAlerts.length * 10, 40);
  return Math.max(0, Math.round(onlineRatio * 100 - alertPenalty));
}

function _extractRisks(nodes: any[], alerts: any[]): string[] {
  const risks: string[] = [];
  nodes.filter(n => n.cpu > 80).forEach(n => risks.push(`High CPU: ${n.name} (${n.cpu}%)`));
  nodes.filter(n => n.status !== 'ONLINE').forEach(n => risks.push(`Offline: ${n.name}`));
  alerts.filter(a => a.severity === 'critical').forEach(a => risks.push(a.type));
  return risks.slice(0, 5);
}

export const orchestratorService = new OrchestratorService();