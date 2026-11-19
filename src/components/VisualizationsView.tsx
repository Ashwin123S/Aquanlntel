import React, { useMemo } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Layers,
  Thermometer,
  CloudRain,
  Activity,
  Droplets
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { PreprocessedRecord } from '../types';

interface VisualizationsViewProps {
  records: PreprocessedRecord[];
}

export const VisualizationsView: React.FC<VisualizationsViewProps> = ({ records }) => {
  // Monthly aggregated data
  const monthlyData = useMemo(() => {
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map: Record<number, { month: string; domestic: number; commercial: number; industrial: number; total: number; count: number }> = {};

    for (const r of records) {
      if (!map[r.Month]) {
        map[r.Month] = { month: monthNames[r.Month], domestic: 0, commercial: 0, industrial: 0, total: 0, count: 0 };
      }
      map[r.Month].domestic += r.Domestic_Usage;
      map[r.Month].commercial += r.Commercial_Usage;
      map[r.Month].industrial += r.Industrial_Usage;
      map[r.Month].total += r.Total_Consumption;
      map[r.Month].count++;
    }

    return Object.values(map).map((m) => ({
      month: m.month,
      Domestic: Math.round(m.domestic / (m.count || 1)),
      Commercial: Math.round(m.commercial / (m.count || 1)),
      Industrial: Math.round(m.industrial / (m.count || 1)),
      Total: Math.round(m.total / (m.count || 1)),
    }));
  }, [records]);

  // Day of Week Distribution
  const dayOfWeekData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<number, { day: string; domestic: number; commercial: number; industrial: number; count: number }> = {};

    for (const r of records) {
      if (!map[r.Day_of_Week]) {
        map[r.Day_of_Week] = { day: dayNames[r.Day_of_Week], domestic: 0, commercial: 0, industrial: 0, count: 0 };
      }
      map[r.Day_of_Week].domestic += r.Domestic_Usage;
      map[r.Day_of_Week].commercial += r.Commercial_Usage;
      map[r.Day_of_Week].industrial += r.Industrial_Usage;
      map[r.Day_of_Week].count++;
    }

    return Object.values(map).map((d) => ({
      day: d.day,
      Domestic: Math.round(d.domestic / (d.count || 1)),
      Commercial: Math.round(d.commercial / (d.count || 1)),
      Industrial: Math.round(d.industrial / (d.count || 1)),
    }));
  }, [records]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <span>Municipal Water Visual Analytics Studio (Module 6)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Multi-dimensional charts, seasonal demand envelopes, and cyclic usage profiles.
        </p>
      </div>

      {/* Grid of Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Seasonal Demand Profile */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm">Monthly Average Demand Envelopes (Seasonal Cycle)</h3>
            <p className="text-xs text-slate-400">Summer heatwave peaks vs winter baseline loads</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${Number(v).toLocaleString()} kL/day`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="Domestic" fill="#06b6d4" stackId="a" name="Domestic" />
                <Bar dataKey="Commercial" fill="#3b82f6" stackId="a" name="Commercial" />
                <Bar dataKey="Industrial" fill="#8b5cf6" stackId="a" name="Industrial" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Day of Week Cyclic Variation */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm">Day-of-Week Sector Dynamic Shifts</h3>
            <p className="text-xs text-slate-400">Weekend residential surges vs weekday industrial/commercial loads</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${Number(v).toLocaleString()} kL`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="Domestic" fill="#06b6d4" name="Domestic" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Commercial" fill="#3b82f6" name="Commercial" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Industrial" fill="#8b5cf6" name="Industrial" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
