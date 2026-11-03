import React, { useState } from 'react';
import { predictDelay, predictTemperatureRisk } from '../services/api';
import {
  Sparkles, Clock, Snowflake, Play, RefreshCw, AlertTriangle,
  CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';

export const PredictorSandboxView: React.FC = () => {
  // Input parameters
  const [distance, setDistance] = useState(3800);
  const [transportMode, setTransportMode] = useState('Air Freight');
  const [weather, setWeather] = useState('Severe Snowstorm');
  const [customsHours, setCustomsHours] = useState(14.0);
  const [trafficIndex, setTrafficIndex] = useState(0.85);

  const [category, setCategory] = useState('Vaccines & Biologics');
  const [recordedTemp, setRecordedTemp] = useState(11.2);
  const [ambientTemp, setAmbientTemp] = useState(32.0);
  const [excursionDuration, setExcursionDuration] = useState(3.5);
  const [sensorGap, setSensorGap] = useState(1.0);

  // Results
  const [delayResult, setDelayResult] = useState<any>(null);
  const [tempResult, setTempResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const handleRunInference = async () => {
    setIsPredicting(true);
    try {
      const delayRes = await predictDelay({
        distance_km: distance,
        transport_mode: transportMode,
        weather_condition: weather,
        customs_delay_hours: customsHours,
        traffic_index: trafficIndex,
        product_category: category
      });
      setDelayResult(delayRes);

      const tempRes = await predictTemperatureRisk({
        product_category: category,
        recorded_temperature_c: recordedTemp,
        ambient_temperature_c: ambientTemp,
        temperature_excursion_duration: excursionDuration,
        sensor_gap_duration: sensorGap,
        transport_mode: transportMode,
        weather_condition: weather
      });
      setTempResult(tempRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Real-time Risk Predictor & Explainability Sandbox</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test custom operational parameters against production Scikit-learn pipelines with instant XAI factor attribution.
          </p>
        </div>
        <button
          onClick={handleRunInference}
          disabled={isPredicting}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          {isPredicting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          <span>Execute ML Inference</span>
        </button>
      </div>

      {/* Two Column Layout: Controls and Real-time Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters Controls */}
        <div className="space-y-5">
          {/* Section 1: Route & Delay Covariates */}
          <div className="glass-panel p-5 rounded-xl space-y-4 border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Transit & Environmental Parameters (Model A)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Route Distance (km)</span>
                  <span className="font-mono text-blue-400 font-bold">{distance.toLocaleString()} km</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="16000"
                  step="100"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 rounded-lg h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Transport Mode</label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Air Freight">Air Freight</option>
                    <option value="Maritime">Maritime (Reefer)</option>
                    <option value="Road Freight">Road Freight</option>
                    <option value="Intermodal Rail">Intermodal Rail</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Weather Condition</label>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Clear">Clear</option>
                    <option value="Rain">Rain</option>
                    <option value="Severe Snowstorm">Severe Snowstorm</option>
                    <option value="Tropical Storm">Tropical Storm</option>
                    <option value="High Heatwave">High Heatwave</option>
                    <option value="Fog">Fog</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Customs Clearance Delay</span>
                  <span className="font-mono text-amber-400 font-bold">{customsHours.toFixed(1)} hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="1"
                  value={customsHours}
                  onChange={(e) => setCustomsHours(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Intermodal Congestion Index</span>
                  <span className="font-mono text-purple-400 font-bold">{trafficIndex.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={trafficIndex}
                  onChange={(e) => setTrafficIndex(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-800 rounded-lg h-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cold-Chain Telemetry Covariates */}
          <div className="glass-panel p-5 rounded-xl space-y-4 border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-emerald-400" />
              Thermal Packaging & Telemetry Parameters (Model B)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="Vaccines & Biologics">Vaccines & Biologics (+2°C to +8°C)</option>
                  <option value="Ultra-Cold Biopharma">Ultra-Cold Biopharma (-25°C to -15°C)</option>
                  <option value="Fresh Produce">Fresh Produce (0°C to +4°C)</option>
                  <option value="Frozen Food">Frozen Food (-22°C to -18°C)</option>
                  <option value="Ambient Pharmaceuticals">Ambient Pharmaceuticals (+15°C to +25°C)</option>
                  <option value="Industrial & Electronics">Industrial & Electronics (+5°C to +35°C)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Recorded Temp</span>
                    <span className="font-mono text-white font-bold">{recordedTemp}°C</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="45"
                    step="0.5"
                    value={recordedTemp}
                    onChange={(e) => setRecordedTemp(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Ambient Temp</span>
                    <span className="font-mono text-slate-300 font-bold">{ambientTemp}°C</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    step="1"
                    value={ambientTemp}
                    onChange={(e) => setAmbientTemp(Number(e.target.value))}
                    className="w-full accent-slate-400 bg-slate-800 rounded-lg h-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Excursion Duration</span>
                    <span className="font-mono text-amber-400 font-bold">{excursionDuration}h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.5"
                    value={excursionDuration}
                    onChange={(e) => setExcursionDuration(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-slate-800 rounded-lg h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Sensor Gap</span>
                    <span className="font-mono text-purple-400 font-bold">{sensorGap}h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={sensorGap}
                    onChange={(e) => setSensorGap(Number(e.target.value))}
                    className="w-full accent-purple-500 bg-slate-800 rounded-lg h-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Results Display */}
        <div className="space-y-5">
          {!delayResult && !tempResult ? (
            <div className="glass-panel p-12 rounded-xl border border-slate-800 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-blue-500 mx-auto" />
              <h3 className="text-base font-bold text-white">Inference Engine Ready</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Adjust the environmental and telemetry sliders on the left and click <strong>"Execute ML Inference"</strong> to observe live predictions.
              </p>
            </div>
          ) : (
            <>
              {/* Delay Risk Output Card */}
              {delayResult && (
                <div className="glass-panel p-5 rounded-xl space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model A Delay Output</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      delayResult.predicted_risk_class === 1
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {delayResult.risk_level} RISK
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400">Delay Probability</span>
                      <p className="text-2xl font-extrabold text-white">{(delayResult.delay_probability * 100).toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Threshold Used</span>
                      <p className="text-sm font-mono text-slate-300">{delayResult.threshold_used}</p>
                    </div>
                  </div>

                  {/* Factor contributions */}
                  {delayResult.contributing_factors && (
                    <div className="space-y-1.5 text-xs">
                      <span className="font-semibold text-slate-300">Contributing Factors:</span>
                      {delayResult.contributing_factors.map((f: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center justify-between">
                          <span>{f.factor}</span>
                          <span className="font-semibold text-amber-400 text-[11px]">{f.impact}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Temperature Risk Output Card */}
              {tempResult && (
                <div className="glass-panel p-5 rounded-xl space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model B Cold-Chain Output</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tempResult.predicted_risk_class === 2
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : tempResult.predicted_risk_class === 1
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {tempResult.risk_label}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Diagnosis:</span>
                    <p className="text-sm font-bold text-white">{tempResult.description}</p>
                  </div>

                  {/* Recommended SOP Actions */}
                  {tempResult.recommended_actions && (
                    <div className="space-y-1.5 text-xs">
                      <span className="font-semibold text-slate-300">Operator Recommended SOP:</span>
                      {tempResult.recommended_actions.map((act: string, i: number) => (
                        <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-200 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                    {tempResult.scientific_disclaimer}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
