import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Cpu,
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { PreprocessedRecord, ModelMetrics, PredictionResult } from '../types';
import {
  trainAndEvaluateAllModels,
  predictWaterConsumption,
  generateMultiStepForecast
} from '../services/mlPrediction';

interface PredictionViewProps {
  records: PreprocessedRecord[];
}

export const PredictionView: React.FC<PredictionViewProps> = ({ records }) => {
  // Input form state
  const [zone, setZone] = useState('Zone_1');
  const [domestic, setDomestic] = useState(5200);
  const [commercial, setCommercial] = useState(3100);
  const [industrial, setIndustrial] = useState(2400);
  const [temperature, setTemperature] = useState(28);
  const [rainfall, setRainfall] = useState(0);
  const [isWeekend, setIsWeekend] = useState(false);
  const [rolling7, setRolling7] = useState(10500);

  const [forecastHorizon, setForecastHorizon] = useState<7 | 30>(7);

  // Train and evaluate models on chronological 80/20 split
  const modelResults = useMemo(() => {
    return trainAndEvaluateAllModels(records);
  }, [records]);

  // Real-time Single Point Prediction
  const predictionResult: PredictionResult = useMemo(() => {
    return predictWaterConsumption({
      Domestic_Usage: domestic,
      Commercial_Usage: commercial,
      Industrial_Usage: industrial,
      Temperature: temperature,
      Rainfall: rainfall,
      Is_Weekend: isWeekend ? 1 : 0,
      Rolling_Mean_7: rolling7,
    });
  }, [domestic, commercial, industrial, temperature, rainfall, isWeekend, rolling7]);

  // Future Forecasting Data (7-day or 30-day)
  const forecastData = useMemo(() => {
    return generateMultiStepForecast(records, forecastHorizon);
  }, [records, forecastHorizon]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Water Consumption ML Prediction & Forecasting Studio (Module 4)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Chronological 80/20 split training, multi-model benchmark evaluation, XGBoost inference, and multi-step forecasting horizons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Leakage-Free Temporal Split</span>
          </span>
        </div>
      </div>

      {/* Benchmark Models Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Multi-Model Regression Benchmark Evaluation</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated on holdout test set ($N={Math.round(records.length * 0.2)}$ records) across standard statistical loss functions
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Target: <strong className="text-cyan-300">Total_Consumption</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3 font-sans">Model Architecture</th>
                <th className="p-3 text-right">MAE (kL)</th>
                <th className="p-3 text-right">MSE</th>
                <th className="p-3 text-right">RMSE (kL)</th>
                <th className="p-3 text-right text-emerald-300 font-bold">$R^2$ Score</th>
                <th className="p-3 text-right">MAPE (%)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {modelResults.models.map((m) => (
                <tr
                  key={m.modelName}
                  className={`transition-colors ${
                    m.isBest ? 'bg-cyan-950/40 text-white font-bold' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="p-3 font-sans flex items-center gap-2">
                    {m.isBest ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        ★ BEST MODEL
                      </span>
                    ) : null}
                    <span className={m.isBest ? 'text-cyan-300 font-bold' : 'text-slate-200'}>
                      {m.modelName}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-300">{m.mae.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-400">{(m.mse / 1000).toFixed(0)}k</td>
                  <td className="p-3 text-right text-slate-300">{m.rmse.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-emerald-400">{m.r2.toFixed(4)}</td>
                  <td className="p-3 text-right text-cyan-300">{m.mape.toFixed(2)}%</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans bg-slate-800 text-slate-300 border border-slate-700">
                      Trained
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importance & Actual vs Predicted Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm">
              Tree-Based Feature Importance Ranking (XGBoost)
            </h3>
            <p className="text-xs text-slate-400">Gini-impurity and split gain contribution per feature</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modelResults.featureImportance}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Importance']}
                />
                <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actual vs Predicted Validation Curve */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">
                Holdout Test Set Validation: Actual vs Predicted
              </h3>
              <p className="text-xs text-slate-400">Comparing real ground truth vs XGBoost regressor</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              $R^2 = {modelResults.bestModel.r2.toFixed(3)}$
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={modelResults.validationSample} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} kL`]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} />
                <Line type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} name="Actual Ground Truth" />
                <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} name="XGBoost Predicted" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Single-Day Real-Time Prediction Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Municipal Water Demand Prediction Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Adjust demographic, meteorological, and sector usage values to simulate dynamic predictions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Zone Selector */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Municipal Zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Zone_1">Zone_1 (Downtown Commercial)</option>
                <option value="Zone_2">Zone_2 (Urban Residential)</option>
                <option value="Zone_3">Zone_3 (East Suburban)</option>
                <option value="Zone_4">Zone_4 (Industrial Corridor)</option>
                <option value="Zone_5">Zone_5 (West Mixed-Use)</option>
              </select>
            </div>

            {/* Domestic Usage */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex justify-between">
                <span>Domestic Usage (kL)</span>
                <span className="text-cyan-400 font-mono">{domestic.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={1000}
                max={12000}
                step={100}
                value={domestic}
                onChange={(e) => setDomestic(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Commercial Usage */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex justify-between">
                <span>Commercial Usage (kL)</span>
                <span className="text-blue-400 font-mono">{commercial.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={500}
                max={8000}
                step={100}
                value={commercial}
                onChange={(e) => setCommercial(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Industrial Usage */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex justify-between">
                <span>Industrial Usage (kL)</span>
                <span className="text-purple-400 font-mono">{industrial.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={200}
                max={6000}
                step={100}
                value={industrial}
                onChange={(e) => setIndustrial(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex justify-between">
                <span>Temperature (°C)</span>
                <span className="text-amber-400 font-mono">{temperature}°C</span>
              </label>
              <input
                type="range"
                min={10}
                max={45}
                step={1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Rainfall */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex justify-between">
                <span>Rainfall (mm)</span>
                <span className="text-cyan-400 font-mono">{rainfall} mm</span>
              </label>
              <input
                type="range"
                min={0}
                max={60}
                step={1}
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Rolling Mean 7 */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex justify-between">
                <span>7-Day Moving Baseline (kL)</span>
                <span className="text-slate-300 font-mono">{rolling7.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={3000}
                max={22000}
                step={200}
                value={rolling7}
                onChange={(e) => setRolling7(Number(e.target.value))}
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>

            {/* Weekend Toggle */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWeekend}
                  onChange={(e) => setIsWeekend(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-slate-200 font-medium">Is Weekend / Public Holiday</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Real-time Inferred Output Card with 95% CI */}
        <div className="bg-gradient-to-b from-slate-900 to-cyan-950/40 border border-cyan-500/30 p-6 rounded-2xl space-y-4 flex flex-col justify-between shadow-xl shadow-cyan-500/10">
          <div className="border-b border-cyan-500/20 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Inference Output</span>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                XGBoost Engine
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-1">Predicted Water Demand</h4>
          </div>

          <div className="text-center py-3 space-y-1">
            <div className="text-4xl font-extrabold text-white font-mono tracking-tight text-cyan-300">
              {predictionResult.predictedConsumption.toLocaleString()} <span className="text-sm font-normal text-slate-400 font-sans">kL</span>
            </div>
            <div className="text-xs text-slate-300">Estimated 24h municipal load</div>
          </div>

          {/* 95% Confidence Intervals */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <div className="text-[11px] font-sans text-slate-400 flex items-center justify-between">
              <span>95% Confidence Interval ($z_{0.975} = \pm 1.96$):</span>
            </div>
            <div className="flex items-center justify-between text-slate-200">
              <span className="text-emerald-400 font-bold">{predictionResult.confidenceInterval.lower.toLocaleString()} kL</span>
              <span className="text-slate-500">to</span>
              <span className="text-rose-400 font-bold">{predictionResult.confidenceInterval.upper.toLocaleString()} kL</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-tight">
            *Confidence intervals are derived from empirical holdout test set residual variance (&sigma; = {modelResults.bestModel.rmse} kL).
          </div>
        </div>
      </div>

      {/* Multi-Step Forecasting Horizon Chart (7-Day & 30-Day) */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Multi-Day Forward Water Consumption Forecasting</span>
            </h3>
            <p className="text-xs text-slate-400">
              Iterative recursive forecasting with projected upper & lower confidence boundaries
            </p>
          </div>

          {/* Horizon Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setForecastHorizon(7)}
              className={`px-3 py-1 rounded-lg transition-all ${forecastHorizon === 7 ? 'bg-cyan-500 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              7-Day Horizon
            </button>
            <button
              onClick={() => setForecastHorizon(30)}
              className={`px-3 py-1 rounded-lg transition-all ${forecastHorizon === 30 ? 'bg-cyan-500 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              30-Day Horizon
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} kL`]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
              <Line type="monotone" dataKey="forecast" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} name="Projected Forecast" />
              <Line type="monotone" dataKey="upper" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Upper 95% CI" />
              <Line type="monotone" dataKey="lower" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Lower 95% CI" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
