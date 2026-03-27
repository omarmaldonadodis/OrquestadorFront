// src/hooks/useNodeDrawer.ts
import { useState, useRef, useCallback } from 'react';
import { ComputerNode } from '@/types/orchestratorTypes';
import { orchestratorService } from '@/services/orchestrator.service';

export function useNodeDrawer() {
    const [selectedNode, setSelectedNode] = useState<ComputerNode | null>(null);
    const [nodeHistory, setNodeHistory]   = useState<{ time: string; cpu: number; ram: number }[]>([]);
    const [nodeLogs, setNodeLogs]         = useState<{ timestamp: string; level: string; message: string }[]>([]);

    const selectedNodeRef         = useRef<ComputerNode | null>(null);
    const lastMetricLogRef        = useRef<Map<string, number>>(new Map());

    const openDrawer = useCallback(async (node: ComputerNode) => {
        selectedNodeRef.current = node;
        setSelectedNode(node);
        setNodeHistory([]);
        setNodeLogs([]);

        const [history, logsData] = await Promise.all([
            orchestratorService.getNodeHistory(node.id),
            orchestratorService.getNodeLogs(node.id),
        ]);
        setNodeHistory(history);
        setNodeLogs(logsData);
    }, []);

    const closeDrawer = useCallback(() => {
        setSelectedNode(null);
        selectedNodeRef.current = null;
    }, []);

    const appendMetric = useCallback((cid: string, cpu: number, ram: number) => {
        if (selectedNodeRef.current?.id.toString() !== cid) return;

        setNodeHistory(prev => {
            const point = { time: new Date().toLocaleTimeString(), cpu: Math.round(cpu), ram: Math.round(ram) };
            // Si history estaba vacío, arrancar con un punto previo para que la barra no aparezca sola
            const base = prev.length === 0 ? [point] : prev;
            return [...base.slice(-29), point];
        });

        const lastLog = lastMetricLogRef.current.get(cid) ?? 0;
        if (Date.now() - lastLog >= 30_000) {
            lastMetricLogRef.current.set(cid, Date.now());
            setNodeLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                level:     'INFO',
                message:   `cpu=${cpu.toFixed(1)}% mem=${ram.toFixed(1)}%`,
            }].slice(-100));
        }
    }, []);

    const appendLog = useCallback((cid: string, log: any) => {
        if (selectedNodeRef.current?.id.toString() !== cid) return;
        setNodeLogs(prev => [...prev, log].slice(-100));
    }, []);

    return {
        selectedNode, nodeHistory, nodeLogs,
        selectedNodeRef,
        openDrawer, closeDrawer, appendMetric, appendLog,
    };
}