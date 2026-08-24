import { useState } from "react";
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
  Bell,
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
  onLogout: () => void;
  onNavigate: (path: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: "all" | "online" | "degraded" | "offline" | "pending";
  onStatusFilterChange: (
    filter: "all" | "online" | "degraded" | "offline" | "pending",
  ) => void;
  onOpenAlerts: () => void;
  onOpenProvision: () => void;
  onOpenConfig: () => void;
  alertsTriggerRef: React.RefObject<HTMLButtonElement | null>;
  provisionTriggerRef: React.RefObject<HTMLButtonElement | null>;
  configTriggerRef: React.RefObject<HTMLButtonElement | null>;
  degradedSinceMap: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Design tokens (keep these as the single source of truth — do not
// re-introduce ad-hoc opacity values elsewhere in this file).
// ---------------------------------------------------------------------------
const surface = {
  panel:
    "bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)]",
  card: "bg-slate-900/50 border border-slate-800",
  cardHover: "hover:bg-slate-800/60 hover:border-slate-700",
  well: "bg-slate-950/50 border border-slate-800/70", // recessed / data readout surface
  divider: "border-slate-800/60",
};

// Headings, labels, and UI chrome use the sans display face.
// Numeric/data readouts (temp, coords, timestamps, ids) stay on mono —
// that contrast is what gives the interface a hierarchy instead of one
// undifferentiated typographic wash.
const type = {
  eyebrow:
    "font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500",
  label: "font-sans text-xs text-slate-400",
  heading:
    "font-sans text-sm font-semibold text-[var(--color-text-main)] tracking-tight",
  data: "font-mono",
};

const icon = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
};

// Severity → color mapping, defined once so badges, borders, and glows
// can never drift out of sync with each other.
const severityColor = {
  mild: {
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/25",
  },
  severe: {
    text: "text-red-300",
    bg: "bg-red-500/15",
    border: "border-red-500/25",
  },
} as const;

export default function Sidebar({
  vehicles,
  selectedVehicle,
  telemetry,
  alerts,
  onVehicleSelect,
  onBack,
  onLogout,
  onNavigate: _onNavigate,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenAlerts,
  onOpenProvision,
  onOpenConfig,
  alertsTriggerRef,
  provisionTriggerRef,
  configTriggerRef,
  degradedSinceMap,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onlineCount = vehicles.filter((v) => v.status === "online").length;
  const degradedCount = vehicles.filter((v) => v.status === "degraded").length;
  const offlineCount = vehicles.filter((v) => v.status === "offline").length;
  const pendingCount = vehicles.filter((v) => v.status === "pending").length;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  const getLatestTelemetry = (vehicleId: string) => {
    // If we're looking at a detail telemetry array (where all entries belong to the selected vehicle)
    if (selectedVehicle?.id === vehicleId && telemetry.length > 0 && telemetry.every(t => t.vehicleId === vehicleId)) {
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

  /** 'mild' within 3°C of the nearest limit, 'severe' further out, null if in range. */
  const getTempSeverity = (
    temp: number,
    profile: ConfigProfile | null | undefined,
  ): "mild" | "severe" | null => {
    if (!profile) return null;
    const { tempMin, tempMax } = profile;
    if (temp >= tempMin && temp <= tempMax) return null;
    const exceedance = temp < tempMin ? tempMin - temp : temp - tempMax;
    return exceedance <= 3 ? "mild" : "severe";
  };

  const getDegradedDuration = (vehicleId: string): string | null => {
    const since = degradedSinceMap[vehicleId];
    if (!since) return null;
    return formatDuration(Math.floor((Date.now() - since) / 1000));
  };

  // ---------------------------------------------------------------------
  // Shared subcomponent: the single place temperature + threshold +
  // severity are rendered, so list view and detail view can never drift.
  // size='sm' for list cards, size='lg' for the detail readout.
  // ---------------------------------------------------------------------
  const TempReading = ({
    temperature,
    profile,
    size = "sm",
  }: {
    temperature: number;
    profile: ConfigProfile | null | undefined;
    size?: "sm" | "lg";
  }) => {
    const severity = getTempSeverity(temperature, profile);
    const thresholdLabel = profile
      ? `Limit ${profile.tempMin}–${profile.tempMax}°C`
      : null;
    const tone = severity ? severityColor[severity] : null;

    if (size === "lg") {
      return (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span
              className={`${type.data} text-4xl font-bold tabular-nums ${
                tone ? tone.text : "text-slate-100"
              }`}
            >
              {temperature.toFixed(1)}
            </span>
            <span className={`${type.data} text-lg text-slate-500`}>°C</span>
            {severity && tone && (
              <span
                className={`${type.eyebrow} ${tone.text} ${tone.bg} ${tone.border} border px-1.5 py-0.5 rounded self-center normal-case tracking-wide`}
              >
                {severity}
              </span>
            )}
          </div>
          {thresholdLabel && (
            <div className={`mt-1 ${type.data} text-[11px] text-slate-500`}>
              {thresholdLabel}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <Thermometer size={icon.xs} className="text-slate-500 shrink-0" />
          <span
            className={`${type.data} text-[11px] font-semibold tabular-nums ${tone ? tone.text : "text-slate-300"}`}
          >
            {temperature.toFixed(1)}°C
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

  // ---------------------------------------------------------------------
  // Collapsed rail
  // ---------------------------------------------------------------------
  if (isCollapsed) {
    return (
      <div
        className={`absolute top-4 left-4 z-10 w-16 h-[calc(100vh-2rem)] ${surface.panel} rounded-2xl flex flex-col items-center py-6 gap-6 shadow-xl transition-all duration-200`}
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

        <button
          ref={alertsTriggerRef}
          onClick={onOpenAlerts}
          className="w-10 h-10 bg-slate-900/70 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-300 relative cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        >
          <Bell size={icon.md} />
          {unacknowledgedAlerts > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unacknowledgedAlerts}
            </span>
          )}
        </button>

        <button
          onClick={onLogout}
          className="mt-auto p-2 text-slate-500 hover:text-red-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
          title="Logout"
        >
          <LogOut size={icon.md} />
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // Expanded sidebar
  // ---------------------------------------------------------------------
  return (
    <div
      className={`absolute top-4 left-4 z-10 w-[390px] h-[calc(100vh-2rem)] ${surface.panel} rounded-2xl flex flex-col shadow-xl transition-all duration-200 overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800/70 bg-slate-950/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity size={icon.md} />
            </div>
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
            className="p-1.5 hover:bg-slate-800/70 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            <ChevronLeft size={icon.md} />
          </button>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[
            ["Online", onlineCount, "text-[var(--color-status-online)]"],
            ["Degraded", degradedCount, "text-[var(--color-status-degraded)]"],
            ["Offline", offlineCount, "text-[var(--color-status-offline)]"],
            ["Pending", pendingCount, "text-slate-400"],
          ].map(([label, count, colorClass]) => (
            <div
              key={label as string}
              className={`${surface.card} rounded-xl py-2 text-center`}
            >
              <div
                className={`${type.data} text-sm font-bold tabular-nums ${colorClass}`}
              >
                {count}
              </div>
              <div className="font-sans text-[9px] text-slate-500 mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={icon.sm}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Filter vehicles…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 ${surface.card} rounded-xl text-[var(--color-text-main)] placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors font-sans`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className={`px-2 py-1.5 ${surface.card} rounded-xl text-[var(--color-text-main)] text-xs focus:outline-none focus:border-blue-500/50 transition-colors font-sans cursor-pointer`}
          >
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="degraded">Degraded</option>
            <option value="offline">Offline</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Unresolved alerts banner — the one deliberate animated moment in this view */}
        {unacknowledgedAlerts > 0 && (
          <button
            ref={alertsTriggerRef}
            onClick={onOpenAlerts}
            className="w-full mt-3 bg-red-500/[0.08] hover:bg-red-500/[0.12] border border-red-500/20 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={icon.sm} className="text-red-400" />
              <span className="font-sans text-xs text-red-300 font-semibold">
                {unacknowledgedAlerts} unresolved alert
                {unacknowledgedAlerts > 1 ? "s" : ""}
              </span>
            </div>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {selectedVehicle ? (
          <div className="space-y-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors py-1 cursor-pointer font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
            >
              <ArrowLeft size={icon.xs} />
              Back to fleet
            </button>

            <div className={`${surface.card} rounded-xl p-4 space-y-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={type.heading}>{selectedVehicle.name}</h3>
                  <p
                    className={`${type.data} text-[10px] text-slate-500 mt-0.5`}
                  >
                    ID: {selectedVehicle.id.slice(0, 8)}…
                  </p>
                </div>
                <StatusBadge status={selectedVehicle.status} />
              </div>

              {/* Temperature readout — the domain signature lives here: a
                  thin gradient edge whose color is driven by severity,
                  not a generic decorative blur. */}
              {(() => {
                const latest = getLatestTelemetry(selectedVehicle.id);
                const severity = latest
                  ? getTempSeverity(
                      latest.temperature,
                      selectedVehicle.configProfile,
                    )
                  : null;
                const edgeColor =
                  severity === "severe"
                    ? "via-red-500/60"
                    : severity === "mild"
                      ? "via-amber-500/50"
                      : "via-cyan-500/40";
                return (
                  <div
                    className={`relative rounded-xl p-[1px] bg-gradient-to-r from-transparent ${edgeColor} to-transparent`}
                  >
                    <div className={`${surface.well} rounded-[11px] p-4`}>
                      <span className={type.eyebrow}>
                        Internal cold temperature
                      </span>
                      <div className="mt-1.5">
                        {latest ? (
                          <TempReading
                            temperature={latest.temperature}
                            profile={selectedVehicle.configProfile}
                            size="lg"
                          />
                        ) : (
                          <span
                            className={`${type.data} text-sm text-slate-600`}
                          >
                            No current reading
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <div
                  className={`flex justify-between items-center py-2 border-b ${surface.divider}`}
                >
                  <span className={type.label}>Assigned route</span>
                  <span
                    className={`${type.data} text-xs text-[var(--color-text-main)]`}
                  >
                    {selectedVehicle.currentRoute || "Unassigned"}
                  </span>
                </div>

                {(() => {
                  const latest = getLatestTelemetry(selectedVehicle.id);
                  if (!latest) return null;
                  return (
                    <>
                      <div
                        className={`flex justify-between items-center py-2 border-b ${surface.divider}`}
                      >
                        <span className={type.label}>Location</span>
                        <span
                          className={`${type.data} text-xs text-[var(--color-text-main)] flex items-center gap-1`}
                        >
                          <MapPin size={icon.xs} className="text-slate-500" />
                          {latest.latitude.toFixed(5)},{" "}
                          {latest.longitude.toFixed(5)}
                        </span>
                      </div>
                      <div
                        className={`flex justify-between items-center py-2 border-b ${surface.divider}`}
                      >
                        <span className={type.label}>Door position</span>
                        <span
                          className={`font-sans text-xs font-semibold ${
                            latest.doorOpen
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {latest.doorOpen ? "Open — alert" : "Secured"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className={type.label}>Last ping</span>
                        <span className={`${type.data} text-xs text-slate-500`}>
                          {new Date(latest.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {vehicles.length === 0 ? (
              <div className="p-8 text-center text-slate-600 font-sans text-xs">
                No vehicles match this filter
              </div>
            ) : (
              vehicles.map((vehicle) => {
                const latest = getLatestTelemetry(vehicle.id);
                const isUrgent =
                  vehicle.status === "offline" || vehicle.status === "degraded";
                const duration =
                  vehicle.status === "degraded"
                    ? getDegradedDuration(vehicle.id)
                    : null;

                return (
                  <button
                    key={vehicle.id}
                    onClick={() => onVehicleSelect(vehicle.id)}
                    className={`w-full p-3 ${surface.card} ${surface.cardHover} rounded-xl text-left transition-colors cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                      isUrgent ? "border-l-2 border-l-red-500/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-sans font-semibold text-xs text-[var(--color-text-main)] group-hover:text-blue-400 transition-colors">
                        {vehicle.name}
                      </span>
                      <StatusBadge status={vehicle.status} />
                    </div>

                    {latest ? (
                      <div className="flex items-start justify-between">
                        <TempReading
                          temperature={latest.temperature}
                          profile={vehicle.configProfile}
                          size="sm"
                        />
                        <span
                          className={`${type.data} text-[10px] text-slate-600 mt-0.5`}
                        >
                          {new Date(latest.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ) : (
                      <div className="font-sans text-[11px] text-slate-600 italic">
                        No location yet — awaiting first check-in
                      </div>
                    )}

                    {duration && (
                      <div className="mt-1.5 flex items-center gap-1 font-sans text-[10px] text-amber-400/90">
                        <AlertTriangle size={icon.xs} />
                        Degraded for {duration}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-950/40 border-t border-slate-800/70 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            ref={configTriggerRef}
            onClick={onOpenConfig}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer font-sans text-[10px] font-medium tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            CONFIG
          </button>
          <button
            ref={provisionTriggerRef}
            onClick={onOpenProvision}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer font-sans text-[10px] font-medium tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            PROVISION
          </button>
          <button
            ref={alertsTriggerRef}
            onClick={onOpenAlerts}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer font-sans text-[10px] font-medium tracking-wide flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            ALERTS
            {unacknowledgedAlerts > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-red-400 transition-colors font-sans text-[10px] font-medium tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
        >
          <LogOut size={icon.xs} />
          LOGOUT
        </button>
      </div>
    </div>
  );
}
