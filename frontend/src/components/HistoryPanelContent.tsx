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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-surface-panel)] text-[var(--color-text-main)] font-sans">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-quiet)] bg-slate-950/20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-500" size={18} />
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-[var(--color-text-main)] uppercase font-mono">
              Event History Log
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              Full audit trail
            </p>
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
            <span className="text-[10px] font-semibold tracking-wider font-mono uppercase">
              Filters
            </span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[9px] font-mono text-slate-500 hover:text-blue-400 transition-colors uppercase cursor-pointer"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <label className="block text-[8px] text-slate-500 uppercase">
              Vehicle
            </label>
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 bg-slate-900/80 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none focus:border-blue-500/50"
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
            <label className="block text-[8px] text-slate-500 uppercase">
              Event Type
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 bg-slate-900/80 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none focus:border-blue-500/50"
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
            <label className="block text-[8px] text-slate-500 uppercase">
              Status
            </label>
            <select
              value={acknowledged}
              onChange={(e) => {
                setAcknowledged(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 bg-slate-900/80 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">All Ack Statuses</option>
              <option value="true">Acknowledged</option>
              <option value="false">Unacknowledged</option>
            </select>
          </div>

          <div>
            <label className="block text-[8px] text-slate-500 uppercase">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 bg-slate-900/80 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="w-full h-40 flex flex-col items-center justify-center text-slate-500 gap-2 font-mono text-xs">
            <RefreshCw size={20} className="animate-spin text-blue-500" />
            Loading event audit record...
          </div>
        ) : !data || data.events.length === 0 ? (
          <div className="w-full h-40 flex flex-col items-center justify-center text-slate-500 gap-1 font-mono text-xs">
            <ListFilter size={20} className="text-slate-700" />
            No events match filters
          </div>
        ) : (
          data.events.map((event) => (
            <div
              key={event.id}
              className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1.5 font-mono text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">
                  {event.vehicle.name}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(event.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-blue-400 font-semibold">
                  {event.eventLabel || event.reason || "Status change"}
                </span>
                <div className="flex items-center gap-1 ml-auto text-[10px]">
                  <StatusBadge status={event.fromStatus} />
                  <span className="text-slate-600">→</span>
                  <StatusBadge status={event.toStatus} />
                </div>
              </div>

              {event.reason && (
                <p className="text-[10px] text-slate-400 leading-tight">
                  {event.reason}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[10px] text-slate-500">
                <span>
                  Duration:{" "}
                  {event.durationSeconds != null
                    ? formatDuration(event.durationSeconds)
                    : "—"}
                </span>
                {event.acknowledged ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={10} /> Acked by{" "}
                    {event.acknowledgedBy || "system"}
                  </span>
                ) : (
                  <button
                    onClick={() => acknowledgeEvent.mutate(event.id)}
                    disabled={acknowledgeEvent.isPending}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[9px] font-semibold transition-colors duration-150 active:scale-[0.96] cursor-pointer"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {data && data.total > 0 && (
        <div className="p-3 bg-slate-950/40 border-t border-[var(--color-border-quiet)] flex items-center justify-between font-mono text-[11px] shrink-0">
          <span className="text-slate-500">
            Page{" "}
            <span className="text-slate-300 font-semibold">{data.page}</span> of{" "}
            <span className="text-slate-300 font-semibold">
              {data.totalPages}
            </span>{" "}
            ({data.total} total)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
