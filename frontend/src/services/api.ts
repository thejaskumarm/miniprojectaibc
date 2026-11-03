import { ShipmentDetailData, AnalyticsOverview } from '../types';

const API_BASE = ''; // Uses Vite proxy to http://127.0.0.1:8000

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/api/analytics/overview`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchShipments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  productCategory?: string;
  delayRisk?: number;
  tempRisk?: number;
  provenance?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('page_size', params.pageSize.toString());
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.productCategory) query.append('product_category', params.productCategory);
  if (params.delayRisk !== undefined) query.append('delay_risk', params.delayRisk.toString());
  if (params.tempRisk !== undefined) query.append('temp_risk', params.tempRisk.toString());
  if (params.provenance) query.append('provenance', params.provenance);

  const res = await fetch(`${API_BASE}/api/shipments?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch shipments');
  return res.json();
}

export async function fetchShipmentDetail(shipmentId: string): Promise<ShipmentDetailData> {
  const res = await fetch(`${API_BASE}/api/shipments/${shipmentId}`);
  if (!res.ok) throw new Error(`Failed to fetch shipment ${shipmentId}`);
  return res.json();
}

export async function verifyShipmentIntegrity(shipmentId: string) {
  const res = await fetch(`${API_BASE}/api/shipments/${shipmentId}/verification`);
  if (!res.ok) throw new Error('Verification failed');
  return res.json();
}

export async function simulatePayloadTamper(shipmentId: string, payload: {
  event_id: string;
  tamper_temperature?: number;
  tamper_location?: string;
  tamper_description?: string;
}) {
  const res = await fetch(`${API_BASE}/api/shipments/${shipmentId}/verify-tamper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Tamper verification simulation failed');
  return res.json();
}

export async function predictDelay(input: any) {
  const res = await fetch(`${API_BASE}/api/predict/delay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Delay prediction failed');
  return res.json();
}

export async function predictTemperatureRisk(input: any) {
  const res = await fetch(`${API_BASE}/api/predict/temperature-risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Temperature risk prediction failed');
  return res.json();
}

export async function sendChatMessage(query: string) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

export async function fetchModelMetadata() {
  const res = await fetch(`${API_BASE}/api/models/metadata`);
  if (!res.ok) throw new Error('Failed to fetch model metadata');
  return res.json();
}

export async function fetchDatasetsSummary() {
  const res = await fetch(`${API_BASE}/api/datasets/summary`);
  if (!res.ok) throw new Error('Failed to fetch datasets summary');
  return res.json();
}
