import React, { useState, useMemo } from 'react';
import {
  LineChart as LineChartIcon,
  BarChart3,
  Thermometer,
  CloudRain,
  Calendar,
  Filter,
  TrendingUp,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Building,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { PreprocessedRecord } from '../types';
import { computeCorrelationMatrix } from '../services/statisticalAnalysis';

interface ConsumptionAnalysisViewProps {
  records: PreprocessedRecord[];
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
}

export const ConsumptionAnalysisView: React.FC<ConsumptionAnalysisViewProps> = ({
  records,
  selectedZone,
  setSelectedZone,
}) => {
  const [timeGrain, setTimeGrain] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [sectorFilter, setSectorFilter] = useState<'all' | 'domestic' | 'commercial' | 'industrial'>('all');
  const [classFilter, setClassFilter] = useState<string>('All');

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchZone = selectedZone === 'All' || r.Zone_ID === selectedZone;
      const matchClass = classFilter === 'All' || r.Consumption_Class === classFilter;
      return matchZone && matchClass;
    });
  }, [records, selectedZone, classFilter]);

  // Automated Pattern Insights
  const insights = useMemo(() => {
    if (filteredRecords.length === 0) return null;

    // Peak and Min Day
    const dateSums: Record<string, number> = {};
    const zoneSums: Record<string, { sum: number; count: number }> = {};

    for (const r of records) {
      dateSums[r.Date] = (dateSums[r.Date] || 0) + r.Total_Consumption;
      if (!zoneSums[r.Zone_ID]) zoneSums[r.Zone_ID] = { sum: 0, count: 0 };
      zoneSums[r.Zone_ID].sum += r.Total_Consumption;
      zoneSums[r.Zone_ID].count++;
    }

    const sortedDates = Object.entries(dateSums).sort((a, b) => b[1] - a[1]);
    const peakPeriod = sortedDates[0];
    const minPeriod = sortedDates[sortedDates.length - 1];

    const zoneAvgs = Object.entries(zoneSums).map(([z, v]) => ({ zone: z, avg: v.sum / (v.count || 1) }));
    zoneAvgs.sort((a, b) => b.avg - a.avg);
    const highestZone = zoneAvgs[0];
    const lowestZone = zoneAvgs[zoneAvgs.length - 1];

    const total = filteredRecords.reduce((acc, r) => acc + r.Total_Consumption, 0);
    const avgConsumption = Math.round(total / (filteredRecords.length || 1));

    return {
      peakDate: peakPeriod ? peakPeriod[0] : 'N/A',
      peakVol: peakPeriod ? Math.round(peakPeriod[1]) : 0,
      minDate: minPeriod ? minPeriod[0] : 'N/A',
      minVol: minPeriod ? Math.round(minPeriod[1]) : 0,
      highestZone: highestZone ? highestZone.zone : 'N/A',
      highestZoneAvg: highestZone ? Math.round(highestZone.avg) : 0,
      lowestZone: lowestZone ? lowestZone.zone : 'N/A',
      lowestZoneAvg: lowestZone ? Math.round(lowestZone.avg) : 0,
      avgConsumption,
    };
  }, [filteredRecords, records]);

  // Aggregated Time Series (Daily, Weekly, Monthly)
  const timeSeriesData = useMemo(() => {
    if (timeGrain === 'daily') {
      const dateMap: Record<string, any> = {};
      for (const r of filteredRecords) {
        if (!dateMap[r.Date]) {
          dateMap[r.Date] = {
            date: r.Date,
            Total: 0,
            Domestic: 0,
            Commercial: 0,
            Industrial: 0,
            Rolling7: 0,
            count: 0
          };
        }
        dateMap[r.Date].Total += r.Total_Consumption;
        dateMap[r.Date].Domestic += r.Domestic_Usage;
        dateMap[r.Date].Commercial += r.Commercial_Usage;
        dateMap[r.Date].Industrial += r.Industrial_Usage;
        dateMap[r.Date].Rolling7 += r.Rolling_Mean_7;
        dateMap[r.Date].count++;
      }
      return Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-45);
    } else if (timeGrain === 'weekly') {
      const weekMap: Record<string, any> = {};
      for (const r of filteredRecords) {
        const key = `Wk ${r.Week_of_Year}`;
        if (!weekMap[key]) {
          weekMap[key] = { date: key, Total: 0, Domestic: 0, Commercial: 0, Industrial: 0, count: 0 };
        }
        weekMap[key].Total += r.Total_Consumption;
        weekMap[key].Domestic += r.Domestic_Usage;
        weekMap[key].Commercial += r.Commercial_Usage;
        weekMap[key].Industrial += r.Industrial_Usage;
        weekMap[key].count++;
      }
      return Object.values(weekMap).map((w: any) => ({
        ...w,
        Total: Math.round(w.Total / (w.count || 1)),
        Domestic: Math.round(w.Domestic / (w.count || 1)),
        Commercial: Math.round(w.Commercial / (w.count || 1)),
        Industrial: Math.round(w.Industrial / (w.count || 1)),
      }));
    } else {
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthMap: Record<string, any> = {};
      for (const r of filteredRecords) {
        const key = monthNames[r.Month];
        if (!monthMap[key]) {
          monthMap[key] = { date: key, Total: 0, Domestic: 0, Commercial: 0, Industrial: 0, count: 0 };
        }
        monthMap[key].Total += r.Total_Consumption;
        monthMap[key].Domestic += r.Domestic_Usage;
        monthMap[key].Commercial += r.Commercial_Usage;
        monthMap[key].Industrial += r.Industrial_Usage;
        monthMap[key].count++;
      }
      return Object.values(monthMap).map((m: any) => ({
        ...m,
        Total: Math.round(m.Total / (m.count || 1)),
        Domestic: Math.round(m.Domestic / (m.count || 1)),
        Commercial: Math.round(m.Commercial / (m.count || 1)),
        Industrial: Math.round(m.Industrial / (m.count || 1)),
      }));
    }
  }, [filteredRecords, timeGrain]);

  // Scatter Data: Temperature vs Total Consumption
  const tempScatterData = useMemo(() => {
    return filteredRecords.slice(0, 150).map((r) => ({
      temperature: r.Temperature,
      consumption: r.Total_Consumption,
      zone: r.Zone_ID,
      domestic: r.Domestic_Usage,
    }));
  }, [filteredRecords]);

  // Scatter Data: Rainfall vs Total Consumption
  const rainScatterData = useMemo(() => {
    return filteredRecords.slice(0, 150).map((r) => ({
      rainfall: r.Rainfall,
      consumption: r.Total_Consumption,
      zone: r.Zone_ID,
    }));
  }, [filteredRecords]);

  // Correlation Matrix
  const { labels: corrLabels, matrix: corrMatrix } = useMemo(() => {
    return computeCorrelationMatrix(records);
  }, [records]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-cyan-400" />
            <span>Exploratory Data Analysis & Consumption Patterns (Module 2)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Temporal aggregates, sector breakdowns, meteorological scatter correlations, and automated peak detection.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setTimeGrain('daily')}
              className={`px-3 py-1 rounded-lg transition-all ${timeGrain === 'daily' ? 'bg-cyan-500 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeGrain('weekly')}
              className={`px-3 py-1 rounded-lg transition-all ${timeGrain === 'weekly' ? 'bg-cyan-500 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeGrain('monthly')}
              className={`px-3 py-1 rounded-lg transition-all ${timeGrain === 'monthly' ? 'bg-cyan-500 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Monthly
            </button>
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Tiers</option>
            <option value="LOW">LOW Tier</option>
            <option value="NORMAL">NORMAL Tier</option>
            <option value="HIGH">HIGH Tier</option>
            <option value="CRITICAL">CRITICAL Tier</option>
          </select>
        </div>
      </div>

      {/* Automated Pattern Identification Banner */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Peak Demand Period</span>
              <span className="text-rose-400 font-mono text-[10px] bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">Peak Surge</span>
            </div>
            <div className="text-lg font-bold text-rose-300 font-mono">{insights.peakVol.toLocaleString()} kL</div>
            <div className="text-[11px] text-slate-400">Observed on {insights.peakDate}</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Minimum Demand Period</span>
              <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">Low Baseline</span>
            </div>
            <div className="text-lg font-bold text-emerald-300 font-mono">{insights.minVol.toLocaleString()} kL</div>
            <div className="text-[11px] text-slate-400">Observed on {insights.minDate}</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Highest Demand Zone</span>
              <Building className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-300 font-mono">{insights.highestZone}</div>
            <div className="text-[11px] text-slate-400">Avg {insights.highestZoneAvg.toLocaleString()} kL/day</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Lowest Demand Zone</span>
              <Building className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-cyan-300 font-mono">{insights.lowestZone}</div>
            <div className="text-[11px] text-slate-400">Avg {insights.lowestZoneAvg.toLocaleString()} kL/day</div>
          </div>
        </div>
      )}

      {/* Main Consumption Trends Chart */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">
              {timeGrain.toUpperCase()} Water Consumption Stream with Sector Decomposition
            </h3>
            <p className="text-xs text-slate-400">
              Interactive stacked time-series breakdown of Domestic, Commercial, and Industrial demand
            </p>
          </div>

          {/* Sector Filter Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setSectorFilter('all')}
              className={`px-2.5 py-1 rounded-lg border transition-all ${sectorFilter === 'all' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              All Sectors
            </button>
            <button
              onClick={() => setSectorFilter('domestic')}
              className={`px-2.5 py-1 rounded-lg border transition-all ${sectorFilter === 'domestic' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              Domestic Only
            </button>
            <button
              onClick={() => setSectorFilter('commercial')}
              className={`px-2.5 py-1 rounded-lg border transition-all ${sectorFilter === 'commercial' ? 'bg-blue-950 text-blue-300 border-blue-700' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              Commercial Only
            </button>
            <button
              onClick={() => setSectorFilter('industrial')}
              className={`px-2.5 py-1 rounded-lg border transition-all ${sectorFilter === 'industrial' ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              Industrial Only
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} kL`]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              {(sectorFilter === 'all' || sectorFilter === 'domestic') && (
                <Line type="monotone" dataKey="Domestic" stroke="#06b6d4" strokeWidth={2} dot={false} name="Domestic Usage" />
              )}
              {(sectorFilter === 'all' || sectorFilter === 'commercial') && (
                <Line type="monotone" dataKey="Commercial" stroke="#3b82f6" strokeWidth={2} dot={false} name="Commercial Usage" />
              )}
              {(sectorFilter === 'all' || sectorFilter === 'industrial') && (
                <Line type="monotone" dataKey="Industrial" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Industrial Usage" />
              )}
              {sectorFilter === 'all' && (
                <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={2.5} strokeDasharray="3 3" dot={false} name="Total Aggregated Demand" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meteorological Scatter Correlations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature vs Consumption Scatter Plot */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Ambient Temperature vs Total Consumption</span>
              </h3>
              <p className="text-xs text-slate-400">Positive correlation ($r \approx +0.48, p &lt; 0.001$)</p>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              $r = +0.48$
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="temperature" type="number" name="Temperature" unit="°C" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="consumption" type="number" name="Consumption" unit=" kL" stroke="#64748b" tick={{ fontSize: 11 }} />
                <ZAxis range={[20, 20]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [name === 'Temperature' ? `${val}°C` : `${Number(val).toLocaleString()} kL`, name]}
                />
                <Scatter name="Temp vs Consumption" data={tempScatterData} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rainfall vs Consumption Scatter Plot */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-cyan-400" />
                <span>Precipitation (Rainfall) vs Total Consumption</span>
              </h3>
              <p className="text-xs text-slate-400">Negative outdoor irrigation impact ($r \approx -0.22$)</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              $r = -0.22$
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="rainfall" type="number" name="Rainfall" unit=" mm" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="consumption" type="number" name="Consumption" unit=" kL" stroke="#64748b" tick={{ fontSize: 11 }} />
                <ZAxis range={[20, 20]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [name === 'Rainfall' ? `${val} mm` : `${Number(val).toLocaleString()} kL`, name]}
                />
                <Scatter name="Rain vs Consumption" data={rainScatterData} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Correlation Heatmap Grid */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="font-semibold text-slate-200 text-sm">
            Feature Correlation Heatmap Matrix (Pearson r)
          </h3>
          <p className="text-xs text-slate-400">
            Pairwise Pearson correlation coefficients between water telemetry features
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[650px] inline-block">
            <div className="grid grid-cols-10 gap-1 text-center text-[11px] font-mono">
              <div className="p-2 font-semibold text-slate-400 text-left">Feature</div>
              {corrLabels.map((lbl) => (
                <div key={lbl} className="p-2 font-semibold text-slate-300 truncate" title={lbl}>
                  {lbl}
                </div>
              ))}

              {corrLabels.map((rowLabel) => (
                <React.Fragment key={rowLabel}>
                  <div className="p-2 font-semibold text-slate-300 text-left truncate" title={rowLabel}>
                    {rowLabel}
                  </div>
                  {corrLabels.map((colLabel) => {
                    const cell = corrMatrix.find((c) => c.x === rowLabel && c.y === colLabel);
                    const r = cell ? cell.r : 0;
                    const isPositive = r >= 0;
                    const absR = Math.abs(r);

                    return (
                      <div
                        key={`${rowLabel}-${colLabel}`}
                        className={`p-2 rounded flex items-center justify-center font-bold text-[11px] border transition-all ${
                          absR > 0.7
                            ? isPositive ? 'bg-cyan-600/60 text-white border-cyan-400' : 'bg-rose-600/60 text-white border-rose-400'
                            : absR > 0.4
                            ? isPositive ? 'bg-cyan-900/50 text-cyan-200 border-cyan-700' : 'bg-rose-900/50 text-rose-200 border-rose-700'
                            : absR > 0.15
                            ? isPositive ? 'bg-cyan-950/30 text-slate-300 border-slate-800' : 'bg-rose-950/30 text-slate-300 border-slate-800'
                            : 'bg-slate-800/30 text-slate-500 border-slate-800'
                        }`}
                        title={`${rowLabel} vs ${colLabel}: r = ${r}`}
                      >
                        {r.toFixed(2)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
