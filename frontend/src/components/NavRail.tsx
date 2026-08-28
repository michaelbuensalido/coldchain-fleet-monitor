import { useEffect, useRef } from "react";
import { Bell, Clock, Sliders, PlusCircle, Radio, LogOut } from "lucide-react";
import { AlertsPanelContent } from "./AlertsPanel";
import { ConfigContent } from "./ConfigModal";
import { ProvisionContent } from "./ProvisionModal";
import { HistoryPanelContent } from "./HistoryPanelContent";

export type NavRailPanel =
  | "live"
  | "alerts"
  | "history"
  | "config"
  | "provision"
  | null;

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

interface NavRailProps {
  activePanel: NavRailPanel;
  onPanelChange: (panel: NavRailPanel) => void;
  alerts: Alert[];
  onLogout: () => void;
}

type NavId = "live" | "alerts" | "history" | "config" | "provision";

const NAV_ITEMS: {
  id: NavId;
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  label: string;
  title: string;
}[] = [
  { id: "live",      icon: Radio,      label: "Live",      title: "Live Fleet Overview" },
  { id: "alerts",    icon: Bell,       label: "Alerts",    title: "Live Fleet Alerts" },
  { id: "history",   icon: Clock,      label: "History",   title: "Event Audit History" },
  { id: "config",    icon: Sliders,    label: "Config",    title: "Manage Config Profiles" },
  { id: "provision", icon: PlusCircle, label: "Provision", title: "Provision New Vehicle" },
];

export default function NavRail({
  activePanel,
  onPanelChange,
  alerts,
  onLogout,
}: NavRailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;
  const isLiveActive = activePanel === null || activePanel === "live";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activePanel !== null) {
        onPanelChange(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePanel, onPanelChange]);

  const togglePanel = (panel: Exclude<NavRailPanel, "live" | null>) => {
    onPanelChange(activePanel === panel ? null : panel);
  };

  const isActive = (id: NavId) =>
    id === "live" ? isLiveActive : activePanel === id;

  return (
    <>
      {/* Backdrop */}
      {activePanel !== null && activePanel !== "live" && (
        <div
          className="fixed inset-0 z-20 transition-opacity duration-200"
          style={{ background: "var(--color-surface-scrim)" }}
          onClick={() => onPanelChange(null)}
        />
      )}

      {/* Vertical Icon Rail */}
      <nav
        aria-label="Primary navigation rail"
        className="fixed top-0 left-0 z-30 flex flex-col items-center py-4"
        style={{
          width: 60,
          height: "100vh",
          background: "var(--color-paper-1)",
          borderRight: "1px solid var(--color-border-quiet)",
        }}
      >
        {/* Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => onPanelChange(null)}
          className="mb-4 overflow-hidden flex-shrink-0 transition-transform duration-150 active:scale-95 cursor-pointer"
          style={{ width: 36, height: 36, borderRadius: 6 }}
          title="ColdChainIQ Fleet Monitor"
        >
          <img
            src="/logo.png"
            alt="ColdChainIQ Logo"
            className="w-full h-full object-cover"
          />
        </button>

        <div className="w-full h-px mb-4" style={{ background: "var(--color-border-quiet)" }} />

        {/* Nav buttons */}
        <div className="flex-1 flex flex-col gap-1 items-center w-full">
          {NAV_ITEMS.map(({ id, icon: Icon, label, title }) => {
            const active = isActive(id);
            return (
              <button
                key={id}
                id={`nav-btn-${id}`}
                onClick={() =>
                  id === "live"
                    ? onPanelChange(null)
                    : togglePanel(id as Exclude<NavRailPanel, "live" | null>)
                }
                title={title}
                className="relative w-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  height: 44,
                  background: active ? "var(--color-accent-dim)" : "transparent",
                  borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-dim)",
                  // @ts-ignore
                  "--tw-ring-color": "var(--color-focus)",
                }}
              >
                <div className="relative">
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  {id === "alerts" && unacknowledgedAlerts > 0 && (
                    <span
                      className="absolute flex items-center justify-center font-mono font-bold"
                      style={{
                        top: -4,
                        right: -6,
                        minWidth: 14,
                        height: 14,
                        padding: "0 2px",
                        fontSize: 8,
                        borderRadius: 7,
                        background: "var(--color-status-offline)",
                        color: "var(--color-text-main)",
                        lineHeight: 1,
                      }}
                    >
                      {unacknowledgedAlerts}
                    </span>
                  )}
                </div>
                <span
                  className="font-mono font-semibold tracking-widest uppercase"
                  style={{ fontSize: 7, fontStyle: "normal" }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          id="nav-btn-logout"
          onClick={onLogout}
          title="Logout"
          className="w-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 mt-auto"
          style={{
            height: 44,
            background: "transparent",
            borderLeft: "2px solid transparent",
            color: "var(--color-text-muted)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-status-offline)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
          }}
        >
          <LogOut size={16} strokeWidth={1.8} />
          <span
            className="font-mono font-semibold tracking-widest uppercase"
            style={{ fontSize: 7, fontStyle: "normal" }}
          >
            Logout
          </span>
        </button>
      </nav>

      {/* Adjacent Slide-out Panel */}
      {activePanel !== null && activePanel !== "live" && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          className="fixed z-30 flex flex-col overflow-hidden panel-enter"
          style={{
            top: 16,
            left: 60,
            width: 420,
            height: "calc(100vh - 2rem)",
            background: "var(--color-surface-panel)",
            border: "1px solid var(--color-border-quiet)",
            borderTop: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          {activePanel === "alerts" && (
            <AlertsPanelContent
              alerts={alerts}
              onClose={() => onPanelChange(null)}
            />
          )}
          {activePanel === "history" && (
            <HistoryPanelContent onClose={() => onPanelChange(null)} />
          )}
          {activePanel === "config" && (
            <ConfigContent onClose={() => onPanelChange(null)} />
          )}
          {activePanel === "provision" && (
            <ProvisionContent onClose={() => onPanelChange(null)} />
          )}
        </div>
      )}
    </>
  );
}
