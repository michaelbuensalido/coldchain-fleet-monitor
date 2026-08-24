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

export default function NavRail({
  activePanel,
  onPanelChange,
  alerts,
  onLogout,
}: NavRailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  // Keyboard navigation & Esc key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activePanel !== null) {
        onPanelChange(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePanel, onPanelChange]);

  const togglePanel = (
    panel: "alerts" | "history" | "config" | "provision",
  ) => {
    if (activePanel === panel) {
      onPanelChange(null);
    } else {
      onPanelChange(panel);
    }
  };

  const isLiveActive = activePanel === null || activePanel === "live";

  return (
    <>
      {/* Click-outside backdrop when panel is open */}
      {activePanel !== null && activePanel !== "live" && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/25 backdrop-blur-[2px] transition-opacity duration-150"
          onClick={() => onPanelChange(null)}
        />
      )}

      {/* Vertical Icon Rail */}
      <nav
        aria-label="Primary navigation rail"
        className="fixed top-4 left-4 z-30 w-[72px] h-[calc(100vh-2rem)] bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md rounded-2xl flex flex-col items-center py-5 shadow-2xl"
      >
        {/* Logo / Brand Indicator */}
        <button
          onClick={() => onPanelChange(null)}
          className="w-12 h-12 rounded-xl overflow-hidden mb-5 flex items-center justify-center select-none cursor-pointer   active:scale-[0.96] transition-transform duration-150"
          title="ColdChainIQ Fleet Monitor"
        >
          <img
            src="/logo.png"
            alt="ColdChainIQ Logo"
            className="w-full h-full object-cover"
          />
        </button>

        {/* Main Navigation Buttons */}
        <div className="flex-1 flex flex-col gap-3.5 items-center w-full px-2">
          {/* 1. Live Overview */}
          <button
            onClick={() => onPanelChange(null)}
            className={`w-full py-2.5 rounded-xl flex flex-col items-center gap-1 transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer relative group ${
              isLiveActive
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                : "bg-slate-900/40 hover:bg-slate-800/70 border border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
            title="Live Fleet Overview"
          >
            <Radio size={18} strokeWidth={2} />
            <span className="text-[9px] font-mono font-semibold tracking-wider uppercase">
              Live
            </span>
          </button>

          {/* 2. Alerts */}
          <button
            onClick={() => togglePanel("alerts")}
            className={`w-full py-2.5 rounded-xl flex flex-col items-center gap-1 transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer relative group ${
              activePanel === "alerts"
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                : "bg-slate-900/40 hover:bg-slate-800/70 border border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
            title="Live Fleet Alerts"
          >
            <div className="relative">
              <Bell size={18} strokeWidth={2} />
              {unacknowledgedAlerts > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold font-mono rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unacknowledgedAlerts}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono font-semibold tracking-wider uppercase">
              Alerts
            </span>
          </button>

          {/* 3. History */}
          <button
            onClick={() => togglePanel("history")}
            className={`w-full py-2.5 rounded-xl flex flex-col items-center gap-1 transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer relative group ${
              activePanel === "history"
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                : "bg-slate-900/40 hover:bg-slate-800/70 border border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
            title="Event Audit History"
          >
            <Clock size={18} strokeWidth={2} />
            <span className="text-[9px] font-mono font-semibold tracking-wider uppercase">
              History
            </span>
          </button>

          {/* 4. Config */}
          <button
            onClick={() => togglePanel("config")}
            className={`w-full py-2.5 rounded-xl flex flex-col items-center gap-1 transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer relative group ${
              activePanel === "config"
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                : "bg-slate-900/40 hover:bg-slate-800/70 border border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
            title="Manage Config Profiles"
          >
            <Sliders size={18} strokeWidth={2} />
            <span className="text-[9px] font-mono font-semibold tracking-wider uppercase">
              Config
            </span>
          </button>

          {/* 5. Provision */}
          <button
            onClick={() => togglePanel("provision")}
            className={`w-full py-2.5 rounded-xl flex flex-col items-center gap-1 transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer relative group ${
              activePanel === "provision"
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                : "bg-slate-900/40 hover:bg-slate-800/70 border border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
            title="Provision New Vehicle"
          >
            <PlusCircle size={18} strokeWidth={2} />
            <span className="text-[9px] font-mono font-semibold tracking-wider uppercase">
              Provision
            </span>
          </button>
        </div>

        {/* Logout at bottom */}
        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-xl bg-slate-900/40 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-500 hover:text-red-400 flex items-center justify-center transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          title="Logout"
        >
          <LogOut size={16} strokeWidth={2} />
        </button>
      </nav>

      {/* Adjacent Slide-out Panel */}
      {activePanel !== null && activePanel !== "live" && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          className="fixed top-4 left-[96px] z-30 w-[420px] h-[calc(100vh-2rem)] bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-150"
        >
          {/* Panel content switcher */}
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
