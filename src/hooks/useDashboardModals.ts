// src/hooks/useDashboardModals.ts
import { useState } from 'react';
import { ServiceStatus, SystemEvent, ProfileItem, ConnectionItem, Alert } from '@/types/orchestratorTypes';

export function useDashboardModals() {
    const [dashModal, setDashModal]               = useState<{ type: string | null; data: any }>({ type: null, data: null });
    const [showHealthDetail, setShowHealthDetail] = useState(false);
    const [showSystemDiag, setShowSystemDiag]     = useState(false);
    const [showResourceDetail, setShowResourceDetail] = useState(false);
    const [showJobQueue, setShowJobQueue]         = useState(false);
    const [showDashFilters, setShowDashFilters]   = useState(false);
    const [selectedService, setSelectedService]   = useState<ServiceStatus | null>(null);
    const [selectedEvent, setSelectedEvent]       = useState<SystemEvent | null>(null);
    const [securityProfile, setSecurityProfile]   = useState<ProfileItem | null>(null);
    const [selectedConn, setSelectedConn]         = useState<ConnectionItem | null>(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showCreateProfile, setShowCreateProfile] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);


    const [selectedProfileHistoryId, setSelectedProfileHistoryId] = useState<string | null>(null);
    const [profileHistoryData, setProfileHistoryData]             = useState<SystemEvent[]>([]);

    return {
        dashModal, setDashModal,
        showHealthDetail, setShowHealthDetail,
        showSystemDiag, setShowSystemDiag,
        showResourceDetail, setShowResourceDetail,
        showJobQueue, setShowJobQueue,
        showDashFilters, setShowDashFilters,
        selectedService, setSelectedService,
        selectedEvent, setSelectedEvent,
        securityProfile, setSecurityProfile,
        selectedConn, setSelectedConn,
        showSessionModal, setShowSessionModal,
        showCreateProfile, setShowCreateProfile,
        selectedAlert, setSelectedAlert,
        selectedProfileHistoryId, setSelectedProfileHistoryId,
        profileHistoryData, setProfileHistoryData,
    };
}