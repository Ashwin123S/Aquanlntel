import React from 'react';
import {
  Bell,
  Search,
  Filter,
  User,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  recordCount: number;
  anomalyCount: number;
  user: UserProfile;
  onOpenAuth: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedZone,
  setSelectedZone,
  recordCount,
  anomalyCount,
  user,
  onOpenAuth,
  onResetData
}) => {
  const zones = ['All', 'Zone_1', 'Zone_2', 'Zone_3', 'Zone_4', 'Zone_5'];

  return (
    <header className="h-14 bg-[#1e293b]/60 backdrop-blur border-b border-slate-700 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Zone Filter and Scope Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
          <Filter className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-medium text-slate-400">Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-transparent text-xs font-semibold text-sky-400 focus:outline-none cursor-pointer"
          >
            {zones.map((z) => (
              <option key={z} value={z} className="bg-slate-900 text-slate-100">
                {z === 'All' ? 'All Municipal Zones (1-5)' : `${z} - ${getZoneLabel(z)}`}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          <span>Ingested Records: <strong className="text-slate-200 font-mono">{recordCount.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Right: Quick Actions & Status Badges */}
      <div className="flex items-center gap-2.5">
        <div className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[11px] font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          <span>System: Optimal</span>
        </div>

        <div className="hidden sm:flex px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[11px] items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Sync: Real-time</span>
        </div>

        {/* Reload Sample */}
        <button
          onClick={onResetData}
          title="Reload baseline municipal dataset"
          className="px-2.5 py-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-md transition-colors border border-slate-700 flex items-center gap-1 text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden md:inline text-[11px]">Reload</span>
        </button>

        {/* Anomaly Badge */}
        {anomalyCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-[11px] font-medium">
            <Bell className="w-3 h-3 text-red-400" />
            <span>{anomalyCount} Anomalies</span>
          </div>
        )}

        {/* User Account / Role Pill */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1 rounded-md border border-slate-700 transition-all text-xs text-slate-200"
        >
          <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-[10px]">
            {user.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-semibold text-slate-200 text-[11px] leading-tight">
              {user.name}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};

function getZoneLabel(zoneId: string): string {
  switch (zoneId) {
    case 'Zone_1': return 'Downtown Commercial';
    case 'Zone_2': return 'North Urban Residential';
    case 'Zone_3': return 'East Suburban';
    case 'Zone_4': return 'Industrial Corridor';
    case 'Zone_5': return 'West Mixed-Use';
    default: return 'Municipal Sector';
  }
}
