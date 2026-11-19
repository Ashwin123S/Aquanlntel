import React from 'react';
import {
  LayoutDashboard,
  Database,
  Sliders,
  LineChart,
  Sigma,
  TrendingUp,
  Tag,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  Droplets,
  Activity,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  anomalyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, anomalyCount }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'data', label: 'Data Management', icon: Database, badge: null },
    { id: 'preprocessing', label: 'Preprocessing', icon: Sliders, badge: 'ML Ready' },
    { id: 'analysis', label: 'Consumption Analysis', icon: LineChart, badge: null },
    { id: 'statistics', label: 'Statistical Analysis', icon: Sigma, badge: 'α=0.05' },
    { id: 'prediction', label: 'Prediction', icon: TrendingUp, badge: 'XGBoost' },
    { id: 'classification', label: 'Classification', icon: Tag, badge: 'RF 96%' },
    { id: 'anomaly', label: 'Anomaly Detection', icon: AlertTriangle, badge: anomalyCount > 0 ? `${anomalyCount}` : null, badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30' },
    { id: 'visualizations', label: 'Visualizations', icon: BarChart3, badge: null },
    { id: 'reports', label: 'Reports', icon: FileText, badge: 'PDF' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: 'Python' },
  ];

  return (
    <aside className="w-56 bg-[#1e293b] border-r border-slate-700 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm">
          A
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-sky-400">AquaIntel</span>
            <span className="px-1 py-0.2 text-[9px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">v2.4</span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">Municipal Telemetry</p>
        </div>
      </div>

      {/* Live System Status */}
      <div className="px-3 py-2.5 border-b border-slate-700/60">
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 rounded-md border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-300">SCADA Feed</span>
          </div>
          <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">Optimal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        <div className="px-2 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Analytics & ML Modules
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono border ${item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3 h-3 text-sky-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer / Academic Meta */}
      <div className="p-3 border-t border-slate-700 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
            DS
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-200 truncate">B.Tech AI-DS Project</p>
            <p className="text-[10px] text-slate-400 truncate">Municipal Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
