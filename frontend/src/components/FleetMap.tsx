import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vehicle {
  id: string;
  name: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string | null;
  onVehicleSelect?: (vehicleId: string) => void;
}

function MapController({ selectedVehicle, vehicles }: { selectedVehicle: Vehicle | null; vehicles: Vehicle[] }) {
  const map = useMap();

  useEffect(() => {
    if (selectedVehicle && selectedVehicle.latitude !== undefined && selectedVehicle.longitude !== undefined) {
      map.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], 13, {
        duration: 1.2,
      });
    } else if (vehicles.length > 0) {
      const bounds = L.latLngBounds(
        vehicles
          .filter((v) => v.latitude !== undefined && v.longitude !== undefined)
          .map((v) => [v.latitude!, v.longitude!])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    }
  }, [map, selectedVehicle, vehicles]);

  return null;
}

const createCustomIcon = (status: string, isSelected: boolean) => {
  const colors = {
    online: '#10b981',
    degraded: '#f59e0b',
    offline: '#ef4444',
    pending: '#94a3b8',
  };
  const color = colors[status as keyof typeof colors] || colors.pending;
  
  const ringSize = isSelected ? 44 : 28;
  const centerSize = isSelected ? 12 : 8;
  const borderSize = isSelected ? 4 : 3;

  const svgIcon = `
    <svg width="${ringSize}" height="${ringSize}" viewBox="0 0 ${ringSize} ${ringSize}" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
      <defs>
        <filter id="glow-${status}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${color}" flood-opacity="0.6" />
        </filter>
      </defs>
      ${isSelected ? `
        <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${ringSize / 2 - 2}" fill="none" stroke="${color}" stroke-width="2" opacity="0.4">
          <animate attributeName="r" values="${ringSize / 3};${ringSize / 2 - 2}" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${ringSize / 2.5}" fill="none" stroke="${color}" stroke-width="1" opacity="0.6">
          <animate attributeName="r" values="${ringSize / 4};${ringSize / 2.5}" dur="1.8s" begin="0.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0" dur="1.8s" begin="0.6s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
      <!-- Outer Base Ring -->
      <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${(centerSize + borderSize * 2) / 2}" fill="#0b0f17" stroke="${color}" stroke-width="${borderSize}" filter="url(#glow-${status})" />
      <!-- Inner Solid Dot -->
      <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${centerSize / 2}" fill="${color}" />
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-container',
    iconSize: [ringSize, ringSize],
    iconAnchor: [ringSize / 2, ringSize / 2],
  });
};

// Implement coordinate jitter/offset calculation to prevent overlapping markers from hiding each other
const applyJitterOffset = (vehicles: Vehicle[]): Vehicle[] => {
  const coordCount: Record<string, number> = {};
  
  return vehicles.map((v) => {
    if (v.latitude === undefined || v.longitude === undefined) return v;
    
    // Group by coordinates rounded to 5 decimal places (~1m resolution)
    const key = `${v.latitude.toFixed(5)},${v.longitude.toFixed(5)}`;
    const count = coordCount[key] || 0;
    coordCount[key] = count + 1;
    
    if (count > 0) {
      // Shift overlapping markers slightly in a radial spiral pattern (approx 15-20 meters away)
      const angle = (count * 2 * Math.PI) / 6;
      const radius = 0.00018 * Math.ceil(count / 6);
      return {
        ...v,
        latitude: v.latitude + Math.sin(angle) * radius,
        longitude: v.longitude + Math.cos(angle) * radius,
      };
    }
    
    return v;
  });
};

export default function FleetMap({ vehicles, selectedVehicleId, onVehicleSelect }: FleetMapProps) {
  const center: [number, number] = [47.6062, -122.3321];
  const [mapReady, setMapReady] = useState(false);

  // Delay Leaflet until after StrictMode's first unmount so markers are not doubled
  useEffect(() => {
    setMapReady(true);
  }, []);

  const vehiclesWithLocation = useMemo(() => {
    const unique = vehicles.filter((v, index, list) => list.findIndex((item) => item.id === v.id) === index);
    return applyJitterOffset(unique).filter(
      (v) => v.latitude !== undefined && v.longitude !== undefined
    );
  }, [vehicles]);

  const selectedVehicle = vehiclesWithLocation.find((v) => v.id === selectedVehicleId);

  return (
    <div className="relative w-full h-full">
      {mapReady && (
      <MapContainer
        center={center}
        zoom={10}
        zoomControl={false} // Disable default zoom controls to keep interface clean
        style={{ height: '100vh', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController selectedVehicle={selectedVehicle || null} vehicles={vehiclesWithLocation} />
        {vehiclesWithLocation.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={[vehicle.latitude!, vehicle.longitude!]}
            icon={createCustomIcon(vehicle.status, vehicle.id === selectedVehicleId)}
            opacity={vehicle.status === 'offline' ? 0.75 : 1.0} // Subtly reduce opacity of offline/stale markers
            eventHandlers={{
              click: () => onVehicleSelect?.(vehicle.id),
            }}
          />
        ))}
      </MapContainer>
      )}

      {/* Floating Status Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl flex flex-col gap-2 pointer-events-auto">
        <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono mb-0.5">Fleet Status Legend</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
            <span>ONLINE</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
            <span>DEGRADED</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-200 flex-row">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444] opacity-75" />
            <span className="opacity-75">OFFLINE (STALE POS)</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-200 flex-row">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] shadow-[0_0_8px_rgba(148,163,184,0.5)]" />
            <span>PENDING (AWAITING CHECK-IN)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
