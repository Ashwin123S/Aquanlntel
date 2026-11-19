import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Sliders,
  CheckCircle2,
  Info,
  Calendar,
  Building,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertCircle
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
import { PreprocessedRecord, AnomalyItem } from '../types';
import { detectWaterAnomalies } from '../services/anomalyDetector';

interface AnomalyDetectionViewProps {
  records: PreprocessedRecord[];
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
}

export const AnomalyDetectionView: React.FC<AnomalyDetectionViewProps> = ({
  records,
  selectedZone,
  setSelectedZone,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [thresholdDeviation, setThresholdDeviation] = useState<number>(20);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Run Anomaly Detection Engine
  const anomalies = useMemo(() => {
    return detectWaterAnomalies(records, thresholdDeviation);
  }, [records, thresholdDeviation]);

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      const matchZone = selectedZone === 'All' || a.zone === selectedZone;
      const matchSeverity = severityFilter === 'All' || a.severity === severityFilter;
      const matchSearch =
        a.date.includes(searchTerm) ||
        a.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.possibleCauses.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchZone && matchSeverity && matchSearch;
    });
  }, [anomalies, selectedZone, severityFilter, searchTerm]);

  // Zone incident breakdown
  const zoneIncidentData = useMemo(() => {
    const counts: Record<string, { zone: string; Critical: number; High: number; Medium: number; Low: number }> = {};
    for (const a of anomalies) {
      if (!counts[a.zone]) {
        counts[a.zone] = { zone: a.zone, Critical: 0, High: 0, Medium: 0, Low: 0 };
      }
      if (a.severity === 'CRITICAL') counts[a.zone].Critical++;
      else if (a.severity === 'HIGH') counts[a.zone].High++;
      else if (a.severity === 'MEDIUM') counts[a.zone].Medium++;
      else counts[a.zone].Low++;
    }
    return Object.values(counts);
  }, [anomalies]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Water Consumption Anomaly Detection & Diagnostics (Module 5B)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Isolation Forest telemetry scoring, dynamic 7-day baseline deviations, and rule-based diagnostic hypotheses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{anomalies.length} Flagged Incidents</span>
          </span>
        </div>
      </div>

      {/* Threshold Tuner & Zone Incident Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Anomaly Sensitivity Tuner */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Anomaly Sensitivity Tuner</span>
            </h3>
            <p className="text-xs text-slate-400">Deviation threshold percentage ($|\Delta\%| \ge \theta$)</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Minimum Deviation ($\theta$):</span>
                <span className="text-cyan-400 font-mono font-bold">&plusmn;{thresholdDeviation}%</span>
              </div>
              <input
                type="range"
                min={15}
                max={50}
                step={1}
                value={thresholdDeviation}
                onChange={(e) => setThresholdDeviation(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <strong className="text-slate-300 block font-sans">Diagnosis Criteria:</strong>
              <p>• Severe Spike: $|\Delta\%| \ge 45\%$ with high domestic/industrial load.</p>
              <p>• Drop Outlier: $\Delta\% \le -35\%$ indicating potential sensor outage or supply cut.</p>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Zone Incidents Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm">
              Anomaly Incidents Distribution Across Municipal Zones
            </h3>
            <p className="text-xs text-slate-400">Aggregated breakdown by severity ratings</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneIncidentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="zone" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="Critical" fill="#f43f5e" stackId="a" name="Critical" />
                <Bar dataKey="High" fill="#f97316" stackId="a" name="High" />
                <Bar dataKey="Medium" fill="#eab308" stackId="a" name="Medium" />
                <Bar dataKey="Low" fill="#06b6d4" stackId="a" name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Anomalies Detailed Table */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">
              Flagged Anomaly Incident Logs ({filteredAnomalies.length} entries)
            </h3>
            <p className="text-xs text-slate-400">
              Expected vs Actual consumption deviations and conservative diagnostic suggestions
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cause, date, zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Zone</th>
                <th className="p-3 text-right">Actual (kL)</th>
                <th className="p-3 text-right">Expected (kL)</th>
                <th className="p-3 text-right">Deviation (%)</th>
                <th className="p-3 text-right">Score</th>
                <th className="p-3 text-center">Severity</th>
                <th className="p-3">Diagnostic Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredAnomalies.slice(0, 15).map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-sans text-slate-200">{a.date}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-sans text-[11px]">
                      {a.zone}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-white">{a.actualConsumption.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-400">{a.expectedBaseline.toLocaleString()}</td>
                  <td className={`p-3 text-right font-bold ${a.deviationPercentage > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                    {a.deviationPercentage > 0 ? `+${a.deviationPercentage.toFixed(1)}%` : `${a.deviationPercentage.toFixed(1)}%`}
                  </td>
                  <td className="p-3 text-right text-slate-300">{a.anomalyScore.toFixed(3)}</td>
                  <td className="p-3 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      a.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      a.severity === 'MEDIUM' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                      'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-xs text-slate-300">
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                      {a.possibleCauses.map((cause, cidx) => (
                        <li key={cidx} className="truncate max-w-sm">{cause}</li>
                      ))}
                    </ul>
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
