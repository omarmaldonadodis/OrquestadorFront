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
  // 204 No Content no tiene body — no intentar parsear JSON
  if (res.status === 204 || res.headers.get("content-length") === "0")
    return null;
  return res.json();
};

function getLocalIP(): Promise<string | null> {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]  // ← STUN público
    });
    pc.createDataChannel('');
    pc.createOffer().then(o => pc.setLocalDescription(o));
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const match = e.candidate.candidate.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
      if (match && !match[1].startsWith('0.')) {
        resolve(match[1]);
        pc.close();
      }
    };
    setTimeout(() => resolve(null), 4000);
  });
}

function getComputerId() {
  let id = localStorage.getItem("computer_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("computer_id", id);
  }

  return id;
}

class OrchestratorService {
  async getDashboardStats() {
    const [
      metrics,
      computers,
      alerts,
      adminDash,
      profiles,
      health,
      proxyStats,
    ] = await Promise.all([
      fetchJSON(`${API}/metrics/dashboard`),
      fetchJSON(`${API}/computers/with-metrics`),
      fetchJSON(`${API}/alerts/?status=active&limit=100`),
      fetchJSON(`${API}/admin/dashboard`),
      fetchJSON(`${API}/profiles/?limit=500`),
      fetchJSON(`${API}/health/system`).catch(() => ({ components: {} })),
      fetchJSON(`${API}/proxy-rotation/stats`).catch(() => ({
        avg_latency_ms: 0,
        avg_success_rate: 0,
      })),
    ]);

    const onlineComputers = computers.items.filter(
      (c: any) => c.status === "ONLINE",
    ).length;
    const { score: healthScore, details: healthDetails } = _computeHealth(
      computers.items,
      alerts.items,
      health.components,
      proxyStats,
      adminDash.active_sessions ?? 0,
    );
    const pendingProfiles = profiles.items.filter(
      (p: any) => p.status === "creating",
    ).length;

    return {
      nodesOnline: onlineComputers,
      nodesTotal: computers.total,
      profilesActive: adminDash.active_sessions,
      profilesTotal: metrics.profiles?.total ?? 0,
      browsersOpen: adminDash.active_sessions,
      alertsActive: alerts.total,
      pendingProfiles,
      healthScore,
      healthDetails,
      healthRisks: _extractRisks(
        computers.items,
        alerts.items,
        health.components,
        proxyStats,
      ),
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
  async getSessionPages(sessionId: number) {
    const data = await fetchJSON(`${API}/admin/sessions/${sessionId}/pages`);
    // Acepta { pages: [] } o array directo
    return Array.isArray(data) ? data : (data.pages ?? data.items ?? []);
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
      .filter((pt) => pt.cpu > 0 || pt.ram > 1); // descartar entradas fantasma (AdsPower sin datos del SO)
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
    const [health, proxyStats, soaxCheck] = await Promise.all([
      fetchJSON(`${API}/health/system`),
      fetchJSON(`${API}/proxy-rotation/stats`).catch(() => ({
        avg_latency_ms: 0,
        avg_success_rate: 0,
      })),
      // Verificar SOAX real: si devuelve ciudades = funciona, si no = roto
      fetchJSON(`${API}/proxies/soax/cities?country=es`).catch(() => ({
        cities: [],
      })),
    ]);
    return mapServices(health.components, proxyStats, soaxCheck.cities ?? []);
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

  // async rotateProxyForProfile(profileId: string) {
  //   return fetchJSON(`${API}/proxy-rotation/profile/${profileId}/rotate`, {
  //     method: "POST",
  //   });
  // }

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

  async getLocalAgent() {
    try {
      const res = await fetch("http://localhost:50320/whoami");
      console.log("Local agent response:", res.status, res.statusText);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return null;
    }
  }


  async getMyComputer() {
    const agent = await this.getLocalAgent();

    return fetchJSON(`${API}/admin/my-computer`, {
      headers: agent
        ? { "X-Computer-ID": agent.computer_id }
        : {},
    });
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
  async deleteProfile(profileId: string) {
    return fetchJSON(`${API}/profiles/${profileId}`, { method: "DELETE" });
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

// ─── mapServices ─────────────────────────────────────────────────────────────
// Cambios:
// - usa avg_success_rate directo del backend (ya calculado arriba)
// - lógica de Proxies y SOAX más clara y menos frágil
// - sin doble penalización latencia (ya la aplica _computeHealth)
 
function mapServices(components: any, proxyStats?: any, soaxCities: string[] = []) {
  const avgLatency    = Math.round(proxyStats?.avg_latency_ms    ?? 0);
  const successRate   = proxyStats?.avg_success_rate != null
    ? Number(proxyStats.avg_success_rate)
    : -1;   // -1 = sin datos aún
 
  // Proxies: ONLINE si success_rate >= 60% o aún no hay datos de check
  const proxiesOnline =
    successRate === -1
      ? (proxyStats?.active ?? 0) > 0          // sin historial → hay proxies activos
      : successRate >= 60 && avgLatency < 3000; // con historial → umbral real
 
  // SOAX API: ONLINE si devuelve ciudades
  const soaxOnline = soaxCities.length > 0;
 
  const agentsOnline = (components?.computers?.online ?? 0) > 0;
 
  return [
    { name: 'Database', status: components?.database?.healthy ? 'ONLINE' : 'DEGRADED', latency: 0,          lastCheck: 'now' },
    { name: 'Redis',    status: components?.redis?.healthy     ? 'ONLINE' : 'DEGRADED', latency: 0,          lastCheck: 'now' },
    { name: 'Proxies',  status: proxiesOnline                  ? 'ONLINE' : 'DEGRADED', latency: avgLatency, lastCheck: 'now' },
    { name: 'Agents',   status: agentsOnline                   ? 'ONLINE' : 'DEGRADED', latency: 0,          lastCheck: 'now' },
    { name: 'AdsPower', status: components?.adspower?.healthy  ? 'ONLINE' : 'DEGRADED', latency: 0,          lastCheck: 'now' },
    { name: 'SOAX',     status: soaxOnline                     ? 'ONLINE' : 'DEGRADED', latency: 0,          lastCheck: 'now' },
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

// ─── _computeHealth ─────────────────────────────────────────────────────────
// Cambios:
// - proxyScore ahora usa avg_success_rate real desde BD
// - hasRotationData usa `total` (total proxies) en vez del inexistente `total_checks`
// - penalización de latencia más fina (3 niveles)
// - nodeScore mínimo bajado de 70 a 50 (más honesto cuando hay muchos nodos offline)
 
function _computeHealth(
  nodes: any[], alerts: any[],
  components: any = {}, proxyStats: any = {},
  activeSessions = 0,
): { score: number; details: import('../types/orchestratorTypes').HealthDetails } {
 
  // 1. NODE SCORE (30%)
  const nodesOnline = nodes.filter(n => n.status === 'ONLINE').length;
  const nodesTotal  = nodes.length;
  const nodeScore =
    nodesTotal === 0 ? 0
    : nodesOnline === nodesTotal ? 100
    : Math.max(50, Math.round((nodesOnline / nodesTotal) * 100));
 
  // 2. PROXY SCORE (25%)
  // Ahora el backend devuelve avg_success_rate real (0-100).
  // Fallback: si no hay datos aún, calcular desde active/total.
  const totalProxies   = proxyStats?.total ?? 0;
  const activeProxies  = proxyStats?.active ?? 0;
  const avgSuccessRate: number =
    proxyStats?.avg_success_rate != null
      ? Number(proxyStats.avg_success_rate)
      : totalProxies > 0 ? Math.round(activeProxies / totalProxies * 100) : 50;
 
  const avgProxyLatency = Math.round(proxyStats?.avg_latency_ms ?? 0);
  // Penalización por latencia: escalonada
  const latencyPenalty =
    avgProxyLatency > 2000 ? 30
    : avgProxyLatency > 1500 ? 20
    : avgProxyLatency > 800  ? 10
    : 0;
  const proxyScore = Math.max(0, Math.min(100, Math.round(avgSuccessRate) - latencyPenalty));
 
  // 3. ALERT SCORE (20%)
  const criticalAlerts = (alerts ?? []).filter(
    (a: any) => (a.severity === 'critical' || a.severity === 'error')
              && a.source !== 'proxy_rotation'
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
    nodeScore     * 0.30 +
    proxyScore    * 0.25 +
    alertScore    * 0.20 +
    adspowerScore * 0.15 +
    infraScore    * 0.10
  )));
 
  return {
    score,
    details: {
      nodeScore, proxyScore, alertScore, adspowerScore, infraScore,
      factors: {
        nodesOnline, nodesTotal,
        proxySuccessRate: avgSuccessRate,
        avgProxyLatency,
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