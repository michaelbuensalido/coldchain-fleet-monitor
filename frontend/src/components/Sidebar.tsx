import { useState } from 'react';
import { 
  Search, 
  ArrowLeft, 
  Thermometer, 
  MapPin, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogOut,
  Bell
} from 'lucide-react';
import StatusBadge from './StatusBadge';

interface Vehicle {
  id: string;
  name: string;
  status: string;
  currentRoute: string | null;
  configProfileId: string | null;
  active: boolean;
  createdAt: string;
}

interface Telemetry {
  id: string;
  vehicleId: string;
  timestamp: string;
  temperature: number;
  latitude: number;
  longitude: number;
  doorOpen: boolean;
}

interface Alert {
  id: string;
  vehicleId: string;
  vehicle: { id: string; name: string };
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

interface SidebarProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | undefined;
  telemetry: Telemetry[];
  alerts: Alert[];
  onVehicleSelect: (vehicleId: string) => void;
  onBack: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'online' | 'degraded' | 'offline' | 'pending';
  onStatusFilterChange: (filter: 'all' | 'online' | 'degraded' | 'offline' | 'pending') => void;
  onLogout?: () => void;
  onOpenAlerts: () => void;
  onOpenProvision: () => void;
  onOpenConfig: () => void;
  alertsTriggerRef: React.RefObject<HTMLButtonElement | null>;
  provisionTriggerRef: React.RefObject<HTMLButtonElement | null>;
  configTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function Sidebar({
  vehicles,
  selectedVehicle,
  telemetry,
  alerts,
  onVehicleSelect,
  onBack,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onLogout,
  onOpenAlerts,
  onOpenProvision,
  onOpenConfig,
  alertsTriggerRef,
  provisionTriggerRef,
  configTriggerRef,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onlineCount = vehicles.filter((v) => v.status === 'online').length;
  const degradedCount = vehicles.filter((v) => v.status === 'degraded').length;
  const offlineCount = vehicles.filter((v) => v.status === 'offline').length;
  const pendingCount = vehicles.filter((v) => v.status === 'pending').length;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  // Temperature gradient mapping with high-quality visual representation
  const getTempGradient = (temp: number) => {
    if (temp < 0) return 'from-blue-500 via-cyan-400 to-emerald-400';
    if (temp < 4) return 'from-cyan-400 to-blue-500';
    if (temp < 8) return 'from-emerald-400 to-cyan-500';
    if (temp < 12) return 'from-amber-400 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const getLatestTelemetry = (vehicleId: string) => {
    return telemetry.find((t) => t.vehicleId === vehicleId);
  };

  if (isCollapsed) {
    return (
      <div className="absolute top-4 left-4 z-10 w-16 h-[calc(100vh-2rem)] bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md rounded-2xl flex flex-col items-center py-6 gap-6 shadow-2xl transition-all duration-300">
        <button
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand sidebar"
          className="p-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl text-[var(--color-text-main)] transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>

        <div className="flex flex-col gap-4 text-center mt-4">
          <div className="flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-online)] shadow-[0_0_8px_var(--color-status-online)]" />
            <span className="text-[10px] font-mono mt-1 text-slate-400">{onlineCount}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-degraded)] shadow-[0_0_8px_var(--color-status-degraded)]" />
            <span className="text-[10px] font-mono mt-1 text-slate-400">{degradedCount}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-offline)] shadow-[0_0_8px_var(--color-status-offline)]" />
            <span className="text-[10px] font-mono mt-1 text-slate-400">{offlineCount}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(148,163,184,0.5)]" />
            <span className="text-[10px] font-mono mt-1 text-slate-400">{pendingCount}</span>
          </div>
        </div>

        <button 
          ref={alertsTriggerRef}
          onClick={onOpenAlerts}
          className="w-10 h-10 bg-[var(--color-status-offline)]/10 hover:bg-[var(--color-status-offline)]/20 border border-[var(--color-status-offline)]/30 rounded-xl flex items-center justify-center text-[var(--color-status-offline)] relative cursor-pointer group"
        >
          <Bell size={18} className={unacknowledgedAlerts > 0 ? "animate-pulse" : ""} />
          {unacknowledgedAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-status-offline)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unacknowledgedAlerts}
            </span>
          )}
        </button>

        <div className="mt-auto flex flex-col gap-3">
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-10 w-[390px] h-[calc(100vh-2rem)] bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md rounded-2xl flex flex-col shadow-2xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-quiet)] bg-slate-950/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-[var(--color-text-main)] uppercase">ColdChainIQ</h2>
              <p className="text-[10px] text-slate-400 font-mono">LIVE FLEET TELEMETRY</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse sidebar"
            className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Status Summary Widget */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 text-center">
            <div className="text-sm font-bold text-[var(--color-status-online)] font-mono tracking-tight">{onlineCount}</div>
            <div className="text-[9px] text-slate-400 font-medium">Online</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 text-center">
            <div className="text-sm font-bold text-[var(--color-status-degraded)] font-mono tracking-tight">{degradedCount}</div>
            <div className="text-[9px] text-slate-400 font-medium">Degraded</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 text-center">
            <div className="text-sm font-bold text-[var(--color-status-offline)] font-mono tracking-tight">{offlineCount}</div>
            <div className="text-[9px] text-slate-400 font-medium">Offline</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 text-center">
            <div className="text-sm font-bold text-slate-400 font-mono tracking-tight">{pendingCount}</div>
            <div className="text-[9px] text-slate-400 font-medium">Pending</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter vehicles..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-xl text-[var(--color-text-main)] placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="px-2 py-1.5 bg-slate-900/50 border border-slate-800 rounded-xl text-[var(--color-text-main)] text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono cursor-pointer"
          >
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="degraded">Degraded</option>
            <option value="offline">Offline</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {unacknowledgedAlerts > 0 && (
          <button 
            ref={alertsTriggerRef}
            onClick={onOpenAlerts}
            className="w-full mt-3 bg-[var(--color-status-offline)]/10 hover:bg-[var(--color-status-offline)]/15 border border-[var(--color-status-offline)]/20 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={15} className="text-[var(--color-status-offline)] animate-bounce" />
              <span className="text-xs text-[var(--color-status-offline)] font-semibold font-mono">
                {unacknowledgedAlerts} UNRESOLVED ALERT{unacknowledgedAlerts > 1 ? 'S' : ''}
              </span>
            </div>
            <Bell size={14} className="text-[var(--color-status-offline)]" />
          </button>
        )}
      </div>

      {/* Content Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {selectedVehicle ? (
          // Vehicle Detail View
          <div className="space-y-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1 cursor-pointer font-mono"
            >
              <ArrowLeft size={12} />
              BACK TO FLEET
            </button>

            <div className="border border-slate-800/80 bg-slate-900/40 rounded-xl p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-main)] tracking-tight">{selectedVehicle.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedVehicle.id.slice(0, 8)}...</p>
                </div>
                <StatusBadge status={selectedVehicle.status} />
              </div>

              {/* Temperature Readout Block */}
              <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-4 flex flex-col relative overflow-hidden">
                {/* Cold frost decorative indicator */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Internal Cold Temperature</span>
                {(() => {
                  const latest = getLatestTelemetry(selectedVehicle.id);
                  return latest ? (
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`text-4xl font-bold font-mono bg-gradient-to-r ${getTempGradient(latest.temperature)} bg-clip-text text-transparent`}>
                        {latest.temperature.toFixed(1)}
                      </span>
                      <span className="text-lg font-mono text-slate-400">°C</span>
                    </div>
                  ) : (
                    <span className="text-sm font-mono text-slate-500 mt-1">No current reading</span>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                  <span className="text-xs text-slate-400">Assigned Route</span>
                  <span className="text-xs font-mono text-[var(--color-text-main)]">{selectedVehicle.currentRoute || 'Unassigned'}</span>
                </div>

                {(() => {
                  const latest = getLatestTelemetry(selectedVehicle.id);
                  if (latest) {
                    return (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                          <span className="text-xs text-slate-400">Location coordinates</span>
                          <span className="text-xs font-mono text-[var(--color-text-main)] flex items-center gap-1">
                            <MapPin size={10} className="text-slate-500" />
                            {latest.latitude.toFixed(5)}, {latest.longitude.toFixed(5)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                          <span className="text-xs text-slate-400">Door Position</span>
                          <span className={`text-xs font-mono font-semibold ${latest.doorOpen ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {latest.doorOpen ? 'OPENED (ALERT)' : 'SECURED'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-xs text-slate-400">Last Ping Received</span>
                          <span className="text-xs font-mono text-slate-400">
                            {new Date(latest.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        ) : (
          // Vehicle List View
          <div className="space-y-1.5">
            {vehicles.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">No active vehicles match filter</div>
            ) : (
              vehicles.map((vehicle) => {
                const latest = getLatestTelemetry(vehicle.id);
                const isUrgent = vehicle.status === 'offline' || vehicle.status === 'degraded';
                
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => onVehicleSelect(vehicle.id)}
                    className={`w-full p-3 bg-slate-900/30 hover:bg-slate-800/50 border rounded-xl text-left transition-all cursor-pointer relative group ${
                      isUrgent 
                        ? 'border-red-500/10 hover:border-red-500/20' 
                        : 'border-slate-800/50 hover:border-slate-700/60'
                    }`}
                  >
                    {isUrgent && (
                      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-red-500 opacity-60" />
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[var(--color-text-main)] group-hover:text-blue-400 transition-colors font-mono">{vehicle.name}</span>
                      <StatusBadge status={vehicle.status} />
                    </div>
                    {latest ? (
                      <div className="flex items-center justify-between text-[11px] font-mono mt-2">
                        <span className={`font-bold bg-gradient-to-r ${getTempGradient(latest.temperature)} bg-clip-text text-transparent flex items-center gap-1`}>
                          <Thermometer size={10} className="text-slate-500" />
                          {latest.temperature.toFixed(1)}°C
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-slate-500 mt-2 italic flex items-center gap-1">
                        No location yet — awaiting first check-in
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Settings/Navigation */}
      <div className="p-3 bg-slate-950/40 border-t border-[var(--color-border-quiet)] flex justify-between items-center text-xs">
        <div className="flex gap-2">
          <button 
            ref={configTriggerRef}
            onClick={onOpenConfig} 
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer font-mono text-[10px]"
          >
            CONFIG
          </button>
          <button 
            ref={provisionTriggerRef}
            onClick={onOpenProvision} 
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer font-mono text-[10px]"
          >
            PROVISION
          </button>
          <button 
            ref={alertsTriggerRef}
            onClick={onOpenAlerts}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer font-mono text-[10px] flex items-center gap-1"
          >
            ALERTS
            {unacknowledgedAlerts > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-red-400 transition-colors font-mono text-[10px] cursor-pointer"
          >
            <LogOut size={10} />
            LOGOUT
          </button>
        )}
      </div>
    </div>
  );
}
