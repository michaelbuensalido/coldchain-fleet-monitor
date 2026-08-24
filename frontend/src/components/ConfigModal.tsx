import { useEffect, useRef, useState } from 'react';
import { X, Settings, Plus } from 'lucide-react';
import { useConfigs, useCreateConfig, useAssignConfig } from '../hooks/useConfigs';
import { useVehicles } from '../hooks/useVehicles';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function ConfigContent({ onClose }: { onClose?: () => void }) {
  const { data: configs } = useConfigs();
  const { data: vehicles } = useVehicles();
  const createConfig = useCreateConfig();
  const assignConfig = useAssignConfig();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    tempMin: 2.0,
    tempMax: 8.0,
    heartbeatIntervalSecs: 30,
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState('');

  const handleCreateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    createConfig.mutate(newConfig, {
      onSuccess: () => {
        setShowCreateForm(false);
        setNewConfig({ name: '', tempMin: 2.0, tempMax: 8.0, heartbeatIntervalSecs: 30 });
      },
    });
  };

  const handleAssignConfig = () => {
    if (selectedVehicleId && selectedConfigId) {
      assignConfig.mutate(
        { vehicleId: selectedVehicleId, configProfileId: selectedConfigId },
        {
          onSuccess: () => {
            setSelectedVehicleId('');
            setSelectedConfigId('');
          },
        }
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-quiet)] bg-slate-950/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings className="text-blue-500" size={18} />
          <h2 className="text-sm font-semibold tracking-wider text-[var(--color-text-main)] uppercase font-mono">
            Manage Configs
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close configuration panel"
            className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Config profiles list */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono">
              Config Profiles
            </span>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-350 hover:text-white transition-colors duration-150 active:scale-[0.96] font-mono text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={10} />
              {showCreateForm ? 'CANCEL' : 'CREATE'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateConfig} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] text-slate-450 font-mono uppercase tracking-wider">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[var(--color-text-main)] placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-[border-color,box-shadow] duration-150 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-mono uppercase tracking-wider">
                    Min Temp
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newConfig.tempMin}
                    onChange={(e) => setNewConfig({ ...newConfig, tempMin: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-[border-color,box-shadow] duration-150 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-mono uppercase tracking-wider">
                    Max Temp
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newConfig.tempMax}
                    onChange={(e) => setNewConfig({ ...newConfig, tempMax: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-[border-color,box-shadow] duration-150 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-mono uppercase tracking-wider">
                    Heartbeat (s)
                  </label>
                  <input
                    type="number"
                    value={newConfig.heartbeatIntervalSecs}
                    onChange={(e) => setNewConfig({ ...newConfig, heartbeatIntervalSecs: parseInt(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-[border-color,box-shadow] duration-150 font-mono"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createConfig.isPending}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
              >
                {createConfig.isPending ? 'Creating...' : 'Create Profile'}
              </button>
            </form>
          )}

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {configs?.map((config) => (
              <div key={config.id} className="p-2.5 border border-slate-800/80 bg-slate-900/30 rounded-xl">
                <h3 className="font-semibold text-xs text-[var(--color-text-main)] font-mono">{config.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Temp: {config.tempMin}°C - {config.tempMax}°C | Heartbeat: {config.heartbeatIntervalSecs}s
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Assign config */}
        <div className="space-y-3 pt-3 border-t border-[var(--color-border-quiet)]">
          <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono block">
            Assign Config to Vehicle
          </span>
          <div className="space-y-3 bg-slate-900/10 border border-slate-800/60 rounded-xl p-3">
            <div className="space-y-1">
              <label className="block text-[9px] text-slate-450 font-mono uppercase tracking-wider">
                Select Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono cursor-pointer"
              >
                <option value="">Choose a vehicle...</option>
                {vehicles?.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] text-slate-450 font-mono uppercase tracking-wider">
                Select Config Profile
              </label>
              <select
                value={selectedConfigId}
                onChange={(e) => setSelectedConfigId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono cursor-pointer"
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
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              {assignConfig.isPending ? 'Assigning...' : 'Assign Config'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigModal({ isOpen, onClose, triggerRef }: ConfigModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

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

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Manage Config Profiles"
        className="fixed top-4 right-4 z-50 w-[450px] h-[calc(100vh-2rem)] bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md rounded-2xl flex flex-col shadow-2xl transition-all duration-300 overflow-hidden"
      >
        <ConfigContent onClose={onClose} />
      </div>
    </>
  );
}
