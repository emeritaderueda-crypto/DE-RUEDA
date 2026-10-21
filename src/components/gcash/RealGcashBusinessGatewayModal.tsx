import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GCashTransactionRecord, GCashPayoutStatus } from '../../types';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  Unlock,
  Key,
  Globe,
  DollarSign,
  Smartphone,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Send,
  FileCheck2,
  Clock,
  Radio,
  Copy,
  Check,
} from 'lucide-react';

interface RealGcashBusinessGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSmsLogs?: () => void;
}

export const RealGcashBusinessGatewayModal: React.FC<RealGcashBusinessGatewayModalProps> = ({
  isOpen,
  onClose,
  onOpenSmsLogs,
}) => {
  const {
    gcashGatewayConfig,
    updateGcashGatewayConfig,
    connectGcashGateway,
    disconnectGcashGateway,
    refreshGcashLiveBalance,
    reconcileGcashTransaction,
    gcashTransactions,
    currentUser,
    payroll,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'balance' | 'reconciliation' | 'credentials' | 'sms'>('balance');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedTxForReconcile, setSelectedTxForReconcile] = useState<GCashTransactionRecord | null>(null);
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [txFilter, setTxFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states for API settings
  const [merchantIdInput, setMerchantIdInput] = useState(gcashGatewayConfig.merchant_id || 'DRC-GCASH-ENT-2026');
  const [clientIdInput, setClientIdInput] = useState(gcashGatewayConfig.client_id || 'drc_corp_live_99281a');
  const [providerTypeInput, setProviderTypeInput] = useState(gcashGatewayConfig.provider_type);
  const [envInput, setEnvInput] = useState(gcashGatewayConfig.environment);

  if (!isOpen) return null;

  const isConnected = gcashGatewayConfig.connection_status === 'CONNECTED';
  const needsReconciliationList = gcashTransactions.filter(
    (t) => t.status === 'NEEDS_RECONCILIATION' || t.status === 'PROCESSING' || t.status === 'PENDING'
  );

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    setStatusMessage(null);
    try {
      const res = await refreshGcashLiveBalance();
      setStatusMessage(res.message);
    } catch {
      setStatusMessage('Failed to refresh balance from provider gateway.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleToggleConnection = async () => {
    setIsRefreshing(true);
    if (isConnected) {
      disconnectGcashGateway();
      setStatusMessage('Gateway disconnected. Live balance and sensitive disbursement feeds are cleared.');
    } else {
      const res = await connectGcashGateway();
      setStatusMessage(res.message);
    }
    setIsRefreshing(false);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSaveCredentials = () => {
    updateGcashGatewayConfig({
      merchant_id: merchantIdInput,
      client_id: clientIdInput,
      provider_type: providerTypeInput,
      environment: envInput,
    });
    setStatusMessage(`Gateway credentials updated. Active Environment: ${envInput.toUpperCase()}`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleReconcileAction = async (action: 'CONFIRM_PAID' | 'MARK_FAILED' | 'VOID' | 'FORCE_RETRY') => {
    if (!selectedTxForReconcile) return;
    setIsRefreshing(true);
    const res = await reconcileGcashTransaction(selectedTxForReconcile.transaction_id, action, reconcileNotes);
    setStatusMessage(res.message);
    setSelectedTxForReconcile(null);
    setReconcileNotes('');
    setIsRefreshing(false);
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleCopy = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const filteredTx = gcashTransactions.filter((t) => {
    if (txFilter === 'NEEDS_RECONCILIATION' && t.status !== 'NEEDS_RECONCILIATION' && t.status !== 'PROCESSING' && t.status !== 'PENDING') return false;
    if (txFilter === 'PAID' && t.status !== 'PAID' && t.status !== 'COMPLETED') return false;
    if (txFilter === 'FAILED' && t.status !== 'FAILED') return false;
    if (txFilter === 'CANCELLED' && t.status !== 'CANCELLED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.reference_no.toLowerCase().includes(q) ||
        t.recipient_name.toLowerCase().includes(q) ||
        t.recipient_mobile.includes(q) ||
        t.site_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-[#0e1a16] border-b border-[#234338] p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                  GCash for Business &bull; Authorized Gateway
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isConnected
                      ? gcashGatewayConfig.environment === 'production'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {isConnected
                    ? `CONNECTED (${gcashGatewayConfig.environment.toUpperCase()})`
                    : 'DISCONNECTED'}
                </span>
                {needsReconciliationList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {needsReconciliationList.length} Needs Reconciliation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Business Disbursement Integration · Globe Telecom / Mynt (G-Xchange, Inc.) API Compliance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#234338] text-slate-400 hover:text-white hover:bg-[#13241f] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#13241f] border-b border-[#234338] px-4 flex gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('balance')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'balance'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Live Balance & Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Reconciliation Workbench</span>
            {needsReconciliationList.length > 0 && (
              <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {needsReconciliationList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'credentials'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Credentials & Environment</span>
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'sms'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>SMS Payslip Telco Gateway</span>
          </button>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className="m-4 p-3 bg-blue-950/40 border border-blue-500/50 rounded-xl text-xs text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab 1: Live Balance & Gateway Status */}
        {activeTab === 'balance' && (
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* Live Balance Card per Section 6 */}
            <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Real Authoritative Live Balance (Section 6 Compliance)</span>
                  </div>

                  {isConnected && gcashGatewayConfig.live_balance !== null ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black font-mono text-white tabular-nums">
                          ₱{gcashGatewayConfig.live_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">PHP (Settled)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Source: Globe Telecom / Mynt (G-Xchange) Authorized Endpoint</span>
                        <span>&bull;</span>
                        <span className="text-slate-300 font-mono">Last Updated: {gcashGatewayConfig.live_balance_last_updated}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-1">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Live Balance Unavailable · Official GCash Business API Credentials Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Under ERP Compliance Specification Section 6, invented, manually typed, or consumer-scraped balances are strictly prohibited. Connect your authorized GCash for Business credentials in the Credentials tab to retrieve real live account balances.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing || !isConnected}
                    className="px-3 py-2 bg-[#13241f] border border-[#234338] hover:border-blue-400 text-blue-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Balance</span>
                  </button>

                  <button
                    onClick={handleToggleConnection}
                    disabled={isRefreshing}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isConnected
                        ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                    }`}
                  >
                    {isConnected ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{isConnected ? 'Disconnect Gateway' : 'Connect Gateway'}</span>
                  </button>
                </div>
              </div>

              {/* Progress: Daily Limit */}
              <div className="mt-5 pt-4 border-t border-[#234338] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#13241f] rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400">Daily Disbursement Limit</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    ₱{gcashGatewayConfig.daily_disbursement_limit.toLocaleString()} PHP
                  </div>
                </div>
                <div className="p-3 bg-[#13241f] rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400">Disbursed Today</div>
                  <div className="font-mono font-bold text-cyan-300 mt-0.5">
                    ₱{gcashGatewayConfig.daily_disbursed_today.toLocaleString()} PHP
                  </div>
                </div>
                <div className="p-3 bg-[#13241f] rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400">Active Merchant ID</div>
                  <div className="font-mono font-bold text-amber-300 mt-0.5 truncate">
                    {gcashGatewayConfig.merchant_id}
                  </div>
                </div>
              </div>
            </div>

            {/* Hub Access Verification Grid per Section 3 & 4 */}
            <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Corporate Payment Hubs &amp; Security Clearance Matrix</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300">1. CEO Operations Hub</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold">CEO ONLY</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Master corporate vault with cross-hub executive oversight, merchant limit controls, and unrestricted disbursement authority.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">2. Executive HR Hub</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">CEO + ADMIN 1</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Weekly salary preparation, batch worker disbursements, HR exceptions queue, and automated SMS payslip dispatch pipeline.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">3. Site Admin 2 Hub</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">SITE SCOPED</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    On-site field distribution terminal strictly isolated to the Admin 2 user's assigned construction project sites.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reconciliation Workbench */}
        {activeTab === 'reconciliation' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#234338]">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  <span>Disbursement Reconciliation Workbench (Section 7 Compliance)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Authoritative status tracking. Unconfirmed or timed-out requests remain flagged until reconciled.
                </p>
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setTxFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    txFilter === 'ALL' ? 'bg-[#a3e635] text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({gcashTransactions.length})
                </button>
                <button
                  onClick={() => setTxFilter('NEEDS_RECONCILIATION')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    txFilter === 'NEEDS_RECONCILIATION'
                      ? 'bg-amber-400 text-black font-bold'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Unresolved ({needsReconciliationList.length})</span>
                </button>
                <button
                  onClick={() => setTxFilter('PAID')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    txFilter === 'PAID' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paid
                </button>
                <button
                  onClick={() => setTxFilter('FAILED')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    txFilter === 'FAILED' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Failed
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference number, recipient name, phone, or site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0e1a16] border border-[#234338] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
              />
            </div>

            {/* Reconciliation Modal Drawer if item selected */}
            {selectedTxForReconcile && (
              <div className="p-4 bg-amber-950/30 border border-amber-500/50 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-200">
                      Reconcile Transaction: {selectedTxForReconcile.reference_no}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTxForReconcile(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-[#0b1612] rounded-lg">
                    <span className="text-[10px] text-slate-400">Recipient</span>
                    <div className="font-bold text-white truncate">{selectedTxForReconcile.recipient_name}</div>
                  </div>
                  <div className="p-2 bg-[#0b1612] rounded-lg">
                    <span className="text-[10px] text-slate-400">Mobile</span>
                    <div className="font-mono text-slate-300">{selectedTxForReconcile.recipient_mobile}</div>
                  </div>
                  <div className="p-2 bg-[#0b1612] rounded-lg">
                    <span className="text-[10px] text-slate-400">Amount</span>
                    <div className="font-mono font-bold text-emerald-400">₱{selectedTxForReconcile.amount.toLocaleString()}</div>
                  </div>
                  <div className="p-2 bg-[#0b1612] rounded-lg">
                    <span className="text-[10px] text-slate-400">Current Status</span>
                    <div className="font-bold text-amber-300">{selectedTxForReconcile.status}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300 font-semibold">
                    Reconciliation Audit Notes (Mandatory for compliance log):
                  </label>
                  <input
                    type="text"
                    value={reconcileNotes}
                    onChange={(e) => setReconcileNotes(e.target.value)}
                    placeholder="e.g. Gateway query verified authoritative bank settlement reference GCASH-99120"
                    className="w-full px-3 py-1.5 bg-[#0b1612] border border-[#234338] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => handleReconcileAction('CONFIRM_PAID')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Authoritative Paid &amp; Send SMS</span>
                  </button>

                  <button
                    onClick={() => handleReconcileAction('MARK_FAILED')}
                    className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Mark Failed &amp; Restore Float</span>
                  </button>

                  <button
                    onClick={() => handleReconcileAction('VOID')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Void Transfer
                  </button>

                  <button
                    onClick={() => handleReconcileAction('FORCE_RETRY')}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Query Gateway API</span>
                  </button>
                </div>
              </div>
            )}

            {/* Transactions Ledger Table */}
            <div className="border border-[#234338] rounded-xl overflow-hidden bg-[#0e1a16]">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#13241f] text-slate-400 font-bold sticky top-0 border-b border-[#234338]">
                    <tr>
                      <th className="p-3">Reference No</th>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Idempotency Key</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#234338]/60">
                    {filteredTx.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No transactions found matching the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTx.map((tx) => (
                        <tr key={tx.transaction_id} className="hover:bg-[#13241f]/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-white">
                            {tx.reference_no}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{tx.recipient_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{tx.recipient_mobile}</div>
                          </td>
                          <td className="p-3 text-[11px] text-slate-300">
                            {tx.category}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            ₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                tx.status === 'PAID' || tx.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : tx.status === 'NEEDS_RECONCILIATION' || tx.status === 'PROCESSING' || tx.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            {tx.idempotency_key || `IDEMP-${tx.reference_no.slice(-6)}`}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedTxForReconcile(tx)}
                              className="px-2.5 py-1 bg-[#13241f] border border-[#234338] hover:border-amber-400 text-amber-300 hover:text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Reconcile
                            </button>
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

        {/* Tab 3: API Credentials & Environment */}
        {activeTab === 'credentials' && (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>GCash Business Partner &amp; Environment Settings (Section 2 Compliance)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold">Integration Provider Channel</label>
                  <select
                    value={providerTypeInput}
                    onChange={(e: any) => setProviderTypeInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="paymongo">PayMongo Enterprise Payouts &amp; Payments API (Preferred)</option>
                    <option value="direct_gcash_business">Globe Telecom / Mynt Direct API (G-Xchange, Inc.)</option>
                    <option value="maya_business">Maya Enterprise Corporate Disbursements</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold">Environment Mode (Section 2 Gate)</label>
                  <select
                    value={envInput}
                    onChange={(e: any) => setEnvInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-xl text-xs text-white outline-none focus:border-emerald-400 font-mono"
                  >
                    <option value="sandbox">SANDBOX (Official Developer Gateway)</option>
                    <option value="production">PRODUCTION (Authoritative Live Money Movement)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold">Corporate Merchant ID</label>
                  <input
                    type="text"
                    value={merchantIdInput}
                    onChange={(e) => setMerchantIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-xl text-xs text-white font-mono outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold">OAuth2 Client ID</label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-xl text-xs text-white font-mono outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Secrets Note */}
              <div className="p-3 bg-[#13241f] rounded-xl border border-[#234338] text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security &amp; Secret Isolation (Section 11 Compliance)</span>
                </div>
                <p>
                  API Private Keys, RSA Certificates, and Webhook Signing Secrets are never exposed to client-side bundles or PDF exports. They are maintained in server-side proxy routes with strict role-based access checks.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400 font-mono">
                  Active Endpoint: {envInput === 'production' ? 'https://api.gcash.com/v1/disburse' : 'https://api-sandbox.gcash.com/v1/disburse'}
                </div>
                <button
                  onClick={handleSaveCredentials}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Gateway Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Automatic SMS Payslip Telco Gateway */}
        {activeTab === 'sms' && (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span>Philippine Telco SMS Gateway Integration (Section 8 Compliance)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automated payslip dispatches triggered strictly upon authoritative GCash payout success.
                  </p>
                </div>

                {onOpenSmsLogs && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSmsLogs();
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open HR SMS Queue</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#13241f] rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400">Telco Provider</div>
                  <div className="font-bold text-white mt-0.5">Semaphore SMS API</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Connected (HTTP 200)</div>
                </div>

                <div className="p-3 bg-[#13241f] rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400">Approved Sender ID</div>
                  <div className="font-bold text-white mt-0.5 font-mono">DERUEDA-ERP</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">NTC Registered</div>
                </div>

                <div className="p-3 bg-[#13241f] rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400">Dispatch Policy</div>
                  <div className="font-bold text-purple-300 mt-0.5">Success-Only</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Zero Spurious Messages</div>
                </div>
              </div>

              {/* Sample SMS Payload Preview */}
              <div className="bg-[#13241f] p-4 rounded-xl border border-[#234338] space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>Itemized SMS Message Template (Section 8 Format):</span>
                </div>
                <div className="p-3 bg-[#0b1612] rounded-lg font-mono text-[11px] text-slate-300 border border-[#234338] leading-relaxed">
                  DE RUEDA CONSTRUCTION: Hi Rodrigo Morales, your wages for 2026-W41 have been disbursed via GCash. Ref: GCASH-MP-20261016-9921443. Gross: P5,600.00 | Ded: P480.00 | Net: P5,120.00. Status: CONFIRMED SUCCESS. https://emybuilder.pages.dev/payslips?id=PAY-001
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#0e1a16] border-t border-[#234338] p-4 flex items-center justify-between gap-4 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authenticated Session: <strong className="text-white">{currentUser?.name || 'Authorized Officer'}</strong> ({currentUser?.access_point.toUpperCase()})</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#13241f] border border-[#234338] hover:border-slate-400 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Close Gateway Console
          </button>
        </div>
      </div>
    </div>
  );
};
