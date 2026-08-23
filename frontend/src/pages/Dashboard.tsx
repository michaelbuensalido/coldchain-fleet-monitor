import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useTelemetryHistory } from '../hooks/useTelemetry';
import { useAlerts } from '../hooks/useAlerts';
import { useSocket } from '../hooks/useSocket';
import Sidebar from '../components/Sidebar';
import FleetMap from '../components/FleetMap';
import AlertsPanel from '../components/AlertsPanel';
import ProvisionModal from '../components/ProvisionModal';
import ConfigModal from '../components/ConfigModal';

interface Vehicle {
  id: string;
  name: string;
  status: string;
  currentRoute: string | null;
  configProfileId: string | null;
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

  // Overlay states
  const [activeOverlay, setActiveOverlay] = useState<'alerts' | 'provision' | 'config' | null>(null);

  // Trigger refs for focus restoration
  const alertsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const provisionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const configTriggerRef = useRef<HTMLButtonElement | null>(null);

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
    }
  }, [socketStatus]);

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

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
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
          vehicles={sortedVehicles} // Pass the same sorted/filtered vehicles to keep in sync
          selectedVehicleId={selectedVehicleId}
          onVehicleSelect={handleVehicleSelect}
        />
      </div>

      {/* Floating Sidebar */}
      <Sidebar
        vehicles={sortedVehicles}
        selectedVehicle={selectedVehicle}
        telemetry={telemetry || []}
        alerts={alerts || []}
        onVehicleSelect={handleVehicleSelect}
        onBack={handleBack}
        onLogout={handleLogout}
        onOpenAlerts={() => setActiveOverlay('alerts')}
        onOpenProvision={() => setActiveOverlay('provision')}
        onOpenConfig={() => setActiveOverlay('config')}
        alertsTriggerRef={alertsTriggerRef}
        provisionTriggerRef={provisionTriggerRef}
        configTriggerRef={configTriggerRef}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Overlays */}
      <AlertsPanel
        isOpen={activeOverlay === 'alerts'}
        onClose={() => setActiveOverlay(null)}
        alerts={alerts || []}
        triggerRef={alertsTriggerRef}
      />

      <ProvisionModal
        isOpen={activeOverlay === 'provision'}
        onClose={() => setActiveOverlay(null)}
        triggerRef={provisionTriggerRef}
      />

      <ConfigModal
        isOpen={activeOverlay === 'config'}
        onClose={() => setActiveOverlay(null)}
        triggerRef={configTriggerRef}
      />
    </div>
  );
}
