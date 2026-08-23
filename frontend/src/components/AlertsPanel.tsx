import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { useAcknowledgeAlert, useAcknowledgeAllAlerts } from '../hooks/useAlerts';

interface Alert {
  id: string;
  vehicleId: string;
  vehicle: { id: string; name: string };
  severity: 'info' | 'warning' | 'critical';
  type: 'status_change' | 'temperature_excursion' | 'connectivity_loss' | string;
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

export default function AlertsPanel({ isOpen, onClose, alerts, triggerRef }: AlertsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const acknowledgeAlert = useAcknowledgeAlert();
  const acknowledgeAll = useAcknowledgeAllAlerts();
  const unresolvedCount = alerts.filter((alert) => !alert.acknowledged).length;

  // Focus trapping and management
  useEffect(() => {
    if (isOpen) {
      // Find first focusable element inside the panel
      const focusableElements = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-950/40 border-red-500/30';
      case 'warning':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      case 'info':
        return 'text-blue-400 bg-blue-950/40 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-900/40 border-slate-800';
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
      case 'warning':
        return 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
      default:
        return 'bg-blue-500 shadow-[0_0_8px_#3b82f6]';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-in drawer */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Alerts log"
        className="fixed top-4 right-4 z-50 w-[450px] h-[calc(100vh-2rem)] bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md rounded-2xl flex flex-col shadow-2xl transition-all duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-quiet)] bg-slate-950/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            <h2 className="text-sm font-semibold tracking-wider text-[var(--color-text-main)] uppercase font-mono">
              Live Fleet Alerts
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {unresolvedCount > 0 && (
              <button
                onClick={() => acknowledgeAll.mutate()}
                disabled={acknowledgeAll.isPending}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] font-mono uppercase text-slate-300 hover:text-green-400 rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {acknowledgeAll.isPending ? 'Resolving…' : 'Resolve all'}
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No alerts currently recorded
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 bg-slate-900/30 border rounded-xl relative group transition-all ${
                  !alert.acknowledged
                    ? 'border-red-500/20 bg-red-950/5'
                    : 'border-slate-850 bg-slate-900/10'
                }`}
              >
                {!alert.acknowledged && (
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-red-500 opacity-80" />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getSeverityDot(alert.severity)}`} />
                      <span className="font-semibold text-xs font-mono text-[var(--color-text-main)]">
                        {alert.vehicle?.name || 'Unknown Vehicle'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert.mutate(alert.id)}
                      disabled={acknowledgeAlert.isPending}
                      aria-label="Acknowledge alert"
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-green-400 rounded-lg transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
