export interface Shipment {
  shipment_id: string;
  product_category: string;
  transport_mode: string;
  origin: string;
  destination: string;
  distance_km: number;
  planned_dispatch_time: string;
  planned_delivery_time: string;
  actual_delivery_time?: string | null;
  carrier_id: string;
  supplier_id: string;
  weather_condition: string;
  traffic_index: number;
  customs_delay_hours: number;
  ambient_temperature_c: number;
  recorded_temperature_c: number;
  target_temperature_min_c: number;
  target_temperature_max_c: number;
  temperature_excursion_duration: number;
  sensor_gap_duration: number;
  shipment_status: 'DISPATCHED' | 'IN_TRANSIT' | 'CUSTOMS_HOLD' | 'DELIVERED';
  delay_risk_label: number;
  temperature_quality_risk_label: number;
  data_provenance: 'real_curated' | 'synthetic_simulated';
  source_dataset: string;
  created_at?: string;
}

export interface ShipmentEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  location: string;
  description: string;
  submitter: string;
  payload_hash?: string;
  anchored_on_chain: boolean;
  blockchain_tx_hash?: string;
}

export interface SensorTelemetry {
  reading_id: string;
  timestamp: string;
  temperature_c: number;
  ambient_temperature_c?: number;
  humidity_pct?: number;
  battery_pct?: number;
  is_excursion: boolean;
}

export interface BlockchainVerification {
  is_anchored: boolean;
  events_anchored_count: number;
  proof_chain: Array<{
    shipment_id: string;
    event_id: string;
    event_type: string;
    keccak256_hash: string;
    previous_hash: string;
    block_number: number;
    transaction_hash: string;
    submitter: string;
    network: string;
  }>;
}

export interface ShipmentDetailData {
  shipment: Shipment;
  events: ShipmentEvent[];
  telemetry: SensorTelemetry[];
  blockchain_verification: BlockchainVerification;
}

export interface AnalyticsOverview {
  kpis: {
    total_monitored_shipments: number;
    active_in_transit: number;
    delayed_shipments_flagged: number;
    system_delay_rate_pct: number;
    cold_chain_critical_breaches: number;
    cold_chain_warning_excursions: number;
    cold_chain_compliant: number;
    total_anchored_audit_events: number;
    blockchain_verification_integrity_pct: number;
  };
  provenance: {
    real_curated_records: number;
    real_percentage: number;
    synthetic_simulated_records: number;
    synthetic_percentage: number;
  };
  distributions: {
    by_category: Array<{ name: string; count: number }>;
    by_transport_mode: Array<{ mode: string; count: number }>;
    by_weather: Array<{ condition: string; count: number }>;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: string[];
  disclaimer?: string;
  records?: any;
}
