import { useParams, useNavigate } from 'react-router-dom';
import { useVehicles, useUpdateVehicle } from '../hooks/useVehicles';
import { useTelemetryHistory } from '../hooks/useTelemetry';
import StatusBadge from '../components/StatusBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicles } = useVehicles();
  const { data: telemetry, isLoading } = useTelemetryHistory(id || '', 50);
  const updateVehicle = useUpdateVehicle();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', currentRoute: '', active: true });

  const vehicle = vehicles?.find((v) => v.id === id);

  const handleBack = () => {
    navigate('/fleet');
  };

  const handleEdit = () => {
    if (vehicle) {
      setEditForm({
        name: vehicle.name,
        currentRoute: vehicle.currentRoute || '',
        active: vehicle.active,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (vehicle) {
      updateVehicle.mutate(
        { id: vehicle.id, data: editForm },
        {
          onSuccess: () => {
            setIsEditing(false);
          },
        }
      );
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (!vehicle) return <div className="p-8">Vehicle not found</div>;

  const chartData = telemetry?.map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString(),
    temperature: t.temperature,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{vehicle.name}</h1>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Edit Vehicle
            </button>
          )}
        </div>
      </header>

      {isEditing && (
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Vehicle</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                <input
                  type="text"
                  value={editForm.currentRoute}
                  onChange={(e) => setEditForm({ ...editForm, currentRoute: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={updateVehicle.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {updateVehicle.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-sm mb-1">Status</p>
            <StatusBadge status={vehicle.status} />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-sm mb-1">Route</p>
            <p className="text-lg font-semibold text-gray-800">{vehicle.currentRoute || 'Not assigned'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-sm mb-1">Latest Temperature</p>
            <p className="text-lg font-semibold text-gray-800">
              {telemetry?.[0]?.temperature.toFixed(1)}°C
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Temperature History</h2>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 15]} />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No telemetry data available</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Telemetry</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Temperature</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Latitude</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Longitude</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Door</th>
                </tr>
              </thead>
              <tbody>
                {telemetry?.slice(0, 10).map((reading) => (
                  <tr key={reading.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {new Date(reading.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">{reading.temperature.toFixed(1)}°C</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{reading.latitude.toFixed(6)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{reading.longitude.toFixed(6)}</td>
                    <td className="py-3 px-4 text-sm">
                      {reading.doorOpen ? (
                        <span className="text-red-600">Open</span>
                      ) : (
                        <span className="text-green-600">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
