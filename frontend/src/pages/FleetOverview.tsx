import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useSocket } from '../hooks/useSocket';
import StatusBadge from '../components/StatusBadge';
import FleetMap from '../components/FleetMap';

export default function FleetOverview() {
  const navigate = useNavigate();
  const { data: vehicles, isLoading, error } = useVehicles();
  useSocket();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading) return <div className="p-8">Loading fleet...</div>;
  if (error) return <div className="p-8 text-red-600">Error loading fleet</div>;

  const onlineCount = vehicles?.filter((v) => v.status === 'online').length || 0;
  const degradedCount = vehicles?.filter((v) => v.status === 'degraded').length || 0;
  const offlineCount = vehicles?.filter((v) => v.status === 'offline').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">ColdChain IQ</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/provision')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Provision
            </button>
            <button
              onClick={() => navigate('/config')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Config
            </button>
            <button
              onClick={() => navigate('/alerts')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Alerts
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Online</p>
                <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-2xl">●</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Degraded</p>
                <p className="text-3xl font-bold text-yellow-600">{degradedCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-2xl">●</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Offline</p>
                <p className="text-3xl font-bold text-red-600">{offlineCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-2xl">●</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Fleet Map</h2>
          <FleetMap vehicles={vehicles || []} />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Fleet Status</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {vehicles?.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{vehicle.name}</h3>
                    <p className="text-sm text-gray-500">{vehicle.currentRoute || 'No route assigned'}</p>
                  </div>
                  <StatusBadge status={vehicle.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
