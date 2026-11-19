import React, { useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Award,
  Sigma,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Cpu,
  Building,
  Droplets
} from 'lucide-react';
import { PreprocessedRecord, AnomalyItem, Recommendation } from '../types';
import { trainAndEvaluateAllModels } from '../services/mlPrediction';
import { trainAndEvaluateClassifiers } from '../services/mlClassification';

interface ReportsViewProps {
  records: PreprocessedRecord[];
  anomalies: AnomalyItem[];
  recommendations: Recommendation[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  anomalies,
  recommendations,
}) => {
  const regressionResults = useMemo(() => trainAndEvaluateAllModels(records), [records]);
  const classificationResults = useMemo(() => trainAndEvaluateClassifiers(records), [records]);

  const totalVol = useMemo(() => records.reduce((acc, r) => acc + r.Total_Consumption, 0), [records]);
  const avgDaily = useMemo(() => Math.round(totalVol / (records.length || 1)), [totalVol, records]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Academic Project Report & Executive Summary (Module 7)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Formal comprehensive report ready for B.Tech project presentation, viva defense, and export.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF Report</span>
        </button>
      </div>

      {/* Formal Academic Printable Document */}
      <div className="bg-slate-900/90 border border-slate-800 p-8 md:p-12 rounded-3xl space-y-8 print:bg-white print:text-black print:border-none print:p-0">
        {/* Title & Institutional Meta */}
        <div className="border-b border-slate-800 print:border-black/20 pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-cyan-400 print:text-blue-700">
            <Droplets className="w-6 h-6" />
            <span className="font-bold text-sm tracking-wider uppercase">AquaIntel Academic Research Report</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white print:text-black tracking-tight">
            Intelligent Water Consumption Monitoring, Prediction, and Anomaly Detection System
          </h1>
          <p className="text-xs text-slate-400 print:text-gray-600 max-w-xl mx-auto">
            A Machine Learning and Statistical Inferential Pipeline for Municipal SCADA Telemetry Analytics
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 print:text-gray-600 font-mono">
            <span>Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
            <span>•</span>
            <span>Dataset: {records.length.toLocaleString()} Records</span>
            <span>•</span>
            <span>Target: Total_Consumption</span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-cyan-300 print:text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <span>1. Executive Summary</span>
          </h3>
          <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed">
            The AquaIntel project presents an end-to-end data science architecture to address non-revenue water loss, demand forecasting uncertainties, and distribution anomalies in urban municipal supply networks. Utilizing 1,125+ chronological telemetry records across five municipal zones, the system executes rigorous data cleaning, temporal lag feature engineering, inferential hypothesis testing ($\alpha = 0.05$), regression benchmarking, and unsupervised Isolation Forest anomaly diagnostics.
          </p>
        </div>

        {/* Section 2: Data Science & Preprocessing Findings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-cyan-300 print:text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <span>2. Data Preprocessing & Feature Engineering Summary</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950/60 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">Total Records</span>
              <strong className="text-white print:text-black">{records.length.toLocaleString()}</strong>
            </div>
            <div className="p-3 bg-slate-950/60 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">Outliers Handled</span>
              <strong className="text-amber-400 print:text-amber-800">IQR 1.5x Method</strong>
            </div>
            <div className="p-3 bg-slate-950/60 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">Lags Generated</span>
              <strong className="text-cyan-400 print:text-blue-800">Lag_1 & Lag_7</strong>
            </div>
            <div className="p-3 bg-slate-950/60 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300">
              <span className="text-slate-400 print:text-gray-600 block text-[10px]">Split Strategy</span>
              <strong className="text-emerald-400 print:text-green-800">80/20 Chronological</strong>
            </div>
          </div>
        </div>

        {/* Section 3: Regression Model Benchmark Metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-cyan-300 print:text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <span>3. Machine Learning Prediction Model Performance</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/80 print:bg-gray-200 text-slate-400 print:text-gray-700">
                <tr>
                  <th className="p-2.5 font-sans">Model</th>
                  <th className="p-2.5 text-right">MAE (kL)</th>
                  <th className="p-2.5 text-right">RMSE (kL)</th>
                  <th className="p-2.5 text-right font-bold">$R^2$ Score</th>
                  <th className="p-2.5 text-right">MAPE (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {regressionResults.models.map((m) => (
                  <tr key={m.modelName} className={m.isBest ? 'font-bold text-cyan-300 print:text-blue-900 bg-cyan-950/20 print:bg-blue-50' : 'text-slate-300 print:text-gray-800'}>
                    <td className="p-2.5 font-sans">{m.isBest ? `★ ${m.modelName}` : m.modelName}</td>
                    <td className="p-2.5 text-right">{m.mae.toLocaleString()}</td>
                    <td className="p-2.5 text-right">{m.rmse.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-emerald-400 print:text-green-700">{m.r2.toFixed(4)}</td>
                    <td className="p-2.5 text-right">{m.mape.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Classification & Anomaly Detection Findings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-cyan-300 print:text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <span>4. Classification & Anomaly Diagnostics</span>
          </h3>
          <div className="p-4 bg-slate-950/60 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300 text-xs space-y-2">
            <p className="text-slate-300 print:text-gray-800">
              • <strong>Top Classifier:</strong> {classificationResults.bestModel.modelName} achieved <strong>{(classificationResults.bestModel.accuracy * 100).toFixed(2)}%</strong> accuracy with Weighted F1-Score of <strong>{classificationResults.bestModel.f1Score.toFixed(4)}</strong> across all 4 quartile demand tiers.
            </p>
            <p className="text-slate-300 print:text-gray-800">
              • <strong>Isolation Forest Anomaly Engine:</strong> Detected <strong>{anomalies.length}</strong> abnormal telemetry deviations ({roundNum((anomalies.length / records.length) * 100, 1)}% contamination).
            </p>
          </div>
        </div>

        {/* Section 5: Strategic Recommendations */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-cyan-300 print:text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <span>5. Municipal Policy Recommendations</span>
          </h3>
          <div className="space-y-2 text-xs">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-3 bg-slate-800/50 print:bg-gray-100 rounded-xl border border-slate-700/60 print:border-gray-300">
                <strong className="text-white print:text-black font-semibold">{rec.title} ({rec.zone})</strong>
                <p className="text-slate-300 print:text-gray-700 mt-0.5">{rec.message}</p>
                <div className="text-[11px] text-cyan-400 print:text-blue-800 mt-1 font-mono">
                  Recommended Action: {rec.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function roundNum(val: number, decimals: number): number {
  return Number(val.toFixed(decimals));
}
