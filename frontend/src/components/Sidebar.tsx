import { useState } from "react";
import {
  Search,
  ArrowLeft,
  Thermometer,
  MapPin,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

interface ConfigProfile {
  id: string;
  name: string;
  tempMin: number;
  tempMax: number;
  heartbeatIntervalSecs: number;
}

interface Vehicle {
  id: string;
  name: string;
  status: string;
  currentRoute: string | null;
  configProfileId: string | null;
  configProfile?: ConfigProfile | null;
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
  severity: "info" | "warning" | "critical";
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
  onLogout?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: "all" | "online" | "degraded" | "offline" | "pending";
  onStatusFilterChange: (
    filter: "all" | "online" | "degraded" | "offline" | "pending",
  ) => void;
  onOpenAlerts?: () => void;
  degradedSinceMap: Record<string, number>;
}

import { surface, type, icon, severityColor } from "../theme/tokens";

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
  onOpenAlerts,
  degradedSinceMap,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onlineCount = vehicles.filter((v) => v.status === "online").length;
  const degradedCount = vehicles.filter((v) => v.status === "degraded").length;
  const offlineCount = vehicles.filter((v) => v.status === "offline").length;
  const pendingCount = vehicles.filter((v) => v.status === "pending").length;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  const getLatestTelemetry = (vehicleId: string) => {
    if (
      selectedVehicle?.id === vehicleId &&
      telemetry.length > 0 &&
      telemetry.every((t) => t.vehicleId === vehicleId)
    ) {
      return telemetry[0];
    }
    return telemetry.find((t) => t.vehicleId === vehicleId);
  };

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const getTempSeverity = (
    temp: number | undefined,
    profile: ConfigProfile | null | undefined,
  ): "mild" | "severe" | null => {
    if (temp === undefined || !profile) return null;
    if (temp >= profile.tempMin && temp <= profile.tempMax) return null;
    const overflow =
      temp > profile.tempMax ? temp - profile.tempMax : profile.tempMin - temp;
    return overflow > 3 ? "severe" : "mild";
  };

  const selectedTelemetry = selectedVehicle
    ? getLatestTelemetry(selectedVehicle.id)
    : undefined;

  const renderTempStats = (
    temp: number | undefined,
    profile: ConfigProfile | null | undefined,
  ) => {
    const severity = getTempSeverity(temp, profile);
    const tone = severity ? severityColor[severity] : null;

    let thresholdLabel = "";
    if (temp !== undefined && profile) {
      if (temp > profile.tempMax) {
        thresholdLabel = `Exceeds max (${profile.tempMax.toFixed(1)}°C)`;
      } else if (temp < profile.tempMin) {
        thresholdLabel = `Below min (${profile.tempMin.toFixed(1)}°C)`;
      }
    }

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Thermometer size={icon.sm} className="text-blue-400" />
            <span className={type.label}>Cargo Temp</span>
          </div>
          <span className={`${type.data} font-semibold text-xs text-slate-200`}>
            {temp !== undefined ? `${temp.toFixed(1)}°C` : "N/A"}
          </span>
          {severity && tone && (
            <span
              className={`${type.eyebrow} ${tone.text} ${tone.bg} px-1 py-0.5 rounded normal-case`}
            >
              {severity}
            </span>
          )}
        </div>
        {thresholdLabel && (
          <div className={`${type.data} text-[10px] text-slate-600 pl-[18px]`}>
            {thresholdLabel}
          </div>
        )}
      </div>
    );
  };

  // Collapsed rail
  if (isCollapsed) {
    return (
      <div
        className={`absolute top-4 left-[96px] z-10 w-16 h-[calc(100vh-2rem)] ${surface.panel} rounded-2xl flex flex-col items-center py-6 gap-6 shadow-xl transition-all duration-200`}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand sidebar"
          className="p-2.5 bg-slate-900/70 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        >
          <ChevronRight size={icon.md} />
        </button>

        <div className="flex flex-col gap-4 text-center mt-2">
          {[
            ["bg-[var(--color-status-online)]", onlineCount],
            ["bg-[var(--color-status-degraded)]", degradedCount],
            ["bg-[var(--color-status-offline)]", offlineCount],
            ["bg-slate-500", pendingCount],
          ].map(([colorClass, count], i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${colorClass}`} />
              <span className={`${type.data} text-[10px] text-slate-500`}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Expanded sidebar
  return (
    <div
      className={`absolute top-4 left-[96px] z-10 w-[380px] h-[calc(100vh-2rem)] ${surface.panel} rounded-2xl flex flex-col shadow-xl transition-all duration-200 overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800/70 bg-slate-950/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="ColdChainIQ"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <h2 className="font-sans text-sm font-bold tracking-wide text-[var(--color-text-main)]">
                ColdChainIQ
              </h2>
              <p className={type.eyebrow}>Live fleet telemetry</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse sidebar"
            className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors duration-150 active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            <ChevronLeft size={icon.md} />
          </button>
        </div>

        {/* Selected Vehicle Detail Header or Search */}
        {selectedVehicle ? (
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors duration-150 active:scale-[0.96] cursor-pointer text-xs font-sans font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
            >
              <ArrowLeft size={icon.sm} />
              <span>Back to fleet</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={icon.sm}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Filter by vehicle name..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[var(--color-text-main)] placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-[border-color,box-shadow] duration-150 font-sans"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex gap-1.5 flex-wrap">
              {(
                ["all", "online", "degraded", "offline", "pending"] as const
              ).map((filter) => (
                <button
                  key={filter}
                  onClick={() => onStatusFilterChange(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-semibold uppercase tracking-wider transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer ${
                    statusFilter === filter
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm"
                      : "bg-slate-900/40 text-slate-400 border border-slate-800/60 hover:text-slate-200 hover:bg-slate-850/60"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary Bar */}
      {!selectedVehicle && (
        <div className="px-4 py-3 border-b border-slate-800/70 bg-slate-950/20 grid grid-cols-4 gap-2 text-center">
          <div>
            <div className={`${type.data} text-xs font-bold text-emerald-400`}>
              {onlineCount}
            </div>
            <div className={type.eyebrow}>Online</div>
          </div>
          <div>
            <div className={`${type.data} text-xs font-bold text-amber-400`}>
              {degradedCount}
            </div>
            <div className={type.eyebrow}>Degraded</div>
          </div>
          <div>
            <div className={`${type.data} text-xs font-bold text-red-400`}>
              {offlineCount}
            </div>
            <div className={type.eyebrow}>Offline</div>
          </div>
          <div>
            <div className={`${type.data} text-xs font-bold text-slate-400`}>
              {pendingCount}
            </div>
            <div className={type.eyebrow}>Pending</div>
          </div>
        </div>
      )}

      {/* Unresolved Alert Banner Quick Trigger */}
      {!selectedVehicle && unacknowledgedAlerts > 0 && onOpenAlerts && (
        <button
          onClick={onOpenAlerts}
          className="mx-3 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="font-mono text-xs font-semibold">
              {unacknowledgedAlerts} unresolved alert
              {unacknowledgedAlerts > 1 ? "s" : ""}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase text-amber-400 underline">
            View
          </span>
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {selectedVehicle ? (
          // Vehicle Detail View
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-bold text-base text-[var(--color-text-main)]">
                  {selectedVehicle.name}
                </h3>
                <StatusBadge status={selectedVehicle.status} />
              </div>

              {selectedVehicle.status === "degraded" &&
                degradedSinceMap[selectedVehicle.id] && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs text-amber-300 font-mono">
                    <span>In degraded state for:</span>
                    <span className="font-bold">
                      {formatDuration(
                        Math.floor(
                          (Date.now() - degradedSinceMap[selectedVehicle.id]) /
                            1000,
                        ),
                      )}
                    </span>
                  </div>
                )}

              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-sans">Route</span>
                  <span className={`${type.data} text-slate-200`}>
                    {selectedVehicle.currentRoute || "Unassigned"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-sans">
                    Config Profile
                  </span>
                  <span className={`${type.data} text-slate-200`}>
                    {selectedVehicle.configProfile?.name || "Standard"}
                  </span>
                </div>
              </div>

              {selectedTelemetry && (
                <div className="space-y-2.5 pt-3 border-t border-slate-800/60">
                  {renderTempStats(
                    selectedTelemetry.temperature,
                    selectedVehicle.configProfile,
                  )}

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-sans">Position</span>
                    <span className={`${type.data} text-slate-200 text-[11px]`}>
                      {selectedTelemetry.latitude.toFixed(4)},{" "}
                      {selectedTelemetry.longitude.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-sans">
                      Door Status
                    </span>
                    <span
                      className={`${type.data} font-semibold ${
                        selectedTelemetry.doorOpen
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedTelemetry.doorOpen ? "OPEN" : "CLOSED"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Telemetry Reading History */}
            <div className="space-y-2">
              <h4 className={type.eyebrow}>Telemetry History</h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {telemetry.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-slate-900/30 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-400 text-[11px]">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-slate-200 font-semibold">
                      {t.temperature.toFixed(1)}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Vehicle List
          <div className="space-y-2">
            {vehicles.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No vehicles matching filters
              </div>
            ) : (
              vehicles.map((vehicle) => {
                const latestTel = getLatestTelemetry(vehicle.id);
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => onVehicleSelect(vehicle.id)}
                    className="w-full p-3 bg-slate-900/40 hover:bg-slate-850/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl flex items-center justify-between transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] cursor-pointer text-left group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-semibold text-xs text-[var(--color-text-main)] group-hover:text-blue-400 transition-colors">
                          {vehicle.name}
                        </span>
                        <StatusBadge status={vehicle.status} />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        {vehicle.currentRoute && (
                          <span className="flex items-center gap-1">
                            <MapPin size={icon.xs} />
                            {vehicle.currentRoute}
                          </span>
                        )}
                        {latestTel && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Thermometer size={icon.xs} />
                            {latestTel.temperature.toFixed(1)}°C
                          </span>
                        )}
                      </div>
                    </div>

                    {vehicle.status === "degraded" &&
                      degradedSinceMap[vehicle.id] && (
                        <span className="font-mono text-[12px] text-amber-400 px-2 py-1 rounded ">
                          {formatDuration(
                            Math.floor(
                              (Date.now() - degradedSinceMap[vehicle.id]) /
                                1000,
                            ),
                          )}
                        </span>
                      )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
