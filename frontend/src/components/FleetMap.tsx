import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plus, Minus, Maximize2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  name: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface TelemetrySnapshot {
  vehicleId: string;
  temperature?: number;
  timestamp?: string;
}

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string | null;
  onVehicleSelect?: (vehicleId: string) => void;
  onVehicleDeselect?: () => void;
  /** Live telemetry keyed by vehicleId — used to populate popup readings */
  telemetryMap?: Record<string, TelemetrySnapshot>;
}

// ─── SVG Marker Icon ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  online: "#10b981",
  degraded: "#f59e0b",
  offline: "#ef4444",
  pending: "#94a3b8",
};

const createCustomIcon = (
  name: string,
  status: string,
  isSelected: boolean,
) => {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending;

  const ringSize = isSelected ? 44 : 26;
  const centerSize = isSelected ? 14 : 8;
  const borderSize = isSelected ? 3.5 : 2.5;

  const svgIcon = `
    <svg width="${ringSize}" height="${ringSize}" viewBox="0 0 ${ringSize} ${ringSize}" xmlns="http://www.w3.org/2000/svg" style="overflow: visible; display: block;">
      <defs>
        <filter id="glow-${status}-${isSelected ? "sel" : "unsel"}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="${isSelected ? 4 : 2}" flood-color="${color}" flood-opacity="${isSelected ? 0.9 : 0.6}" />
        </filter>
      </defs>
      ${
        isSelected
          ? `
        <!-- Outer pulsing ring -->
        <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${ringSize / 2 - 2}" fill="none" stroke="${color}" stroke-width="2" opacity="0.35">
          <animate attributeName="r" values="${ringSize / 3};${ringSize / 2 - 2}" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <!-- Inner pulsing ring -->
        <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${ringSize / 2.5}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5">
          <animate attributeName="r" values="${ringSize / 4};${ringSize / 2.5}" dur="1.8s" begin="0.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="1.8s" begin="0.6s" repeatCount="indefinite"/>
        </circle>
        <!-- Static halo ring -->
        <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${(centerSize + borderSize * 2) / 2 + 4}" fill="none" stroke="${color}" stroke-width="1" opacity="0.25"/>
      `
          : ""
      }
      <!-- Outer base ring -->
      <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${(centerSize + borderSize * 2) / 2}" fill="#0c0f16" stroke="${color}" stroke-width="${borderSize}" filter="url(#glow-${status}-${isSelected ? "sel" : "unsel"})"/>
      <!-- Inner solid dot -->
      <circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${centerSize / 2}" fill="${color}"/>
    </svg>
  `;

  const html = `
    <div style="position: relative; width: ${ringSize}px; height: ${ringSize}px; display: flex; align-items: center; justify-content: center;">
      <div class="marker-name-tag" style="
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 3px;
        background: rgba(12, 15, 22, 0.92);
        border: 1px solid ${isSelected ? color : "rgba(38, 42, 60, 0.85)"};
        border-radius: 4px;
        padding: 2px 6px;
        color: ${isSelected ? "#edf2f8" : "#8892a4"};
        font-size: 10px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
        letter-spacing: 0.02em;
        pointer-events: auto;
        cursor: pointer;
      ">
        ${name}
      </div>
      ${svgIcon}
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-marker-container",
    iconSize: [ringSize, ringSize],
    iconAnchor: [ringSize / 2, ringSize / 2],
  });
};

// ─── Jitter offset to separate stacked markers ────────────────────────────────

const applyJitterOffset = (vehicles: Vehicle[]): Vehicle[] => {
  const coordCount: Record<string, number> = {};
  return vehicles.map((v) => {
    if (v.latitude === undefined || v.longitude === undefined) return v;
    const key = `${v.latitude.toFixed(5)},${v.longitude.toFixed(5)}`;
    const count = coordCount[key] || 0;
    coordCount[key] = count + 1;
    if (count > 0) {
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

// ─── MapController — handles fly-to on selection and initial bounds ─────────

function MapController({
  selectedVehicle,
  vehicles,
  suppressNextFly,
}: {
  selectedVehicle: Vehicle | null;
  vehicles: Vehicle[];
  suppressNextFly: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  const hasInitialFit = useRef(false);

  useEffect(() => {
    if (
      selectedVehicle &&
      selectedVehicle.latitude !== undefined &&
      selectedVehicle.longitude !== undefined
    ) {
      if (suppressNextFly.current) {
        suppressNextFly.current = false;
        return;
      }
      map.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], 13, {
        duration: 1.2,
      });
    } else if (!selectedVehicle && !hasInitialFit.current && vehicles.length > 0) {
      const valid = vehicles.filter(
        (v) => v.latitude !== undefined && v.longitude !== undefined,
      );
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((v) => [v.latitude!, v.longitude!]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80] });
          hasInitialFit.current = true;
        }
      }
    }
  }, [map, selectedVehicle, vehicles, suppressNextFly]);

  return null;
}

// ─── MapZoomControls — zoom in/out & fit fleet buttons ─────────────────────

function MapZoomControls({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap();

  const handleFitAll = useCallback(() => {
    const valid = vehicles.filter(
      (v) => v.latitude !== undefined && v.longitude !== undefined,
    );
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((v) => [v.latitude!, v.longitude!]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    }
  }, [map, vehicles]);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="w-9 h-9 bg-[var(--color-surface-panel)] hover:bg-slate-800 border border-[var(--color-border-quiet)] text-slate-300 hover:text-white rounded-xl shadow-lg flex items-center justify-center transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
        title="Zoom in"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="w-9 h-9 bg-[var(--color-surface-panel)] hover:bg-slate-800 border border-[var(--color-border-quiet)] text-slate-300 hover:text-white rounded-xl shadow-lg flex items-center justify-center transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
        title="Zoom out"
      >
        <Minus size={16} />
      </button>
      <button
        onClick={handleFitAll}
        aria-label="Fit all vehicles"
        className="w-9 h-9 bg-[var(--color-surface-panel)] hover:bg-slate-800 border border-[var(--color-border-quiet)] text-slate-300 hover:text-white rounded-xl shadow-lg flex items-center justify-center transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer mt-1"
        title="Fit all vehicles in view"
      >
        <Maximize2 size={15} />
      </button>
    </div>
  );
}

// ─── MapClickCapture — closes popup when clicking empty map space ─────────────

function MapClickCapture({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({ click: onMapClick });
  return null;
}

// ─── PixelPositionTracker — converts a lat/lng to container px and calls back ─

function PixelPositionTracker({
  lat,
  lng,
  onPosition,
}: {
  lat: number;
  lng: number;
  onPosition: (pos: { x: number; y: number } | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const update = () => {
      const point = map.latLngToContainerPoint([lat, lng]);
      onPosition({ x: point.x, y: point.y });
    };
    update();
    map.on("move zoom viewreset", update);
    return () => {
      map.off("move zoom viewreset", update);
    };
  }, [map, lat, lng, onPosition]);

  return null;
}

// ─── Inline status badge (no Tailwind — inline styles to keep out of Leaflet DOM) ──

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
  pending: "Pending",
};

function InlineStatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 9999,
        border: `1px solid ${color}33`,
        background: `${color}1a`,
        color,
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ─── Popup card (rendered outside MapContainer to avoid overflow:hidden clipping) ──

interface PopupOverlayProps {
  vehicle: Vehicle;
  telemetry?: TelemetrySnapshot;
  /** Container-relative pixel position of the marker */
  pixelPos: { x: number; y: number };
  onClose: () => void;
}

const POPUP_WIDTH = 224;
const POPUP_ARROW_OFFSET = 20; // px above marker centre

function PopupOverlay({
  vehicle,
  telemetry,
  pixelPos,
  onClose,
}: PopupOverlayProps) {
  const color = STATUS_COLORS[vehicle.status] ?? STATUS_COLORS.pending;
  const hasTemp = telemetry?.temperature !== undefined;

  const tempColor =
    vehicle.status === "degraded"
      ? "#f59e0b"
      : vehicle.status === "offline"
        ? "#ef4444"
        : "#10b981";

  return (
    <div
      style={{
        position: "absolute",
        // Centre popup horizontally over marker, place above it
        left: pixelPos.x - POPUP_WIDTH / 2,
        top: pixelPos.y - POPUP_ARROW_OFFSET,
        transform: "translateY(-100%)",
        width: POPUP_WIDTH,
        zIndex: 2000,
        pointerEvents: "auto",
        // Animate in
        animation: "popup-appear 0.15s ease-out",
      }}
    >
      {/* Caret pointing down toward marker */}
      <div
        style={{
          position: "absolute",
          bottom: -7,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: "7px solid #1e293b",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -5,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid rgba(18,27,42,0.97)",
          zIndex: 2,
        }}
      />

      {/* Card */}
      <div
        style={{
          background: "rgba(18, 27, 42, 0.97)",
          border: `1px solid #1e293b`,
          borderRadius: 14,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px ${color}22`,
          overflow: "hidden",
        }}
      >
        {/* Status-colour accent stripe at top */}
        <div
          style={{
            height: 2,
            background: `linear-gradient(90deg, ${color} 0%, ${color}55 70%, transparent 100%)`,
          }}
        />

        <div style={{ padding: "10px 12px 12px" }}>
          {/* Vehicle name + status badge + close button */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-primary)",
                fontWeight: 600,
                fontSize: 13,
                color: "#f1f5f9",
                lineHeight: 1.3,
                wordBreak: "break-word",
                flex: 1,
              }}
            >
              {vehicle.name}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
              }}
            >
              <InlineStatusBadge status={vehicle.status} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Close popup"
                style={{
                  background: "rgba(100,116,139,0.15)",
                  border: "1px solid rgba(100,116,139,0.2)",
                  color: "#64748b",
                  cursor: "pointer",
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  lineHeight: 1,
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Temperature readout */}
          <div
            style={{
              background: "rgba(11,15,23,0.8)",
              borderRadius: 8,
              padding: "8px 10px",
              marginBottom: hasTemp && telemetry?.timestamp ? 8 : 0,
              border: "1px solid rgba(30,41,59,0.8)",
              display: "flex",
              alignItems: "baseline",
              gap: 3,
            }}
          >
            {hasTemp ? (
              <>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 24,
                    fontWeight: 700,
                    color: tempColor,
                    lineHeight: 1,
                  }}
                >
                  {telemetry!.temperature!.toFixed(1)}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "#475569",
                    alignSelf: "flex-end",
                    paddingBottom: 1,
                  }}
                >
                  °C
                </span>
              </>
            ) : (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "#475569",
                  fontStyle: "italic",
                }}
              >
                No reading yet
              </span>
            )}
          </div>

          {/* Last updated timestamp */}
          {telemetry?.timestamp && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "#334155",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ color: "#475569", fontSize: 11 }}>↻</span>
              {new Date(telemetry.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inner map layer (must be a child of MapContainer to access useMap) ───────

interface MapInnerProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string | null;
  onVehicleSelect?: (vehicleId: string) => void;
  onVehicleDeselect?: () => void;
  suppressNextFly: React.MutableRefObject<boolean>;
  // Popup state is lifted to FleetMap so the overlay renders outside MapContainer
  popupVehicleId: string | null;
  onPopupOpen: (vehicleId: string) => void;
  onPopupClose: () => void;
  onPopupPosition: (pos: { x: number; y: number } | null) => void;
}

function MapInner({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  onVehicleDeselect,
  suppressNextFly,
  popupVehicleId,
  onPopupOpen,
  onPopupClose,
  onPopupPosition,
}: MapInnerProps) {
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const popupVehicle = vehicles.find((v) => v.id === popupVehicleId);

  const handleMapClick = useCallback(() => {
    onPopupClose();
    onVehicleDeselect?.();
  }, [onPopupClose, onVehicleDeselect]);

  const handleMarkerClick = useCallback(
    (vehicle: Vehicle) => {
      suppressNextFly.current = true;
      onPopupOpen(vehicle.id);
      onVehicleSelect?.(vehicle.id);
    },
    [onPopupOpen, onVehicleSelect, suppressNextFly],
  );

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapController
        selectedVehicle={selectedVehicle ?? null}
        vehicles={vehicles}
        suppressNextFly={suppressNextFly}
      />
      <MapClickCapture onMapClick={handleMapClick} />
      <MapZoomControls vehicles={vehicles} />

      {/* Track popup vehicle's pixel position and report it upward */}
      {popupVehicle?.latitude !== undefined &&
        popupVehicle?.longitude !== undefined && (
          <PixelPositionTracker
            lat={popupVehicle.latitude}
            lng={popupVehicle.longitude}
            onPosition={onPopupPosition}
          />
        )}

      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.latitude!, vehicle.longitude!]}
          icon={createCustomIcon(
            vehicle.name,
            vehicle.status,
            vehicle.id === selectedVehicleId,
          )}
          opacity={vehicle.status === "offline" ? 0.75 : 1.0}
          zIndexOffset={vehicle.id === selectedVehicleId ? 1000 : 0}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              handleMarkerClick(vehicle);
            },
          }}
        />
      ))}
    </>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export default function FleetMap({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  onVehicleDeselect,
  telemetryMap,
}: FleetMapProps) {
  const center: [number, number] = [1.3521, 103.8198];
  const [mapReady, setMapReady] = useState(false);

  // Ref to suppress fly-to when selection originates from a map click
  const suppressNextFly = useRef(false);

  // Popup state lives here (outside MapContainer) so the overlay can be rendered
  // in the outer relative div — MapContainer has overflow:hidden which would clip it.
  const [popupVehicleId, setPopupVehicleId] = useState<string | null>(null);
  const [popupPixelPos, setPopupPixelPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Sync popup with selection changes (sidebar click or marker click)
  useEffect(() => {
    if (selectedVehicleId) {
      setPopupVehicleId(selectedVehicleId);
    } else {
      setPopupVehicleId(null);
      setPopupPixelPos(null);
    }
  }, [selectedVehicleId]);

  const handlePopupOpen = useCallback((vehicleId: string) => {
    setPopupVehicleId(vehicleId);
  }, []);

  const handlePopupClose = useCallback(() => {
    setPopupVehicleId(null);
    setPopupPixelPos(null);
  }, []);

  useEffect(() => {
    setMapReady(true);
  }, []);

  const vehiclesWithLocation = useMemo(() => {
    const unique = vehicles.filter(
      (v, index, list) => list.findIndex((item) => item.id === v.id) === index,
    );
    return applyJitterOffset(unique).filter(
      (v) => v.latitude !== undefined && v.longitude !== undefined,
    );
  }, [vehicles]);

  const popupVehicle = vehiclesWithLocation.find(
    (v) => v.id === popupVehicleId,
  );

  return (
    <div className="relative w-full h-full">
      {mapReady && (
        <MapContainer
          center={center}
          zoom={10}
          zoomControl={false}
          style={{ height: "100vh", width: "100%", zIndex: 0 }}
        >
          <MapInner
            vehicles={vehiclesWithLocation}
            selectedVehicleId={selectedVehicleId}
            onVehicleSelect={onVehicleSelect}
            onVehicleDeselect={onVehicleDeselect}
            suppressNextFly={suppressNextFly}
            popupVehicleId={popupVehicleId}
            onPopupOpen={handlePopupOpen}
            onPopupClose={handlePopupClose}
            onPopupPosition={setPopupPixelPos}
          />
        </MapContainer>
      )}

      {/* Popup overlay rendered OUTSIDE MapContainer to avoid overflow:hidden clipping */}
      {popupVehicle && popupPixelPos && (
        <PopupOverlay
          vehicle={popupVehicle}
          telemetry={telemetryMap?.[popupVehicle.id]}
          pixelPos={popupPixelPos}
          onClose={() => {
            handlePopupClose();
            onVehicleDeselect?.();
          }}
        />
      )}

      {/* Floating Status Legend — bottom-right, compact, matches sidebar dark theme */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)] backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl flex flex-col gap-1.5 pointer-events-auto">
        <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase font-mono mb-0.5">
          Status
        </div>
        {[
          { color: "#10b981", glow: "#10b981", label: "Online", opacity: "1" },
          {
            color: "#f59e0b",
            glow: "#f59e0b",
            label: "Degraded",
            opacity: "1",
          },
          {
            color: "#ef4444",
            glow: "#ef4444",
            label: "Offline",
            opacity: "0.75",
          },
          {
            color: "#94a3b8",
            glow: "rgba(148,163,184,0.5)",
            label: "Pending",
            opacity: "1",
          },
        ].map(({ color, glow, label, opacity }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 6px ${glow}`,
                opacity,
              }}
            />
            <span
              className="text-[11px] font-mono"
              style={{
                color: `color-mix(in srgb, ${color} 80%, white)`,
                opacity,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
