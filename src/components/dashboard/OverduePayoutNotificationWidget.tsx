import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../layout/Sidebar';
import { PaymentRecord } from '../../types';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
  Search,
  Filter,
  Flame,
  Send,
} from 'lucide-react';

interface OverduePayoutNotificationWidgetProps {
  onNavigate: (page: PageId) => void;
}

export const OverduePayoutNotificationWidget: React.FC<OverduePayoutNotificationWidgetProps> = ({
  onNavigate,
}) => {
  const { paymentRecords, sites, employees, addAuditLog, currentUser } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [escalationNotice, setEscalationNotice] = useState<string | null>(null);

  // Reference now
  const now = Date.now();

  // Identify all records awaiting payout and flag those > 48 hours
  const { overdueRecords, totalOverdueAmount, siteBreakdown, allAwaitingRecords } = useMemo(() => {
    const overdue: Array<{ record: PaymentRecord; ageHours: number; employeeName: string; employeeTrade: string; photoUrl?: string }> = [];
    const awaiting: PaymentRecord[] = [];
    const siteMap: Record<string, { siteId: string; siteName: string; count: number; amount: number }> = {};

    // Initialize sites in breakdown
    sites.forEach((s) => {
      siteMap[s.site_id] = { siteId: s.site_id, siteName: s.name, count: 0, amount: 0 };
    });

    for (const rec of paymentRecords) {
      if (rec.status === 'AWAITING_PAYMENT') {
        awaiting.push(rec);

        const createdTime = new Date(rec.created_at || rec.approved_at || Date.now()).getTime();
        const ageHours = Math.max(0, Math.floor((now - createdTime) / (1000 * 60 * 60)));

        // Flag if > 48 hours (or default to 48h threshold)
        if (ageHours >= 48) {
          const emp = employees.find((e) => e.employee_id === rec.recipient_id);
          overdue.push({
            record: rec,
            ageHours,
            employeeName: rec.recipient_name,
            employeeTrade: emp?.position || 'Construction Personnel',
            photoUrl: emp?.photo_url,
          });

          if (siteMap[rec.site_id]) {
            siteMap[rec.site_id].count += 1;
            siteMap[rec.site_id].amount += rec.expected_amount;
          } else {
            siteMap[rec.site_id] = {
              siteId: rec.site_id,
              siteName: rec.site_name || rec.site_id,
              count: 1,
              amount: rec.expected_amount,
            };
          }
        }
      }
    }

    // Sort by longest waiting time first
    overdue.sort((a, b) => b.ageHours - a.ageHours);

    const totalAmount = overdue.reduce((sum, item) => sum + item.record.expected_amount, 0);

    return {
      overdueRecords: overdue,
      totalOverdueAmount: totalAmount,
      siteBreakdown: Object.values(siteMap),
      allAwaitingRecords: awaiting,
    };
  }, [paymentRecords, employees, sites, now]);

  // Filtered overdue list based on search and site tabs
  const filteredOverdue = useMemo(() => {
    return overdueRecords.filter((item) => {
      const matchSite = selectedSiteFilter === 'ALL' || item.record.site_id === selectedSiteFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.employeeName.toLowerCase().includes(q) ||
        item.record.recipient_id.toLowerCase().includes(q) ||
        item.employeeTrade.toLowerCase().includes(q) ||
        item.record.id.toLowerCase().includes(q);
      return matchSite && matchQuery;
    });
  }, [overdueRecords, selectedSiteFilter, searchQuery]);

  const handleEscalateNotification = () => {
    addAuditLog(
      'ESCALATE_OVERDUE_PAYOUT_ALERT',
      'PAYMENT_DISBURSEMENT',
      'ALERT_48H',
      `Executive disbursement escalation alert triggered for ${overdueRecords.length} workers with salary awaiting release >48 hours.`
    );
    setEscalationNotice(`Disbursement escalation notice dispatched to Finance & HR Lead for ${overdueRecords.length} flagged workers.`);
    setTimeout(() => setEscalationNotice(null), 4000);
  };

  // If there are no overdue records, show compliant status
  if (overdueRecords.length === 0) {
    return null;
  }

  return (
    <div className="bg-linear-to-r from-amber-950/40 via-[#13241f] to-rose-950/40 border-2 border-amber-500/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
      {/* Background Accent Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                DOLE D.O. 13 Alert
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                &gt; 48 Hours Overdue
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
              <span>Critical Salary Release Alert:</span>
              <span className="text-amber-400 font-mono">{overdueRecords.length} Workers Flagged</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Verified wages approved but awaiting release for over 48 hours across operational sites. Immediate disbursement required.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEscalateNotification}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Dispatch emergency notification to Site Supervisors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Escalate Alert</span>
          </button>

          <button
            onClick={() => onNavigate('ceo_gcash')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Resolve in Payments Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white bg-[#0e1a16] border border-[#234338] rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Alert Drawer' : 'Expand Alert Drawer'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {escalationNotice && (
        <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{escalationNotice}</span>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0b1613] border border-[#234338] rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Overdue Payout</span>
              <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                ₱{totalOverdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500">Across {overdueRecords.length} employee vouchers</span>
            </div>

            <div className="bg-[#0b1613] border border-[#234338] rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Maximum Waiting Time</span>
              <div className="text-xl font-black font-mono text-rose-400 mt-0.5">
                {overdueRecords[0]?.ageHours || 48} Hours
              </div>
              <span className="text-[10px] text-slate-500">Exceeds standard 48h limit</span>
            </div>

            <div className="bg-[#0b1613] border border-[#234338] rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pending Release</span>
              <div className="text-xl font-black font-mono text-white mt-0.5">
                {overdueRecords.length} / {allAwaitingRecords.length}
              </div>
              <span className="text-[10px] text-amber-400/90 font-medium">100% of current awaiting batch</span>
            </div>

            <div className="bg-[#0b1613] border border-[#234338] rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Affected Sites</span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                {siteBreakdown.filter((s) => s.count > 0).length} Sites
              </div>
              <span className="text-[10px] text-slate-500">All 4 enterprise operations</span>
            </div>
          </div>

          {/* Interactive Site Tabs & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1411] p-2 rounded-xl border border-[#234338]">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedSiteFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSiteFilter === 'ALL'
                    ? 'bg-amber-500 text-[#080f0d] shadow-xs'
                    : 'bg-[#13241f] text-slate-300 hover:text-white'
                }`}
              >
                All Sites ({overdueRecords.length})
              </button>

              {siteBreakdown.map((sb) => (
                <button
                  key={sb.siteId}
                  onClick={() => setSelectedSiteFilter(sb.siteId)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedSiteFilter === sb.siteId
                      ? 'bg-amber-500 text-[#080f0d] font-bold shadow-xs'
                      : 'bg-[#13241f] text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{sb.siteId}</span>
                  <span className="px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono">
                    {sb.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flagged worker..."
                className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Overdue Workers Grid (Scrollable) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredOverdue.map(({ record, ageHours, employeeName, employeeTrade, photoUrl }) => (
              <div
                key={record.id}
                className="bg-[#0e1a16] border border-amber-500/40 hover:border-amber-400 rounded-xl p-3.5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                        alt={employeeName}
                        className="w-9 h-9 rounded-full object-cover border border-[#234338] shrink-0"
                      />
                      <div>
                        <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                          {employeeName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {employeeTrade}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      {ageHours}h Overdue
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-[#234338]/60">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {record.site_id} &bull; {record.recipient_id}
                    </span>
                    <span className="font-mono font-black text-amber-300">
                      ₱{record.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {record.period_reference}
                  </span>
                  <button
                    onClick={() => onNavigate('ceo_gcash')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Release Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
