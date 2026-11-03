import React, { useState, useEffect } from 'react';
import { fetchModelMetadata } from '../services/api';
import {
  Cpu, CheckCircle2, TrendingUp, BarChart3, AlertTriangle, ShieldCheck,
  RefreshCw, Info, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export const ModelPerformanceView: React.FC = () => {
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchModelMetadata()
      .then(res => {
        setMetadata(res);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading || !metadata) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const modelA = metadata.model_a_delay;
  const modelB = metadata.model_b_temperature;

  // Format feature importances for chart
  const modelAFeatures = Object.entries(modelA.feature_importances || {}).map(([name, val]) => ({
    name: name.replace('_', ' '),
    importance: Math.max(Number(val), 0)
  })).slice(0, 7);

  const modelBFeatures = Object.entries(modelB.feature_importances || {}).map(([name, val]) => ({
    name: name.replace('_', ' '),
    importance: Math.max(Number(val), 0)
  })).slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Machine Learning Pipelines & Evaluation Report</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Independently trained & validated on 16,000 usable records (70% Train: 11,200 | 15% Val: 2,400 | 15% Held-out Test: 2,400). Zero post-arrival leakage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-semibold">
            Python 3.12 &bull; Scikit-learn
          </span>
        </div>
      </div>

      {/* PIPELINE A: DELAY PREDICTION */}
      <div className="glass-panel p-6 rounded-xl space-y-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pipeline A
              </span>
              <h3 className="text-base font-extrabold text-white">Shipment Delay Prediction</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Binary classification of late delivery likelihood relative to planned transit window</p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Selected: {modelA.algorithm} (Opt. Thresh: {modelA.optimal_threshold})
          </span>
        </div>

        {/* Test Set Metric Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Accuracy</span>
            <p className="text-lg font-extrabold text-white mt-1">{(modelA.test_metrics.accuracy * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Precision</span>
            <p className="text-lg font-extrabold text-white mt-1">{(modelA.test_metrics.precision * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Recall</span>
            <p className="text-lg font-extrabold text-white mt-1">{(modelA.test_metrics.recall * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">F1-Score</span>
            <p className="text-lg font-extrabold text-blue-400 mt-1">{modelA.test_metrics.f1.toFixed(3)}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">ROC-AUC</span>
            <p className="text-lg font-extrabold text-emerald-400 mt-1">{modelA.test_metrics.roc_auc.toFixed(3)}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">PR-AUC</span>
            <p className="text-lg font-extrabold text-emerald-400 mt-1">{modelA.test_metrics.pr_auc.toFixed(3)}</p>
          </div>
        </div>

        {/* Algorithm Comparison Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-white">Validation Set Algorithmic Comparison:</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Precision</th>
                  <th className="py-2.5 px-3">Recall</th>
                  <th className="py-2.5 px-3">F1-Score</th>
                  <th className="py-2.5 px-3">ROC-AUC</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.entries(modelA.validation_comparison || {}).map(([algo, m]: [string, any]) => (
                  <tr key={algo} className={algo === modelA.algorithm ? 'bg-blue-950/20 font-bold' : ''}>
                    <td className="py-2.5 px-3 text-white capitalize">{algo.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-blue-400">{m.f1.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{m.roc_auc.toFixed(3)}</td>
                    <td className="py-2.5 px-3">
                      {algo === modelA.algorithm ? (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Selected Best</span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Evaluated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-white">Model A Feature Attribution (Permutation Importance):</span>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelAFeatures} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Bar dataKey="importance" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PIPELINE B: COLD-CHAIN TEMPERATURE & QUALITY RISK */}
      <div className="glass-panel p-6 rounded-xl space-y-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Pipeline B
              </span>
              <h3 className="text-base font-extrabold text-white">Cold-Chain Temperature & Quality Risk</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Multi-class risk assessment (0: Compliant, 1: Moderate Excursion, 2: Critical Breach)</p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Selected: {modelB.algorithm}
          </span>
        </div>

        {/* Test Set Metric Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Overall Accuracy</span>
            <p className="text-lg font-extrabold text-white mt-1">{(modelB.test_metrics.accuracy * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Macro Precision</span>
            <p className="text-lg font-extrabold text-white mt-1">{(modelB.test_metrics.macro_precision * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Macro Recall</span>
            <p className="text-lg font-extrabold text-white mt-1">{(modelB.test_metrics.macro_recall * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Macro F1-Score</span>
            <p className="text-lg font-extrabold text-emerald-400 mt-1">{modelB.test_metrics.macro_f1.toFixed(3)}</p>
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-white">Model B Feature Attribution (Permutation Importance):</span>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelBFeatures} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Bar dataKey="importance" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
