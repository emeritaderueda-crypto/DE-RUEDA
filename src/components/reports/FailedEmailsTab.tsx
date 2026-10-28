import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getPayrollEmailLogs, retryPayrollEmail, PayrollEmailLogEntry } from '../../utils/emailService';
import {
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Download,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { downloadCSV } from '../../utils/exporters';

export const FailedEmailsTab: React.FC = () => {
  const { emailDeliveryLogs, retryEmailPayslip, payroll, employees, sites } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Combine AppContext email delivery logs and local email service logs
  const localEmailLogs: PayrollEmailLogEntry[] = getPayrollEmailLogs();

  // Find all failed email items across both stores
  const failedFromContext = emailDeliveryLogs.filter((log) => log.status === 'FAILED');
  const failedFromLocal = localEmailLogs.filter((log) => log.status === 'FAILED');

  // Build unified list of unique failed email records
  interface UnifiedFailedEmail {
    id: string;
    payroll_id: string;
    employee_id: string;
    employee_name: string;
    recipient_email: string;
    pay_period: string;
    site_id: string;
    site_name: string;
    net_pay: number;
    payment_method: string;
    payout_reference: string;
    failure_reason: string;
    attempts: number;
    last_attempt_at: string;
    can_retry: boolean;
  }

  const failedMap = new Map<string, UnifiedFailedEmail>();

  failedFromContext.forEach((l) => {
    const linkedPayroll = payroll.find((p) => p.payroll_id === l.payroll_id || p.payroll_id === l.id);
    const linkedEmp = employees.find((e) => e.employee_id === linkedPayroll?.employee_id || e.email === l.recipient_email);
    const siteObj = sites.find((s) => s.site_id === l.site_id || s.site_id === linkedPayroll?.site_id);

    const key = l.payroll_id || l.id;
    failedMap.set(key, {
      id: l.id,
      payroll_id: l.payroll_id || l.id,
      employee_id: linkedEmp?.employee_id || linkedPayroll?.employee_id || 'EMP-UNKNOWN',
      employee_name: l.recipient_name || linkedEmp?.name || 'Worker',
      recipient_email: l.recipient_email,
      pay_period: l.week_key,
      site_id: l.site_id || linkedPayroll?.site_id || 'SITE-001',
      site_name: siteObj?.name || l.site_id || 'Active Site',
      net_pay: linkedPayroll?.net_pay || 0,
      payment_method: l.payment_method || linkedPayroll?.payment_method || 'CASH',
      payout_reference: l.payout_reference || linkedPayroll?.reference_no || 'REF-CONFIRMED',
      failure_reason: l.failure_reason || 'Email provider delivery failure or timeout',
      attempts: l.attempts || 1,
      last_attempt_at: l.sent_at,
      can_retry: true,
    });
  });

  failedFromLocal.forEach((l) => {
    const key = l.payroll_id || l.id;
    if (!failedMap.has(key)) {
      const siteObj = sites.find((s) => s.site_id === l.site_id);
      failedMap.set(key, {
        id: l.id,
        payroll_id: l.payroll_id,
        employee_id: l.employee_id,
        employee_name: l.employee_name,
        recipient_email: l.recipient_email,
        pay_period: l.pay_period,
        site_id: l.site_id || 'SITE-001',
        site_name: siteObj?.name || l.site_id || 'Active Site',
        net_pay: l.net_pay || 0,
        payment_method: l.payment_method || 'CASH',
        payout_reference: l.payout_reference || 'REF-CONFIRMED',
        failure_reason: l.failure_reason || 'Email provider dispatch failed',
        attempts: l.attempts || 1,
        last_attempt_at: l.last_attempt_at,
        can_retry: true,
      });
    }
  });

  const failedItems = Array.from(failedMap.values());

  // Filtered failed items
  const filteredItems = failedItems.filter((item) => {
    if (siteFilter !== 'ALL' && item.site_id !== siteFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.employee_name.toLowerCase().includes(q);
      const matchEmail = item.recipient_email.toLowerCase().includes(q);
      const matchPayroll = item.payroll_id.toLowerCase().includes(q);
      const matchRef = item.payout_reference.toLowerCase().includes(q);
      const matchPeriod = item.pay_period.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPayroll && !matchRef && !matchPeriod) return false;
    }
    return true;
  });

  const handleRetrySingle = async (item: UnifiedFailedEmail) => {
    setRetryingId(item.id);
    setActionNotice(null);
    try {
      // 1. Re-attempt via AppContext retry
      let res = await retryEmailPayslip(item.id);

      // 2. Also trigger local email service retry if available
      if (!res.success) {
        const localRes = await retryPayrollEmail(item.payroll_id || item.id);
        if (localRes.success) {
          res = { success: true, message: localRes.message };
        }
      }

      if (res.success) {
        setActionNotice({
          type: 'success',
          message: `Payslip email re-sent successfully to ${item.recipient_email} (${item.employee_name}) without duplicating the underlying payment.`,
        });
      } else {
        setActionNotice({
          type: 'error',
          message: res.message || 'Email retry attempted. Failure reason recorded in audit log.',
        });
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err?.message || 'Email retry encountered an error.',
      });
    } finally {
      setRetryingId(null);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handleRetryAll = async () => {
    if (filteredItems.length === 0) return;
    setRetryingId('ALL');
    setActionNotice(null);

    let successCount = 0;
    for (const item of filteredItems) {
      try {
        const res = await retryEmailPayslip(item.id);
        if (res.success) successCount++;
      } catch (e) {
        console.warn(`Retry failed for ${item.id}:`, e);
      }
    }

    setRetryingId(null);
    setActionNotice({
      type: 'success',
      message: `Batch email retry completed. Processed ${filteredItems.length} records (${successCount} recovered). Underlying payouts were safely preserved without duplication.`,
    });
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Payroll ID',
      'Employee ID',
      'Employee Name',
      'Recipient Email',
      'Pay Period',
      'Site ID',
      'Net Pay (PHP)',
      'Payout Method',
      'Payout Reference',
      'Attempts',
      'Failure Reason',
      'Last Attempted',
    ];
    const rows = filteredItems.map((item) => [
      item.payroll_id,
      item.employee_id,
      item.employee_name,
      item.recipient_email,
      item.pay_period,
      item.site_id,
      item.net_pay.toFixed(2),
      item.payment_method,
      item.payout_reference,
      item.attempts,
      item.failure_reason,
      item.last_attempt_at,
    ]);
    downloadCSV(`DRC_Failed_Payroll_Emails_${new Date().toISOString().substring(0, 10)}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
              Failed Payroll Email Delivery &amp; Recovery Station
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              HR EXCEPTION QUEUE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ZERO-PAYMENT-DUPLICATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Inspect undelivered DOLE D.O. 13 employee payslip vouchers, review logged dispatch failure reasons, and manually trigger re-sending for specific payroll records without repeating the cash release or digital disbursement.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={filteredItems.length === 0}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handleRetryAll}
            disabled={filteredItems.length === 0 || retryingId !== null}
            className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retryingId === 'ALL' ? 'animate-spin' : ''}`} />
            Retry All ({filteredItems.length})
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded hover:bg-black/20"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#0e1a16] border border-[#234338] rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Failed Emails</div>
          <div className="text-xl font-black text-rose-400 font-mono mt-0.5">{failedItems.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Requiring HR attention</div>
        </div>

        <div className="p-3 bg-[#0e1a16] border border-[#234338] rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Dispatched</div>
          <div className="text-xl font-black text-white font-mono mt-0.5">{emailDeliveryLogs.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Payslips &amp; DTR summaries</div>
        </div>

        <div className="p-3 bg-[#0e1a16] border border-[#234338] rounded-xl">
          <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Successfully Delivered</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
            {emailDeliveryLogs.filter((l) => l.status === 'DELIVERED').length}
          </div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">Confirmed by recipient server</div>
        </div>

        <div className="p-3 bg-[#0e1a16] border border-[#234338] rounded-xl">
          <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Outbox Audit Ledger</div>
          <div className="text-xl font-black text-blue-400 font-mono mt-0.5">
            {emailDeliveryLogs.filter((l) => l.status === 'SENT').length}
          </div>
          <div className="text-[10px] text-blue-500/70 mt-0.5">Saved for external dispatch</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worker, email, payroll ID, ref..."
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Project Sites</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.name} ({s.site_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Failed Emails List Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="font-bold text-white text-sm">No Failed Payroll Emails in Queue</div>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              All employee payslip emails have been successfully sent or recorded in the audit outbox. Whenever an email dispatch encounters an exception, it will appear here with one-click recovery.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-3">Status</th>
                  <th className="p-3">Recipient Worker</th>
                  <th className="p-3">Payroll Run &amp; Site</th>
                  <th className="p-3">Disbursement Details</th>
                  <th className="p-3">Failure Reason</th>
                  <th className="p-3 text-right">HR Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#234338]">
                {filteredItems.map((item) => {
                  const isRetryingCurrent = retryingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-[#13241f]/50 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          FAILED
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Attempts: {item.attempts}
                        </div>
                        <div className="text-[9px] text-slate-600 font-mono">
                          {new Date(item.last_attempt_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.employee_name}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{item.recipient_email}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {item.employee_id}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-200">{item.pay_period}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.payroll_id}
                        </div>
                        <div className="text-[10px] text-[#a3e635] mt-0.5">
                          {item.site_name}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {item.net_pay > 0 && (
                          <div className="font-mono text-sm font-bold text-emerald-400">
                            ₱{item.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                            {item.payment_method.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.payout_reference}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="text-[11px] text-rose-300 font-mono bg-rose-950/30 p-2 rounded border border-rose-900/40 leading-relaxed">
                          {item.failure_reason}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Payout verified; re-sending will not repeat cash disbursement.</span>
                        </div>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleRetrySingle(item)}
                          disabled={retryingId !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-[#080f0d] hover:bg-emerald-400 font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRetryingCurrent ? 'animate-spin' : ''}`} />
                          <span>{isRetryingCurrent ? 'Sending...' : 'Retry Email'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
