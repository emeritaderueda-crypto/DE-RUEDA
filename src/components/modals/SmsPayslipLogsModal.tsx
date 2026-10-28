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
  Mail,
  Shield,
  Send,
  Clock,
  ExternalLink,
  Edit2,
  Check,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface SmsPayslipLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmsPayslipLogsModal: React.FC<SmsPayslipLogsModalProps> = ({ isOpen, onClose }) => {
  const {
    smsPayslipLogs,
    retrySmsPayslip,
    emailDeliveryLogs,
    retryEmailPayslip,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DELIVERED' | 'FAILED' | 'SENT' | 'RETRY_QUEUED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSmsId, setEditingSmsId] = useState<string | null>(null);
  const [correctedMobile, setCorrectedMobile] = useState('');
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // SMS Stats
  const totalSmsDelivered = smsPayslipLogs.filter((l) => l.status === 'DELIVERED').length;
  const totalSmsFailed = smsPayslipLogs.filter((l) => l.status === 'FAILED').length;

  // Email Stats
  const totalEmailDelivered = emailDeliveryLogs.filter((l) => l.status === 'DELIVERED').length;
  const totalEmailFailed = emailDeliveryLogs.filter((l) => l.status === 'FAILED').length;
  const totalEmailSent = emailDeliveryLogs.filter((l) => l.status === 'SENT').length;

  // Filtered SMS logs
  const filteredSmsLogs = smsPayslipLogs.filter((log) => {
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

  // Filtered Email logs
  const filteredEmailLogs = emailDeliveryLogs.filter((log) => {
    if (filterStatus !== 'ALL' && log.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (log.recipient_name || '').toLowerCase().includes(q);
      const matchEmail = (log.recipient_email || '').toLowerCase().includes(q);
      const matchSubject = (log.subject || '').toLowerCase().includes(q);
      const matchWeek = (log.week_key || '').toLowerCase().includes(q);
      const matchRef = (log.payout_reference || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchSubject && !matchWeek && !matchRef) return false;
    }
    return true;
  });

  const handleStartEdit = (id: string, currentMobile: string) => {
    setEditingSmsId(id);
    setCorrectedMobile(currentMobile);
  };

  const handleExecuteSmsRetry = async (smsId: string) => {
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

  const handleExecuteEmailRetry = async (emailId: string) => {
    setIsRetrying(emailId);
    try {
      const res = await retryEmailPayslip(emailId);
      setActionNotice(res.message || 'Email retry initiated.');
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(err?.message || 'Email retry failed.');
    } finally {
      setIsRetrying(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in duration-150">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#234338] bg-[#0c1613] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              {activeTab === 'EMAIL' ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                  Audited Payslip &amp; Wage Notification Hub
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  DISBURSEMENT-CONFIRMED ONLY
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  RESEND SERVICE SUPPORTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official payslips are dispatched via Email only after cash payout or electronic disbursement confirmation. Retries do not duplicate payouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Tab Navigation */}
        <div className="px-4 py-2.5 bg-[#0a1411] border-b border-[#234338] flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('EMAIL'); setFilterStatus('ALL'); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'EMAIL'
                  ? 'bg-emerald-500 text-[#0a1411] shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Payslips &amp; DTR (Resend)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
                {emailDeliveryLogs.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('SMS'); setFilterStatus('ALL'); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'SMS'
                  ? 'bg-emerald-500 text-[#0a1411] shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#13241f]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SMS Outbox (Legacy)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
                {smsPayslipLogs.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Zero-Duplicate Payout Protection</span>
          </div>
        </div>

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
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {activeTab === 'EMAIL' ? emailDeliveryLogs.length : smsPayslipLogs.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {activeTab === 'EMAIL' ? 'Payslip & DTR vouchers' : 'Transactional SMS jobs'}
            </div>
          </div>

          <div className="p-2.5 bg-[#13241f] border border-emerald-500/30 rounded-xl">
            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Delivered</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              {activeTab === 'EMAIL' ? totalEmailDelivered : totalSmsDelivered}
            </div>
            <div className="text-[10px] text-emerald-500/70 mt-0.5">Recipient confirmed</div>
          </div>

          <div className="p-2.5 bg-[#13241f] border border-blue-500/30 rounded-xl">
            <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">
              {activeTab === 'EMAIL' ? 'Sent (Audit Ledger)' : 'Processing'}
            </div>
            <div className="text-lg font-black text-blue-400 font-mono mt-0.5">
              {activeTab === 'EMAIL' ? totalEmailSent : smsPayslipLogs.filter((l) => l.status === 'SENT').length}
            </div>
            <div className="text-[10px] text-blue-500/70 mt-0.5">Recorded in outbox</div>
          </div>

          <div className="p-2.5 bg-[#13241f] border border-rose-500/30 rounded-xl">
            <div className="text-[10px] text-rose-400 uppercase font-bold tracking-wider">Failed / Retry Pending</div>
            <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
              {activeTab === 'EMAIL' ? totalEmailFailed : totalSmsFailed}
            </div>
            <div className="text-[10px] text-rose-500/70 mt-0.5">Can retry without payout duplication</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 sm:p-4 bg-[#0c1613] border-b border-[#234338] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-[#13241f] p-1 rounded-lg border border-[#234338]">
              {(['ALL', 'DELIVERED', 'FAILED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st as any)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-emerald-500 text-[#0c1613]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'EMAIL' ? "Search recipient, email, ref..." : "Search worker, mobile, ref..."}
              className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'EMAIL' ? (
            /* EMAIL LOGS VIEW */
            filteredEmailLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-white text-sm">No Payslip Email Records Found</div>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Automated payslip emails appear here automatically whenever employee cash payouts or disbursements are confirmed.
                </p>
              </div>
            ) : (
              <div className="border border-[#234338] rounded-xl overflow-hidden bg-[#0c1613]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#13241f] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-[#234338]">
                      <tr>
                        <th className="p-3">Status</th>
                        <th className="p-3">Recipient Employee</th>
                        <th className="p-3">Pay Period &amp; Site</th>
                        <th className="p-3">Payout Ref &amp; Method</th>
                        <th className="p-3">Delivery Notes / Reason</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#234338]">
                      {filteredEmailLogs.map((log) => {
                        const isDelivered = log.status === 'DELIVERED';
                        const isFailed = log.status === 'FAILED';

                        return (
                          <tr key={log.id} className="hover:bg-[#13241f]/50 transition-colors">
                            <td className="p-3 whitespace-nowrap">
                              {isDelivered ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  DELIVERED
                                </span>
                              ) : isFailed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  FAILED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  <Clock className="w-3 h-3 text-blue-400" />
                                  SENT (AUDIT)
                                </span>
                              )}
                              <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Tries: {log.attempts || 1}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="font-bold text-white text-sm">{log.recipient_name}</div>
                              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {log.recipient_email}
                              </div>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-300">{log.week_key}</div>
                              <div className="text-[10px] text-slate-500 font-mono">Site: {log.site_id}</div>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <div className="font-mono text-xs font-bold text-slate-200">
                                {log.payout_reference || 'REF-CONFIRMED'}
                              </div>
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                                {log.payment_method || 'CASH'}
                              </span>
                            </td>

                            <td className="p-3 text-[11px] max-w-xs">
                              {log.failure_reason ? (
                                <span className="text-rose-400/90 font-mono text-[10px]">
                                  {log.failure_reason}
                                </span>
                              ) : isDelivered ? (
                                <span className="text-emerald-400/90">
                                  Dispatched via Resend REST API to {log.recipient_email}
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  Recorded in audit ledger (live external dispatch pending API key)
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleExecuteEmailRetry(log.id)}
                                disabled={isRetrying === log.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#13241f] border border-[#234338] text-emerald-300 hover:text-white hover:border-emerald-500/50 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`w-3 h-3 ${isRetrying === log.id ? 'animate-spin' : ''}`} />
                                <span>Retry Email</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* SMS LOGS VIEW (LEGACY) */
            filteredSmsLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-white text-sm">No SMS Payslip Logs Found</div>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Legacy SMS notifications will appear here if triggered.
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
                        <th className="p-3">Cycle &amp; Site</th>
                        <th className="p-3">Financials</th>
                        <th className="p-3">Payout Ref / Idempotency</th>
                        <th className="p-3">SMS Content</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#234338]">
                      {filteredSmsLogs.map((log) => {
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
                              <div className="font-bold text-white text-sm">{log.employee_name}</div>
                              {isEditing ? (
                                <div className="flex items-center gap-1 mt-1">
                                  <input
                                    type="text"
                                    value={correctedMobile}
                                    onChange={(e) => setCorrectedMobile(e.target.value)}
                                    placeholder="+639..."
                                    className="bg-black/50 border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs text-white font-mono w-28 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleExecuteSmsRetry(log.id)}
                                    className="p-1 rounded bg-emerald-500 text-black hover:bg-emerald-400"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSmsId(null)}
                                    className="p-1 rounded bg-slate-700 text-white hover:bg-slate-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                                  <Phone className="w-3 h-3 text-emerald-400" />
                                  <span>{log.mobile_number}</span>
                                  {isFailed && (
                                    <button
                                      onClick={() => handleStartEdit(log.id, log.mobile_number)}
                                      className="text-slate-500 hover:text-white p-0.5 ml-1"
                                      title="Edit number before retry"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-300">{log.week_key}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{log.site_id}</div>
                            </td>

                            <td className="p-3 whitespace-nowrap font-mono">
                              <div className="font-bold text-emerald-400">₱{log.net_pay.toLocaleString()}</div>
                              <div className="text-[10px] text-slate-500">Gross: ₱{log.gross_pay.toLocaleString()}</div>
                            </td>

                            <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                              <div className="text-slate-300 font-bold">{log.payout_ref}</div>
                              <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{log.idempotency_key}</div>
                            </td>

                            <td className="p-3 max-w-xs">
                              <div className="text-[11px] text-slate-300 bg-[#13241f] p-2 rounded border border-[#234338] font-mono leading-relaxed line-clamp-2">
                                {log.sms_body}
                              </div>
                            </td>

                            <td className="p-3 text-right whitespace-nowrap">
                              {isFailed && (
                                <button
                                  onClick={() => handleExecuteSmsRetry(log.id)}
                                  disabled={isRetrying === log.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#13241f] border border-[#234338] text-rose-300 hover:text-white hover:border-rose-500/50 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isRetrying === log.id ? 'animate-spin' : ''}`} />
                                  <span>Retry SMS</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#0c1613] border-t border-[#234338] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Audit Trail &bull; Resend Email Engine Active &bull; No Secrets Exposed</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            Close Notification Hub
          </button>
        </div>
      </div>
    </div>
  );
};
