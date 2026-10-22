import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';

export interface EmployeesPayoutSummaryDashboardProps {
  selectedSiteFilter: string;
  onSelectSiteFilter: (siteId: string) => void;
  payoutStatusFilter: 'ALL' | 'PENDING' | 'RELEASED' | 'OVERDUE_48H';
  onSelectPayoutStatusFilter: (status: 'ALL' | 'PENDING' | 'RELEASED' | 'OVERDUE_48H') => void;
  onOpenPaymentHub?: () => void;
}

export const EmployeesPayoutSummaryDashboard: React.FC<EmployeesPayoutSummaryDashboardProps> = ({
  selectedSiteFilter,
  onSelectSiteFilter,
  payoutStatusFilter,
  onSelectPayoutStatusFilter,
}) => {
  const { employees, sites, paymentRecords, payroll } = useApp();

  const now = Date.now();

  // Aggregate stats per site for the 15 employees per site
  const { siteStats, enterpriseTotals } = useMemo(() => {
    const map: Record<
      string,
      {
        siteId: string;
        siteName: string;
        siteCode: string;
        totalEmployees: number;
        payoutPendingCount: number;
        payoutReleasedCount: number;
        payoutOverdue48hCount: number;
        pendingAmount: number;
        releasedAmount: number;
      }
    > = {};

    // Initialize all 4 official sites
    sites.forEach((s) => {
      map[s.site_id] = {
        siteId: s.site_id,
        siteName: s.name,
        siteCode: s.code,
        totalEmployees: 0,
        payoutPendingCount: 0,
        payoutReleasedCount: 0,
        payoutOverdue48hCount: 0,
        pendingAmount: 0,
        releasedAmount: 0,
      };
    });

    // Map each employee to their payout status
    employees.forEach((emp) => {
      const siteId = emp.site_id;
      if (!map[siteId]) {
        map[siteId] = {
          siteId,
          siteName: siteId,
          siteCode: siteId,
          totalEmployees: 0,
          payoutPendingCount: 0,
          payoutReleasedCount: 0,
          payoutOverdue48hCount: 0,
          pendingAmount: 0,
          releasedAmount: 0,
        };
      }

      map[siteId].totalEmployees += 1;

      // Find matching payment record
      const payRec = paymentRecords.find(
        (p) => p.recipient_id === emp.employee_id && p.module === 'WEEKLY_PAYROLL'
      );
      const payrollItem = payroll.find((pr) => pr.employee_id === emp.employee_id);

      const isReleased =
        payRec?.status === 'PAID_VERIFIED' ||
        payrollItem?.payment_status === 'Verified' ||
        payrollItem?.payment_status === 'Paid';

      const amount = payRec?.expected_amount || payrollItem?.net_pay || emp.daily_rate * 6 * 0.85;

      if (isReleased) {
        map[siteId].payoutReleasedCount += 1;
        map[siteId].releasedAmount += amount;
      } else {
        map[siteId].payoutPendingCount += 1;
        map[siteId].pendingAmount += amount;

        // Check if > 48h
        const createdTime = new Date(payRec?.created_at || payrollItem?.created_at || emp.created_at).getTime();
        const ageHours = Math.max(0, Math.floor((now - createdTime) / (1000 * 60 * 60)));
        if (ageHours >= 48) {
          map[siteId].payoutOverdue48hCount += 1;
        }
      }
    });

    const list = Object.values(map);

    const totals = list.reduce(
      (acc, s) => ({
        totalEmployees: acc.totalEmployees + s.totalEmployees,
        payoutPendingCount: acc.payoutPendingCount + s.payoutPendingCount,
        payoutReleasedCount: acc.payoutReleasedCount + s.payoutReleasedCount,
        payoutOverdue48hCount: acc.payoutOverdue48hCount + s.payoutOverdue48hCount,
        pendingAmount: acc.pendingAmount + s.pendingAmount,
        releasedAmount: acc.releasedAmount + s.releasedAmount,
      }),
      {
        totalEmployees: 0,
        payoutPendingCount: 0,
        payoutReleasedCount: 0,
        payoutOverdue48hCount: 0,
        pendingAmount: 0,
        releasedAmount: 0,
      }
    );

    return { siteStats: list, enterpriseTotals: totals };
  }, [employees, sites, paymentRecords, payroll, now]);

  const pendingPercentage = enterpriseTotals.totalEmployees > 0
    ? Math.round((enterpriseTotals.payoutPendingCount / enterpriseTotals.totalEmployees) * 100)
    : 0;

  const releasedPercentage = enterpriseTotals.totalEmployees > 0
    ? Math.round((enterpriseTotals.payoutReleasedCount / enterpriseTotals.totalEmployees) * 100)
    : 0;

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 shadow-xl space-y-5">
      {/* Dashboard Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#234338] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Workforce Payout Analytics
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-[#13241f] border border-[#234338]">
              {enterpriseTotals.totalEmployees} Personnel &bull; {sites.length} Sites
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
            <span>Visual Salary Payout Status Dashboard</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time breakdown of <span className="text-amber-400 font-semibold">Payout Pending</span> versus <span className="text-emerald-400 font-semibold">Payout Released</span> across all enterprise sites.
          </p>
        </div>

        {/* Enterprise Quick Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 bg-[#13241f] border border-amber-500/40 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Payout Pending</div>
              <div className="text-sm font-black font-mono text-amber-400">
                {enterpriseTotals.payoutPendingCount} / {enterpriseTotals.totalEmployees}
                <span className="text-[10px] font-normal text-slate-400 ml-1">
                  (₱{enterpriseTotals.pendingAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                </span>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-[#13241f] border border-emerald-500/40 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Payout Released</div>
              <div className="text-sm font-black font-mono text-emerald-400">
                {enterpriseTotals.payoutReleasedCount} / {enterpriseTotals.totalEmployees}
                <span className="text-[10px] font-normal text-slate-400 ml-1">
                  (₱{enterpriseTotals.releasedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Dual Status Visual Progress Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-amber-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            Payout Pending: {enterpriseTotals.payoutPendingCount} workers ({pendingPercentage}%)
          </span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            Payout Released: {enterpriseTotals.payoutReleasedCount} workers ({releasedPercentage}%)
          </span>
        </div>

        <div className="w-full h-3 bg-[#13241f] rounded-full overflow-hidden flex border border-[#234338]">
          <div
            style={{ width: `${pendingPercentage}%` }}
            className="h-full bg-linear-to-r from-amber-500 to-amber-400 transition-all duration-500"
            title={`Payout Pending: ${enterpriseTotals.payoutPendingCount} employees`}
          />
          <div
            style={{ width: `${releasedPercentage}%` }}
            className="h-full bg-linear-to-r from-emerald-500 to-[#a3e635] transition-all duration-500"
            title={`Payout Released: ${enterpriseTotals.payoutReleasedCount} employees`}
          />
        </div>
      </div>

      {/* Per-Site Breakdown */}
      {siteStats.length === 0 ? (
        <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-[#234338] rounded-xl">
          No project sites registered yet. Register your first site under Sites &amp; Projects to monitor location-based payroll status.
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {siteStats.map((site) => {
          const sitePendingPct = site.totalEmployees > 0
            ? Math.round((site.payoutPendingCount / site.totalEmployees) * 100)
            : 0;
          const siteReleasedPct = site.totalEmployees > 0
            ? Math.round((site.payoutReleasedCount / site.totalEmployees) * 100)
            : 0;
          const isSelected = selectedSiteFilter === site.siteId;

          return (
            <div
              key={site.siteId}
              onClick={() => onSelectSiteFilter(isSelected ? 'ALL' : site.siteId)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#13241f] border-[#a3e635] shadow-lg ring-1 ring-[#a3e635]'
                  : 'bg-[#0a1411] border-[#234338] hover:border-slate-500 hover:bg-[#0f1d18]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#a3e635] uppercase">
                    {site.siteCode}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {site.totalEmployees} Employees
                  </span>
                </div>

                <div className="font-bold text-xs text-white group-hover:text-[#a3e635] transition-colors truncate">
                  {site.siteName}
                </div>

                {/* Overdue Badge */}
                {site.payoutOverdue48hCount > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-md text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>{site.payoutOverdue48hCount} Pending &gt;48h</span>
                  </div>
                )}

                {/* Progress bar for this site */}
                <div className="mt-3 space-y-1">
                  <div className="w-full h-2 bg-[#13241f] rounded-full overflow-hidden flex border border-[#234338]">
                    <div
                      style={{ width: `${sitePendingPct}%` }}
                      className="h-full bg-amber-400 transition-all duration-300"
                    />
                    <div
                      style={{ width: `${siteReleasedPct}%` }}
                      className="h-full bg-emerald-400 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Detailed counts */}
                <div className="mt-3 pt-2 border-t border-[#234338]/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pending</span>
                    <span className="font-mono font-bold text-amber-400">
                      {site.payoutPendingCount} ({sitePendingPct}%)
                    </span>
                    <div className="text-[9px] text-slate-500 truncate">
                      ₱{site.pendingAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Released</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {site.payoutReleasedCount} ({siteReleasedPct}%)
                    </span>
                    <div className="text-[9px] text-slate-500 truncate">
                      ₱{site.releasedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-[#234338]/40">
                <span>{isSelected ? '✓ Filtered' : 'Click to filter'}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-[#a3e635]' : 'text-slate-500'}`} />
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Interactive Status Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#234338]">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-semibold uppercase">Filter Table By Status:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onSelectPayoutStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              payoutStatusFilter === 'ALL'
                ? 'bg-[#10b981] text-white shadow-xs'
                : 'bg-[#13241f] text-slate-300 hover:text-white border border-[#234338]'
            }`}
          >
            All Workers ({enterpriseTotals.totalEmployees})
          </button>

          <button
            onClick={() => onSelectPayoutStatusFilter('PENDING')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              payoutStatusFilter === 'PENDING'
                ? 'bg-amber-500 text-[#080f0d] shadow-xs'
                : 'bg-[#13241f] text-amber-300 hover:text-white border border-amber-500/30'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Payout Pending ({enterpriseTotals.payoutPendingCount})</span>
          </button>

          <button
            onClick={() => onSelectPayoutStatusFilter('RELEASED')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              payoutStatusFilter === 'RELEASED'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-[#13241f] text-emerald-300 hover:text-white border border-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Payout Released ({enterpriseTotals.payoutReleasedCount})</span>
          </button>

          <button
            onClick={() => onSelectPayoutStatusFilter('OVERDUE_48H')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              payoutStatusFilter === 'OVERDUE_48H'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-[#13241f] text-rose-300 hover:text-white border border-rose-500/40'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>&gt; 48h Overdue ({enterpriseTotals.payoutOverdue48hCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
