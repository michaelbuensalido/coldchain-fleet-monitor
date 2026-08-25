import { useState } from "react";
import {
  X,
  Clock,
  RefreshCw,
  Filter,
  ListFilter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useVehicles } from "../hooks/useVehicles";
import { useEvents, useAcknowledgeEvent } from "../hooks/useEvents";
import { formatDuration } from "../hooks/useAlerts";
import StatusBadge from "./StatusBadge";
import { surface, type, icon } from "../theme/tokens";

export function HistoryPanelContent({ onClose }: { onClose: () => void }) {
  const { data: vehicles } = useVehicles();
  const acknowledgeEvent = useAcknowledgeEvent();

  const [vehicleId, setVehicleId] = useState("all");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [acknowledged, setAcknowledged] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isFetching, refetch } = useEvents({
    vehicleId,
    status,
    from: fromDate || undefined,
    to: toDate || undefined,
    acknowledged,
    page,
    limit,
  });

  const handleResetFilters = () => {
    setVehicleId("all");
    setStatus("all");
    setFromDate("");
    setToDate("");
    setAcknowledged("all");
    setPage(1);
  };

  /**
   * Helper to get secondary text (reason or unique label context).
   * Redundant generic event labels like "Status change" or enum names are dropped.
   */
  const getSecondaryText = (event: {
    eventLabel?: string | null;
    reason?: string | null;
    fromStatus: string;
    toStatus: string;
  }) => {
    if (event.reason) return event.reason;
    if (
      event.eventLabel &&
      ![
        "temperature_excursion",
        "connectivity_lost",
        "recovered",
        "first_checkin",
        "Status change",
        event.fromStatus,
        event.toStatus,
      ].includes(event.eventLabel)
    ) {
      return event.eventLabel;
    }
    return null;
  };

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 ${surface.panel} text-[var(--color-text-main)] font-sans`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-quiet)] bg-slate-950/20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-500" size={icon.md} />
          <div>
            <h2 className={type.heading}>Event History Log</h2>
            <p className={type.eyebrow}>Audit log</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors duration-150 active:scale-[0.96] cursor-pointer"
            title="Refresh log"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close history panel"
            className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors duration-150 active:scale-[0.96] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-3 border-b border-[var(--color-border-quiet)] bg-slate-950/40 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter size={12} className="text-blue-500" />
            <span className={type.eyebrow}>Filters</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[9px] font-sans text-slate-500 hover:text-blue-400 transition-colors uppercase cursor-pointer"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-sans">
          <div>
            <label className="block text-[9px] text-slate-500 uppercase font-sans mb-0.5">
              Vehicle
            </label>
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-sans cursor-pointer"
            >
              <option value="all">All Vehicles</option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-slate-500 uppercase font-sans mb-0.5">
              Event Type
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-sans cursor-pointer"
            >
              <option value="all">All events</option>
              <option value="temperature_excursion">Temp Excursion</option>
              <option value="connectivity_lost">Conn Lost</option>
              <option value="recovered">Recovered</option>
              <option value="first_checkin">First Check-in</option>
              <option value="degraded">To: Degraded</option>
              <option value="offline">To: Offline</option>
              <option value="online">To: Online</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-slate-500 uppercase font-sans mb-0.5">
              Status
            </label>
            <select
              value={acknowledged}
              onChange={(e) => {
                setAcknowledged(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-sans cursor-pointer"
            >
              <option value="all">All Ack Statuses</option>
              <option value="true">Acknowledged</option>
              <option value="false">Unacknowledged</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-slate-500 uppercase font-sans mb-0.5">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <div className="w-full h-40 flex flex-col items-center justify-center text-slate-400 gap-2 font-sans text-xs">
            <RefreshCw size={18} className="animate-spin text-blue-500" />
            <span>Loading history...</span>
          </div>
        ) : !data || data.events.length === 0 ? (
          <div className="w-full h-40 flex flex-col items-center justify-center text-slate-500 gap-2 font-sans text-xs">
            <ListFilter size={18} className="text-slate-600" />
            <span>No events match filters</span>
          </div>
        ) : (
          data.events.map((event) => {
            const secondaryText = getSecondaryText(event);
            const isLongDuration =
              event.durationSeconds != null && event.durationSeconds >= 300;

            return (
              <div
                key={event.id}
                className={`p-3.5 rounded-xl space-y-2.5 transition-[background-color,border-color,box-shadow] duration-150 bg-slate-900/30 border border-slate-800/60`}
              >
                {/* 1. Headline: Status Transition + Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={event.fromStatus} />
                    <span className="text-slate-600 font-sans text-xs">→</span>
                    <StatusBadge status={event.toStatus} />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 font-medium shrink-0">
                    {new Date(event.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* 2. Body: Vehicle Name + Reason */}
                <div className="space-y-0.5">
                  <h3 className="font-sans font-semibold text-sm text-[var(--color-text-main)]">
                    {event.vehicle.name}
                  </h3>
                  {secondaryText && (
                    <p className="font-sans text-xs text-slate-400 leading-normal">
                      {secondaryText}
                    </p>
                  )}
                </div>

                {/* 3. Footer: Duration + Acknowledgment Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 text-xs">
                  <div>
                    {isLongDuration ? (
                      <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                        <Clock size={10} className="text-amber-400" />
                        Duration: {formatDuration(event.durationSeconds!)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-slate-500 font-medium">
                        Duration:{" "}
                        {event.durationSeconds != null
                          ? formatDuration(event.durationSeconds)
                          : "—"}
                      </span>
                    )}
                  </div>

                  {event.acknowledged ? (
                    <span className="font-sans text-xs text-slate-500 flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-500" />{" "}
                      Acked by {event.acknowledgedBy || "system"}
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledgeEvent.mutate(event.id)}
                      disabled={acknowledgeEvent.isPending}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-sans font-medium transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {acknowledgeEvent.isPending
                        ? "Acknowledging..."
                        : "Acknowledge"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {data && data.total > 0 && (
        <div className="p-3 bg-slate-950/40 border-t border-[var(--color-border-quiet)] flex items-center justify-between font-sans text-xs shrink-0">
          <span className="text-slate-400 font-sans">
            Page{" "}
            <span className="font-mono font-semibold text-slate-200">
              {data.page}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold text-slate-200">
              {data.totalPages}
            </span>{" "}
            (
            <span className="font-mono text-slate-300 font-medium">
              {data.total}
            </span>{" "}
            total)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-30 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-30 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
