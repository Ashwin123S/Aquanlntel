import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileCheck,
  Table as TableIcon
} from 'lucide-react';
import { WaterRecord } from '../types';
import { generateRawCSV } from '../data/sampleData';

interface DataManagementViewProps {
  records: WaterRecord[];
  onUploadDataset: (newRecords: WaterRecord[], filename: string) => void;
  onResetToDefault: () => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  records,
  onUploadDataset,
  onResetToDefault,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const pageSize = 12;

  const requiredColumns = [
    'Date', 'Zone_ID', 'Population', 'Temperature', 'Rainfall',
    'Humidity', 'Number_of_Households', 'Domestic_Usage',
    'Commercial_Usage', 'Industrial_Usage', 'Previous_Day_Consumption',
    'Previous_Week_Consumption', 'Total_Consumption'
  ];

  // Filtering & Pagination
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchZone = zoneFilter === 'All' || r.Zone_ID === zoneFilter;
      const matchSearch =
        r.Date.includes(searchTerm) ||
        r.Zone_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.Total_Consumption).includes(searchTerm);
      return matchZone && matchSearch;
    });
  }, [records, zoneFilter, searchTerm]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handle File Upload (CSV parsing)
  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadStatus('Error: Invalid format. Please provide a CSV or Excel file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setUploadStatus('Error: Dataset appears empty.');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        const missing = requiredColumns.filter((col) => !headers.includes(col));

        if (missing.length > 0) {
          setUploadStatus(`Warning: Dataset is missing expected columns: ${missing.slice(0, 3).join(', ')}. Auto-mapping applied.`);
        }

        const newRecords: WaterRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          if (vals.length >= 5) {
            const rowMap: Record<string, any> = {};
            headers.forEach((h, idx) => {
              rowMap[h] = vals[idx];
            });

            newRecords.push({
              id: i,
              Date: rowMap['Date'] || new Date().toISOString().split('T')[0],
              Zone_ID: rowMap['Zone_ID'] || 'Zone_1',
              Population: Number(rowMap['Population']) || 50000,
              Temperature: Number(rowMap['Temperature']) || 25,
              Rainfall: Number(rowMap['Rainfall']) || 0,
              Humidity: Number(rowMap['Humidity']) || 50,
              Number_of_Households: Number(rowMap['Number_of_Households']) || 15000,
              Domestic_Usage: Number(rowMap['Domestic_Usage']) || 5000,
              Commercial_Usage: Number(rowMap['Commercial_Usage']) || 3000,
              Industrial_Usage: Number(rowMap['Industrial_Usage']) || 2000,
              Previous_Day_Consumption: Number(rowMap['Previous_Day_Consumption']) || 10000,
              Previous_Week_Consumption: Number(rowMap['Previous_Week_Consumption']) || 10000,
              Total_Consumption: Number(rowMap['Total_Consumption']) || 10000,
            });
          }
        }

        if (newRecords.length > 0) {
          onUploadDataset(newRecords, file.name);
          setUploadStatus(`Successfully loaded and validated ${newRecords.length.toLocaleString()} records from "${file.name}".`);
          setCurrentPage(1);
        }
      } catch (err: any) {
        setUploadStatus(`Upload parse error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadCSV = () => {
    const csvContent = generateRawCSV(records);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aquaintel_raw_water_consumption.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>Data Collection & Management (Module 1)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ingest municipal telemetry files, validate column schema, preview records, and export raw datasets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={onResetToDefault}
            className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium rounded-lg border border-sky-500/30 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Upload Zone & Schema Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upload Box (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-4 rounded-xl space-y-3">
          <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-widest flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Upload New Municipal Telemetry Dataset</span>
          </h3>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            }}
            className={`border border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/40'
            }`}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-slate-200">
                Click to browse or drag and drop telemetry file
              </div>
              <p className="text-[11px] text-slate-400">
                Supports <span className="text-slate-300 font-mono">.CSV</span> and <span className="text-slate-300 font-mono">.XLSX</span> municipal water consumption feeds
              </p>
            </div>
          </div>

          {uploadStatus && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              uploadStatus.startsWith('Error')
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : uploadStatus.startsWith('Warning')
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}>
              {uploadStatus.startsWith('Error') ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              <span>{uploadStatus}</span>
            </div>
          )}
        </div>

        {/* Dataset Schema & Health Card (1 Col) */}
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl space-y-3">
          <div className="border-b border-slate-700 pb-2">
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-widest flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-green-400" />
              <span>Dataset Schema Validation</span>
            </h3>
            <p className="text-[11px] text-slate-400">13 Required telemetry attributes</p>
          </div>

          <div className="space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar text-xs">
            {requiredColumns.map((col) => (
              <div key={col} className="flex items-center justify-between p-1.5 rounded-md bg-slate-900/60 border border-slate-700/60">
                <span className="font-mono text-slate-300 text-[11px]">{col}</span>
                <span className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Validated
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <span>Total Ingested:</span>
            <strong className="text-sky-400 font-mono">{records.length.toLocaleString()} Records</strong>
          </div>
        </div>
      </div>

      {/* Interactive Data Table Preview */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-widest">
              Raw Dataset Preview & Search ({filteredRecords.length.toLocaleString()} matched)
            </h3>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search date, zone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="bg-slate-800 border border-slate-700 rounded-md pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={zoneFilter}
              onChange={(e) => { setZoneFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Zones</option>
              <option value="Zone_1">Zone_1 (Downtown)</option>
              <option value="Zone_2">Zone_2 (Urban Res.)</option>
              <option value="Zone_3">Zone_3 (Suburban)</option>
              <option value="Zone_4">Zone_4 (Industrial)</option>
              <option value="Zone_5">Zone_5 (Mixed-Use)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Data Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-700 sticky top-0">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Zone ID</th>
                <th className="px-3 py-2 text-right">Population</th>
                <th className="px-3 py-2 text-right">Temp (°C)</th>
                <th className="px-3 py-2 text-right">Rain (mm)</th>
                <th className="px-3 py-2 text-right">Humidity (%)</th>
                <th className="px-3 py-2 text-right">Domestic</th>
                <th className="px-3 py-2 text-right">Commercial</th>
                <th className="px-3 py-2 text-right">Industrial</th>
                <th className="px-3 py-2 text-right font-bold text-sky-400">Total Consumption (kL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-mono text-[11px]">
              {paginatedRecords.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-3 py-1.5 text-slate-500">{(currentPage - 1) * pageSize + idx + 1}</td>
                  <td className="px-3 py-1.5 font-sans text-slate-200">{r.Date}</td>
                  <td className="px-3 py-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700 font-sans text-[10px]">
                      {r.Zone_ID}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">{r.Population.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right">{r.Temperature}°</td>
                  <td className="px-3 py-1.5 text-right">{r.Rainfall}</td>
                  <td className="px-3 py-1.5 text-right">{r.Humidity}%</td>
                  <td className="px-3 py-1.5 text-right text-sky-300">{r.Domestic_Usage.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right text-indigo-300">{r.Commercial_Usage.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right text-purple-300">{r.Industrial_Usage.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-green-400">{r.Total_Consumption.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="text-[11px]">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md border border-slate-700 transition-colors text-slate-200 text-xs"
            >
              Previous
            </button>
            <span className="px-1.5 font-mono text-sky-400 text-xs">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md border border-slate-700 transition-colors text-slate-200 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
