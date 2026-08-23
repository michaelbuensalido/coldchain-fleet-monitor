import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateVehicle } from '../hooks/useVehicles';

export default function Provisioning() {
  const navigate = useNavigate();
  const createVehicle = useCreateVehicle();
  const [name, setName] = useState('');
  const [route, setRoute] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVehicle.mutate(
      { name, currentRoute: route || undefined },
      {
        onSuccess: (data) => {
          setGeneratedApiKey(data.apiKey);
          setShowApiKey(true);
          setName('');
          setRoute('');
        },
      }
    );
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
          <h1 className="text-2xl font-bold text-gray-800">Provision Vehicle</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {showApiKey && generatedApiKey ? (
            <div>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Vehicle Provisioned Successfully</h3>
                <p className="text-sm text-green-700 mb-4">
                  Save this API key now. It will not be shown again.
                </p>
                <div className="bg-white p-4 rounded border border-green-300">
                  <code className="text-sm font-mono text-green-900 break-all">{generatedApiKey}</code>
                </div>
              </div>
              <button
                onClick={() => setShowApiKey(false)}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Provision Another Vehicle
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Truck-006"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route (Optional)</label>
                <input
                  type="text"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Route-105"
                />
              </div>
              <button
                type="submit"
                disabled={createVehicle.isPending}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {createVehicle.isPending ? 'Provisioning...' : 'Provision Vehicle'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
