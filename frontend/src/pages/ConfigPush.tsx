import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigs, useCreateConfig, useAssignConfig } from '../hooks/useConfigs';
import { useVehicles } from '../hooks/useVehicles';

export default function ConfigPush() {
  const navigate = useNavigate();
  const { data: configs } = useConfigs();
  const { data: vehicles } = useVehicles();
  const createConfig = useCreateConfig();
  const assignConfig = useAssignConfig();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    tempMin: 2.0,
    tempMax: 8.0,
    heartbeatIntervalSecs: 60,
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState('');

  const handleCreateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    createConfig.mutate(newConfig, {
      onSuccess: () => {
        setShowCreateForm(false);
        setNewConfig({ name: '', tempMin: 2.0, tempMax: 8.0, heartbeatIntervalSecs: 60 });
      },
    });
  };

  const handleAssignConfig = () => {
    if (selectedVehicleId && selectedConfigId) {
      assignConfig.mutate(
        { vehicleId: selectedVehicleId, configProfileId: selectedConfigId },
        {
          onSuccess: () => {
            alert('Config assigned successfully');
            setSelectedVehicleId('');
            setSelectedConfigId('');
          },
        }
      );
    }
  };

  const handleBack = () => {
    navigate('/fleet');
  };

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
          <h1 className="text-2xl font-bold text-gray-800">Config Management</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Config Profiles</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showCreateForm ? 'Cancel' : 'Create New Profile'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateConfig} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name</label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newConfig.tempMin}
                    onChange={(e) => setNewConfig({ ...newConfig, tempMin: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newConfig.tempMax}
                    onChange={(e) => setNewConfig({ ...newConfig, tempMax: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heartbeat (s)</label>
                  <input
                    type="number"
                    value={newConfig.heartbeatIntervalSecs}
                    onChange={(e) => setNewConfig({ ...newConfig, heartbeatIntervalSecs: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createConfig.isPending}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {createConfig.isPending ? 'Creating...' : 'Create Profile'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {configs?.map((config) => (
              <div key={config.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-500">
                      Temp: {config.tempMin}°C - {config.tempMax}°C | Heartbeat: {config.heartbeatIntervalSecs}s
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Assign Config to Vehicle</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a vehicle...</option>
                {vehicles?.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Config Profile</label>
              <select
                value={selectedConfigId}
                onChange={(e) => setSelectedConfigId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a config profile...</option>
                {configs?.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAssignConfig}
              disabled={assignConfig.isPending || !selectedVehicleId || !selectedConfigId}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {assignConfig.isPending ? 'Assigning...' : 'Assign Config'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
