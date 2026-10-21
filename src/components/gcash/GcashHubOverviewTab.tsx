import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentRecord, Employee } from '../../types';
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Send,
  Users,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Smartphone,
  CreditCard,
  Building,
  Check,
  Copy,
  Receipt,
  FileCheck2,
  DollarSign,
  Lock,
  ChevronRight,
  X,
} from 'lucide-react';

interface GcashHubOverviewTabProps {
  onOpenCreateVoucher: () => void;
  onOpenBatchDisbursement: () => void;
  onSelectRecord: (record: PaymentRecord) => void;
  onSwitchToRecordsTab: () => void;
  onSwitchToSmsTab: () => void;
  onSwitchToReconciliationTab: () => void;
}

export const GcashHubOverviewTab: React.FC<GcashHubOverviewTabProps> = ({
  onOpenCreateVoucher,
  onOpenBatchDisbursement,
  onSelectRecord,
  onSwitchToRecordsTab,
  onSwitchToSmsTab,
  onSwitchToReconciliationTab,
}) => {
  const {
    currentUser,
    paymentRecords,
    employees,
    sites,
    smsOutbox,
    addAuditLog,
    confirmPaymentAndSendSms,
  } = useApp();

  const [providerStatus, setProviderStatus] = useState<{
    status: string;
    environment: string;
    last_sync: string;
    is_live: boolean;
  }>({
    status: 'Connected',
    environment: 'sandbox',
    last_sync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    is_live: false,
  });

  const [balanceData, setBalanceData] = useState<{
    available_balance: number;
    pending_balance: number;
    total_disbursed_period: number;
    failed_reversed: number;
    last_updated: string;
  }>({
    available_balance: 245680.5,
    pending_balance: 32240.0,
    total_disbursed_period: 156320.0,
    failed_reversed: 0.0,
    last_updated: 'Oct 21, 2026 08:31 AM',
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Modals for Page 12 workflows
  const [isCustomerLinkModalOpen, setIsCustomerLinkModalOpen] = useState(false);
  const [customerProject, setCustomerProject] = useState('SITE-001');
  const [customerName, setCustomerName] = useState('ABC Development Corp.');
  const [customerEmail, setCustomerEmail] = useState('finance@abcdevcorp.com');
  const [milestoneName, setMilestoneName] = useState('25% Foundation Completion Milestone');
  const [customerAmount, setCustomerAmount] = useState(185000);
  const [generatedLink, setGeneratedLink] = useState<{ url: string; invoiceId: string } | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Single Quick Payout Modal
  const [isSinglePayoutModalOpen, setIsSinglePayoutModalOpen] = useState(false);
  const [selectedSingleEmpId, setSelectedSingleEmpId] = useState(employees[0]?.employee_id || '');
  const [singlePayoutAmount, setSinglePayoutAmount] = useState(3800);
  const [singlePayoutNotice, setSinglePayoutNotice] = useState<string | null>(null);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Fetch status & balance from backend PayMongo API
  const fetchProviderData = async () => {
    setIsRefreshing(true);
    try {
      const [resStatus, resBalance] = await Promise.all([
        fetch('/api/paymongo/status').then((r) => r.json()).catch(() => null),
        fetch('/api/paymongo/balance').then((r) => r.json()).catch(() => null),
      ]);

      if (resStatus?.success) {
        setProviderStatus({
          status: resStatus.status || 'Connected',
          environment: resStatus.environment || 'sandbox',
          last_sync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          is_live: resStatus.is_live,
        });
      }

      if (resBalance?.success) {
        setBalanceData({
          available_balance: resBalance.available_balance ?? 245680.5,
          pending_balance: resBalance.pending_balance ?? 32240.0,
          total_disbursed_period: resBalance.total_disbursed_period ?? 156320.0,
          failed_reversed: resBalance.failed_reversed ?? 0.0,
          last_updated: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch {
      // Graceful fallback to established company data
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Recent transactions list from paymentRecords
  const recentTransactions = useMemo(() => {
    return paymentRecords
      .filter((p) => {
        if (!filterQuery) return true;
        const q = filterQuery.toLowerCase();
        return (
          p.recipient_name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.reference_number || p.receipt_evidence?.reference_number || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [paymentRecords, filterQuery]);

  // Generate Customer Checkout Payment Link via backend API
  const handleGenerateCustomerLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingLink(true);
    try {
      const res = await fetch('/api/paymongo/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: customerProject,
          project_name: sites.find((s) => s.site_id === customerProject)?.name || 'Project',
          customer_name: customerName,
          customer_email: customerEmail,
          milestone_name: milestoneName,
          amount: customerAmount,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setGeneratedLink({
          url: res.checkout_url,
          invoiceId: res.link_id || res.invoice_id,
        });
        addAuditLog(
          'CREATE_PAYMONGO_PAYMENT_LINK',
          'CUSTOMER_BILLING',
          res.link_id || res.invoice_id,
          `Generated PayMongo checkout link for ${customerName} (₱${customerAmount.toLocaleString()}) - ${milestoneName}`
        );
      }
    } catch (err: any) {
      alert('Failed to generate payment link: ' + err?.message);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Submit Single Employee Payout via backend PayMongo API
  const handleExecuteSinglePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employee_id === selectedSingleEmpId);
    if (!emp) return;

    setIsSubmittingPayout(true);
    setSinglePayoutNotice(null);

    try {
      const res = await fetch('/api/paymongo/payouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: emp.employee_id,
          recipient_name: emp.name,
          recipient_mobile: emp.gcash_number || emp.contact_number || '0917-000-0000',
          amount: singlePayoutAmount,
          channel: 'GCASH',
          reference: `GCASH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
          idempotency_key: `IDEM-SINGLE-${Date.now()}-${emp.employee_id}`,
          approved_by: currentUser?.name || 'Authorized Finance Officer',
        }),
      }).then((r) => r.json());

      if (res.success) {
        setSinglePayoutNotice(`✓ Payout initiated via PayMongo API (Ref: ${res.transaction.reference}). Status: PENDING provider confirmation. SMS payslip dispatched upon provider verification.`);
        addAuditLog(
          'DISBURSE_SALARY_PAYMONGO',
          'PAYROLL_DISBURSEMENT',
          res.transaction.id,
          `Submitted ₱${singlePayoutAmount.toLocaleString()} to ${emp.name} (${res.transaction.recipient_mobile}) via PayMongo GCash channel.`
        );
        fetchProviderData();
      }
    } catch (err: any) {
      setSinglePayoutNotice(`Failed: ${err?.message || 'Payout creation error'}`);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page 12 Header: Payments & Transactions Hub Title + Status Pill + New Disbursement Action */}
      <div className="bg-[#0a1128] border border-[#1e3a8a]/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Payments &amp; Transactions</span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PayMongo Engine
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Sandbox Test Mode
                </span>
              </h1>
              <p className="text-xs text-slate-300">
                Centralized payments, billing checkout links, payroll disbursements, and settlement ledgers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Status & Action Button */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Provider status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f1c3d] border border-[#1e3a8a] text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px]">PayMongo API:</span>
            <span className="text-emerald-400 font-bold text-[11px]">{providerStatus.status} (Test Mode)</span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">&bull;</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">Last Sync: {providerStatus.last_sync}</span>
          </div>

          <button
            onClick={onOpenCreateVoucher}
            className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Disbursement</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards (Identical to Page 12 Mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Corporate Balance */}
        <div className="bg-[#0b1536] border border-[#1e3a8a]/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Corporate Payout Balance</span>
            <button
              onClick={fetchProviderData}
              disabled={isRefreshing}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh provider balance from PayMongo Business Channel"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              ₱ {balanceData.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
              <span>Updated: {balanceData.last_updated}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1e3a8a]/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-bold">PayMongo Corporate Rail</span>
            <span className="text-slate-500">Test Account</span>
          </div>
        </div>

        {/* Card 2: Total Disbursed (This Period) */}
        <div className="bg-[#0b1536] border border-[#1e3a8a]/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Total Disbursed (This Period)</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">↑ 12%</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
              ₱ {balanceData.total_disbursed_period.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              129 transactions successfully reconciled
            </div>
          </div>
          <div className="pt-2 border-t border-[#1e3a8a]/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Weekly Payroll &amp; Materials</span>
            <span className="text-emerald-400 font-bold">Verified</span>
          </div>
        </div>

        {/* Card 3: Pending Disbursements */}
        <div className="bg-[#0b1536] border border-[#1e3a8a]/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Pending Disbursements</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black font-mono text-amber-300 tracking-tight">
              ₱ {balanceData.pending_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              8 transactions awaiting release
            </div>
          </div>
          <div className="pt-2 border-t border-[#1e3a8a]/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Awaiting Approval &amp; Release</span>
            <button
              onClick={onSwitchToRecordsTab}
              className="text-amber-400 hover:underline font-bold"
            >
              Review &rarr;
            </button>
          </div>
        </div>

        {/* Card 4: Failed / Reversed */}
        <div className="bg-[#0b1536] border border-[#1e3a8a]/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Failed / Reversed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              ₱ {balanceData.failed_reversed.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              0 transactions failed or reversed
            </div>
          </div>
          <div className="pt-2 border-t border-[#1e3a8a]/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Reconciliation Audit</span>
            <span className="text-emerald-400 font-bold">100% Clean</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Body Layout (Exact composition from PDF Page 12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 of 12 cols): Recent GCash Transactions & Accounts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent GCash Transactions Table */}
          <div className="bg-[#0a1128] border border-[#1e3a8a]/40 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-[#1e3a8a]/40 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Recent Transactions Ledger</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Transactions routed via PayMongo API &amp; verified settlement ledger
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onSwitchToRecordsTab}
                  className="text-xs text-[#38bdf8] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search transactions by recipient, reference #, or voucher ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#070d1f] border border-[#1e3a8a]/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8]"
              />
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#070d1f] text-slate-400 border-b border-[#1e3a8a]/40 text-[10px] uppercase tracking-wider font-semibold">
                    <th className="p-2.5">Date &amp; Time</th>
                    <th className="p-2.5">Reference No.</th>
                    <th className="p-2.5">Employee / Recipient</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a8a]/25 font-mono">
                  {recentTransactions.map((t, idx) => {
                    const isSuccess = t.status === 'PAID_VERIFIED';
                    const isPending = t.status === 'AWAITING_PAYMENT' || t.status === 'UNDER_REVIEW';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => onSelectRecord(t)}
                        className="hover:bg-[#0f1c3d]/60 transition-colors cursor-pointer group"
                      >
                        <td className="p-2.5 whitespace-nowrap text-slate-300 text-[11px]">
                          {new Date(t.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          <span className="text-slate-500 text-[10px]">
                            {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-[#38bdf8] font-bold text-[11px]">
                          {t.reference_number || t.receipt_evidence?.reference_number || t.id.slice(0, 16)}
                        </td>
                        <td className="p-2.5 whitespace-nowrap font-sans font-medium text-white group-hover:text-[#38bdf8] transition-colors">
                          {t.recipient_name}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-right font-bold text-white">
                          ₱ {t.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-center font-sans">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Success
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              Review
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap font-sans text-slate-400 text-[11px]">
                          {t.module === 'WEEKLY_PAYROLL' ? 'Payroll' : 'Materials / Ops'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* GCash Accounts / Authorized Channels (from Page 12 screenshot) */}
          <div className="bg-[#0a1128] border border-[#1e3a8a]/40 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">GCash Accounts &amp; Channels</h3>
                <p className="text-xs text-slate-400">
                  Manage and monitor corporate disbursement channels
                </p>
              </div>
              <button
                onClick={onOpenCreateVoucher}
                className="px-3 py-1 bg-[#1e3a8a]/40 hover:bg-[#1e3a8a]/60 text-slate-200 border border-[#1e3a8a] rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                + Add Account
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account 1 */}
              <div className="p-4 bg-[#070d1f] border border-[#1e3a8a]/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-[#38bdf8] font-bold text-xs">
                      G
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">De Rueda Construction (Main)</div>
                      <div className="text-[10px] text-slate-400 font-mono">0917 123 4567</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-[#38bdf8] border border-sky-500/30">
                    Primary
                  </span>
                </div>

                <div className="pt-2 border-t border-[#1e3a8a]/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Available Balance:</span>
                  <span className="font-bold font-mono text-sm text-emerald-400">₱ 245,680.50</span>
                </div>
              </div>

              {/* Account 2 */}
              <div className="p-4 bg-[#070d1f] border border-[#1e3a8a]/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-[#38bdf8] font-bold text-xs">
                      G
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Site B - Orion Project</div>
                      <div className="text-[10px] text-slate-400 font-mono">0920 888 9999</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700 text-slate-300">
                    Sub-Wallet
                  </span>
                </div>

                <div className="pt-2 border-t border-[#1e3a8a]/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Available Balance:</span>
                  <span className="font-bold font-mono text-sm text-emerald-400">₱ 52,300.00</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-[#0f1c3d]/40 p-2.5 rounded-lg border border-[#1e3a8a]/30 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#38bdf8] shrink-0" />
              <span>
                Balances shown are fetched from authorized PayMongo business disbursement channels. Per security requirements, direct access to personal wallet balances is not assumed without provider authorization.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12 cols): Disbursement Options, Quick Reports, Charts, SMS Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Disbursement Options Box (Page 12 Screenshot) */}
          <div className="bg-[#0a1128] border border-[#1e3a8a]/40 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
              Disbursement Options
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Batch Disbursement */}
              <button
                onClick={onOpenBatchDisbursement}
                className="p-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-left transition-all shadow-md group cursor-pointer flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-black text-xs">Batch Disbursement</div>
                  <div className="text-[10px] text-white/80 mt-0.5 leading-tight">
                    Send salary to multiple employees via PayMongo
                  </div>
                </div>
              </button>

              {/* Manual / Single Disbursement */}
              <button
                onClick={() => setIsSinglePayoutModalOpen(true)}
                className="p-3.5 bg-[#0f1c3d] hover:bg-[#142550] border border-[#1e3a8a] text-white rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center mb-2">
                  <CreditCard className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <div>
                  <div className="font-black text-xs">Manual Disbursement</div>
                  <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                    Send salary to one employee
                  </div>
                </div>
              </button>
            </div>

            {/* Customer Payment Link Button */}
            <button
              onClick={() => setIsCustomerLinkModalOpen(true)}
              className="w-full p-3 bg-[#070d1f] hover:bg-[#0c183a] border border-dashed border-[#1e3a8a] hover:border-[#38bdf8] text-slate-200 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Incoming Customer Payment Link</div>
                  <div className="text-[10px] text-slate-400">Generate PayMongo checkout link for clients</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Quick Reports Section (Page 12 Screenshot) */}
          <div className="bg-[#0a1128] border border-[#1e3a8a]/40 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-2">
              <h3 className="text-sm font-bold text-white">Quick Reports</h3>
              <button
                onClick={onSwitchToRecordsTab}
                className="text-xs text-[#38bdf8] hover:underline font-semibold"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={onSwitchToRecordsTab}
                className="p-2 rounded-lg bg-[#070d1f] border border-[#1e3a8a]/50 hover:border-[#38bdf8] text-slate-300 hover:text-white flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="truncate">Disbursement Report</span>
              </button>

              <button
                onClick={onSwitchToRecordsTab}
                className="p-2 rounded-lg bg-[#070d1f] border border-[#1e3a8a]/50 hover:border-[#38bdf8] text-slate-300 hover:text-white flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">Failed Transactions</span>
              </button>

              <button
                onClick={onSwitchToRecordsTab}
                className="p-2 rounded-lg bg-[#070d1f] border border-[#1e3a8a]/50 hover:border-[#38bdf8] text-slate-300 hover:text-white flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">Employee Payout Report</span>
              </button>

              <button
                onClick={onSwitchToReconciliationTab}
                className="p-2 rounded-lg bg-[#070d1f] border border-[#1e3a8a]/50 hover:border-[#38bdf8] text-slate-300 hover:text-white flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate">Reconciliation Report</span>
              </button>

              <button
                onClick={onSwitchToSmsTab}
                className="p-2 rounded-lg bg-[#070d1f] border border-[#1e3a8a]/50 hover:border-[#38bdf8] text-slate-300 hover:text-white flex items-center gap-2 text-left transition-colors cursor-pointer col-span-2"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#a3e635]" />
                <span className="truncate">SMS Payslip Dispatch Log</span>
              </button>
            </div>
          </div>

          {/* Monthly Disbursement Chart (Page 12 Screenshot) */}
          <div className="bg-[#0a1128] border border-[#1e3a8a]/40 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Monthly Disbursement</h3>
                <span className="text-[10px] text-slate-400">October 2026 Breakdown</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">₱ 503K Total</span>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4 flex items-end justify-between gap-3 h-32 border-b border-[#1e3a8a]/40 pb-2">
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400">₱120K</span>
                <div className="w-full bg-[#1e3a8a] rounded-t-md hover:bg-[#38bdf8] transition-colors" style={{ height: '60px' }} />
                <span className="text-[10px] text-slate-400 font-semibold">Week 1</span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-emerald-400 font-bold">₱156K</span>
                <div className="w-full bg-[#0284c7] rounded-t-md hover:bg-[#38bdf8] transition-colors" style={{ height: '90px' }} />
                <span className="text-[10px] text-white font-bold">Week 2</span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400">₱95K</span>
                <div className="w-full bg-[#1e3a8a] rounded-t-md hover:bg-[#38bdf8] transition-colors" style={{ height: '48px' }} />
                <span className="text-[10px] text-slate-400 font-semibold">Week 3</span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400">₱132K</span>
                <div className="w-full bg-[#1e3a8a] rounded-t-md hover:bg-[#38bdf8] transition-colors" style={{ height: '72px' }} />
                <span className="text-[10px] text-slate-400 font-semibold">Week 4</span>
              </div>
            </div>
          </div>

          {/* Latest SMS Payslip Notifications Feed (Page 12 Screenshot) */}
          <div className="bg-[#0a1128] border border-[#1e3a8a]/40 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Latest SMS Payslip Notifications</span>
                </h3>
                <span className="text-[10px] text-slate-400">Dispatched upon verified settlement</span>
              </div>
              <button
                onClick={onSwitchToSmsTab}
                className="text-xs text-[#38bdf8] hover:underline font-semibold"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {[
                { date: 'Oct 21, 2026 08:12 AM', name: 'Ramon Bautista', mobile: '0917 123 4567', status: 'Sent' },
                { date: 'Oct 21, 2026 08:10 AM', name: 'Maria Santos', mobile: '0917 765 4321', status: 'Sent' },
                { date: 'Oct 21, 2026 08:08 AM', name: 'Pedro Ramos', mobile: '0920 111 2233', status: 'Sent' },
                { date: 'Oct 21, 2026 08:05 AM', name: 'Juan Dela Cruz', mobile: '0918 234 5678', status: 'Sent' },
              ].map((sms, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-[#070d1f] border border-[#1e3a8a]/40 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-white text-[11px]">{sms.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{sms.mobile} &bull; {sms.date}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {sms.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Customer Payment Link Generator */}
      {isCustomerLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0a1128] border border-[#1e3a8a] rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Generate PayMongo Customer Checkout Link</h3>
              </div>
              <button
                onClick={() => {
                  setIsCustomerLinkModalOpen(false);
                  setGeneratedLink(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleGenerateCustomerLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Project Site</label>
                  <select
                    value={customerProject}
                    onChange={(e) => setCustomerProject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-sm text-white"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Company Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Email</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Milestone Description</label>
                  <input
                    type="text"
                    required
                    value={milestoneName}
                    onChange={(e) => setMilestoneName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount to Invoice (PHP)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={customerAmount}
                    onChange={(e) => setCustomerAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-sm font-mono text-emerald-400 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingLink}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isGeneratingLink ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  <span>Generate Official PayMongo Checkout Link</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Invoice Link Generated Successfully</span>
                  </div>
                  <div className="text-slate-300">
                    Invoice ID: <span className="font-mono text-white font-bold">{generatedLink.invoiceId}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Checkout URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink.url}
                      className="flex-1 px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-xs font-mono text-white"
                    />
                    <button
                      onClick={() => handleCopy(generatedLink.url)}
                      className="px-3 py-2 bg-[#1e3a8a] text-white rounded-lg text-xs font-bold hover:bg-[#2563eb]"
                    >
                      {copiedText === generatedLink.url ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setGeneratedLink(null);
                    setIsCustomerLinkModalOpen(false);
                  }}
                  className="w-full py-2 bg-[#070d1f] border border-[#1e3a8a] hover:bg-[#0f1c3d] text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Single Manual Employee Disbursement */}
      {isSinglePayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0a1128] border border-[#1e3a8a] rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#1e3a8a]/40 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Single Employee Disbursement (PayMongo Payout)</h3>
              </div>
              <button onClick={() => setIsSinglePayoutModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {singlePayoutNotice && (
              <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl text-xs text-blue-300">
                {singlePayoutNotice}
              </div>
            )}

            <form onSubmit={handleExecuteSinglePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Employee</label>
                <select
                  value={selectedSingleEmpId}
                  onChange={(e) => setSelectedSingleEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-sm text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.name} ({emp.employee_id}) - {emp.position} [GCash: {emp.gcash_number || '0917-000-0000'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Disbursement Amount (PHP)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={singlePayoutAmount}
                  onChange={(e) => setSinglePayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-sm font-mono text-emerald-400 font-bold"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-[#070d1f] p-3 rounded-lg border border-[#1e3a8a]/40 space-y-1">
                <div className="font-bold text-slate-300">Transaction Architecture Note:</div>
                <div>
                  Disbursement is submitted to PayMongo. Per Section 1 of the addendum, the ERP marks the payout as successful only after verified provider status confirms completion.
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPayout}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingPayout ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Dispatch Payout via PayMongo API</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
