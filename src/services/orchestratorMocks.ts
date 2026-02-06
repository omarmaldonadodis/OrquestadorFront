
import { ComputerNode, ProfileItem, Alert, KPIStats } from '../types/orchestratorTypes';

// --- MOCK DATA ---

export const MOCK_NODES: ComputerNode[] = [
    { id: 'N-01', name: 'OPERADOR - ANGEL (LIDER)', group: 'ELITE', status: 'ONLINE', openBrowsers: 12, cpu: 45, ram: 60, uptime: '12d 4h', lastUpdate: '10s ago' },
    { id: 'N-02', name: 'OPERADOR - PAUL', group: 'ELITE', status: 'ONLINE', openBrowsers: 8, cpu: 30, ram: 45, uptime: '5d 12h', lastUpdate: '12s ago' },
    { id: 'N-03', name: 'OPERADOR - STALIN', group: 'STANDARD', status: 'OFFLINE', openBrowsers: 0, cpu: 0, ram: 0, uptime: '0s', lastUpdate: '5m ago' },
    { id: 'N-04', name: 'OPERADOR - ANGEL (INC)', group: 'INCUBATOR', status: 'WARNING', openBrowsers: 4, cpu: 92, ram: 88, uptime: '2d 1h', lastUpdate: '5s ago' },
];

export const MOCK_PROFILES: ProfileItem[] = [
    {
        id: 'P-01', adsId: 'j829x91', name: 'Bet365-ES-01', group: 'ELITE', sport: 'Fútbol', bookie: 'Bet365', status: 'RUNNING', health: 98, trustScore: 92,
        latency: 45, memory: 450, nodeId: 'ELITE-MAIN-01', lastAction: 'OPEN',
        owner: 'Jonathan Ayala - Loja', browserScore: 100, fingerprintScore: 98, cookieStatus: 'OK',
        proxy: { ip: '192.168.1.10', location: 'ES-Madrid', type: 'SOAX-MOB', latency: 45, rotationTime: 12 }
    },
    {
        id: 'P-02', adsId: 'k920a22', name: '1xBet-IT-05', group: 'ELITE', sport: 'Tenis', bookie: '1xBet', status: 'SLOW', health: 75, trustScore: 88,
        latency: 320, memory: 600, nodeId: 'ELITE-MAIN-02', lastAction: 'WARM',
        owner: 'Gabriel Guaman- Azoques', browserScore: 85, fingerprintScore: 90, cookieStatus: 'OK',
        proxy: { ip: '192.168.1.11', location: 'IT-Rome', type: 'SOAX-RES', latency: 320, rotationTime: 5 }
    },
    {
        id: 'P-03', adsId: 'm102z33', name: 'Pinny-UK-02', group: 'STANDARD', sport: 'Fútbol', bookie: 'Pinny', status: 'ERROR', health: 0, trustScore: 74,
        latency: 0, memory: 0, nodeId: 'N/A', lastAction: 'ERROR',
        owner: 'Josue Correa- Quito', browserScore: 60, fingerprintScore: 70, cookieStatus: 'MISSING',
        proxy: { ip: '10.0.0.5', location: 'UK-London', type: 'DATACENTER', latency: 0, rotationTime: 0 }
    },
    {
        id: 'P-04', adsId: 'x555y11', name: 'Betfair-ES-09', group: 'ELITE', sport: 'Fútbol', bookie: 'Betfair', status: 'IDLE', health: 100, trustScore: 95,
        latency: 60, memory: 0, nodeId: 'ELITE-MAIN-01', lastAction: 'CLOSE',
        owner: 'William Muñoz - Cuenca', browserScore: 100, fingerprintScore: 100, cookieStatus: 'OK',
        proxy: { ip: '192.168.1.12', location: 'ES-Barcelona', type: 'SOAX-MOB', latency: 60, rotationTime: 20 }
    },
    {
        id: 'P-05', adsId: 'z999q11', name: 'WilliamHill-01', group: 'ELITE', sport: 'Basket', bookie: 'WilliamHill', status: 'RUNNING', health: 95, trustScore: 90,
        latency: 55, memory: 410, nodeId: 'ELITE-MAIN-02', lastAction: 'OPEN',
        owner: 'Nicolas Ullauri - Loja', browserScore: 98, fingerprintScore: 95, cookieStatus: 'OK',
        proxy: { ip: '192.168.1.15', location: 'UK-Manchester', type: 'SOAX-RES', latency: 55, rotationTime: 15 }
    },
    {
        id: 'P-06', adsId: 'a111b22', name: 'Betway-MX-03', group: 'ELITE', sport: 'Tenis', bookie: 'Betway', status: 'RUNNING', health: 99, trustScore: 96,
        latency: 50, memory: 380, nodeId: 'ELITE-MAIN-01', lastAction: 'OPEN',
        owner: 'Paul Jimenez - Cuenca', browserScore: 100, fingerprintScore: 99, cookieStatus: 'OK',
        proxy: { ip: '192.168.1.20', location: 'MX-City', type: 'SOAX-MOB', latency: 50, rotationTime: 30 }
    },
    {
        id: 'P-07', adsId: 'c333d44', name: 'Betcris-EC-01', group: 'STANDARD', sport: 'Fútbol', bookie: 'Betcris', status: 'IDLE', health: 88, trustScore: 85,
        latency: 120, memory: 0, nodeId: 'ELITE-MAIN-02', lastAction: 'CLOSE',
        owner: 'David - Cuenca', browserScore: 90, fingerprintScore: 88, cookieStatus: 'OK',
        proxy: { ip: '192.168.1.25', location: 'EC-Quito', type: 'DATACENTER', latency: 120, rotationTime: 45 }
    },
    {
        id: 'P-08', adsId: 'e555f66', name: 'Coolbet-CL-02', group: 'ELITE', sport: 'Basket', bookie: 'Coolbet', status: 'RUNNING', health: 94, trustScore: 93,
        latency: 80, memory: 400, nodeId: 'ELITE-MAIN-01', lastAction: 'OPEN',
        owner: 'LUIS GUERRERO - Cuenca', browserScore: 96, fingerprintScore: 94, cookieStatus: 'OK',
        proxy: { ip: '192.168.1.30', location: 'CL-Santiago', type: 'SOAX-RES', latency: 80, rotationTime: 10 }
    },
    {
        id: 'P-09', adsId: 'g777h88', name: 'Betsson-PE-04', group: 'STANDARD', sport: 'Fútbol', bookie: 'Betsson', status: 'WARMING', health: 70, trustScore: 80,
        latency: 150, memory: 300, nodeId: 'ELITE-MAIN-02', lastAction: 'WARM',
        owner: 'Stalin Arauz- Quito', browserScore: 80, fingerprintScore: 75, cookieStatus: 'EXPIRED',
        proxy: { ip: '192.168.1.35', location: 'PE-Lima', type: 'DATACENTER', latency: 150, rotationTime: 60 }
    },
    {
        id: 'P-10', adsId: 'i999j00', name: 'Marathon-BR-01', group: 'ELITE', sport: 'Tenis', bookie: 'Marathon', status: 'IDLE', health: 97, trustScore: 95,
        latency: 65, memory: 0, nodeId: 'ELITE-MAIN-01', lastAction: 'CLOSE',
        owner: 'Adrian Cevallos - Manta', browserScore: 99, fingerprintScore: 98, cookieStatus: 'OK',
        proxy: { ip: '192.168.1.40', location: 'BR-SaoPaulo', type: 'SOAX-MOB', latency: 65, rotationTime: 25 }
    }
];

export const MOCK_ALERTS: Alert[] = [
    { id: 1, type: 'Nodo Offline', message: 'STD-BACKUP perdió conexión', severity: 'Critical', time: '5m ago', nodeId: 'N-03', read: false },
    { id: 2, type: 'Performance Degradado', message: 'INCUBATOR-A CPU > 90%', severity: 'Warning', time: '2m ago', nodeId: 'N-04', read: false },
    { id: 3, type: 'Latencia Alta', message: '1xBet-IT-05 proxy lento > 300ms', severity: 'Info', time: '10m ago', nodeId: 'N-02', read: true },
];

export const getOrchestratorData = async (): Promise<{ nodes: ComputerNode[], profiles: ProfileItem[], alerts: Alert[] }> => {
    // Simulate API delay
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                nodes: MOCK_NODES,
                profiles: MOCK_PROFILES,
                alerts: MOCK_ALERTS
            });
        }, 800);
    });
};
