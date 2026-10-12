import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Site, Employee, DeductionRecord, GCashTransactionRecord } from '../../types';
import {
  downloadCSV,
  downloadExcelXLSX,
  downloadWordDoc,
  downloadReportPDF,
} from '../../utils/exporters';
import { CanteenGcashPayoutModal } from '../modals/CanteenGcashPayoutModal';
import {
  UtensilsCrossed,
  Building2,
  Users,
  DollarSign,
  Wallet,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  FileCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Send,
  Eye,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface WorkerDeductionLine {
  employee_id: string;
  name: string;
  position: string;
  site_id: string;
  site_code: string;
  site_name: string;
  vendor_name: string;
  gcash_number: string;
  week_key: string;
  amount: number;
  notes: string;
  settlement_status: 'GCash Settled' | 'Pending Settlement';
  settlement_reference: string;
}

interface SiteAggregation {
  site: Site;
  workerCount: number;
  totalMealDeductions: number;
  totalGcashSettled: number;
  netOutstandingBalance: number;
  workers: WorkerDeductionLine[];
}

export const CanteenSpendingAggregationTab: React.FC = () => {
  const {
    sites,
    employees,
    deductions,
    gcashTransactions,
    dtrWeeks,
    currentSite,
  } = useApp();

  // Filters
  const [siteFilter, setSiteFilter] = useState<string>(currentSite);
  const [weekFilter, setWeekFilter] = useState<string>(dtrWeeks[0]?.week_key || '2026-W41');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SETTLED' | 'PENDING'>('ALL');

  // 3-Way Sub-Mode View Toggle (as requested: Hierarchical, Flat Ledger, Executive Cards)
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat-ledger' | 'executive-cards'>('hierarchical');

  // Accordion state for Hierarchical mode
  const [expandedSites, setExpandedSites] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sites.forEach((s) => {
      initial[s.site_id] = true; // expanded by default for full visibility
    });
    return initial;
  });

  // Modal State for Direct GCash Payout
  const [payoutModalSite, setPayoutModalSite] = useState<Site | null>(null);
  const [payoutDefaultAmount, setPayoutDefaultAmount] = useState<number>(0);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Drill-down Modal State for Executive Cards
  const [drillDownSite, setDrillDownSite] = useState<SiteAggregation | null>(null);

  const toggleSiteAccordion = (siteId: string) => {
    setExpandedSites((prev) => ({
      ...prev,
      [siteId]: !prev[siteId],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    sites.forEach((s) => {
      allExp[s.site_id] = true;
    });
    setExpandedSites(allExp);
  };

  const collapseAll = () => {
    setExpandedSites({});
  };

  // Build Aggregated Data Model per Site and Employee
  const siteAggregations: SiteAggregation[] = useMemo(() => {
    const filteredSitesList = sites.filter((s) => siteFilter === 'ALL' || s.site_id === siteFilter);

    return filteredSitesList.map((site) => {
      const siteDeds = deductions.filter((d) => {
        const matchSite = d.site_id === site.site_id;
        const matchWeek = weekFilter === 'ALL' || d.week_key === weekFilter;
        const hasMeal = Number(d.canteen || 0) > 0;
        return matchSite && matchWeek && hasMeal && d.is_void === 0;
      });

      // Total settled to this site canteen via GCash
      const sitePayoutTxs = gcashTransactions.filter((tx) => {
        const matchCat = tx.category === 'Site Canteen Payout';
        const matchSite = tx.site_id === site.site_id;
        const isComp = tx.status === 'COMPLETED';
        return matchCat && matchSite && isComp;
      });

      const totalSettled = sitePayoutTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const totalMealCharges = siteDeds.reduce((sum, d) => sum + Number(d.canteen || 0), 0);
      const netOutstanding = Math.max(0, totalMealCharges - totalSettled);

      const latestTx = sitePayoutTxs[0];

      const workerLines: WorkerDeductionLine[] = siteDeds.map((d) => {
        const emp = employees.find((e) => e.employee_id === d.employee_id);
        const isSettled = totalSettled >= totalMealCharges && totalMealCharges > 0;
        return {
          employee_id: d.employee_id,
          name: emp ? emp.name : d.employee_id,
          position: emp ? emp.position : 'Field Worker',
          site_id: site.site_id,
          site_code: site.code,
          site_name: site.name,
          vendor_name: site.canteen_vendor_name || 'Project Canteen Concessionaire',
          gcash_number: site.canteen_gcash_number || '09171234567',
          week_key: d.week_key,
          amount: Number(d.canteen || 0),
          notes: d.notes || 'Weekly meal withholding',
          settlement_status: isSettled ? 'GCash Settled' : 'Pending Settlement',
          settlement_reference: latestTx ? latestTx.reference_no : 'Unsettled',
        };
      });

      // Apply search query filter if provided
      const searchedWorkers = workerLines.filter((w) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          w.name.toLowerCase().includes(query) ||
          w.employee_id.toLowerCase().includes(query) ||
          w.position.toLowerCase().includes(query)
        );
      });

      // Apply status filter if provided
      const filteredWorkers = searchedWorkers.filter((w) => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'SETTLED') return w.settlement_status === 'GCash Settled';
        if (statusFilter === 'PENDING') return w.settlement_status === 'Pending Settlement';
        return true;
      });

      return {
        site,
        workerCount: searchedWorkers.length,
        totalMealDeductions: totalMealCharges,
        totalGcashSettled: totalSettled,
        netOutstandingBalance: netOutstanding,
        workers: filteredWorkers,
      };
    });
  }, [sites, siteFilter, weekFilter, deductions, gcashTransactions, employees, searchQuery, statusFilter]);

  // Overall Global Summary Totals
  const overallTotals = useMemo(() => {
    let totalDeductions = 0;
    let totalSettled = 0;
    let totalOutstanding = 0;
    let totalWorkers = 0;

    siteAggregations.forEach((agg) => {
      totalDeductions += agg.totalMealDeductions;
      totalSettled += agg.totalGcashSettled;
      totalOutstanding += agg.netOutstandingBalance;
      totalWorkers += agg.workerCount;
    });

    return {
      totalDeductions,
      totalSettled,
      totalOutstanding,
      totalWorkers,
    };
  }, [siteAggregations]);

  // Flat Worker Roster across all sites (for Flat Searchable Ledger mode)
  const allFlattenedWorkers: WorkerDeductionLine[] = useMemo(() => {
    const list: WorkerDeductionLine[] = [];
    siteAggregations.forEach((agg) => {
      list.push(...agg.workers);
    });
    return list;
  }, [siteAggregations]);

  // Handle Quick GCash Settlement Trigger
  const handleOpenPayoutModal = (site: Site, outstanding: number) => {
    setPayoutModalSite(site);
    setPayoutDefaultAmount(outstanding > 0 ? outstanding : 0);
    setIsPayoutModalOpen(true);
  };

  // ----------------------------------------------------------------------
  // Export Handlers for Canteen Spending Aggregation
  // ----------------------------------------------------------------------
  const getCanteenExportPayload = () => {
    const headers = [
      'Site Code',
      'Construction Site',
      'Concessionaire Caterer',
      'Canteen GCash No.',
      'Employee ID',
      'Worker Name',
      'Position / Trade',
      'Payroll Week',
      'Meal Deduction (₱)',
      'GCash Payout Status',
      'Settlement Ref No.',
    ];

    const rows: (string | number)[][] = [];

    siteAggregations.forEach((agg) => {
      agg.workers.forEach((w) => {
        rows.push([
          agg.site.code,
          agg.site.name,
          agg.site.canteen_vendor_name || 'Concessionaire',
          agg.site.canteen_gcash_number || '09171234567',
          w.employee_id,
          w.name,
          w.position,
          w.week_key,
          w.amount.toFixed(2),
          w.settlement_status,
          w.settlement_reference,
        ]);
      });
      // Add Subtotal Line for this site
      if (agg.workers.length > 0) {
        rows.push([
          agg.site.code,
          `SUBTOTAL (${agg.site.name})`,
          agg.site.canteen_vendor_name || 'Concessionaire',
          '-',
          '-',
          `${agg.workers.length} Workers`,
          '-',
          weekFilter,
          agg.totalMealDeductions.toFixed(2),
          `Settled: ₱${agg.totalGcashSettled.toFixed(2)}`,
          `Net Due: ₱${agg.netOutstandingBalance.toFixed(2)}`,
        ]);
      }
    });

    // Add Grand Total Line
    rows.push([
      'ALL',
      'GRAND TOTAL (ALL SITES)',
      '-',
      '-',
      '-',
      `${overallTotals.totalWorkers} Workers Total`,
      '-',
      weekFilter,
      overallTotals.totalDeductions.toFixed(2),
      `Total Settled: ₱${overallTotals.totalSettled.toFixed(2)}`,
      `Total Due: ₱${overallTotals.totalOutstanding.toFixed(2)}`,
    ]);

    const title = 'Canteen Spending Aggregation & Concessionaire Remittance Register';
    const subtitle = `Filter: ${siteFilter} | Week: ${weekFilter} | Total Withholdings: ₱${overallTotals.totalDeductions.toLocaleString(
      undefined,
      { minimumFractionDigits: 2 }
    )} | Total Settled: ₱${overallTotals.totalSettled.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    return { headers, rows, title, subtitle };
  };

  const handleDownloadPDF = () => {
    const payload = getCanteenExportPayload();
    downloadReportPDF(
      `DRC_Canteen_Aggregation_${siteFilter}_${weekFilter}.pdf`,
      `De Rueda Construction — ${payload.title}`,
      payload.subtitle,
      payload.headers,
      payload.rows,
      true // landscape
    );
  };

  const handleDownloadExcel = () => {
    const payload = getCanteenExportPayload();
    downloadExcelXLSX(
      `DRC_Canteen_Aggregation_${siteFilter}_${weekFilter}.xlsx`,
      'Canteen Spending',
      payload.headers,
      payload.rows
    );
  };

  const handleDownloadWord = () => {
    const payload = getCanteenExportPayload();
    let tableHtml = `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;"><thead><tr style="background:#0e1a16;color:#ffffff;">${payload.headers
      .map((h) => `<th>${h}</th>`)
      .join('')}</tr></thead><tbody>`;
    payload.rows.forEach((row) => {
      tableHtml += `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    });
    tableHtml += `</tbody></table>`;

    downloadWordDoc(
      `DRC_Canteen_Aggregation_${siteFilter}_${weekFilter}.doc`,
      payload.title,
      `<h2>${payload.title}</h2><p>${payload.subtitle}</p>${tableHtml}`
    );
  };

  const handleDownloadCSV = () => {
    const payload = getCanteenExportPayload();
    downloadCSV(`DRC_Canteen_Aggregation_${siteFilter}_${weekFilter}.csv`, [payload.headers, ...payload.rows]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Weekly Canteen Stipend Aggregator
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  SITE &amp; EMPLOYEE AGGREGATOR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Weekly canteen stipend collection (GCash or Cash) aggregated by site and employee with concessionaire settlement tracking
              </p>
            </div>
          </div>
        </div>

        {/* Export & Print Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download Authenticated PDF Report"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-[#a3e635] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download Microsoft Excel Workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Excel (.xlsx)
          </button>

          <button
            onClick={handleDownloadWord}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download Microsoft Word Document (.doc)"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Word (.doc)
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV"
          >
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
            CSV
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Print Current Aggregation"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* 4 Summary Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Weekly Canteen Stipends Collected</span>
            <DollarSign className="w-4 h-4 text-[#a3e635]" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2 tracking-tight">
            ₱{overallTotals.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Withheld from worker wages</span>
            <span>·</span>
            <span className="font-mono text-emerald-400">{siteAggregations.length} Sites</span>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>GCash Settled to Caterers</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2 tracking-tight">
            ₱{overallTotals.totalSettled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Paid via Corporate GCash</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">Reconciled</span>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Net Outstanding Balance</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2 tracking-tight">
            ₱{overallTotals.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Due to site concessionaires</span>
            <span>·</span>
            <span className="text-amber-400 font-medium">Awaiting Payout</span>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Workers Subsidized</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2 tracking-tight">
            {overallTotals.totalWorkers}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Registered meal chits</span>
            <span>·</span>
            <span className="text-blue-400 font-mono">100% Tracked</span>
          </div>
        </div>
      </div>

      {/* Control Filter & Sub-Mode Switcher Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-4 space-y-4 no-print shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sub-Mode Segmented Button */}
          <div className="flex items-center gap-1 bg-[#13241f] border border-[#234338] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('hierarchical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'hierarchical'
                  ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hierarchical Site Breakdown</span>
            </button>

            <button
              onClick={() => setViewMode('flat-ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'flat-ledger'
                  ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Flat Searchable Ledger</span>
            </button>

            <button
              onClick={() => setViewMode('executive-cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'executive-cards'
                  ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Executive Summary Cards</span>
            </button>
          </div>

          {/* Quick Accordion Expand/Collapse for Hierarchical mode */}
          {viewMode === 'hierarchical' && (
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-[#13241f] border border-[#234338] rounded-lg transition-colors cursor-pointer"
              >
                Expand All Sites
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-[#13241f] border border-[#234338] rounded-lg transition-colors cursor-pointer"
              >
                Collapse All Sites
              </button>
            </div>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#234338]">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Target Construction Site
            </label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="ALL">All Construction Sites (Consolidated)</option>
              {sites.map((s) => (
                <option key={s.site_id} value={s.site_id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Work / Payroll Week
            </label>
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none cursor-pointer"
            >
              <option value="ALL">All Historical Weeks</option>
              {dtrWeeks.map((w) => (
                <option key={w.week_key} value={w.week_key}>
                  {w.week_key} ({w.date_start} to {w.date_end})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filter by Worker / ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search worker name or EMP-ID..."
                className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#a3e635]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Settlement Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="ALL">All Settlement Statuses</option>
              <option value="PENDING">Pending Settlement Only</option>
              <option value="SETTLED">GCash Settled Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODE 1: HIERARCHICAL SITE BREAKDOWN                               */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'hierarchical' && (
        <div className="space-y-4">
          {siteAggregations.map((agg) => {
            const isExpanded = !!expandedSites[agg.site.site_id];
            const siteVendor = agg.site.canteen_vendor_name || 'Project Canteen Concessionaire';
            const siteGcash = agg.site.canteen_gcash_number || '09171234567';

            return (
              <div
                key={agg.site.site_id}
                className="bg-[#0e1a16] border border-[#234338] rounded-2xl overflow-hidden shadow-md transition-all"
              >
                {/* Site Header Bar */}
                <div
                  onClick={() => toggleSiteAccordion(agg.site.site_id)}
                  className="p-4 bg-[#13241f] border-b border-[#234338] flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-[#13241f]/80 select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      aria-label="Toggle accordion"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#a3e635]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded border border-[#a3e635]/30">
                          {agg.site.code}
                        </span>
                        <h3 className="text-sm font-black text-white">{agg.site.name}</h3>
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          &bull; {agg.site.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-300">
                          <UtensilsCrossed className="w-3 h-3 text-[#a3e635]" />
                          {siteVendor}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-slate-300 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-blue-400" />
                          {siteGcash}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Site Summary Metrics & Action */}
                  <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Deductions</div>
                        <div className="font-mono font-bold text-xs text-white">
                          ₱{agg.totalMealDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="border-l border-[#234338] pl-3">
                        <div className="text-[10px] uppercase font-bold text-slate-400">GCash Settled</div>
                        <div className="font-mono font-bold text-xs text-emerald-400">
                          ₱{agg.totalGcashSettled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="border-l border-[#234338] pl-3">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Net Due</div>
                        <div className="font-mono font-bold text-xs text-amber-400">
                          ₱{agg.netOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Quick GCash Settle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPayoutModal(agg.site, agg.netOutstandingBalance);
                      }}
                      className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ml-2"
                      title="Settle Concessionaire Bill via GCash"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Settle GCash</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Worker Roster Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {agg.workers.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No meal deduction records found for this site under selected filters.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px]">
                            <th className="p-3 whitespace-nowrap">Employee ID</th>
                            <th className="p-3 whitespace-nowrap">Worker Name</th>
                            <th className="p-3 whitespace-nowrap">Trade / Position</th>
                            <th className="p-3 whitespace-nowrap">Cycle Week</th>
                            <th className="p-3 whitespace-nowrap text-right">Meal Deduction (₱)</th>
                            <th className="p-3 whitespace-nowrap text-center">Settlement Status</th>
                            <th className="p-3 whitespace-nowrap">GCash Ref No.</th>
                            <th className="p-3 whitespace-nowrap">Remarks / Chit Memo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#234338]/40">
                          {agg.workers.map((worker) => (
                            <tr key={`${worker.employee_id}-${worker.week_key}`} className="hover:bg-[#13241f]/70 transition-colors">
                              <td className="p-3 whitespace-nowrap font-mono font-bold text-[#a3e635]">
                                {worker.employee_id}
                              </td>
                              <td className="p-3 whitespace-nowrap font-bold text-white">
                                {worker.name}
                              </td>
                              <td className="p-3 whitespace-nowrap text-slate-300">
                                {worker.position}
                              </td>
                              <td className="p-3 whitespace-nowrap font-mono text-slate-400">
                                {worker.week_key}
                              </td>
                              <td className="p-3 whitespace-nowrap text-right font-mono font-black text-white">
                                ₱{worker.amount.toFixed(2)}
                              </td>
                              <td className="p-3 whitespace-nowrap text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                    worker.settlement_status === 'GCash Settled'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  }`}
                                >
                                  {worker.settlement_status}
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                                {worker.settlement_reference}
                              </td>
                              <td className="p-3 whitespace-nowrap text-slate-400 text-[11px]">
                                {worker.notes}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#13241f] border-t-2 border-[#234338] font-bold text-white">
                            <td colSpan={4} className="p-3 text-right uppercase text-[11px] text-slate-300">
                              Subtotal ({agg.site.code} &bull; {agg.workers.length} Workers):
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-[#a3e635]">
                              ₱{agg.totalMealDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td colSpan={3} className="p-3 text-xs text-slate-400 font-normal">
                              Settled: ₱{agg.totalGcashSettled.toFixed(2)} | Net Balance: ₱{agg.netOutstandingBalance.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODE 2: FLAT SEARCHABLE LEDGER                                    */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'flat-ledger' && (
        <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-[#13241f] border-b border-[#234338] flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Cross-Site Master Canteen Deductions Register
              </div>
              <div className="text-[11px] text-slate-400">
                {allFlattenedWorkers.length} total worker meal charges found
              </div>
            </div>
            <span className="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              AUDITED FINANCIAL DATA
            </span>
          </div>

          <div className="overflow-x-auto">
            {allFlattenedWorkers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No canteen charges matching filter criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="p-3 whitespace-nowrap">Site</th>
                    <th className="p-3 whitespace-nowrap">Worker ID</th>
                    <th className="p-3 whitespace-nowrap">Full Name</th>
                    <th className="p-3 whitespace-nowrap">Position</th>
                    <th className="p-3 whitespace-nowrap">Concessionaire Caterer</th>
                    <th className="p-3 whitespace-nowrap">Canteen GCash</th>
                    <th className="p-3 whitespace-nowrap">Week</th>
                    <th className="p-3 whitespace-nowrap text-right">Deduction (₱)</th>
                    <th className="p-3 whitespace-nowrap text-center">Status</th>
                    <th className="p-3 whitespace-nowrap">Settlement Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#234338]/40">
                  {allFlattenedWorkers.map((w, idx) => (
                    <tr key={idx} className="hover:bg-[#13241f]/70 transition-colors">
                      <td className="p-3 whitespace-nowrap font-mono font-bold text-slate-300">
                        {w.site_code}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono font-bold text-[#a3e635]">
                        {w.employee_id}
                      </td>
                      <td className="p-3 whitespace-nowrap font-bold text-white">
                        {w.name}
                      </td>
                      <td className="p-3 whitespace-nowrap text-slate-300">
                        {w.position}
                      </td>
                      <td className="p-3 whitespace-nowrap text-slate-300 text-[11px]">
                        {w.vendor_name}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                        {w.gcash_number}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-slate-400">
                        {w.week_key}
                      </td>
                      <td className="p-3 whitespace-nowrap text-right font-mono font-black text-white">
                        ₱{w.amount.toFixed(2)}
                      </td>
                      <td className="p-3 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                            w.settlement_status === 'GCash Settled'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {w.settlement_status}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                        {w.settlement_reference}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#13241f] border-t-2 border-[#234338] font-bold text-white">
                    <td colSpan={7} className="p-3 text-right uppercase text-[11px] text-slate-300">
                      Grand Total ({allFlattenedWorkers.length} Meal Line Items):
                    </td>
                    <td className="p-3 text-right font-mono text-sm text-[#a3e635]">
                      ₱{overallTotals.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2} className="p-3 text-xs text-slate-400 font-normal">
                      Reconciled against GCash disbursements
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODE 3: EXECUTIVE SUMMARY CARDS                                   */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'executive-cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {siteAggregations.map((agg) => {
            const percentSettled =
              agg.totalMealDeductions > 0
                ? Math.min(100, Math.round((agg.totalGcashSettled / agg.totalMealDeductions) * 100))
                : 100;

            return (
              <div
                key={agg.site.site_id}
                className="bg-[#0e1a16] border border-[#234338] hover:border-[#a3e635]/40 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded border border-[#a3e635]/30">
                        {agg.site.code}
                      </span>
                      <h4 className="text-base font-black text-white mt-1.5">{agg.site.name}</h4>
                      <p className="text-xs text-slate-400">{agg.site.location}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                          agg.netOutstandingBalance === 0
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {agg.netOutstandingBalance === 0 ? 'FULLY SETTLED' : 'PENDING GCASH'}
                      </span>
                    </div>
                  </div>

                  {/* Vendor Details */}
                  <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Concessionaire:</span>
                      <span className="font-bold text-white truncate max-w-[150px]">
                        {agg.site.canteen_vendor_name || 'Project Canteen'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>GCash Number:</span>
                      <span className="font-mono text-emerald-400">
                        {agg.site.canteen_gcash_number || '09171234567'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="bg-[#13241f]/60 rounded-lg p-2 border border-[#234338]/60">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Meals</div>
                      <div className="font-mono font-black text-xs text-white mt-0.5">
                        ₱{agg.totalMealDeductions.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="bg-[#13241f]/60 rounded-lg p-2 border border-[#234338]/60">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">GCash Paid</div>
                      <div className="font-mono font-black text-xs text-emerald-400 mt-0.5">
                        ₱{agg.totalGcashSettled.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="bg-[#13241f]/60 rounded-lg p-2 border border-[#234338]/60">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Due Balance</div>
                      <div className="font-mono font-black text-xs text-amber-400 mt-0.5">
                        ₱{agg.netOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {/* Settlement Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Settlement Progress</span>
                      <span className="font-mono font-bold text-white">{percentSettled}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#13241f] rounded-full overflow-hidden border border-[#234338]">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${percentSettled}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#234338]">
                  <button
                    onClick={() => setDrillDownSite(agg)}
                    className="flex-1 py-2 bg-[#13241f] hover:bg-[#1a3029] border border-[#234338] text-slate-200 hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#a3e635]" />
                    <span>Inspect Roster ({agg.workerCount})</span>
                  </button>

                  <button
                    onClick={() => handleOpenPayoutModal(agg.site, agg.netOutstandingBalance)}
                    className="py-2 px-3 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                    title="Pay Concessionaire"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Pay</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DRILL DOWN EMPLOYEE ROSTER MODAL (For Executive Cards Mode)       */}
      {/* ------------------------------------------------------------------ */}
      {drillDownSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#13241f] border-b border-[#234338] p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded border border-[#a3e635]/30">
                    {drillDownSite.site.code}
                  </span>
                  <h3 className="font-black text-base text-white">
                    {drillDownSite.site.name} &bull; Worker Meal Deductions
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Concessionaire: {drillDownSite.site.canteen_vendor_name || 'Project Canteen'} &bull; GCash: {drillDownSite.site.canteen_gcash_number || '09171234567'}
                </p>
              </div>

              <button
                onClick={() => setDrillDownSite(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Deductions</div>
                  <div className="font-mono font-black text-base text-white mt-0.5">
                    ₱{drillDownSite.totalMealDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">GCash Settled</div>
                  <div className="font-mono font-black text-base text-emerald-400 mt-0.5">
                    ₱{drillDownSite.totalGcashSettled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Due to Caterer</div>
                  <div className="font-mono font-black text-base text-amber-400 mt-0.5">
                    ₱{drillDownSite.netOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#234338] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="p-2.5">Worker ID</th>
                      <th className="p-2.5">Worker Name</th>
                      <th className="p-2.5">Trade</th>
                      <th className="p-2.5">Cycle Week</th>
                      <th className="p-2.5 text-right">Meal Deduction (₱)</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#234338]/40">
                    {drillDownSite.workers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No workers recorded for this site.
                        </td>
                      </tr>
                    ) : (
                      drillDownSite.workers.map((w) => (
                        <tr key={w.employee_id} className="hover:bg-[#13241f]/70">
                          <td className="p-2.5 font-mono font-bold text-[#a3e635]">{w.employee_id}</td>
                          <td className="p-2.5 font-bold text-white">{w.name}</td>
                          <td className="p-2.5 text-slate-300">{w.position}</td>
                          <td className="p-2.5 font-mono text-slate-400">{w.week_key}</td>
                          <td className="p-2.5 text-right font-mono font-black text-white">₱{w.amount.toFixed(2)}</td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                w.settlement_status === 'GCash Settled'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {w.settlement_status}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-400 text-[11px]">{w.settlement_reference}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#13241f] border-t border-[#234338] p-4 flex items-center justify-between">
              <button
                onClick={() => setDrillDownSite(null)}
                className="px-4 py-2 bg-[#0e1a16] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const s = drillDownSite.site;
                  const amt = drillDownSite.netOutstandingBalance;
                  setDrillDownSite(null);
                  handleOpenPayoutModal(s, amt);
                }}
                className="px-4 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Settle via GCash (₱{drillDownSite.netOutstandingBalance.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DIRECT GCASH PAYOUT MODAL TRIGGERED FROM REPORTS VIEW              */}
      {/* ------------------------------------------------------------------ */}
      {isPayoutModalOpen && payoutModalSite && (
        <CanteenGcashPayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => {
            setIsPayoutModalOpen(false);
            setPayoutModalSite(null);
          }}
          site={payoutModalSite}
          defaultAmount={payoutDefaultAmount}
          weekKey={weekFilter === 'ALL' ? '2026-W41' : weekFilter}
          onSuccess={() => {
            setIsPayoutModalOpen(false);
            setPayoutModalSite(null);
          }}
        />
      )}
    </div>
  );
};
