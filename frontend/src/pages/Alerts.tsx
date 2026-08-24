import { useNavigate } from 'react-router-dom';
import { useAlerts, useUnacknowledgedAlerts, useAcknowledgeAlert, formatDuration } from '../hooks/useAlerts';

export default function Alerts() {
  const navigate = useNavigate();
  const { data: alerts, isLoading } = useAlerts();
  const { data: unacknowledgedAlerts } = useUnacknowledgedAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
  };

  const handleBack = () => {
    navigate('/');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return '🔄';
      case 'temperature_excursion':
        return '🌡️';
      case 'connectivity_loss':
        return '📡';
      default:
        return '⚠️';
    }
  };

  if (isLoading) return <div className="p-8 text-[var(--color-text-secondary)]">Loading alerts...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-text-secondary)] transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Alerts</h1>
          {unacknowledgedAlerts && unacknowledgedAlerts.length > 0 && (
            <span className="bg-[var(--color-status-red)] text-white px-3 py-1 rounded-full text-sm font-medium">
              {unacknowledgedAlerts.length} unacknowledged
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-[var(--color-surface)] rounded-xl shadow-sm overflow-hidden border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">All Alerts</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {alerts?.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-secondary)]">No alerts</div>
            ) : (
              alerts?.map((alert) => (
                <div
                  key={alert.id}
                  className={`px-6 py-4 ${!alert.acknowledged ? 'bg-[var(--color-status-red)]/5 border-l-4 border-l-[var(--color-status-red)]' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                        <div>
                          <h3 className="font-medium text-[var(--color-text-primary)]">{alert.vehicle.name}</h3>
                          <p className="text-sm text-[var(--color-text-secondary)]">{alert.message}</p>
                          {alert.minor && (
                            <span className="text-xs text-[var(--color-status-green)] ml-2">(Minor, self-resolved)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                        {alert.durationSeconds !== null && (
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            Duration: {formatDuration(alert.durationSeconds)}
                          </span>
                        )}
                        {alert.recoveredAt && (
                          <span className="text-xs text-[var(--color-status-green)]">
                            Recovered at {new Date(alert.recoveredAt).toLocaleString()}
                          </span>
                        )}
                        {alert.acknowledged && (
                          <span className="text-xs text-[var(--color-status-green)]">
                            Acknowledged by {alert.acknowledgedBy} at{' '}
                            {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleString() : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledgeAlert.isPending}
                        className="px-4 py-2 bg-[var(--color-status-green)] text-white rounded-lg hover:bg-[var(--color-status-green)]/80 transition-colors disabled:opacity-50 text-sm"
                      >
                        {acknowledgeAlert.isPending ? 'Acknowledging...' : 'Acknowledge'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
