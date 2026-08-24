import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useTelemetryHistory } from '../hooks/useTelemetry';
import { useAlerts } from '../hooks/useAlerts';
import { useSocket } from '../hooks/useSocket';
import Sidebar from '../components/Sidebar';
import FleetMap from '../components/FleetMap';
import NavRail, { type NavRailPanel } from '../components/NavRail';

interface Vehicle {
  id: string;
  name: string;
  status: string;
  currentRoute: string | null;
  configProfileId: string | null;
  configProfile?: { id: string; name: string; tempMin: number; tempMax: number; heartbeatIntervalSecs: number } | null;
  active: boolean;
  createdAt: string;
}

interface VehicleWithLocation extends Vehicle {
  latitude?: number;
  longitude?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: vehicles } = useVehicles();
  const { data: alerts } = useAlerts();
  const { telemetry: socketTelemetry, status: socketStatus } = useSocket();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'degraded' | 'offline' | 'pending'>('all');

  const [liveTelemetryMap, setLiveTelemetryMap] = useState<Record<string, any>>({});
  const [liveStatusMap, setLiveStatusMap] = useState<Record<string, string>>({});
  const [degradedSinceMap, setDegradedSinceMap] = useState<Record<string, number>>({});

  // Active panel state for NavRail (alerts | history | settings | null)
  const [activePanel, setActivePanel] = useState<NavRailPanel>(null);

  // Initialize degradedSinceMap for vehicles already in degraded state
  useEffect(() => {
    if (vehicles) {
      const now = Date.now();
      const initialMap: Record<string, number> = {};
      vehicles.forEach((vehicle) => {
        if (vehicle.status === 'degraded' && !degradedSinceMap[vehicle.id]) {
          initialMap[vehicle.id] = now - 300000;
        }
      });
      if (Object.keys(initialMap).length > 0) {
        setDegradedSinceMap((prev) => ({ ...prev, ...initialMap }));
      }
    }
  }, [vehicles]);

  const selectedVehicle = vehicles?.find((v) => v.id === selectedVehicleId);
  const { data: telemetry } = useTelemetryHistory(selectedVehicleId || '', 50);

  // Update live telemetry from socket event
  useEffect(() => {
    if (socketTelemetry && socketTelemetry.vehicleId) {
      setLiveTelemetryMap((prev) => ({
        ...prev,
        [socketTelemetry.vehicleId]: socketTelemetry,
      }));
    }
  }, [socketTelemetry]);

  // Update live status from socket event
  useEffect(() => {
    if (socketStatus && socketStatus.vehicleId) {
      setLiveStatusMap((prev) => ({
        ...prev,
        [socketStatus.vehicleId]: socketStatus.status,
      }));

      // Track when vehicle enters degraded state
      if (socketStatus.status === 'degraded' && !degradedSinceMap[socketStatus.vehicleId]) {
        setDegradedSinceMap((prev) => ({
          ...prev,
          [socketStatus.vehicleId]: Date.now(),
        }));
      }

      // Clear degraded timestamp when vehicle recovers
      if (socketStatus.status !== 'degraded') {
        setDegradedSinceMap((prev) => {
          const next = { ...prev };
          delete next[socketStatus.vehicleId];
          return next;
        });
      }
    }
  }, [socketStatus, degradedSinceMap]);

  // Get latest telemetry for all vehicles to add location data
  const vehiclesWithLocation: VehicleWithLocation[] = useMemo(() => {
    const seenIds = new Set<string>();
    return (vehicles || []).reduce<VehicleWithLocation[]>((acc, vehicle) => {
      if (seenIds.has(vehicle.id)) return acc;
      seenIds.add(vehicle.id);

      const currentStatus = liveStatusMap[vehicle.id] || vehicle.status;
      const liveTel = liveTelemetryMap[vehicle.id];
      const backendTel = (vehicle as any).telemetry?.[0];

      acc.push({
        ...vehicle,
        status: currentStatus,
        latitude: liveTel?.latitude ?? backendTel?.latitude,
        longitude: liveTel?.longitude ?? backendTel?.longitude,
      });
      return acc;
    }, []);
  }, [vehicles, liveStatusMap, liveTelemetryMap]);

  // Convert live telemetry map to array for Sidebar
  const allTelemetry = useMemo(() => {
    return Object.entries(liveTelemetryMap).map(([vehicleId, data]) => ({
      id: data.id || `${vehicleId}-live`,
      vehicleId,
      timestamp: data.timestamp || new Date().toISOString(),
      temperature: data.temperature,
      latitude: data.latitude,
      longitude: data.longitude,
      doorOpen: data.doorOpen || false,
    }));
  }, [liveTelemetryMap]);

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  const handleVehicleDeselect = () => {
    setSelectedVehicleId(null);
  };

  const handleBack = () => {
    setSelectedVehicleId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const filteredVehicles = vehiclesWithLocation.filter((vehicle) => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort vehicles: offline first, then degraded, then online, then pending, then name
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    const statusPriority = { offline: 0, degraded: 1, online: 2, pending: 3 };
    const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 3;
    const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-bg-base)]">
      {/* Full-bleed Map */}
      <div className="absolute inset-0 w-full h-full z-0">
        <FleetMap
          vehicles={sortedVehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleSelect={handleVehicleSelect}
          onVehicleDeselect={handleVehicleDeselect}
          telemetryMap={liveTelemetryMap}
        />
      </div>

      {/* Vertical Icon Rail */}
      <NavRail
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        alerts={alerts || []}
        onLogout={handleLogout}
      />

      {/* Fleet Sidebar — visible when live overview is active */}
      {(activePanel === null || activePanel === 'live') && (
        <Sidebar
          vehicles={sortedVehicles}
          selectedVehicle={selectedVehicle}
          telemetry={selectedVehicleId ? (telemetry || []) : allTelemetry}
          alerts={alerts || []}
          onVehicleSelect={handleVehicleSelect}
          onBack={handleBack}
          onLogout={handleLogout}
          onOpenAlerts={() => setActivePanel('alerts')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          degradedSinceMap={degradedSinceMap}
        />
      )}
    </div>
  );
}
