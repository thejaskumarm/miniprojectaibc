import React from 'react';
import { AnalyticsOverview } from '../types';
import { CorridorsMap } from './CorridorsMap';
import {
  ShieldAlert, ShieldCheck, Truck, Snowflake, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Database, ExternalLink, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface OverviewViewProps {
  analytics: AnalyticsOverview | null;
  onNavigateToShipments: (filter?: any) => void;
  onSelectShipment: (id: string) => void;
}

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const OverviewView: React.FC<OverviewViewProps> = ({
  analytics,
  onNavigateToShipments,
  onSelectShipment
}) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { kpis, provenance, distributions } = analytics;

  return (
    <div className="space-y-6">
      {/* Top Banner: Strict Provenance Disclosure */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/40 p-4 sm:p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Verified Ingested Data Provenance</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Audit Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Total <strong>{kpis.total_monitored_shipments.toLocaleString()}</strong> processed consignments: 
                <span className="text-emerald-400 font-semibold ml-1">{provenance.real_curated_records.toLocaleString()} Real-World Curated ({provenance.real_percentage}%)</span> + 
                <span className="text-blue-400 font-semibold ml-1">{provenance.synthetic_simulated_records.toLocaleString()} Synthetic Simulated ({provenance.synthetic_percentage}%)</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToShipments({ provenance: 'real_curated' })}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all shrink-0"
          >
            <span>Filter Real Curated</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Monitored Shipments */}
        <div
          onClick={() => onNavigateToShipments()}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Consignments</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{kpis.total_monitored_shipments.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              Active Fleet
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>In Transit: <strong>{kpis.active_in_transit.toLocaleString()}</strong></span>
            <span className="text-blue-400 hover:underline">View All &rarr;</span>
          </div>
        </div>

        {/* Card 2: Delay Risk Flagged */}
        <div
          onClick={() => onNavigateToShipments({ delayRisk: 1 })}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Delay Risk Flagged</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-400">{kpis.delayed_shipments_flagged.toLocaleString()}</span>
            <span className="text-xs font-semibold text-amber-300">
              {kpis.system_delay_rate_pct}% of total
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Model A (Logistic/RF)</span>
            <span className="text-amber-400 hover:underline">Inspect Risks &rarr;</span>
          </div>
        </div>

        {/* Card 3: Cold-Chain Excursions */}
        <div
          onClick={() => onNavigateToShipments({ tempRisk: 2 })}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cold-Chain Excursions</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <Snowflake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-400">
              {(kpis.cold_chain_critical_breaches + kpis.cold_chain_warning_excursions).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-red-400/80">
              {kpis.cold_chain_critical_breaches} Critical
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Model B HistGradient</span>
            <span className="text-red-400 hover:underline">Quarantine List &rarr;</span>
          </div>
        </div>

        {/* Card 4: Blockchain Anchored Verification */}
        <div className="glass-panel glass-panel-hover p-4 rounded-xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Blockchain Anchored</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{kpis.blockchain_verification_integrity_pct}%</span>
            <span className="text-xs font-semibold text-emerald-300">
              EVM Validated
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{kpis.total_anchored_audit_events.toLocaleString()} Milestones</span>
            <span className="text-emerald-400">Zero Bit Tamper</span>
          </div>
        </div>
      </div>

      {/* Global Supply Chain Map Section */}
      <div className="glass-panel p-5 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Live Global Transit Corridors & Telemetry Nodes</h3>
            <p className="text-xs text-slate-400">Visualizing high-traffic international air freight and maritime reefer corridors</p>
          </div>
          <span className="text-[11px] text-blue-400 font-medium">12 Worldwide Logistics Nodes</span>
        </div>
        <CorridorsMap onSelectHub={(hub) => onNavigateToShipments({ search: hub.split(' ')[0] })} />
      </div>

      {/* Charts Row: Category Distribution & Weather Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume by Product Category */}
        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Consignments by Product Category
            </h3>
            <span className="text-xs text-slate-400">Configured Thermal Limits</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributions.by_category} layout="vertical" margin={{ left: 30, right: 20 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Shipments']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Weather Impact on Delay Risk */}
        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Corridor Weather Conditions
            </h3>
            <span className="text-xs text-slate-400">Primary Model A Covariate</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributions.by_weather} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="condition" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Shipments']}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
