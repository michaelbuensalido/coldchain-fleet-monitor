import { useEffect, useRef } from "react";
import { X, AlertTriangle, Check } from "lucide-react";
import {
  useAcknowledgeAlert,
  useAcknowledgeAllAlerts,
} from "../hooks/useAlerts";

interface Alert {
  id: string;
  vehicleId: string;
  vehicle: { id: string; name: string };
  severity: "info" | "warning" | "critical";
  type:
    | "status_change"
    | "temperature_excursion"
    | "connectivity_loss"
    | string;
  message: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
}

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

/* ─── Severity visual config ─────────────────────────────────── */
const SEVERITY_CFG = {
  critical: {
    stripe: "var(--color-status-offline)",
    dot: "var(--color-status-offline)",
    badge: {
      color: "var(--color-status-offline)",
      bg: "oklch(0.62 0.22 25 / 0.14)",
      border: "oklch(0.62 0.22 25 / 0.30)",
    },
    label: "Critical",
  },
  warning: {
    stripe: "var(--color-status-degraded)",
    dot: "var(--color-status-degraded)",
    badge: {
      color: "var(--color-status-degraded)",
      bg: "oklch(0.78 0.17 75 / 0.14)",
      border: "oklch(0.78 0.17 75 / 0.30)",
    },
    label: "Warning",
  },
  info: {
    stripe: "var(--color-accent)",
    dot: "var(--color-accent)",
    badge: {
      color: "var(--color-accent)",
      bg: "var(--color-accent-dim)",
      border: "var(--color-accent-edge)",
    },
    label: "Info",
  },
} as const;

function cfg(severity: string) {
  return (
    SEVERITY_CFG[severity as keyof typeof SEVERITY_CFG] ?? SEVERITY_CFG.info
  );
}

/**
 * Standalone alerts content — used inside the NavRail adjacent panel
 * and inside the legacy modal wrapper.
 */
export function AlertsPanelContent({
  alerts,
  onClose,
}: {
  alerts: Alert[];
  onClose: () => void;
}) {
  const acknowledgeAlert = useAcknowledgeAlert();
  const acknowledgeAll = useAcknowledgeAllAlerts();
  const unresolvedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--color-border-quiet)",
          background: "oklch(0 0 0 / 0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={15}
            style={{ color: "var(--color-status-degraded)" }}
          />
          <h2
            className="font-mono font-semibold uppercase tracking-widest"
            style={{ fontSize: 11, color: "var(--color-text-main)" }}
          >
            Live Fleet Alerts
          </h2>
          {unresolvedCount > 0 && (
            <span
              className="font-mono font-bold"
              style={{
                fontSize: 9,
                padding: "2px 6px",
                borderRadius: 6,
                background: "var(--color-status-offline-dim)",
                border: "1px solid var(--color-status-offline-edge)",
                color: "var(--color-status-offline)",
              }}
            >
              {unresolvedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unresolvedCount > 0 && (
            <button
              id="alerts-resolve-all-btn"
              onClick={() => acknowledgeAll.mutate()}
              disabled={acknowledgeAll.isPending}
              className="font-mono font-semibold uppercase tracking-wider cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40"
              style={{
                fontSize: 9,
                padding: "5px 10px",
                borderRadius: 8,
                background: "var(--color-accent-dim)",
                border: "1px solid var(--color-accent-edge)",
                color: "var(--color-accent)",
                // @ts-ignore
                "--tw-ring-color": "var(--color-focus)",
              }}
            >
              {acknowledgeAll.isPending ? "Resolving…" : "Resolve all"}
            </button>
          )}
          <button
            id="alerts-close-btn"
            onClick={onClose}
            aria-label="Close alerts panel"
            className="rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={{
              width: 28,
              height: 28,
              background: "transparent",
              border: "1px solid transparent",
              color: "var(--color-text-muted)",
              // @ts-ignore
              "--tw-ring-color": "var(--color-focus)",
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
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {alerts.length === 0 ? (
          <div
            className="py-12 text-center font-mono text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            No alerts recorded
          </div>
        ) : (
          alerts.map((alert) => {
            const c = cfg(alert.severity);
            return (
              <div
                key={alert.id}
                className="rounded-xl overflow-hidden transition-opacity duration-150"
                style={{
                  opacity: alert.acknowledged ? 0.45 : 1,
                  background: "var(--color-paper-2)",
                  border: `1px solid var(--color-border)`,
                }}
              >
                <div className="flex items-start gap-3 p-3 pl-4">
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {/* Vehicle + severity badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: c.dot }}
                      />
                      <span
                        className="font-mono font-semibold text-xs"
                        style={{ color: "var(--color-text-main)" }}
                      >
                        {alert.vehicle?.name || "Unknown Vehicle"}
                      </span>
                      <span
                        className="font-mono font-bold uppercase tracking-wider"
                        style={{
                          fontSize: 9,
                          padding: "2px 6px",
                          borderRadius: 5,
                          color: c.badge.color,
                          background: c.badge.bg,
                          border: `1px solid ${c.badge.border}`,
                          textDecoration: alert.acknowledged
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {c.label}
                      </span>
                    </div>
                    {/* Message */}
                    <p
                      className="font-mono text-xs leading-relaxed"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {alert.message}
                    </p>
                    {/* Timestamp */}
                    <p
                      className="font-mono"
                      style={{ fontSize: 10, color: "var(--color-text-muted)" }}
                    >
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Acknowledge button */}
                  {!alert.acknowledged && (
                    <button
                      id={`alert-ack-btn-${alert.id}`}
                      onClick={() => acknowledgeAlert.mutate(alert.id)}
                      disabled={acknowledgeAlert.isPending}
                      aria-label="Acknowledge alert"
                      className="rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        background: "var(--color-paper-3)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-muted)",
                        // @ts-ignore
                        "--tw-ring-color": "var(--color-focus)",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "oklch(0.72 0.18 155 / 0.12)";
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "var(--color-status-online-edge)";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "var(--color-status-online)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "var(--color-paper-3)";
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "var(--color-border)";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "var(--color-text-muted)";
                      }}
                    >
                      <Check size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

/**
 * Legacy modal wrapper — kept for backward compatibility.
 */
export default function AlertsPanel({
  isOpen,
  onClose,
  alerts,
  triggerRef,
}: AlertsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.[0]?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          background: "var(--color-surface-scrim)",
          backdropFilter: "blur(3px)",
        }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Alerts log"
        className="fixed top-4 right-4 z-50 flex flex-col overflow-hidden panel-enter"
        style={{
          width: 450,
          height: "calc(100vh - 2rem)",
          background: "var(--color-surface-panel)",
          border: "1px solid var(--color-border-quiet)",
          backdropFilter: "blur(20px)",
          borderRadius: 18,
          boxShadow: "0 8px 40px oklch(0 0 0 / 0.55)",
        }}
      >
        <AlertsPanelContent alerts={alerts} onClose={onClose} />
      </div>
    </>
  );
}
