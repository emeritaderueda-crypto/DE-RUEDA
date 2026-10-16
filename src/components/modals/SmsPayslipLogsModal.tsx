import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Shield,
  Send,
  Clock,
  ExternalLink,
  Edit2,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface SmsPayslipLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmsPayslipLogsModal: React.FC<SmsPayslipLogsModalProps> = ({ isOpen, onClose }) => {
  const { smsPayslipLogs, retrySmsPayslip, sendAutomaticSmsPayslip, payroll, employees } = useApp();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DELIVERED' | 'FAILED' | 'RETRY_QUEUED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSmsId, setEditingSmsId] = useState<string | null>(null);
  const [correctedMobile, setCorrectedMobile] = useState('');
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Test SMS State
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testPayrollId, setTestPayrollId] = useState(payroll[0]?.payroll_id || '');
  const [isSendingTest, setIsSendingTest] = useState(false);

  if (!isOpen) return null;

  const totalDelivered = smsPayslipLogs.filter((l) => l.status === 'DELIVERED').length;
  const totalFailed = smsPayslipLogs.filter((l) => l.status === 'FAILED').length;

  const filteredLogs = smsPayslipLogs.filter((log) => {
    if (filterStatus !== 'ALL' && log.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = log.employee_name.toLowerCase().includes(q);
      const matchMobile = log.mobile_number.includes(q);
      const matchRef = log.payout_ref.toLowerCase().includes(q);
      const matchWeek = log.week_key.toLowerCase().includes(q);
      const matchIdem = log.idempotency_key.toLowerCase().includes(q);
      if (!matchName && !matchMobile && !matchRef && !matchWeek && !matchIdem) return false;
    }
    return true;
  });

  const handleStartEdit = (id: string, currentMobile: string) => {
    setEditingSmsId(id);
    setCorrectedMobile(currentMobile);
  };

  const handleExecuteRetry = async (smsId: string) => {
    setIsRetrying(smsId);
    try {
      const res = await retrySmsPayslip(smsId, correctedMobile.trim() || undefined);
      setActionNotice(res.message);
      setEditingSmsId(null);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(err?.message || 'Retry failed');
    } finally {
      setIsRetrying(null);
    }
  };

  const handleSendTestSms = async () => {
    const pRecord = payroll.find((p) => p.payroll_id === testPayrollId);
    if (!pRecord) return;
    setIsSendingTest(true);
    try {
      const fakeRef = `GCASH-TEST-${Date.now().toString().slice(-6)}`;
      const res = await sendAutomaticSmsPayslip(pRecord, fakeRef);
      setActionNotice(res.message);
      setIsTestOpen(false);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(err?.message || 'Test dispatch failed');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in duration-150">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#234338] bg-[#0c1613] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                  Automated SMS Payslips & HR Exception Queue
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  TELCO VERIFIED
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  IDEMPOTENT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated SMS payslip delivery triggered strictly on confirmed GCash disbursement &bull; Audited delivery logs & exception retry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTestOpen(!isTestOpen)}
              className="px-3 py-1.5 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] text-xs text-[#a3e635] font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test Dispatch</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Test Dispatch Form Drawer */}
        {isTestOpen && (
          <div className="p-4 bg-[#11211b] border-b border-[#234338] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Simulate Automatic SMS Payslip Dispatch
              </span>
              <button onClick={() => setIsTestOpen(false)} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={testPayrollId}
                onChange={(e) => setTestPayrollId(e.target.value)}
                className="bg-[#080f0d] border border-[#234338] text-xs text-white rounded-lg px-3 py-2 flex-1 min-w-[220px]"
              >
                {payroll.map((p) => {
                  const emp = employees.find((e) => e.employee_id === p.employee_id);
                  return (
                    <option key={p.payroll_id} value={p.payroll_id}>
                      {emp?.name || p.employee_id} &bull; Net: ₱{p.net_pay.toLocaleString()} &bull; {p.week_key}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleSendTestSms}
                disabled={isSendingTest}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#10b981] text-[#080f0d] font-black text-xs uppercase rounded-lg hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Dispatching...' : 'Dispatch SMS'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {actionNotice && (
          <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Stat Badges Bar */}
        <div className="p-3 sm:p-4 bg-[#0e1a16] border-b border-[#234338] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 bg-[#13241f] border border-[#234338] rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Dispatched</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">{smsPayslipLogs.length}</div>
          </div>
          <div className="p-2.5 bg-[#13241f] border border-[#234338] rounded-xl">
            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Delivered (Success)</div>
            <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">{totalDelivered}</div>
          </div>
          <div className="p-2.5 bg-[#13241f] border border-[#234338] rounded-xl">
            <div className="text-[10px] text-rose-400 uppercase font-bold tracking-wider">HR Exception Queue</div>
            <div className="text-lg font-black text-rose-300 font-mono mt-0.5">{totalFailed}</div>
          </div>
          <div className="p-2.5 bg-[#13241f] border border-[#234338] rounded-xl">
            <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Idempotency Guard</div>
            <div className="text-xs font-bold text-blue-300 mt-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Zero Duplicates</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 border-b border-[#234338] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a1411]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white text-[#080f0d]'
                  : 'bg-[#13241f] text-slate-300 hover:text-white border border-[#234338]'
              }`}
            >
              All Logs ({smsPayslipLogs.length})
            </button>
            <button
              onClick={() => setFilterStatus('DELIVERED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === 'DELIVERED'
                  ? 'bg-emerald-500 text-[#080f0d]'
                  : 'bg-[#13241f] text-emerald-400 hover:text-white border border-[#234338]'
              }`}
            >
              Delivered ({totalDelivered})
            </button>
            <button
              onClick={() => setFilterStatus('FAILED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === 'FAILED'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#13241f] text-rose-400 hover:text-white border border-[#234338]'
              }`}
            >
              Exceptions / Failed ({totalFailed})
            </button>
          </div>

          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search worker, mobile, ref..."
              className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-white text-sm">No SMS Payslip Logs Found</div>
              <p className="text-slate-500 max-w-sm mx-auto">
                Automatic SMS payslips will appear here automatically when weekly employee wages are disbursed via GCash.
              </p>
            </div>
          ) : (
            <div className="border border-[#234338] rounded-xl overflow-hidden bg-[#0c1613]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#13241f] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-[#234338]">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Employee / Mobile</th>
                      <th className="p-3">Cycle & Site</th>
                      <th className="p-3">Financials</th>
                      <th className="p-3">Payout Ref / Idempotency</th>
                      <th className="p-3">SMS Content</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#234338]">
                    {filteredLogs.map((log) => {
                      const isFailed = log.status === 'FAILED';
                      const isEditing = editingSmsId === log.id;

                      return (
                        <tr key={log.id} className="hover:bg-[#13241f]/50 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            {log.status === 'DELIVERED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                DELIVERED
                              </span>
                            ) : log.status === 'FAILED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                EXCEPTION
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3 text-amber-400" />
                                {log.status}
                              </span>
                            )}
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-white">{log.employee_name}</div>
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="text"
                                  value={correctedMobile}
                                  onChange={(e) => setCorrectedMobile(e.target.value)}
                                  placeholder="+639XXXXXXXXX"
                                  className="px-2 py-1 bg-[#080f0d] border border-amber-500 text-white font-mono text-xs rounded w-36"
                                />
                                <button
                                  onClick={() => handleExecuteRetry(log.id)}
                                  disabled={isRetrying === log.id}
                                  className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] rounded cursor-pointer"
                                >
                                  {isRetrying === log.id ? 'Sending...' : 'Retry'}
                                </button>
                                <button
                                  onClick={() => setEditingSmsId(null)}
                                  className="px-1.5 py-1 text-slate-400 hover:text-white text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{log.mobile_number}</span>
                              </div>
                            )}
                            {log.failure_reason && (
                              <div className="text-[10px] text-rose-400 mt-1 max-w-xs leading-tight">
                                {log.failure_reason}
                              </div>
                            )}
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-300">{log.week_key}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{log.site_id}</div>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-emerald-400">₱{log.net_pay.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Gross: ₱{log.gross_pay.toLocaleString()} &bull; Ded: ₱{log.deductions_total.toLocaleString()}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-mono text-[11px] text-slate-300 font-bold">{log.payout_ref}</div>
                            <div className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]" title={log.idempotency_key}>
                              {log.idempotency_key}
                            </div>
                          </td>

                          <td className="p-3 max-w-xs">
                            <p className="text-[10px] text-slate-400 line-clamp-2 font-mono leading-tight bg-[#080f0d] p-1.5 rounded border border-[#234338]/60">
                              {log.sms_body}
                            </p>
                          </td>

                          <td className="p-3 text-right whitespace-nowrap">
                            {isFailed && !isEditing && (
                              <button
                                onClick={() => handleStartEdit(log.id, log.mobile_number)}
                                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Fix & Retry</span>
                              </button>
                            )}
                            {!isFailed && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Provider: {log.provider_ref}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-[#0a1411] border-t border-[#234338] flex items-center justify-between text-xs text-slate-400">
          <span>Official Telco Provider: Smart Communications / Globe Enterprise Gateway</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#13241f] border border-[#234338] hover:border-slate-400 text-white rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
