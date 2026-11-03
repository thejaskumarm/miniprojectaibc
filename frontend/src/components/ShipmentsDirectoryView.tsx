import React, { useState, useEffect } from 'react';
import { Shipment } from '../types';
import { fetchShipments } from '../services/api';
import {
  Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, Snowflake,
  Clock, CheckCircle, ShieldCheck, ArrowRight, RefreshCw, Eye
} from 'lucide-react';

interface ShipmentsDirectoryViewProps {
  initialFilter?: any;
  onSelectShipment: (shipmentId: string) => void;
}

export const ShipmentsDirectoryView: React.FC<ShipmentsDirectoryViewProps> = ({
  initialFilter,
  onSelectShipment
}) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialFilter?.search || '');
  const [category, setCategory] = useState(initialFilter?.productCategory || '');
  const [status, setStatus] = useState(initialFilter?.status || '');
  const [delayRisk, setDelayRisk] = useState<number | undefined>(initialFilter?.delayRisk);
  const [tempRisk, setTempRisk] = useState<number | undefined>(initialFilter?.tempRisk);
  const [provenance, setProvenance] = useState<string>(initialFilter?.provenance || '');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchShipments({
        page,
        pageSize,
        search: search || undefined,
        productCategory: category || undefined,
        status: status || undefined,
        delayRisk: delayRisk,
        tempRisk: tempRisk,
        provenance: provenance || undefined
      });
      setShipments(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, category, status, delayRisk, tempRisk, provenance]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setDelayRisk(undefined);
    setTempRisk(undefined);
    setProvenance('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="glass-panel p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Shipment ID (e.g. TT-000001), Hub, Carrier, or Supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSearchSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
            >
              Search
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Vaccines & Biologics">Vaccines & Biologics</option>
            <option value="Ultra-Cold Biopharma">Ultra-Cold Biopharma</option>
            <option value="Fresh Produce">Fresh Produce</option>
            <option value="Frozen Food">Frozen Food</option>
            <option value="Ambient Pharmaceuticals">Ambient Pharmaceuticals</option>
            <option value="Industrial & Electronics">Industrial & Electronics</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CUSTOMS_HOLD">Customs Hold</option>
            <option value="DISPATCHED">Dispatched</option>
          </select>

          {/* Delay Risk Filter */}
          <select
            value={delayRisk === undefined ? '' : delayRisk.toString()}
            onChange={(e) => { setDelayRisk(e.target.value === '' ? undefined : parseInt(e.target.value)); setPage(1); }}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="">Delay Risk (All)</option>
            <option value="1">Delayed Flagged (1)</option>
            <option value="0">On-Time Scheduled (0)</option>
          </select>

          {/* Cold-Chain Temp Risk Filter */}
          <select
            value={tempRisk === undefined ? '' : tempRisk.toString()}
            onChange={(e) => { setTempRisk(e.target.value === '' ? undefined : parseInt(e.target.value)); setPage(1); }}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="">Thermal Risk (All)</option>
            <option value="2">Critical Breach (2)</option>
            <option value="1">Moderate Excursion (1)</option>
            <option value="0">Compliant Safe (0)</option>
          </select>

          {/* Provenance Filter */}
          <select
            value={provenance}
            onChange={(e) => { setProvenance(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="">Provenance (All)</option>
            <option value="real_curated">Real Curated (6,000)</option>
            <option value="synthetic_simulated">Synthetic Simulated (10,000)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Shipment ID</th>
                <th className="py-3 px-4">Category & Mode</th>
                <th className="py-3 px-4">Corridor Route</th>
                <th className="py-3 px-4">Carrier / Weather</th>
                <th className="py-3 px-4">Delay Risk</th>
                <th className="py-3 px-4">Thermal Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Loading verified records...</span>
                    </div>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No shipments match the selected filters.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => {
                  const isDelay = s.delay_risk_label === 1;
                  const tempRiskLevel = s.temperature_quality_risk_label;

                  return (
                    <tr
                      key={s.shipment_id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => onSelectShipment(s.shipment_id)}
                    >
                      {/* ID & Provenance */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                            {s.shipment_id}
                          </span>
                        </div>
                        <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                          s.data_provenance === 'real_curated'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {s.data_provenance === 'real_curated' ? 'Real Curated' : 'Synthetic'}
                        </span>
                      </td>

                      {/* Category & Transport */}
                      <td className="py-3 px-4">
                        <p className="text-slate-200 font-semibold">{s.product_category}</p>
                        <p className="text-slate-400 text-[11px]">{s.transport_mode}</p>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <span>{s.origin}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span>{s.destination}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{s.distance_km.toLocaleString()} km</p>
                      </td>

                      {/* Carrier & Weather */}
                      <td className="py-3 px-4">
                        <p className="text-slate-200">{s.carrier_id.replace('CARRIER_', '')}</p>
                        <span className={`text-[10px] ${
                          s.weather_condition.includes('Storm') || s.weather_condition.includes('Snow')
                            ? 'text-amber-400 font-semibold'
                            : 'text-slate-400'
                        }`}>
                          {s.weather_condition}
                        </span>
                      </td>

                      {/* Delay Risk */}
                      <td className="py-3 px-4">
                        {isDelay ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                            <Clock className="w-3 h-3" />
                            Delay Likely
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            On-Time
                          </span>
                        )}
                      </td>

                      {/* Temperature Status */}
                      <td className="py-3 px-4">
                        {tempRiskLevel === 2 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {s.recorded_temperature_c}°C (Breach)
                          </span>
                        ) : tempRiskLevel === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                            <Snowflake className="w-3 h-3" />
                            {s.recorded_temperature_c}°C (Excursion)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            {s.recorded_temperature_c}°C (Safe)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.shipment_status === 'DELIVERED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : s.shipment_status === 'CUSTOMS_HOLD'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {s.shipment_status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShipment(s.shipment_id);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-all"
                        >
                          Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <strong>{((page - 1) * pageSize) + 1}</strong> to <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total.toLocaleString()}</strong> consignments
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-200">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
