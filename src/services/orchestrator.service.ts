
import { ComputerNode, ProfileItem, Alert, KPIStats } from '../types/orchestratorTypes';
import { MOCK_NODES, MOCK_PROFILES, MOCK_ALERTS } from './orchestratorMocks';

// CONSTANTS (Mock API URL)
const API_BASE = '/api/v1/orchestrator';

// SIMULATE DELAY
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class OrchestratorService {

    // --- DASHBOARD DATA ---
    async getDashboardStats(): Promise<KPIStats> {
        // In a real app: return httpClient.get(`${API_BASE}/stats`);
        await delay(500);
        return {
            nodesOnline: MOCK_NODES.filter(n => n.status === 'ONLINE').length,
            nodesTotal: MOCK_NODES.length,
            profilesActive: MOCK_PROFILES.length,
            profilesTotal: MOCK_PROFILES.length,
            browsersOpen: MOCK_NODES.reduce((acc, curr) => acc + curr.openBrowsers, 0),
            alertsActive: MOCK_ALERTS.filter(a => !a.read).length,
            healthScore: 92,
            healthRisks: ['High Latency Node-02', 'Proxy Rotation Fail']
        };
    }

    // --- NODES ---
    async getNodes(): Promise<ComputerNode[]> {
        await delay(600);
        return [...MOCK_NODES];
    }

    // --- PROFILES ---
    async getProfiles(): Promise<ProfileItem[]> {
        await delay(700);
        return [...MOCK_PROFILES];
    }

    // --- ALERTS ---
    async getAlerts(): Promise<Alert[]> {
        await delay(400);
        return [...MOCK_ALERTS];
    }

    // --- ACTIONS ---
    async executeAgentAction(action: 'OPEN' | 'CLOSE' | 'ROTATE', payload: { profileId: string, nodeId?: string }): Promise<{ success: boolean, message: string }> {
        console.log(`[OrchestratorService] Executing ${action}`, payload);
        await delay(1200); // Simulate network latency

        // Random simulated failure for QA testing
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
            return { success: true, message: `Action ${action} completed successfully.` };
        } else {
            throw new Error(`Failed to execute ${action}. Agent did not respond.`);
        }
    }

    async registerManualOpen(profileId: string): Promise<void> {
        console.log(`[OrchestratorService] Registering manual open for ${profileId}`);
        await delay(300);
    }

    // --- NEW METHODS FOR DASHBOARD EXPANSION ---
    async getSystemEvents(): Promise<import('../types/orchestratorTypes').SystemEvent[]> {
        await delay(300);
        return [
            { id: 'EV-1', type: 'SUCCESS', message: 'Backup diario completado', source: 'System', timestamp: '10:00 AM' },
            { id: 'EV-2', type: 'INFO', message: 'Agente-07 inició sesión', source: 'ELITE-MAIN-01', timestamp: '10:05 AM' },
            { id: 'EV-3', type: 'WARNING', message: 'Latencia alta detectada (400ms)', source: 'Node-02', timestamp: '10:15 AM' },
            { id: 'EV-4', type: 'ERROR', message: 'Fallo conexión proxy', source: 'Profile-X', timestamp: '10:20 AM' }
        ];
    }

    async getJobs(): Promise<import('../types/orchestratorTypes').Job[]> {
        await delay(300);
        return [
            { id: 'JOB-101', name: 'Sync Odds Batch A', type: 'BATCH', status: 'RUNNING', progress: 45, totalTasks: 100, completedTasks: 45, startTime: '09:00 AM', logs: ['Start batch', 'Processing item 45...'] },
            { id: 'JOB-102', name: 'Health Check Routine', type: 'SYNC', status: 'COMPLETED', progress: 100, totalTasks: 50, completedTasks: 50, startTime: '08:00 AM', logs: ['All checks passed'] },
            { id: 'JOB-103', name: 'Nav Parallel Session', type: 'PARALLEL', status: 'WAITING', progress: 0, totalTasks: 10, completedTasks: 0, startTime: 'Pending', logs: [] }
        ];
    }

    async getServicesStatus(): Promise<import('../types/orchestratorTypes').ServiceStatus[]> {
        await delay(300);
        return [
            { name: 'API Gateway', status: 'ONLINE', lastCheck: 'Just now', latency: 45 },
            { name: 'Worker Pool', status: 'ONLINE', lastCheck: '1m ago', latency: 120 },
            { name: 'Backup Scheduler', status: 'ONLINE', lastCheck: '5m ago', latency: 60 }
        ];
    }

    async getConnections(): Promise<import('../types/orchestratorTypes').ConnectionItem[]> {
        await delay(400);
        return [
            { id: 'CONN-1', url: 'https://api.bookie1.com', status: 'OK', latency: 120, latencyHistory: [100, 110, 120, 115, 120], nodeId: 'ELITE-MAIN-01', lastChecked: '10s ago' },
            { id: 'CONN-2', url: 'https://api.bookie2.com', status: 'WARN', latency: 350, latencyHistory: [200, 250, 300, 320, 350], nodeId: 'ELITE-MAIN-02', lastChecked: '5s ago' },
            { id: 'CONN-3', url: 'https://internal.auth.service', status: 'DOWN', latency: 0, latencyHistory: [50, 60, 0, 0, 0], nodeId: 'STD-NODE-04', lastChecked: '1m ago' }
        ];
    }

    async ackAlert(id: number): Promise<void> {
        await delay(200);
        console.log(`[OrchestratorService] Alert ${id} acknowledged`);
    }

    async getNodeHistory(nodeId: string): Promise<{ time: string, cpu: number, ram: number }[]> {
        await delay(300);
        // Generate mock trend
        return Array.from({ length: 20 }, (_, i) => ({
            time: `${10 + Math.floor(i / 2)}:${(i % 2) * 30}`,
            cpu: 20 + Math.random() * 30,
            ram: 40 + Math.random() * 20
        }));
    }
    // --- PART 2: NEW METHODS ---

    async getSessionHistory(sessionId: string): Promise<import('../types/orchestratorTypes').SystemEvent[]> {
        await delay(400);
        // Simulate history specific to this session
        return [
            { id: 'H-1', type: 'INFO', message: 'Session initialized', source: 'Orchestrator', timestamp: '09:00:00' },
            { id: 'H-2', type: 'SUCCESS', message: 'Browser opened', source: sessionId, timestamp: '09:00:05' },
            { id: 'H-3', type: 'INFO', message: 'Navigated to target', source: sessionId, timestamp: '09:00:15' },
            { id: 'H-4', type: 'WARNING', message: 'High memory usage detected', source: sessionId, timestamp: '09:30:00' }
        ];
    }

    async getBackups(): Promise<import('../types/orchestratorTypes').BackupStatus> {
        await delay(300);
        return {
            lastBackupTime: 'Today 04:00 AM',
            status: 'OK',
            nextBackupTime: 'Tomorrow 04:00 AM',
            size: '2.4 GB'
        };
    }

    async getCLIOptions(): Promise<string[]> {
        return [
            '$ ws-orch status --full',
            '$ ws-orch reset-nodes --force',
            '$ ws-orch logs --tail 100',
            '$ ws-orch sessions --active',
            '$ ws-orch backup --trigger-now'
        ];
    }
}

export const orchestratorService = new OrchestratorService();
