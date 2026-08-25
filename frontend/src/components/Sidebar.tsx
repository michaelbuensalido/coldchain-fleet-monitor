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

/* ─── Status stripe colour per status ───────────────────────── */
const STATUS_STRIPE: Record<string, string> = {
  online: "var(--color-status-online)",
  degraded: "var(--color-status-degraded)",
  offline: "var(--color-status-offline)",
  pending: "var(--color-border-strong)",
};

/* ─── Stat chip colours ──────────────────────────────────────── */
const STAT_CHIPS = [
  { label: "Online", colorVar: "var(--color-status-online)", key: "online" },
  {
    label: "Degraded",
    colorVar: "var(--color-status-degraded)",
    key: "degraded",
  },
  { label: "Offline", colorVar: "var(--color-status-offline)", key: "offline" },
  { label: "Pending", colorVar: "var(--color-text-muted)", key: "pending" },
];

/* ─── Filter chips ───────────────────────────────────────────── */
const FILTER_OPTS = [
  "all",
  "online",
  "degraded",
  "offline",
  "pending",
] as const;

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
  const counts: Record<string, number> = {
    online: onlineCount,
    degraded: degradedCount,
    offline: offlineCount,
    pending: pendingCount,
  };
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
    if (seconds === null) return "—";
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
    let thresholdLabel = "";
    if (temp !== undefined && profile) {
      if (temp > profile.tempMax) {
        thresholdLabel = `Exceeds max (${profile.tempMax.toFixed(1)} °C)`;
      } else if (temp < profile.tempMin) {
        thresholdLabel = `Below min (${profile.tempMin.toFixed(1)} °C)`;
      }
    }

    const severityColor =
      severity === "severe"
        ? "var(--color-severity-severe)"
        : severity === "mild"
          ? "var(--color-severity-mild)"
          : "var(--color-text-main)";

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex items-center gap-1.5"
            style={{ color: "var(--color-text-dim)" }}
          >
            <Thermometer size={13} style={{ color: "var(--color-accent)" }} />
            <span
              className="font-sans text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}
            >
              Cargo Temp
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-xs font-semibold"
              style={{ color: severityColor }}
            >
              {temp !== undefined ? `${temp.toFixed(1)} °C` : "—"}
            </span>
            {severity && (
              <span
                className="font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  color: severityColor,
                  background:
                    severity === "severe"
                      ? "var(--color-severity-severe-dim)"
                      : "var(--color-severity-mild-dim)",
                }}
              >
                {severity}
              </span>
            )}
          </div>
        </div>
        {thresholdLabel && (
          <p
            className="font-mono text-[10px] pl-[22px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            {thresholdLabel}
          </p>
        )}
      </div>
    );
  };

  /* ── Collapsed rail ────────────────────────────────────────── */
  if (isCollapsed) {
    return (
      <div
        className="absolute top-4 left-[96px] z-10 flex flex-col items-center py-5 gap-5 transition-all duration-200"
        style={{
          width: 56,
          height: "calc(100vh - 2rem)",
          background: "var(--color-surface-panel)",
          border: "1px solid var(--color-border-quiet)",
          backdropFilter: "blur(16px)",
          borderRadius: 18,
          boxShadow: "0 8px 32px oklch(0 0 0 / 0.45)",
        }}
      >
        <button
          id="sidebar-expand-btn"
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand sidebar"
          className="rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
          style={{
            width: 36,
            height: 36,
            background: "var(--color-paper-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-dim)",
          }}
        >
          <ChevronRight size={15} />
        </button>

        <div className="flex flex-col gap-3.5 items-center">
          {STAT_CHIPS.map(({ key, colorVar }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: colorVar }}
              />
              <span
                className="font-mono text-[10px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {counts[key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Expanded sidebar ──────────────────────────────────────── */
  return (
    <div
      className="absolute top-4 left-[96px] z-10 flex flex-col overflow-hidden transition-all duration-200"
      style={{
        width: 380,
        height: "calc(100vh - 2rem)",
        background: "var(--color-surface-panel)",
        border: "1px solid var(--color-border-quiet)",
        backdropFilter: "blur(16px)",
        borderRadius: 18,
        boxShadow: "0 8px 32px oklch(0 0 0 / 0.45)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--color-border-quiet)",
          background: "oklch(0 0 0 / 0.15)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="ColdChainIQ"
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            />
            <div>
              <p
                className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--color-text-muted)" }}
              >
                Fleet Monitor
              </p>
              <h2
                className="font-sans text-sm font-bold tracking-tight leading-tight"
                style={{ color: "var(--color-text-main)" }}
              >
                ColdChainIQ
              </h2>
            </div>
          </div>
          <button
            id="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse sidebar"
            className="rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={{
              width: 30,
              height: 30,
              background: "transparent",
              border: "1px solid transparent",
              color: "var(--color-text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--color-paper-3)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--color-border)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--color-text-main)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--color-text-muted)";
            }}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Back / Search */}
        {selectedVehicle ? (
          <button
            id="sidebar-back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded cursor-pointer transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 font-sans text-xs font-medium"
            style={{ color: "var(--color-text-dim)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "var(--color-text-main)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "var(--color-text-dim)")
            }
          >
            <ArrowLeft size={13} />
            <span>Back to fleet</span>
          </button>
        ) : (
          <div className="space-y-2.5">
            {/* Search input */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                id="sidebar-search"
                type="text"
                placeholder="Filter vehicles…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full font-sans text-xs transition-all duration-150 focus:outline-none focus:ring-2"
                style={{
                  paddingLeft: 32,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  background: "var(--color-paper-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  color: "var(--color-text-main)",
                  // @ts-ignore
                  "--tw-ring-color": "var(--color-focus)",
                }}
              />
            </div>

            {/* Status filter chips */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_OPTS.map((filter) => {
                const active = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    id={`sidebar-filter-${filter}`}
                    onClick={() => onStatusFilterChange(filter)}
                    className="font-mono font-semibold uppercase tracking-widest cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      fontSize: 9,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: active
                        ? "var(--color-accent-dim)"
                        : "var(--color-paper-2)",
                      border: `1px solid ${active ? "var(--color-accent-edge)" : "var(--color-border)"}`,
                      color: active
                        ? "var(--color-accent)"
                        : "var(--color-text-muted)",
                      // @ts-ignore
                      "--tw-ring-color": "var(--color-focus)",
                    }}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      {!selectedVehicle && (
        <div
          className="grid grid-cols-4 gap-px flex-shrink-0"
          style={{
            borderBottom: "1px solid var(--color-border-quiet)",
            background: "var(--color-border-quiet)",
          }}
        >
          {STAT_CHIPS.map(({ label, colorVar, key }) => (
            <div
              key={key}
              className="flex flex-col items-center py-2.5 gap-0.5"
              style={{ background: "var(--color-paper-1)" }}
            >
              <span
                className="font-mono text-sm font-bold"
                style={{ color: colorVar }}
              >
                {counts[key]}
              </span>
              <span
                className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Unresolved alert banner */}
      {!selectedVehicle && unacknowledgedAlerts > 0 && onOpenAlerts && (
        <button
          id="sidebar-alerts-banner"
          onClick={onOpenAlerts}
          className="mx-3 mt-3 flex-shrink-0 flex items-center justify-between rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 text-left"
          style={{
            padding: "10px 12px",
            background: "oklch(0.78 0.17 75 / 0.08)",
            border: "1px solid oklch(0.78 0.17 75 / 0.25)",
            color: "var(--color-status-degraded)",
            // @ts-ignore
            "--tw-ring-color": "var(--color-focus)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "oklch(0.78 0.17 75 / 0.14)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "oklch(0.78 0.17 75 / 0.08)")
          }
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} />
            <span className="font-mono text-xs font-semibold">
              {unacknowledgedAlerts} unresolved alert
              {unacknowledgedAlerts > 1 ? "s" : ""}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider underline underline-offset-2">
            View
          </span>
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {selectedVehicle ? (
          /* Vehicle detail */
          <div className="space-y-3">
            {/* Identity card */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--color-paper-2)",
                border: "1px solid var(--color-border)",
                borderLeft: `3px solid ${STATUS_STRIPE[selectedVehicle.status] ?? "var(--color-border)"}`,
              }}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3
                    className="font-sans font-bold text-sm leading-tight"
                    style={{ color: "var(--color-text-main)" }}
                  >
                    {selectedVehicle.name}
                  </h3>
                  <StatusBadge status={selectedVehicle.status} />
                </div>

                {/* Degraded timer */}
                {selectedVehicle.status === "degraded" &&
                  degradedSinceMap[selectedVehicle.id] && (
                    <div
                      className="flex items-center justify-between rounded-lg font-mono text-xs"
                      style={{
                        padding: "8px 12px",
                        background: "oklch(0.78 0.17 75 / 0.08)",
                        border: "1px solid oklch(0.78 0.17 75 / 0.20)",
                        color: "var(--color-status-degraded)",
                      }}
                    >
                      <span>Degraded for</span>
                      <span className="font-bold">
                        {formatDuration(
                          Math.floor(
                            (Date.now() -
                              degradedSinceMap[selectedVehicle.id]) /
                              1000,
                          ),
                        )}
                      </span>
                    </div>
                  )}

                {/* Meta rows */}
                <div
                  className="space-y-2 pt-2"
                  style={{ borderTop: "1px solid var(--color-border-quiet)" }}
                >
                  {[
                    {
                      label: "Route",
                      value: selectedVehicle.currentRoute || "Unassigned",
                    },
                    {
                      label: "Config Profile",
                      value: selectedVehicle.configProfile?.name || "Standard",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center"
                    >
                      <span
                        className="font-sans text-xs"
                        style={{ color: "var(--color-text-dim)" }}
                      >
                        {label}
                      </span>
                      <span
                        className="font-mono text-xs"
                        style={{ color: "var(--color-text-main)" }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Telemetry rows */}
                {selectedTelemetry && (
                  <div
                    className="space-y-2.5 pt-3"
                    style={{ borderTop: "1px solid var(--color-border-quiet)" }}
                  >
                    {renderTempStats(
                      selectedTelemetry.temperature,
                      selectedVehicle.configProfile,
                    )}
                    <div className="flex justify-between items-center">
                      <span
                        className="font-sans text-xs flex items-center gap-1.5"
                        style={{ color: "var(--color-text-dim)" }}
                      >
                        <MapPin
                          size={12}
                          style={{ color: "var(--color-accent)" }}
                        />
                        Position
                      </span>
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "var(--color-text-main)" }}
                      >
                        {selectedTelemetry.latitude.toFixed(4)},{" "}
                        {selectedTelemetry.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className="font-sans text-xs"
                        style={{ color: "var(--color-text-dim)" }}
                      >
                        Door Status
                      </span>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{
                          color: selectedTelemetry.doorOpen
                            ? "var(--color-status-degraded)"
                            : "var(--color-status-online)",
                        }}
                      >
                        {selectedTelemetry.doorOpen ? "OPEN" : "CLOSED"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Telemetry history */}
            {telemetry.length > 0 && (
              <div className="space-y-2">
                <p
                  className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] px-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Telemetry History
                </p>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {telemetry.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{
                        background: "var(--color-paper-2)",
                        border: "1px solid var(--color-border-quiet)",
                      }}
                    >
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: "var(--color-text-main)" }}
                      >
                        {t.temperature.toFixed(1)} °C
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Vehicle list */
          <div className="space-y-1.5">
            {vehicles.length === 0 ? (
              <div
                className="py-10 text-center font-mono text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                No vehicles match the current filter
              </div>
            ) : (
              vehicles.map((vehicle) => {
                const latestTel = getLatestTelemetry(vehicle.id);
                return (
                  <button
                    key={vehicle.id}
                    id={`vehicle-card-${vehicle.id}`}
                    onClick={() => onVehicleSelect(vehicle.id)}
                    className="w-full rounded-xl flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 text-left group overflow-hidden"
                    style={{
                      padding: "10px 12px",
                      paddingLeft: 15,
                      background: "var(--color-paper-2)",
                      border: `1px solid var(--color-border)`,

                      // @ts-ignore
                      "--tw-ring-color": "var(--color-focus)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--color-paper-3)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--color-paper-2)";
                    }}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-sans font-semibold text-xs truncate transition-colors duration-150"
                          style={{ color: "var(--color-text-main)" }}
                        >
                          {vehicle.name}
                        </span>
                        <StatusBadge status={vehicle.status} />
                      </div>
                      <div
                        className="flex items-center gap-3 font-mono text-[11px]"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {vehicle.currentRoute && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={10} />
                            {vehicle.currentRoute}
                          </span>
                        )}
                        {latestTel && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Thermometer
                              size={10}
                              style={{ color: "var(--color-accent)" }}
                            />
                            {latestTel.temperature.toFixed(1)} °C
                          </span>
                        )}
                      </div>
                    </div>

                    {vehicle.status === "degraded" &&
                      degradedSinceMap[vehicle.id] && (
                        <span
                          className="font-mono text-[11px] font-semibold flex-shrink-0 ml-2"
                          style={{ color: "var(--color-status-degraded)" }}
                        >
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
