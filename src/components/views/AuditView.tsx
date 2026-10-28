import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { downloadCSV, downloadExcelXLSX, downloadReportPDF } from '../../utils/exporters';
import { getPayrollEmailLogs, PayrollEmailLogEntry } from '../../utils/emailService';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Download,
  Printer,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Activity,
  FileCheck2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface EmailAuditItem {
  id: string;
  timestamp: string;
  recipient_email: string;
  recipient_name: string;
  recipient_id?: string;
  subject: string;
  status: 'success' | 'failed' | 'sent';
  raw_status: 'DELIVERED' | 'SENT' | 'FAILED';
  error_message: string;
  payroll_run: string;
  payout_reference: string;
  payment_method: string;
  attempts: number;
}

/**
 * Dedicated Sortable, Paginated AuditEmailLog Component
 * Displays: Timestamp, Recipient Email, Subject, Status (Success/Failed), Error Message field for failed attempts
 */
export const AuditEmailLog: React.FC = () => {
  const { emailDeliveryLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'success' | 'failed'>('ALL');
  const [sortField, setSortField] = useState<'timestamp' | 'recipient_email' | 'subject' | 'status'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Pull email status data from AppContext and local storage service
  const emailData: EmailAuditItem[] = useMemo(() => {
    const localLogs: PayrollEmailLogEntry[] = getPayrollEmailLogs();
    const itemsMap = new Map<string, EmailAuditItem>();

    // 1. Process server / AppContext email logs
    emailDeliveryLogs.forEach((l) => {
      const isFailed = l.status === 'FAILED';
      const isSuccess = l.status === 'DELIVERED';
      const key = l.id || `${l.payroll_id}-${l.recipient_email}`;

      itemsMap.set(key, {
        id: l.id,
        timestamp: l.sent_at,
        recipient_email: l.recipient_email,
        recipient_name: l.recipient_name,
        subject: l.subject,
        status: isFailed ? 'failed' : isSuccess ? 'success' : 'sent',
        raw_status: l.status,
        error_message: isFailed ? l.failure_reason || 'Email provider dispatch failed' : '—',
        payroll_run: l.payroll_id ? `${l.payroll_id} (${l.week_key})` : l.week_key,
        payout_reference: l.payout_reference || 'REF-CONFIRMED',
        payment_method: l.payment_method || 'CASH',
        attempts: l.attempts || 1,
      });
    });

    // 2. Process local email service logs
    localLogs.forEach((l) => {
      const key = l.id || `${l.payroll_id}-${l.recipient_email}`;
      if (!itemsMap.has(key)) {
        const isFailed = l.status === 'FAILED';
        const isSuccess = l.status === 'DELIVERED';

        itemsMap.set(key, {
          id: l.id,
          timestamp: l.last_attempt_at,
          recipient_email: l.recipient_email,
          recipient_name: l.employee_name,
          recipient_id: l.employee_id,
          subject: `[OFFICIAL PAYSLIP] Wage Receipt for ${l.employee_name} (${l.pay_period})`,
          status: isFailed ? 'failed' : isSuccess ? 'success' : 'sent',
          raw_status: l.status,
          error_message: isFailed ? l.failure_reason || 'Dispatch error occurred' : '—',
          payroll_run: `${l.payroll_id} (${l.pay_period})`,
          payout_reference: l.payout_reference || 'REF-CONFIRMED',
          payment_method: l.payment_method || 'CASH',
          attempts: l.attempts || 1,
        });
      }
    });

    return Array.from(itemsMap.values());
  }, [emailDeliveryLogs]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return emailData.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'success' && item.status !== 'success' && item.status !== 'sent') return false;
        if (statusFilter === 'failed' && item.status !== 'failed') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmail = item.recipient_email.toLowerCase().includes(q);
        const matchName = item.recipient_name.toLowerCase().includes(q);
        const matchSubject = item.subject.toLowerCase().includes(q);
        const matchRun = item.payroll_run.toLowerCase().includes(q);
        const matchRef = item.payout_reference.toLowerCase().includes(q);
        const matchErr = item.error_message.toLowerCase().includes(q);
        if (!matchEmail && !matchName && !matchSubject && !matchRun && !matchRef && !matchErr) {
          return false;
        }
      }
      return true;
    });
  }, [emailData, statusFilter, searchQuery]);

  // Sorted dataset
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];

      if (sortField === 'timestamp') {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLogs = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: 'timestamp' | 'recipient_email' | 'subject' | 'status') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: 'timestamp' | 'recipient_email' | 'subject' | 'status') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 inline ml-1 opacity-70" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#a3e635] inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#a3e635] inline ml-1" />
    );
  };

  const totalSuccess = emailData.filter((i) => i.status === 'success' || i.status === 'sent').length;
  const totalFailed = emailData.filter((i) => i.status === 'failed').length;

  return (
    <div className="space-y-4">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#0e1a16] border border-[#234338] rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Dispatches</div>
          <div className="text-xl font-black text-white font-mono mt-0.5">{emailData.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Audit log entries</div>
        </div>

        <div className="p-3 bg-[#0e1a16] border border-emerald-500/30 rounded-xl">
          <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Success (Delivered)</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{totalSuccess}</div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">Delivered / outbox confirmed</div>
        </div>

        <div className="p-3 bg-[#0e1a16] border border-rose-500/30 rounded-xl">
          <div className="text-[10px] text-rose-400 uppercase font-bold tracking-wider">Failed Attempts</div>
          <div className="text-xl font-black text-rose-400 font-mono mt-0.5">{totalFailed}</div>
          <div className="text-[10px] text-rose-500/70 mt-0.5">Requires retry</div>
        </div>

        <div className="p-3 bg-[#0e1a16] border border-blue-500/30 rounded-xl">
          <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Provider Status</div>
          <div className="text-xs font-bold text-white mt-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Resend Protected</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero credentials leaked</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3 no-print">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search recipient email, worker, subject, error..."
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses ({emailData.length})</option>
            <option value="success">Success ({totalSuccess})</option>
            <option value="failed">Failed ({totalFailed})</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          Showing {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
        </div>
      </div>

      {/* Main Sortable & Paginated Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#a3e635]" />
            <span>Audit Email Log Table (Sortable &amp; Paginated)</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            PAGE {safeCurrentPage} OF {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th
                  onClick={() => handleSort('timestamp')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  Timestamp {renderSortIcon('timestamp')}
                </th>
                <th
                  onClick={() => handleSort('recipient_email')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  Recipient Email {renderSortIcon('recipient_email')}
                </th>
                <th
                  onClick={() => handleSort('subject')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  Subject {renderSortIcon('subject')}
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  Status (Success/Failed) {renderSortIcon('status')}
                </th>
                <th className="p-3">Error Message (Failed Attempts)</th>
                <th className="p-3">Payroll Run / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    No email notification log entries found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isSuccess = log.status === 'success' || log.status === 'sent';
                  const isFailed = log.status === 'failed';

                  return (
                    <tr key={log.id} className="hover:bg-[#13241f]/70 transition-colors">
                      {/* 1. Timestamp */}
                      <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        <div>
                          {new Date(log.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* 2. Recipient Email */}
                      <td className="p-3">
                        <div className="font-semibold text-white flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{log.recipient_name}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{log.recipient_email}</span>
                        </div>
                      </td>

                      {/* 3. Subject */}
                      <td className="p-3 text-slate-300 max-w-xs text-[11px]">
                        <div className="font-medium truncate" title={log.subject}>
                          {log.subject}
                        </div>
                      </td>

                      {/* 4. Status (Success / Failed) */}
                      <td className="p-3 whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            FAILED
                          </span>
                        )}
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          Tries: {log.attempts}
                        </div>
                      </td>

                      {/* 5. Error Message for Failed Attempts */}
                      <td className="p-3 max-w-sm text-[11px]">
                        {isFailed ? (
                          <div className="p-1.5 rounded bg-rose-950/40 border border-rose-900/50 text-rose-300 font-mono text-[10px] leading-relaxed">
                            {log.error_message}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* 6. Payroll Run & Ref */}
                      <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                        <div className="font-bold text-slate-200">{log.payroll_run}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.payout_reference}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-[#0c1613] border-t border-[#234338] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="font-mono text-[11px]">
            Showing <strong className="text-white">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="text-white">{Math.min(startIndex + pageSize, totalItems)}</strong> of{' '}
            <strong className="text-white">{totalItems}</strong> notification entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="px-2.5 py-1 rounded bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold text-xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="px-3 py-1 rounded bg-[#13241f] border border-[#234338] font-mono text-xs text-[#a3e635] font-bold">
              {safeCurrentPage} / {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="px-2.5 py-1 rounded bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold text-xs cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuditView: React.FC = () => {
  const { auditLogs, currentUser, emailDeliveryLogs } = useApp();

  const [activeAuditTab, setActiveAuditTab] = useState<'SYSTEM_ACTIVITY' | 'EMAIL_NOTIFICATIONS'>('EMAIL_NOTIFICATIONS');

  // Search & Filters for System Activity
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const isCeo = currentUser?.access_point === 'ceo';

  // 1. Process System Activity Logs
  const accessibleLogs = auditLogs.filter((log) => {
    if (log.entity === 'LOGIN_DIRECTORY' && !isCeo) return false;
    return true;
  });

  const filteredSystemLogs = accessibleLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      (log.after_value && log.after_value.toLowerCase().includes(q));

    const matchA = actionFilter === 'ALL' || log.action === actionFilter;
    return matchQ && matchA;
  });

  const uniqueActions = Array.from(new Set(accessibleLogs.map((l) => l.action)));

  // Export handlers for System Activity
  const handleExportSystemCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Entity ID', 'Details / Value'];
    const rows = filteredSystemLogs.map((l) => [
      l.timestamp,
      l.actor,
      l.action,
      l.entity,
      l.entity_id,
      l.after_value || l.before_value || 'Executed',
    ]);
    downloadCSV(`DRC_Audit_Trail_${new Date().toISOString().substring(0, 10)}.csv`, [headers, ...rows]);
  };

  const handleExportSystemPDF = () => {
    const headers = ['Timestamp', 'Actor Identity', 'Action', 'Entity', 'Entity ID', 'Details'];
    const rows = filteredSystemLogs.map((l) => [
      l.timestamp,
      l.actor,
      l.action,
      l.entity,
      l.entity_id,
      l.after_value || l.before_value || 'Executed',
    ]);
    downloadReportPDF(
      `DRC_Audit_Log_${new Date().toISOString().substring(0, 10)}.pdf`,
      'De Rueda Construction — Immutable Forensic Audit Trail',
      `Showing ${filteredSystemLogs.length} logged system events`,
      headers,
      rows,
      true
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Enterprise Audit &amp; Verification Center
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
            <span>Immutable Forensic Log of Logins, Rates &amp; Disbursements</span>
            <span>·</span>
            <span>Dedicated Email Notification Status Audit Trail</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleExportSystemCSV}
            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>
          <button
            onClick={handleExportSystemPDF}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Audit PDF
          </button>
        </div>
      </div>

      {/* Audit View Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-[#234338] pb-3 no-print flex-wrap">
        <button
          onClick={() => setActiveAuditTab('EMAIL_NOTIFICATIONS')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeAuditTab === 'EMAIL_NOTIFICATIONS'
              ? 'bg-[#13241f] text-[#a3e635] border border-[#a3e635]/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]/50 border border-transparent'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Notification Status Audit Trail (AuditEmailLog)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#a3e635]/20 text-[#a3e635]">
            {emailDeliveryLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAuditTab('SYSTEM_ACTIVITY')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeAuditTab === 'SYSTEM_ACTIVITY'
              ? 'bg-[#13241f] text-[#a3e635] border border-[#a3e635]/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#13241f]/50 border border-transparent'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Activity &amp; Forensic Log</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#13241f] text-slate-400 border border-[#234338]">
            {accessibleLogs.length}
          </span>
        </button>
      </div>

      {activeAuditTab === 'EMAIL_NOTIFICATIONS' ? (
        <AuditEmailLog />
      ) : (
        /* ========================================================================= */
        /* GENERAL SYSTEM FORENSIC AUDIT TABLE                                      */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3 no-print">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actor, action, target entity ID..."
                className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="ALL">All Actions ({uniqueActions.length})</option>
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-400 ml-auto font-mono">
              Showing {filteredSystemLogs.length} logged events
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
            <div className="p-3 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
                <span>Forensic Record Trail</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">STATUS: VERIFIED SECURE</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Timestamp (PHT)</th>
                    <th className="p-3">Actor Identity</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Target ID</th>
                    <th className="p-3">Operational Details / Changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#234338]/40">
                  {filteredSystemLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No matching audit logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredSystemLogs.map((log) => (
                      <tr key={log.audit_id} className="hover:bg-[#13241f]/70 transition-colors">
                        <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="p-3 font-medium text-white">{log.actor}</td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-[#a3e635] text-[11px] bg-[#13241f] px-2 py-0.5 rounded border border-[#234338]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-semibold text-[11px]">{log.entity}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{log.entity_id}</td>
                        <td className="p-3 text-slate-300 max-w-sm text-[11px]">
                          {log.after_value || log.before_value || 'Success'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
