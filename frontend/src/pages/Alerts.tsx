import { useNavigate } from 'react-router-dom';
import { useAlerts, useUnacknowledgedAlerts, useAcknowledgeAlert, useAcknowledgeAllAlerts } from '../hooks/useAlerts';

export default function Alerts() {
  const navigate = useNavigate();
  const { data: alerts, isLoading } = useAlerts();
  const { data: unacknowledgedAlerts } = useUnacknowledgedAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();
  const acknowledgeAll = useAcknowledgeAllAlerts();

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
  };

  const handleBack = () => {
    navigate('/fleet');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (isLoading) return <div className="p-8">Loading alerts...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Alerts</h1>
          {unacknowledgedAlerts && unacknowledgedAlerts.length > 0 && (
            <>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unacknowledgedAlerts.length} unacknowledged
              </span>
              <button
                onClick={() => acknowledgeAll.mutate()}
                disabled={acknowledgeAll.isPending}
                className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
              >
                {acknowledgeAll.isPending ? 'Acknowledging...' : 'Acknowledge all'}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">All Alerts</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {alerts?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No alerts</div>
            ) : (
              alerts?.map((alert) => (
                <div
                  key={alert.id}
                  className={`px-6 py-4 ${!alert.acknowledged ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{alert.vehicle.name}</h3>
                          <p className="text-sm text-gray-500">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                        {alert.acknowledged && (
                          <span className="text-xs text-green-600">
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
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
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
