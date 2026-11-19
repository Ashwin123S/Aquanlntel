import React, { useMemo, useState } from 'react';
import {
  Sigma,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  Award,
  Sparkles,
  BarChart,
  Layers,
  Info
} from 'lucide-react';
import { PreprocessedRecord, StatisticalSummary, HypothesisTestResult } from '../types';
import {
  calculateColumnSummary,
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  performStudentTTest,
  performOneWayANOVA,
  performChiSquareTest
} from '../services/statisticalAnalysis';

interface StatisticalAnalysisViewProps {
  records: PreprocessedRecord[];
}

export const StatisticalAnalysisView: React.FC<StatisticalAnalysisViewProps> = ({ records }) => {
  const [selectedCol, setSelectedCol] = useState<string>('Total_Consumption');

  // Compute descriptive statistics for all numeric features
  const descriptiveStats = useMemo(() => {
    const columns: (keyof PreprocessedRecord)[] = [
      'Total_Consumption',
      'Domestic_Usage',
      'Commercial_Usage',
      'Industrial_Usage',
      'Temperature',
      'Rainfall',
      'Humidity',
      'Population',
      'Number_of_Households',
      'Lag_1',
      'Rolling_Mean_7'
    ];

    return columns.map((col) => calculateColumnSummary(records, col));
  }, [records]);

  // Execute all hypothesis tests
  const hypothesisTests = useMemo<HypothesisTestResult[]>(() => {
    // 1. Two-sample t-test: Weekend vs Weekday
    const weekendVals = records.filter((r) => r.Is_Weekend === 1).map((r) => r.Total_Consumption);
    const weekdayVals = records.filter((r) => r.Is_Weekend === 0).map((r) => r.Total_Consumption);
    const tTestWeekend = performStudentTTest(
      weekendVals,
      weekdayVals,
      'Weekend (Sat/Sun)',
      'Weekday (Mon-Fri)',
      'Total Water Consumption'
    );

    // 2. Two-sample t-test: High Temp (> 28°C) vs Moderate Temp (<= 28°C)
    const highTempVals = records.filter((r) => r.Temperature > 28).map((r) => r.Total_Consumption);
    const modTempVals = records.filter((r) => r.Temperature <= 28).map((r) => r.Total_Consumption);
    const tTestTemp = performStudentTTest(
      highTempVals,
      modTempVals,
      'High Temperature (>28°C)',
      'Moderate Temperature (≤28°C)',
      'Total Water Demand'
    );

    // 3. One-Way ANOVA across Zones
    const anovaTest = performOneWayANOVA(records);

    // 4. Chi-Square Test of Independence (Zone vs Consumption Tier)
    const chiSquareTest = performChiSquareTest(records);

    return [tTestWeekend, tTestTemp, anovaTest, chiSquareTest];
  }, [records]);

  const activeColSummary = useMemo(() => {
    return descriptiveStats.find((s) => s.column === selectedCol) || descriptiveStats[0];
  }, [descriptiveStats, selectedCol]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sigma className="w-5 h-5 text-cyan-400" />
            <span>Statistical Analysis of Municipal Water Consumption (Module 3)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Descriptive dispersion measures, Pearson/Spearman coefficients, Welch's t-test, One-Way ANOVA, and Chi-Square hypothesis testing ($\alpha = 0.05$).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300">
            Significance Level: $\alpha = 0.05$
          </span>
        </div>
      </div>

      {/* Primary Hypothesis Testing Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Inferential Hypothesis Testing Suite ($\alpha = 0.05$)</span>
          </h3>
          <span className="text-xs text-slate-400">SciPy & Pandas Exact Approximations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hypothesisTests.map((test, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <h4 className="font-semibold text-sm text-white">{test.testName}</h4>
                  <p className="text-[11px] text-slate-400">{test.description}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                    test.isSignificant
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {test.isSignificant ? 'Significant (p < 0.05)' : 'Not Significant'}
                </span>
              </div>

              {/* Hypotheses Formulas */}
              <div className="space-y-1 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 truncate">
                  <strong className="text-slate-300 font-sans">Null Hypothesis:</strong> {test.nullHypothesis}
                </div>
                <div className="text-cyan-300 truncate">
                  <strong className="text-slate-300 font-sans">Alt Hypothesis:</strong> {test.altHypothesis}
                </div>
              </div>

              {/* Test Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">{test.testStatisticName}</span>
                  <span className="text-white font-bold">{test.testStatisticValue}</span>
                </div>
                <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">p-value</span>
                  <span className={`font-bold ${test.isSignificant ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {test.pValue < 0.0001 ? '< 0.0001' : test.pValue.toFixed(4)}
                  </span>
                </div>
                <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Alpha Threshold</span>
                  <span className="text-cyan-300 font-bold">{test.alpha}</span>
                </div>
              </div>

              {/* Interpretation & Academic Rule */}
              <div className="text-xs space-y-1 pt-1">
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-900/50 text-cyan-200 text-[11px] leading-relaxed">
                  <strong>Academic Interpretation:</strong> {test.interpretation}
                </div>
                <p className="text-[11px] text-slate-300 font-sans pt-1">{test.conclusion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Descriptive Statistics Table & Focused Metric Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Comprehensive Descriptive Statistics Table</span>
            </h3>
            <p className="text-xs text-slate-400">
              Central tendency, variance, standard deviation, quartiles (Q1, Q2, Q3), and interquartile ranges (IQR)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Focus Feature:</span>
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg px-2.5 py-1 focus:outline-none font-mono"
            >
              {descriptiveStats.map((s) => (
                <option key={s.column} value={s.column}>
                  {s.column}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Focused Column Stats Highlights */}
        {activeColSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono text-center">
            <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Mean ($\mu$)</span>
              <span className="text-white font-bold text-sm">{activeColSummary.mean.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Median ($Q_2$)</span>
              <span className="text-cyan-300 font-bold text-sm">{activeColSummary.median.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Std Dev ($\sigma$)</span>
              <span className="text-amber-300 font-bold text-sm">{activeColSummary.std.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Min Value</span>
              <span className="text-emerald-300 font-bold text-sm">{activeColSummary.min.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Max Value</span>
              <span className="text-rose-300 font-bold text-sm">{activeColSummary.max.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">IQR ($Q_3 - Q_1$)</span>
              <span className="text-purple-300 font-bold text-sm">{activeColSummary.iqr.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Skewness</span>
              <span className="text-blue-300 font-bold text-sm">{activeColSummary.skewness}</span>
            </div>
          </div>
        )}

        {/* Master Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3 font-sans">Attribute Name</th>
                <th className="p-3 text-right">Count</th>
                <th className="p-3 text-right text-cyan-300">Mean</th>
                <th className="p-3 text-right text-cyan-300">Median</th>
                <th className="p-3 text-right">Mode</th>
                <th className="p-3 text-right">Variance ($\sigma^2$)</th>
                <th className="p-3 text-right text-amber-300">Std Dev ($\sigma$)</th>
                <th className="p-3 text-right">Min</th>
                <th className="p-3 text-right">Q1 (25%)</th>
                <th className="p-3 text-right">Q3 (75%)</th>
                <th className="p-3 text-right text-purple-300">IQR</th>
                <th className="p-3 text-right">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {descriptiveStats.map((stat) => (
                <tr
                  key={stat.column}
                  onClick={() => setSelectedCol(stat.column)}
                  className={`cursor-pointer transition-colors ${
                    selectedCol === stat.column ? 'bg-cyan-950/40 text-white font-bold' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="p-3 font-sans text-cyan-300 flex items-center gap-1.5">
                    {selectedCol === stat.column && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                    <span>{stat.column}</span>
                  </td>
                  <td className="p-3 text-right text-slate-400">{stat.count.toLocaleString()}</td>
                  <td className="p-3 text-right text-cyan-200">{stat.mean.toLocaleString()}</td>
                  <td className="p-3 text-right text-cyan-200">{stat.median.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-400">{stat.mode.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-400">{(stat.variance / 1000).toFixed(0)}k</td>
                  <td className="p-3 text-right text-amber-300">{stat.std.toLocaleString()}</td>
                  <td className="p-3 text-right">{stat.min.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-400">{stat.q1.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-400">{stat.q3.toLocaleString()}</td>
                  <td className="p-3 text-right text-purple-300">{stat.iqr.toLocaleString()}</td>
                  <td className="p-3 text-right">{stat.max.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
