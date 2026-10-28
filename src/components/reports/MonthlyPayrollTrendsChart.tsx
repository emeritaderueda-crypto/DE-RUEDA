import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import {
  FileBarChart2,
  HardDrive,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  triggerDailyRedundancyExport,
  getLatestRedundancySnapshot,
  downloadRedundancySnapshot,
  getLocalDateKey,
  DailyRedundancySnapshot,
} from '../../utils/dailyRedundancyExport';
import { downloadCSV } from '../../utils/exporters';

interface MonthlyPayrollData {
  monthKey: string;
  monthName: string;
  actualGross: number;
  actualNet: number;
  actualDeductions: number;
  budgetProjected: number;
  varianceAmount: number;
  variancePercent: number;
  isOverBudget: boolean;
  workerCount: number;
  payrollRunCount: number;
}

const MONTHLY_BUDGET_BASELINES: Record<string, number> = {
  Jan: 480000,
  Feb: 490000,
  Mar: 510000,
  Apr: 530000,
  May: 540000,
  Jun: 550000,
  Jul: 560000,
  Aug: 550000,
  Sep: 570000,
  Oct: 585000,
  Nov: 600000,
  Dec: 620000,
};

export const MonthlyPayrollTrendsChart: React.FC = () => {
  const { payroll, employees, sites, addAuditLog, currentUser } = useApp();

  const [selectedSite, setSelectedSite] = useState<string>('ALL');
  const [selectedMetric, setSelectedMetric] = useState<'gross' | 'net'>('gross');
  const [budgetMultiplier, setBudgetMultiplier] = useState<number>(1.0);
  const [isExportingRedundancy, setIsExportingRedundancy] = useState<boolean>(false);
  const [redundancyNotice, setRedundancyNotice] = useState<string | null>(null);

  const [latestSnapshot, setLatestSnapshot] = useState<DailyRedundancySnapshot | null>(() =>
    getLatestRedundancySnapshot()
  );

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyData: MonthlyPayrollData[] = useMemo(() => {
    const filteredPayroll =
      selectedSite === 'ALL'
        ? payroll
        : payroll.filter((p) => {
            if (p.site_id === selectedSite) return true;
            const emp = employees.find((e) => e.employee_id === p.employee_id);
            return emp?.site_id === selectedSite;
          });

    const siteWeight = selectedSite === 'ALL' ? 1.0 : 1 / (sites.length || 3);

    return monthNames.map((mName, mIndex) => {
      const monthRecords = filteredPayroll.filter((p) => {
        if (p.created_at) {
          const d = new Date(p.created_at);
          if (!isNaN(d.getTime()) && d.getMonth() === mIndex) {
            return true;
          }
        }
        if (p.week_key) {
          const weekMatch = p.week_key.match(/W(\d+)/i) || p.week_key.match(/Week\s*(\d+)/i);
          if (weekMatch) {
            const weekNum = parseInt(weekMatch[1], 10);
            const approxMonth = Math.min(11, Math.floor((weekNum - 1) / 4.33));
            if (approxMonth === mIndex) return true;
          }
          if (p.week_key.toLowerCase().includes(mName.toLowerCase())) {
            return true;
          }
        }
        return false;
      });

      const actualGross = monthRecords.reduce((sum, p) => sum + (Number(p.gross_pay) || 0), 0);
      const actualNet = monthRecords.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0);
      const actualDeductions = monthRecords.reduce((sum, p) => sum + (Number(p.total_deductions) || 0), 0);

      const uniqueWorkers = new Set(monthRecords.map((p) => p.employee_id)).size;
      const baseBudget = (MONTHLY_BUDGET_BASELINES[mName] || 500000) * siteWeight * budgetMultiplier;
      const budgetProjected = Math.round(baseBudget);

      const targetSpend = selectedMetric === 'gross' ? actualGross : actualNet;
      const varianceAmount = Math.round(targetSpend - budgetProjected);
      const variancePercent =
        budgetProjected > 0 ? Math.round(((targetSpend - budgetProjected) / budgetProjected) * 1000) / 10 : 0;

      return {
        monthKey: `2026-${String(mIndex + 1).padStart(2, '0')}`,
        monthName: mName,
        actualGross: Math.round(actualGross),
        actualNet: Math.round(actualNet),
        actualDeductions: Math.round(actualDeductions),
        budgetProjected,
        varianceAmount,
        variancePercent,
        isOverBudget: targetSpend > budgetProjected,
        workerCount: uniqueWorkers,
        payrollRunCount: monthRecords.length,
      };
    });
  }, [payroll, employees, sites, selectedSite, selectedMetric, budgetMultiplier]);

  const totalActualGross = useMemo(() => monthlyData.reduce((acc, m) => acc + m.actualGross, 0), [monthlyData]);
  const totalActualNet = useMemo(() => monthlyData.reduce((acc, m) => acc + m.actualNet, 0), [monthlyData]);
  const totalBudget = useMemo(() => monthlyData.reduce((acc, m) => acc + m.budgetProjected, 0), [monthlyData]);
  const activeSpend = selectedMetric === 'gross' ? totalActualGross : totalActualNet;
  const netVariance = activeSpend - totalBudget;
  const netVariancePercent = totalBudget > 0 ? Math.round(((activeSpend - totalBudget) / totalBudget) * 1000) / 10 : 0;

  const handleTriggerManualEodExport = () => {
    setIsExportingRedundancy(true);
    setRedundancyNotice(null);

    try {
      const res = triggerDailyRedundancyExport(
        employees,
        payroll,
        'MANUAL_TRIGGER',
        currentUser?.email || 'HR_REPORTS_TERMINAL'
      );

      if (res.success && res.snapshot) {
        setLatestSnapshot(res.snapshot);
        setRedundancyNotice(
          `Local Storage Redundancy Snapshot successfully created (${res.snapshot.metadata.employee_count} employees, ${res.snapshot.metadata.payroll_count} payroll records). Checksum: ${res.snapshot.metadata.checksum}`
        );
        addAuditLog(
          'BROWSER_DATABASE_EXPORT',
          'LOCAL_STORAGE_REDUNDANCY',
          res.snapshot.metadata.snapshot_id,
          `Triggered browser-based database redundancy export to local storage: ${res.snapshot.metadata.employee_count} employees, ${res.snapshot.metadata.payroll_count} payroll records.`
        );
      } else {
        setRedundancyNotice(`Export failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setRedundancyNotice(`Export error: ${err?.message || 'Storage error'}`);
    } finally {
      setIsExportingRedundancy(false);
    }
  };

  const handleDownloadSnapshotJSON = () => {
    downloadRedundancySnapshot();
  };

  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Actual Gross Pay (₱)',
      'Actual Net Pay (₱)',
      'Total Deductions (₱)',
      'Budget Projected (₱)',
      'Variance (₱)',
      'Variance (%)',
      'Status',
      'Active Workers Paid',
      'Payroll Records',
    ];

    const rows = monthlyData.map((d) => [
      d.monthName,
      d.actualGross.toFixed(2),
      d.actualNet.toFixed(2),
      d.actualDeductions.toFixed(2),
      d.budgetProjected.toFixed(2),
      d.varianceAmount.toFixed(2),
      `${d.variancePercent > 0 ? '+' : ''}${d.variancePercent}%`,
      d.isOverBudget ? 'OVER BUDGET' : 'UNDER BUDGET (SAVINGS)',
      d.workerCount,
      d.payrollRunCount,
    ]);

    downloadCSV(`DRC_Monthly_Payroll_vs_Budget_${selectedSite}_${getLocalDateKey()}.csv`, [headers, ...rows]);
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthlyPayrollData;
      return (
        <div className="bg-[#0b1713] border border-[#234338] rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[210px]">
          <div className="font-bold text-white border-b border-[#234338] pb-1 flex items-center justify-between">
            <span className="text-[#a3e635] text-sm font-black">{data.monthName} 2026</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                data.isOverBudget ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {data.isOverBudget ? 'OVER BUDGET' : 'ON TRACK'}
            </span>
          </div>

          <div className="space-y-1 pt-1 font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#a3e635]" />
                Actual Gross:
              </span>
              <span className="font-bold text-white">₱{data.actualGross.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]" />
                Actual Net Disbursed:
              </span>
              <span className="font-semibold text-sky-300">₱{data.actualNet.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" />
                Budget Projected:
              </span>
              <span className="font-semibold text-amber-300">₱{data.budgetProjected.toLocaleString()}</span>
            </div>

            <div className="border-t border-[#234338] pt-1 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Monthly Variance:</span>
              <span
                className={`font-black ${
                  data.varianceAmount > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {data.varianceAmount > 0 ? '+' : ''}₱{data.varianceAmount.toLocaleString()} ({data.variancePercent}%)
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
              <span>Workforce Headcount:</span>
              <span className="text-white">{data.workerCount} workers ({data.payrollRunCount} runs)</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Redundancy & Routine Status Banner */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#13241f] border border-[#a3e635]/30 text-[#a3e635] shrink-0 mt-0.5">
              <HardDrive className="w-5 h-5 text-[#a3e635]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white tracking-tight">
                  Daily End-of-Day Browser Database Redundancy Routine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#a3e635]" />
                  <span>Routine Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Automated scheduler snapshots all payroll and employee records to browser local storage at the end of each day (17:00 PHT) to guarantee offline resilience and dual-tier data redundancy.
              </p>

              {latestSnapshot && (
                <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-slate-400 flex-wrap">
                  <span>
                    Last Backup:{' '}
                    <strong className="text-slate-200">
                      {new Date(latestSnapshot.metadata.timestamp).toLocaleString()}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Redundancy Payload:{' '}
                    <strong className="text-[#a3e635]">
                      {latestSnapshot.metadata.employee_count} Employees / {latestSnapshot.metadata.payroll_count} Payrolls
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Checksum:{' '}
                    <strong className="text-sky-300">{latestSnapshot.metadata.checksum}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Redundancy Action Controls */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleTriggerManualEodExport}
              disabled={isExportingRedundancy}
              className="px-3.5 py-2 bg-[#13241f] border border-[#a3e635]/50 text-[#a3e635] hover:bg-[#a3e635] hover:text-[#080f0d] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              title="Manually trigger end-of-day redundancy export of payroll and employee records to local storage now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExportingRedundancy ? 'animate-spin' : ''}`} />
              <span>{isExportingRedundancy ? 'Exporting...' : 'Trigger EOD Redundancy Export'}</span>
            </button>

            <button
              onClick={handleDownloadSnapshotJSON}
              className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download local storage redundancy snapshot as verified JSON file"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Redundancy JSON</span>
            </button>
          </div>
        </div>

        {redundancyNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#13241f] border border-[#a3e635]/40 text-xs text-[#a3e635] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{redundancyNotice}</span>
          </div>
        )}
      </div>

      {/* Main Header & Visualization Filters */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileBarChart2 className="w-5 h-5 text-[#a3e635]" />
              <h2 className="text-lg font-black text-white tracking-tight">
                Monthly Payroll Spending Trends vs. Budget Projections
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive multi-month variance analysis comparing actual gross and net payroll disbursements against engineering budget targets.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Site Scope Filter */}
            <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Project Sites (Company Wide)</option>
                {sites.map((s) => (
                  <option key={s.site_id} value={s.site_id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Metric Mode Toggle */}
            <div className="flex bg-[#13241f] border border-[#234338] rounded-xl p-0.5 text-xs font-bold">
              <button
                onClick={() => setSelectedMetric('gross')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedMetric === 'gross'
                    ? 'bg-[#a3e635] text-[#080f0d] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gross Wage
              </button>
              <button
                onClick={() => setSelectedMetric('net')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedMetric === 'net'
                    ? 'bg-[#38bdf8] text-[#080f0d] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Net Disbursed
              </button>
            </div>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-[#a3e635] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export monthly payroll trends dataset to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#13241f]/70 border border-[#234338]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              YTD Actual Spending ({selectedMetric === 'gross' ? 'Gross' : 'Net'})
            </span>
            <div className="text-xl font-black text-white font-mono mt-1">
              ₱{activeSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Gross: ₱{totalActualGross.toLocaleString()}</span>
              <span>·</span>
              <span>Net: ₱{totalActualNet.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#13241f]/70 border border-[#234338]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              YTD Projected Budget
            </span>
            <div className="text-xl font-black text-amber-300 font-mono mt-1">
              ₱{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Central Luzon workforce projection baseline
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#13241f]/70 border border-[#234338]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Net Budget Variance
            </span>
            <div
              className={`text-xl font-black font-mono mt-1 flex items-center gap-1 ${
                netVariance > 0 ? 'text-rose-400' : 'text-[#a3e635]'
              }`}
            >
              {netVariance > 0 ? (
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-[#a3e635]" />
              )}
              <span>
                {netVariance > 0 ? '+' : ''}₱{Math.abs(netVariance).toLocaleString()}
              </span>
            </div>
            <div className="text-[11px] mt-1 flex items-center gap-1.5">
              <span
                className={`font-mono font-bold ${
                  netVariance > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {netVariancePercent > 0 ? `+${netVariancePercent}%` : `${netVariancePercent}%`}
              </span>
              <span className="text-slate-400">
                {netVariance > 0 ? 'Budget Overrun' : 'Under Budget (Savings)'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#13241f]/70 border border-[#234338]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Avg Monthly Run-Rate
            </span>
            <div className="text-xl font-black text-sky-300 font-mono mt-1">
              ₱{(activeSpend / 12).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active Scope: <strong className="text-slate-200">{selectedSite}</strong>
            </div>
          </div>
        </div>

        {/* Recharts Visualization Canvas */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span>Monthly Run (₱ PHP)</span>
              <span className="text-[10px] text-slate-500 font-normal">
                (Bars: Actual Spending · Line: Budget Target)
              </span>
            </span>

            {/* Projection Sensitivity Slider */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Projection Scale:</span>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={budgetMultiplier}
                onChange={(e) => setBudgetMultiplier(parseFloat(e.target.value))}
                className="w-24 accent-[#a3e635] cursor-pointer"
              />
              <span className="font-mono text-white font-bold">{Math.round(budgetMultiplier * 100)}%</span>
            </div>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 15, right: 20, bottom: 20, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b362c" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#234338' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#234338' }}
                  tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                {selectedMetric === 'gross' ? (
                  <Bar
                    dataKey="actualGross"
                    name="Actual Gross Payroll"
                    fill="#a3e635"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                ) : (
                  <Bar
                    dataKey="actualNet"
                    name="Actual Net Disbursed"
                    fill="#38bdf8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="budgetProjected"
                  name="Budget Projection Benchmark"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#080f0d', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Monthly Breakdown Table */}
        <div className="border-t border-[#234338] pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Monthly Variance Ledger &amp; Budget Performance
            </h4>
            <span className="text-[11px] text-slate-400">12 Billing Cycles</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#234338]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#13241f] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#234338]">
                <tr>
                  <th className="p-2.5">Month</th>
                  <th className="p-2.5 text-right">Gross Wage (₱)</th>
                  <th className="p-2.5 text-right">Net Disbursed (₱)</th>
                  <th className="p-2.5 text-right">Deductions (₱)</th>
                  <th className="p-2.5 text-right">Budget Projected (₱)</th>
                  <th className="p-2.5 text-right">Variance (₱)</th>
                  <th className="p-2.5 text-right">Variance (%)</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-center">Headcount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#234338]/60 font-mono">
                {monthlyData.map((row) => (
                  <tr key={row.monthKey} className="hover:bg-[#13241f]/50 transition-colors">
                    <td className="p-2.5 font-sans font-bold text-white">{row.monthName} 2026</td>
                    <td className="p-2.5 text-right text-slate-200">₱{row.actualGross.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-sky-300">₱{row.actualNet.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-slate-400">₱{row.actualDeductions.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-amber-300">₱{row.budgetProjected.toLocaleString()}</td>
                    <td
                      className={`p-2.5 text-right font-bold ${
                        row.varianceAmount > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {row.varianceAmount > 0 ? '+' : ''}₱{row.varianceAmount.toLocaleString()}
                    </td>
                    <td
                      className={`p-2.5 text-right font-bold ${
                        row.variancePercent > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {row.variancePercent > 0 ? '+' : ''}{row.variancePercent}%
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          row.isOverBudget
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {row.isOverBudget ? 'OVER BUDGET' : 'UNDER BUDGET'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center text-slate-300">
                      {row.workerCount} workers
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
