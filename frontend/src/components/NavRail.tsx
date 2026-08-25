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
          style={{ background: "var(--color-surface-scrim)", backdropFilter: "blur(2px)" }}
          onClick={() => onPanelChange(null)}
        />
      )}

      {/* Vertical Icon Rail */}
      <nav
        aria-label="Primary navigation rail"
        className="fixed top-4 left-4 z-30 flex flex-col items-center py-5"
        style={{
          width: 72,
          height: "calc(100vh - 2rem)",
          background: "var(--color-surface-panel)",
          border: "1px solid var(--color-border-quiet)",
          backdropFilter: "blur(16px)",
          borderRadius: 18,
          boxShadow: "0 8px 32px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(1 0 0 / 0.04)",
        }}
      >
        {/* Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => onPanelChange(null)}
          className="mb-5 rounded-xl overflow-hidden flex-shrink-0 transition-transform duration-150 active:scale-95 cursor-pointer"
          style={{ width: 44, height: 44 }}
          title="ColdChainIQ Fleet Monitor"
        >
          <img
            src="/logo.png"
            alt="ColdChainIQ Logo"
            className="w-full h-full object-cover"
          />
        </button>

        {/* Nav buttons */}
        <div className="flex-1 flex flex-col gap-2.5 items-center w-full px-2">
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
                className="relative w-full rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  padding: "10px 0",
                  background: active
                    ? "var(--color-accent-dim)"
                    : "oklch(0.16 0.022 240 / 0.50)",
                  border: active
                    ? "1px solid var(--color-accent-edge)"
                    : "1px solid var(--color-border-quiet)",
                  color: active
                    ? "var(--color-accent)"
                    : "var(--color-text-dim)",
                  boxShadow: active
                    ? "0 0 14px var(--color-accent-glow), inset 3px 0 0 var(--color-accent)"
                    : "none",
                  transform: active ? "none" : undefined,
                  // @ts-ignore
                  "--tw-ring-color": "var(--color-focus)",
                }}
              >
                <div className="relative">
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  {id === "alerts" && unacknowledgedAlerts > 0 && (
                    <span
                      className="absolute flex items-center justify-center font-mono font-bold dot-online"
                      style={{
                        top: -6,
                        right: -8,
                        minWidth: 15,
                        height: 15,
                        padding: "0 3px",
                        fontSize: 9,
                        borderRadius: 8,
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
                  style={{ fontSize: 8 }}
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
          className="rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
          style={{
            width: 40,
            height: 40,
            background: "oklch(0.16 0.022 240 / 0.50)",
            border: "1px solid var(--color-border-quiet)",
            color: "var(--color-text-muted)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "oklch(0.62 0.22 25 / 0.10)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "oklch(0.62 0.22 25 / 0.30)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-status-offline)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "oklch(0.16 0.022 240 / 0.50)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--color-border-quiet)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-text-muted)";
          }}
        >
          <LogOut size={15} strokeWidth={1.8} />
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
            left: 96,
            width: 420,
            height: "calc(100vh - 2rem)",
            background: "var(--color-surface-panel)",
            border: "1px solid var(--color-border-quiet)",
            backdropFilter: "blur(20px)",
            borderRadius: 18,
            boxShadow:
              "0 8px 40px oklch(0 0 0 / 0.55), 0 0 0 1px oklch(1 0 0 / 0.04)",
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
