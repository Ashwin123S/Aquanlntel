import React, { useState, useMemo } from 'react';
import {
  Sliders,
  CheckCircle2,
  Sparkles,
  Download,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Filter,
  ShieldAlert,
  Database
} from 'lucide-react';
import { PreprocessedRecord, WaterRecord } from '../types';
import {
  PreprocessingConfig,
  DEFAULT_PREPROCESSING_CONFIG,
  preprocessDataset,
  generateProcessedCSV
} from '../services/dataProcessor';

interface PreprocessingViewProps {
  rawRecords: WaterRecord[];
  onApplyProcessed: (processed: PreprocessedRecord[]) => void;
}

export const PreprocessingView: React.FC<PreprocessingViewProps> = ({
  rawRecords,
  onApplyProcessed,
}) => {
  const [config, setConfig] = useState<PreprocessingConfig>(DEFAULT_PREPROCESSING_CONFIG);
  const [isApplying, setIsApplying] = useState(false);

  // Run preprocessing pipeline on the raw records
  const result = useMemo(() => {
    return preprocessDataset(rawRecords, config);
  }, [rawRecords, config]);

  const handleDownloadProcessed = () => {
    const csvData = generateProcessedCSV(result.processed);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aquaintel_processed_features.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToPipeline = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyProcessed(result.processed);
      setIsApplying(false);
    }, 400);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Data Preprocessing & Feature Engineering Studio (Module 1)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated pipeline for missing value imputation, outlier management, temporal feature extraction, and lag calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadProcessed}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Processed CSV</span>
          </button>

          <button
            onClick={handleSaveToPipeline}
            disabled={isApplying}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isApplying ? 'Applying Pipeline...' : 'Deploy to ML Engine'}</span>
          </button>
        </div>
      </div>

      {/* Preprocessing Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Missing Values Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{result.missingCount} cells</div>
          <div className="text-[11px] text-emerald-400">Imputed via {config.missingStrategy.toUpperCase()}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Duplicates Removed</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{result.duplicateCount} records</div>
          <div className="text-[11px] text-blue-400">Date-Zone unique keys enforced</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Outliers Handled</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">{result.outliersDetected} points</div>
          <div className="text-[11px] text-amber-400">Method: {config.outlierMethod.toUpperCase()} (1.5x IQR)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Engineered Features</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono">+11 Columns</div>
          <div className="text-[11px] text-cyan-400">Lags & Rolling Means computed</div>
        </div>
      </div>

      {/* Preprocessing Hyperparameters Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Controls (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm">Pipeline Hyperparameters</h3>
            <p className="text-xs text-slate-400">Tune data cleaning & transformation rules</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Missing Value Strategy */}
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Missing Value Imputation Strategy</label>
              <select
                value={config.missingStrategy}
                onChange={(e: any) => setConfig({ ...config, missingStrategy: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="median">Median Imputation (Robust to outliers)</option>
                <option value="mean">Mean Imputation (Standard Gaussian)</option>
                <option value="mode">Mode Imputation (Frequent value)</option>
                <option value="ffill">Forward Fill (Time-series continuity)</option>
                <option value="drop">Drop Incomplete Rows</option>
              </select>
            </div>

            {/* 2. Outlier Detection Method */}
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Outlier Detection & Management</label>
              <select
                value={config.outlierMethod}
                onChange={(e: any) => setConfig({ ...config, outlierMethod: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="iqr">IQR Rule (Q1 - 1.5*IQR to Q3 + 1.5*IQR)</option>
                <option value="zscore">Z-Score Method (|z| &gt; 3.0)</option>
                <option value="none">Preserve Raw Outliers</option>
              </select>
            </div>

            {/* 3. Numerical Feature Scaling */}
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Feature Scaling Transform</label>
              <select
                value={config.scalingMethod}
                onChange={(e: any) => setConfig({ ...config, scalingMethod: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="standard">StandardScaler (Zero mean, Unit variance)</option>
                <option value="minmax">MinMaxScaler (Normalized 0.0 to 1.0)</option>
                <option value="none">No Scaling (Raw Scale)</option>
              </select>
            </div>

            {/* 4. Duplicates Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.removeDuplicates}
                  onChange={(e) => setConfig({ ...config, removeDuplicates: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-slate-300 font-medium">Auto-deduplicate temporal timestamp keys</span>
              </label>
            </div>
          </div>

          <button
            onClick={() => setConfig(DEFAULT_PREPROCESSING_CONFIG)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Config</span>
          </button>
        </div>

        {/* Right: Engineered Time-Series Features Documentation (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Engineered Time-Series Feature Schema</span>
            </h3>
            <p className="text-xs text-slate-400">Created to capture temporal autocorrelation and seasonality</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold">Lag_1</span>
              <p className="text-slate-400 text-[11px]">Previous day consumption (t-1) for the same zone.</p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold">Lag_7</span>
              <p className="text-slate-400 text-[11px]">Same day of previous week consumption (t-7) for weekly cycle.</p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold">Rolling_Mean_7</span>
              <p className="text-slate-400 text-[11px]">7-day moving window average (mean of t to t-6) for short-term trend.</p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold">Rolling_Mean_30</span>
              <p className="text-slate-400 text-[11px]">30-day moving window average for seasonal baseline smoothing.</p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold">Is_Weekend & Is_Holiday</span>
              <p className="text-slate-400 text-[11px]">Binary indicators for non-working days affecting domestic vs commercial load.</p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold">Day_of_Week & Week_of_Year</span>
              <p className="text-slate-400 text-[11px]">Cyclic indicators for periodic multi-frequency variations.</p>
            </div>
          </div>

          {/* Statistical Distribution Derived Thresholds for Classification */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Statistical Distribution-Derived Classification Thresholds</span>
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
                <span className="text-slate-400 text-[10px] block">LOW Tier (&le; Q1)</span>
                <span className="text-emerald-400 font-bold">&le; {result.thresholds.low.toLocaleString()} kL</span>
              </div>
              <div className="p-2 bg-blue-950/40 border border-blue-800/60 rounded-lg">
                <span className="text-slate-400 text-[10px] block">NORMAL Tier (Q1-Q3)</span>
                <span className="text-blue-400 font-bold">{result.thresholds.low.toLocaleString()} - {result.thresholds.high.toLocaleString()} kL</span>
              </div>
              <div className="p-2 bg-rose-950/40 border border-rose-800/60 rounded-lg">
                <span className="text-slate-400 text-[10px] block">CRITICAL Tier (&gt; Q3+1.2*IQR)</span>
                <span className="text-rose-400 font-bold">&gt; {Math.round(result.thresholds.high * 1.3).toLocaleString()} kL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processed Feature Table Preview */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">
              Processed Dataset Feature Table Preview (First 8 Records)
            </h3>
            <p className="text-xs text-slate-400">All features transformed and ready for regression & classification models</p>
          </div>
          <span className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-mono font-medium">
            {result.processed.length} Clean Records
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Zone</th>
                <th className="p-2.5 text-right">Day_of_Wk</th>
                <th className="p-2.5 text-right">Weekend</th>
                <th className="p-2.5 text-right text-cyan-300">Lag_1</th>
                <th className="p-2.5 text-right text-cyan-300">Lag_7</th>
                <th className="p-2.5 text-right text-amber-300">Roll_7</th>
                <th className="p-2.5 text-right text-amber-300">Roll_30</th>
                <th className="p-2.5 text-right font-bold text-white">Total_Consumption</th>
                <th className="p-2.5 text-center">Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {result.processed.slice(0, 8).map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-sans text-slate-200">{r.Date}</td>
                  <td className="p-2.5 text-cyan-300">{r.Zone_ID}</td>
                  <td className="p-2.5 text-right">{r.Day_Name.slice(0, 3)} ({r.Day_of_Week})</td>
                  <td className="p-2.5 text-right">{r.Is_Weekend ? '1 (Yes)' : '0'}</td>
                  <td className="p-2.5 text-right text-cyan-300">{r.Lag_1.toLocaleString()}</td>
                  <td className="p-2.5 text-right text-cyan-300">{r.Lag_7.toLocaleString()}</td>
                  <td className="p-2.5 text-right text-amber-300">{r.Rolling_Mean_7.toLocaleString()}</td>
                  <td className="p-2.5 text-right text-amber-300">{r.Rolling_Mean_30.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-bold text-emerald-400">{r.Total_Consumption.toLocaleString()}</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded font-sans text-[10px] font-semibold ${
                      r.Consumption_Class === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      r.Consumption_Class === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      r.Consumption_Class === 'LOW' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {r.Consumption_Class}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
