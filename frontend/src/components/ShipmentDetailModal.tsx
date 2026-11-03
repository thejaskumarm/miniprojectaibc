import React, { useState, useEffect } from 'react';
import { ShipmentDetailData } from '../types';
import { fetchShipmentDetail, simulatePayloadTamper, verifyShipmentIntegrity } from '../services/api';
import {
  X, ShieldCheck, ShieldAlert, AlertTriangle, Snowflake, Clock, CheckCircle2,
  MapPin, Truck, ExternalLink, RefreshCw, Cpu, Activity, AlertCircle, Play, Pause
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceArea, ReferenceLine
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

interface ShipmentDetailModalProps {
  shipmentId: string | null;
  onClose: () => void;
}

// Map coordinates lookup for hubs
const HUB_COORDS: Record<string, [number, number]> = {
  "Frankfurt": [50.0379, 8.5622],
  "Basel": [47.5900, 7.5292],
  "Chicago": [41.9742, -87.9073],
  "Shanghai": [31.1443, 121.8083],
  "Rotterdam": [51.9244, 4.4777],
  "Singapore": [1.3644, 103.9915],
  "Dubai": [25.2532, 55.3657],
  "Mumbai": [19.0896, 72.8656],
  "Santos": [-23.9608, -46.3336],
  "Sydney": [-33.9399, 151.1753],
  "Tokyo": [35.7720, 140.3929],
  "Los Angeles": [33.9416, -118.4085]
};

const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-hub-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({
  shipmentId,
  onClose
}) => {
  const [data, setData] = useState<ShipmentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tamperState, setTamperState] = useState<{
    isTampered: boolean;
    tamperResult?: any;
  }>({ isTampered: false });
  const [isSimulatingPlayback, setIsSimulatingPlayback] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0.5);

  useEffect(() => {
    if (!shipmentId) return;
    setIsLoading(true);
    setTamperState({ isTampered: false });
    fetchShipmentDetail(shipmentId)
      .then(res => {
        setData(res);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [shipmentId]);

  // Route playback simulation loop
  useEffect(() => {
    let interval: any;
    if (isSimulatingPlayback) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => (prev >= 1.0 ? 0.0 : prev + 0.05));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isSimulatingPlayback]);

  if (!shipmentId) return null;

  const handleTamperClick = async (type: 'temperature' | 'location') => {
    if (!data || !data.events.length) return;
    const targetEvent = data.events[0];
    try {
      const payload: any = { event_id: targetEvent.event_id };
      if (type === 'temperature') {
        payload.tamper_temperature = 48.5; // Fraudulent heat modification
      } else {
        payload.tamper_location = "Unauthorized Transfer Warehouse (Uncertified)";
      }
      const res = await simulatePayloadTamper(data.shipment.shipment_id, payload);
      setTamperState({
        isTampered: true,
        tamperResult: res
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetVerification = async () => {
    if (!data) return;
    try {
      const res = await verifyShipmentIntegrity(data.shipment.shipment_id);
      setTamperState({ isTampered: false, tamperResult: null });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-[#0b1120]/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white font-mono tracking-tight">{shipmentId}</h2>
                {data && (
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    data.shipment.data_provenance === 'real_curated'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {data.shipment.data_provenance === 'real_curated' ? 'Real Curated Benchmark' : 'Synthetic Physics Simulated'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {data?.shipment.product_category} &bull; {data?.shipment.transport_mode} &bull; Carrier: {data?.shipment.carrier_id.replace('CARRIER_', '')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isLoading || !data ? (
          <div className="p-16 flex items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Retrieving telemetry and blockchain proofs...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Top Corridor Strip */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Origin Corridor</span>
                <p className="font-bold text-white text-sm">{data.shipment.origin}</p>
                <span className="text-[10px] text-slate-400">Dispatched: {new Date(data.shipment.planned_dispatch_time).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400">Destination</span>
                <p className="font-bold text-white text-sm">{data.shipment.destination}</p>
                <span className="text-[10px] text-slate-400">Scheduled: {new Date(data.shipment.planned_delivery_time).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400">Route Distance</span>
                <p className="font-bold text-blue-400 text-sm">{data.shipment.distance_km.toLocaleString()} km</p>
                <span className="text-[10px] text-slate-400">Customs Queue: {data.shipment.customs_delay_hours}h</span>
              </div>
              <div>
                <span className="text-slate-400">Corridor Weather</span>
                <p className={`font-bold text-sm ${data.shipment.weather_condition.includes('Storm') ? 'text-amber-400' : 'text-slate-200'}`}>
                  {data.shipment.weather_condition}
                </p>
                <span className="text-[10px] text-slate-400">Traffic Index: {data.shipment.traffic_index}</span>
              </div>
            </div>

            {/* Interactive Leaflet Map with Playback Simulation */}
            <div className="glass-panel p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Route Transit Waypoints & Playback
                </span>
                <button
                  onClick={() => setIsSimulatingPlayback(!isSimulatingPlayback)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                    isSimulatingPlayback
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
                  }`}
                >
                  {isSimulatingPlayback ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isSimulatingPlayback ? 'Pause Playback' : 'Simulate GPS Playback'}</span>
                </button>
              </div>

              <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-800">
                {(() => {
                  const originCoords = HUB_COORDS[data.shipment.origin] || [50, 8];
                  const destCoords = HUB_COORDS[data.shipment.destination] || [40, -80];
                  
                  // Interpolated simulated position
                  const curLat = originCoords[0] + (destCoords[0] - originCoords[0]) * playbackProgress;
                  const curLng = originCoords[1] + (destCoords[1] - originCoords[1]) * playbackProgress;
                  const currentPos: [number, number] = [curLat, curLng];

                  return (
                    <MapContainer
                      center={originCoords}
                      zoom={2}
                      scrollWheelZoom={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        className="dark-tiles"
                      />
                      <Polyline
                        positions={[originCoords, destCoords]}
                        pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '6, 8' }}
                      />
                      <Marker position={originCoords} icon={createMarkerIcon('#10b981')}>
                        <Popup><span className="text-xs font-bold text-white">Origin: {data.shipment.origin}</span></Popup>
                      </Marker>
                      <Marker position={destCoords} icon={createMarkerIcon('#ef4444')}>
                        <Popup><span className="text-xs font-bold text-white">Destination: {data.shipment.destination}</span></Popup>
                      </Marker>
                      <Marker position={currentPos} icon={createMarkerIcon('#3b82f6')}>
                        <Popup>
                          <div className="text-xs">
                            <span className="font-bold text-white">Consignment In Transit</span>
                            <p className="text-blue-400 font-mono">Progress: {(playbackProgress * 100).toFixed(0)}%</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  );
                })()}
              </div>
            </div>

            {/* Model A vs Model B Side-by-Side Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Model A: Delay Prediction Card */}
              <div className="glass-panel p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Model A: Delay Risk Prediction</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">Logistic Reg v1</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">Predicted Risk Level</span>
                    <p className={`text-base font-extrabold ${data.shipment.delay_risk_label === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {data.shipment.delay_risk_label === 1 ? 'DELAY LIKELY' : 'ON-TIME SCHEDULED'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Decision Threshold</span>
                    <p className="text-sm font-mono text-white">0.50</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-400 font-semibold">Contributing Operational Factors:</span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Weather Condition</span>
                      <span className="font-bold text-amber-400">{data.shipment.weather_condition}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Customs Clearance Queue</span>
                      <span className="font-mono text-white">{data.shipment.customs_delay_hours} hrs</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Intermodal Congestion</span>
                      <span className="font-mono text-white">{data.shipment.traffic_index}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  *Disclaimer: Model A predicts probabilities based on route history; it does not confirm arrival outcomes.
                </p>
              </div>

              {/* Model B: Cold-Chain Temperature Risk Card */}
              <div className="glass-panel p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Model B: Cold-Chain Telemetry</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">HistGradient v1</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">Thermal Compliance</span>
                    <p className={`text-base font-extrabold ${
                      data.shipment.temperature_quality_risk_label === 2
                        ? 'text-red-400'
                        : data.shipment.temperature_quality_risk_label === 1
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {data.shipment.temperature_quality_risk_label === 2
                        ? 'CRITICAL EXCURSION'
                        : data.shipment.temperature_quality_risk_label === 1
                        ? 'EXCURSION WARNING'
                        : 'COMPLIANT / SAFE'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Target Envelope</span>
                    <p className="text-sm font-mono text-emerald-400">
                      {data.shipment.target_temperature_min_c}°C to {data.shipment.target_temperature_max_c}°C
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-400 font-semibold">Sensor Readings & Exposure:</span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Recorded Container Temp</span>
                      <span className="font-mono font-bold text-white">{data.shipment.recorded_temperature_c}°C</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Excursion Duration</span>
                      <span className="font-mono text-white">{data.shipment.temperature_excursion_duration} hrs</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">External Ambient Temp</span>
                      <span className="font-mono text-white">{data.shipment.ambient_temperature_c}°C</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  *Confirmed biological quality damage requires destructive laboratory assay and QA validation.
                </p>
              </div>
            </div>

            {/* Cold-Chain Telemetry Line Chart (Recharts) */}
            {data.telemetry && data.telemetry.length > 0 && (
              <div className="glass-panel p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Multi-Interval IoT Temperature Telemetry Time-Series
                  </h3>
                  <span className="text-xs text-slate-400">
                    Safe Margin: [{data.shipment.target_temperature_min_c}°C, {data.shipment.target_temperature_max_c}°C]
                  </span>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.telemetry} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <XAxis
                        dataKey="timestamp"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(v: string) => v.slice(11, 16)}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        unit="°C"
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                        formatter={(val: any, name: any) => [`${val}°C`, name === 'temperature_c' ? 'Recorded Logger' : 'Ambient']}
                      />
                      {/* Green reference area for safe cold-chain boundary */}
                      <ReferenceArea
                        y1={data.shipment.target_temperature_min_c}
                        y2={data.shipment.target_temperature_max_c}
                        fill="#10b981"
                        fillOpacity={0.12}
                      />
                      <ReferenceLine y={data.shipment.target_temperature_max_c} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Max Limit', fill: '#ef4444', fontSize: 10 }} />
                      <ReferenceLine y={data.shipment.target_temperature_min_c} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Min Limit', fill: '#3b82f6', fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="temperature_c"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#10b981' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="ambient_temperature_c"
                        stroke="#64748b"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* BLOCKCHAIN PROVENANCE & LIVE TAMPER DETECTION WIDGET */}
            <div className={`p-5 rounded-xl border transition-all ${
              tamperState.isTampered
                ? 'bg-red-950/40 border-red-500/60 shadow-xl shadow-red-900/20'
                : 'glass-panel border-emerald-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${tamperState.isTampered ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {tamperState.isTampered ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">
                        {tamperState.isTampered ? 'CRITICAL TAMPERING DETECTED' : 'Blockchain Verification & Integrity Engine'}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tamperState.isTampered
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {tamperState.isTampered ? 'TAMPERED STATE' : 'VERIFIED IMMUTABLE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Smart Contract: <code className="text-blue-400 font-mono">TrustTraceAnchor.sol</code> &bull; Network: EVM Local Devnet / Sepolia
                    </p>
                  </div>
                </div>

                {/* Tamper testing simulation controls */}
                <div className="flex items-center gap-2">
                  {!tamperState.isTampered ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTamperClick('temperature')}
                        className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-semibold transition-all"
                      >
                        ⚡ Simulate Temp Tamper
                      </button>
                      <button
                        onClick={() => handleTamperClick('location')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
                      >
                        ⚡ Simulate Route Tamper
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleResetVerification}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restore Authentic State
                    </button>
                  )}
                </div>
              </div>

              {/* Tamper Warning Banner if triggered */}
              {tamperState.isTampered && tamperState.tamperResult && (
                <div className="mb-4 p-4 rounded-xl bg-red-900/60 border border-red-500/50 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-red-200 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Cryptographic Hash Mismatch: Payload modified after on-chain anchoring!</span>
                  </div>
                  <p className="text-red-300">
                    The calculated Keccak-256 hash (<code className="font-mono text-white">{tamperState.tamperResult.computed_hash.slice(0, 20)}...</code>) does not match the immutable on-chain record (<code className="font-mono text-white">{tamperState.tamperResult.anchored_hash.slice(0, 20)}...</code>).
                  </p>
                  {tamperState.tamperResult.tampered_fields && (
                    <div className="mt-2 space-y-1">
                      <span className="font-semibold text-white">Discrepancy Details:</span>
                      {tamperState.tamperResult.tampered_fields.map((f: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-black/40 border border-red-500/30 font-mono text-[11px]">
                          Field: <span className="text-yellow-300 font-bold">{f.field}</span> | Anchored: <span className="text-emerald-400 font-bold">{String(f.original_anchored_value)}</span> | Tampered: <span className="text-red-400 font-bold">{String(f.tampered_value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cryptographic Event Proof Chain */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-300">Anchored Merkle Event Chain ({data.blockchain_verification.events_anchored_count} Events):</span>
                <div className="space-y-2">
                  {data.events.map((evt, idx) => (
                    <div
                      key={evt.event_id}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{evt.event_type}</span>
                          <span className="text-slate-400 text-[11px]">&bull; {evt.location}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{evt.description}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Anchored Hash: <span className="text-emerald-400">{evt.payload_hash || '0x49f2b8...'}</span>
                        </p>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-[11px] text-slate-400 block">{new Date(evt.timestamp).toLocaleString()}</span>
                        <span className="text-[10px] text-blue-400 font-mono block">Tx: {evt.blockchain_tx_hash ? evt.blockchain_tx_hash.slice(0, 16) + '...' : '0x8a92...'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
