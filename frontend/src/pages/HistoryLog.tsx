import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useEvents, useAcknowledgeEvent } from '../hooks/useEvents';
import { formatDuration } from '../hooks/useAlerts';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft,
  Filter,
  CheckCircle,
  Clock,
  ListFilter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function HistoryLog() {
  const navigate = useNavigate();
  const { data: vehicles } = useVehicles();
  const acknowledgeEvent = useAcknowledgeEvent();

  const [vehicleId, setVehicleId] = useState('all');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [acknowledged, setAcknowledged] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 50;

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
    setVehicleId('all');
    setStatus('all');
    setFromDate('');
    setToDate('');
    setAcknowledged('all');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)] flex flex-col font-sans">
      <header className="p-4 border-b border-[var(--color-border-quiet)] bg-slate-950/40 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/fleet')}
              className="p-2 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <img src="/logo.png" alt="ColdChainIQ" className="w-8 h-8 rounded-lg border border-blue-500/30 object-cover shadow-sm" />
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wider font-mono">
                Event History
              </h1>
              <p className="text-[11px] text-slate-500 font-mono">
                Full status-change audit record
              </p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Refresh log"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4 overflow-hidden">
        <div className="bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md rounded-2xl p-4 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Filter size={14} className="text-blue-500" />
              <span className="text-xs font-semibold tracking-wider font-mono uppercase">
                Filters
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-mono text-slate-500 hover:text-blue-400 transition-colors uppercase cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="block text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                Vehicle
              </label>
              <select
                value={vehicleId}
                onChange={(e) => {
                  setVehicleId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono cursor-pointer"
              >
                <option value="all">All Vehicles</option>
                {vehicles?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                Status / Event Type
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono cursor-pointer"
              >
                <option value="all">All events</option>
                <option value="temperature_excursion">Temperature excursion</option>
                <option value="connectivity_lost">Connectivity lost</option>
                <option value="recovered">Recovered</option>
                <option value="first_checkin">First check-in</option>
                <option value="degraded">To: Degraded</option>
                <option value="offline">To: Offline</option>
                <option value="online">To: Online</option>
                <option value="pending">To: Pending</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                Acknowledgment
              </label>
              <select
                value={acknowledged}
                onChange={(e) => {
                  setAcknowledged(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="true">Acknowledged</option>
                <option value="false">Unacknowledged</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            {isLoading ? (
              <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 gap-3 font-mono text-sm">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                Loading audit record...
              </div>
            ) : !data || data.events.length === 0 ? (
              <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 gap-2 font-mono text-sm">
                <ListFilter size={24} className="text-slate-700" />
                No historical events match the active filters
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800/80 sticky top-0 text-[10px] font-mono uppercase tracking-widest text-slate-400 z-5">
                    <th className="p-3.5 pl-5">Vehicle</th>
                    <th className="p-3.5">Event Type</th>
                    <th className="p-3.5">From / To</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Acknowledgment</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
                  {data.events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-3.5 pl-5 text-slate-200 font-semibold">{event.vehicle.name}</td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-slate-200">
                            {event.eventLabel || event.reason || 'Status change'}
                          </span>
                          {event.reason && event.eventLabel && (
                            <div className="text-[10px] text-slate-500 max-w-xs truncate" title={event.reason}>
                              {event.reason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={event.fromStatus} />
                          <span className="text-slate-600">→</span>
                          <StatusBadge status={event.toStatus} />
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {event.durationSeconds != null ? (
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-slate-600" />
                            {formatDuration(event.durationSeconds)}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {event.acknowledged ? (
                          <div className="space-y-0.5 text-slate-400 text-[11px]">
                            <div className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle size={10} />
                              <span>Acknowledged by {event.acknowledgedBy || 'unknown'}</span>
                            </div>
                            {event.acknowledgedAt && (
                              <div className="text-[10px] text-slate-600">
                                {new Date(event.acknowledgedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-400/90 font-semibold">Unacknowledged</span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        {!event.acknowledged && (
                          <button
                            onClick={() => acknowledgeEvent.mutate(event.id)}
                            disabled={acknowledgeEvent.isPending}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-sans text-[10px] font-semibold rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {data && data.total > 0 && (
            <div className="p-4 bg-slate-950/30 border-t border-[var(--color-border-quiet)] flex items-center justify-between font-mono text-xs">
              <span className="text-slate-500">
                Showing page <span className="text-slate-300 font-semibold">{data.page}</span> of{' '}
                <span className="text-slate-300 font-semibold">{data.totalPages}</span> ({data.total} events)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
