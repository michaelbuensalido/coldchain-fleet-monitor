import { useEffect, useRef, useState } from 'react';
import { X, Key, Plus } from 'lucide-react';
import { useCreateVehicle } from '../hooks/useVehicles';

interface ProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function ProvisionContent({ onClose }: { onClose?: () => void }) {
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-quiet)] bg-slate-950/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Plus className="text-blue-500" size={18} />
          <h2 className="text-sm font-semibold tracking-wider text-[var(--color-text-main)] uppercase font-mono">
            Provision Vehicle
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {showApiKey && generatedApiKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 text-xs font-mono">
                <Key size={14} />
                VEHICLE PROVISIONED SUCCESSFULLY
              </div>
              <p className="text-[11px] text-slate-400 font-mono mb-3">
                Save this API key now. It will not be shown again.
              </p>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 break-all select-all">
                <code className="text-xs font-mono text-emerald-300">{generatedApiKey}</code>
              </div>
            </div>
            <button
              onClick={() => {
                setShowApiKey(false);
                setGeneratedApiKey('');
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer font-mono"
            >
              Provision Another Vehicle
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                Vehicle Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-[var(--color-text-main)] placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                placeholder="Truck-006"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                Route (Optional)
              </label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-[var(--color-text-main)] placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                placeholder="Route-105"
              />
            </div>
            <button
              type="submit"
              disabled={createVehicle.isPending}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer font-mono"
            >
              {createVehicle.isPending ? 'Provisioning...' : 'Provision Vehicle'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProvisionModal({ isOpen, onClose, triggerRef }: ProvisionModalProps) {
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
        aria-label="Provision vehicle form"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md rounded-2xl flex flex-col shadow-2xl transition-all duration-300 overflow-hidden"
      >
        <ProvisionContent onClose={onClose} />
      </div>
    </>
  );
}
