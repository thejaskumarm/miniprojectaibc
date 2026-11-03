import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom marker icons
const createHubIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-hub-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${color};
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const HUBS = [
  { name: "Frankfurt (FRA)", coords: [50.0379, 8.5622] as [number, number], type: "Air Pharma Hub", activeShipments: 1420 },
  { name: "Basel (BSL)", coords: [47.5900, 7.5292] as [number, number], type: "Biologics Cold Hub", activeShipments: 980 },
  { name: "Chicago (ORD)", coords: [41.9742, -87.9073] as [number, number], type: "Intermodal Americas Hub", activeShipments: 1850 },
  { name: "Shanghai (PVG)", coords: [31.1443, 121.8083] as [number, number], type: "East Asia Maritime Gateway", activeShipments: 2340 },
  { name: "Rotterdam (RTM)", coords: [51.9244, 4.4777] as [number, number], type: "Euro Cold Port", activeShipments: 1610 },
  { name: "Singapore (SIN)", coords: [1.3644, 103.9915] as [number, number], type: "Aviation Transshipment Hub", activeShipments: 1980 },
  { name: "Dubai (DXB)", coords: [25.2532, 55.3657] as [number, number], type: "Mid-East Intermodal Hub", activeShipments: 1540 },
  { name: "Mumbai (BOM)", coords: [19.0896, 72.8656] as [number, number], type: "Tropical Gateway", activeShipments: 1120 },
  { name: "Santos (SSZ)", coords: [-23.9608, -46.3336] as [number, number], type: "South America Cold Port", activeShipments: 890 },
  { name: "Sydney (SYD)", coords: [-33.9399, 151.1753] as [number, number], type: "Pacific Gateway", activeShipments: 760 },
  { name: "Tokyo (NRT)", coords: [35.7720, 140.3929] as [number, number], type: "High-Tech Cargo Hub", activeShipments: 1350 },
  { name: "Los Angeles (LAX)", coords: [33.9416, -118.4085] as [number, number], type: "Trans-Pacific Gateway", activeShipments: 1720 }
];

const CORRIDORS = [
  { from: [47.5900, 7.5292], to: [41.9742, -87.9073], label: "Basel -> Chicago (Vaccine Air Lift)", color: "#10b981" },
  { from: [50.0379, 8.5622], to: [1.3644, 103.9915], label: "Frankfurt -> Singapore (Biopharma Cold Chain)", color: "#3b82f6" },
  { from: [31.1443, 121.8083], to: [33.9416, -118.4085], label: "Shanghai -> LAX (High-Tech Trans-Pacific)", color: "#8b5cf6" },
  { from: [51.9244, 4.4777], to: [-23.9608, -46.3336], label: "Rotterdam -> Santos (Reefer Maritime)", color: "#f59e0b" },
  { from: [25.2532, 55.3657], to: [19.0896, 72.8656], label: "Dubai -> Mumbai (Cross-Gulf Express)", color: "#06b6d4" }
];

interface CorridorsMapProps {
  onSelectHub?: (hubName: string) => void;
}

export const CorridorsMap: React.FC<CorridorsMapProps> = ({ onSelectHub }) => {
  return (
    <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-xl">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={1}
        maxZoom={7}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-tiles"
        />

        {/* Trade Corridor Polylines */}
        {CORRIDORS.map((c, idx) => (
          <Polyline
            key={idx}
            positions={[c.from as [number, number], c.to as [number, number]]}
            pathOptions={{
              color: c.color,
              weight: 2.5,
              dashArray: '6, 8',
              opacity: 0.75
            }}
          />
        ))}

        {/* International Hub Markers */}
        {HUBS.map((hub) => (
          <Marker
            key={hub.name}
            position={hub.coords}
            icon={createHubIcon(hub.type.includes('Cold') || hub.type.includes('Vaccine') ? '#10b981' : '#3b82f6')}
            eventHandlers={{
              click: () => onSelectHub && onSelectHub(hub.name)
            }}
          >
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-white text-sm">{hub.name}</p>
                <p className="text-emerald-400 font-medium">{hub.type}</p>
                <p className="text-slate-300 mt-1">Active Monitored Shipments: <strong>{hub.activeShipments}</strong></p>
                <div className="mt-2 pt-1 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-[10px] text-blue-400">Cryptographically Anchored</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Overlay Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 shadow-lg">
        <p className="font-semibold text-white mb-1">Global Verification Network</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Cold-Chain Hub</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Multimodal Gateway</span>
        </div>
      </div>
    </div>
  );
};
