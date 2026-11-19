import React, { useState, useMemo } from 'react';
import {
  Tag,
  Award,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { PreprocessedRecord, ClassifierMetrics } from '../types';
import {
  trainAndEvaluateClassifiers,
  classifyConsumptionTier
} from '../services/mlClassification';

interface ClassificationViewProps {
  records: PreprocessedRecord[];
}

export const ClassificationView: React.FC<ClassificationViewProps> = ({ records }) => {
  // Simulator inputs
  const [domestic, setDomestic] = useState(6500);
  const [commercial, setCommercial] = useState(3800);
  const [industrial, setIndustrial] = useState(3200);
  const [temperature, setTemperature] = useState(32);

  // Benchmarking Results
  const benchmarkResults = useMemo(() => {
    return trainAndEvaluateClassifiers(records);
  }, [records]);

  // Live inference
  const liveClassification = useMemo(() => {
    return classifyConsumptionTier(domestic, commercial, industrial, temperature);
  }, [domestic, commercial, industrial, temperature]);

  const classes = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

  // Distribution chart data
  const classDistData = useMemo(() => {
    const counts: Record<string, number> = { LOW: 0, NORMAL: 0, HIGH: 0, CRITICAL: 0 };
    for (const r of records) {
      if (counts[r.Consumption_Class] !== undefined) {
        counts[r.Consumption_Class]++;
      }
    }
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: ((count / (records.length || 1)) * 100).toFixed(1),
    }));
  }, [records]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-cyan-400" />
            <span>Water Consumption Classification Studio (Module 5A)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Statistical quartile-derived tier categorization into LOW, NORMAL, HIGH, and CRITICAL demand states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-cyan-950/60 border border-cyan-800/80 rounded-xl text-xs font-mono text-cyan-300">
            Derived via Q1, Q3, and 1.2 x IQR Thresholds
          </span>
        </div>
      </div>

      {/* Classifier Benchmark Evaluation Table */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Multi-Class Classification Benchmark Results</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated on 20% holdout test set with Weighted Macro Precision, Recall, and F1-Score
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Target: <strong className="text-cyan-300">Consumption_Class (4 Classes)</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3 font-sans">Classifier Algorithm</th>
                <th className="p-3 text-right text-emerald-300 font-bold">Accuracy</th>
                <th className="p-3 text-right text-cyan-300">Precision</th>
                <th className="p-3 text-right text-blue-300">Recall</th>
                <th className="p-3 text-right text-amber-300 font-bold">F1-Score</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {benchmarkResults.models.map((m) => (
                <tr
                  key={m.modelName}
                  className={`transition-colors ${
                    m.isBest ? 'bg-cyan-950/40 text-white font-bold' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="p-3 font-sans flex items-center gap-2">
                    {m.isBest && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        ★ BEST MODEL
                      </span>
                    )}
                    <span className={m.isBest ? 'text-cyan-300 font-bold' : 'text-slate-200'}>
                      {m.modelName}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-400">{(m.accuracy * 100).toFixed(2)}%</td>
                  <td className="p-3 text-right text-cyan-300">{m.precision.toFixed(4)}</td>
                  <td className="p-3 text-right text-blue-300">{m.recall.toFixed(4)}</td>
                  <td className="p-3 text-right font-bold text-amber-400">{m.f1Score.toFixed(4)}</td>
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

      {/* Confusion Matrix & Class Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Interactive Heatmap */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">
                Confusion Matrix Heatmap (Random Forest Classifier)
              </h3>
              <p className="text-xs text-slate-400">Rows = Actual Ground Truth | Columns = Predicted Label</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Acc: {(benchmarkResults.bestModel.accuracy * 100).toFixed(1)}%
            </span>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 overflow-x-auto">
            <div className="min-w-[340px]">
              {/* Header Cols */}
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-mono mb-1.5">
                <div className="text-[10px] text-slate-500 font-sans text-left">Actual \ Pred</div>
                {classes.map((c) => (
                  <div key={c} className="font-bold text-slate-300 text-[11px]">{c}</div>
                ))}
              </div>

              {/* Rows */}
              {classes.map((actualRow) => (
                <div key={actualRow} className="grid grid-cols-5 gap-1.5 items-center mb-1.5 text-xs font-mono">
                  <div className="font-bold text-slate-300 text-left text-[11px]">{actualRow}</div>
                  {classes.map((predCol) => {
                    const cell = benchmarkResults.confusionMatrix.find(
                      (c) => c.actual === actualRow && c.predicted === predCol
                    );
                    const count = cell ? cell.count : 0;
                    const isDiagonal = actualRow === predCol;

                    return (
                      <div
                        key={`${actualRow}-${predCol}`}
                        className={`p-3 rounded-lg text-center font-bold text-sm border transition-all ${
                          isDiagonal
                            ? count > 0 ? 'bg-cyan-600/40 text-cyan-200 border-cyan-500/50 shadow-inner' : 'bg-slate-800 text-slate-500'
                            : count > 0 ? 'bg-rose-950/40 text-rose-300 border-rose-800/50' : 'bg-slate-900/50 text-slate-600 border-slate-800'
                        }`}
                      >
                        {count}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Empirical Class Distribution Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm">
              Empirical Class Distribution in Municipal Dataset
            </h3>
            <p className="text-xs text-slate-400">Proportions of observations across the four demand tiers</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} records`]}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Real-Time Classification Tester */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Interactive Consumption Tier Classifier Simulator</span>
          </h3>
          <p className="text-xs text-slate-400">
            Input candidate usage values to evaluate the resulting predicted class and confidence probabilities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders (2 Cols) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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

            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex justify-between">
                <span>Ambient Temperature (°C)</span>
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
          </div>

          {/* Result Card (1 Col) */}
          <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs text-slate-400 font-medium">Inferred Consumption Tier:</span>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-bold tracking-wide ${
                    liveClassification.predictedClass === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : liveClassification.predictedClass === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : liveClassification.predictedClass === 'LOW'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {liveClassification.predictedClass} DEMAND
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {(liveClassification.confidence * 100).toFixed(1)}% Conf
                </span>
              </div>
            </div>

            {/* Probability Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Softmax Class Probabilities:</span>
              {Object.entries(liveClassification.probabilities).map(([tier, prob]) => (
                <div key={tier} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-300">{tier}</span>
                    <span className="text-cyan-300 font-semibold">{((prob as number) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${(prob as number) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
