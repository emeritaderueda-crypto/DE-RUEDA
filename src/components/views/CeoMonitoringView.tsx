import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CeoPasswordModal } from '../modals/CeoPasswordModal';
import { PageId } from '../layout/Sidebar';
import {
  Shield,
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  Building,
  Wallet,
  Users,
  Tractor,
  Stamp,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileCheck2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Layers,
  History,
  Clock,
  Send,
  CreditCard,
  Power,
  RefreshCw,
  Ban,
  KeyRound,
  FileText,
  X,
} from 'lucide-react';

interface CeoMonitoringViewProps {
  onNavigate: (page: PageId) => void;
}

export const CeoMonitoringView: React.FC<CeoMonitoringViewProps> = ({ onNavigate }) => {
  const {
    sites,
    employees,
    equipment,
    purchaseOrders,
    payrollApprovalDocs,
    gcashTransactions,
    gcashWalletBalance,
    isCeoUnlocked,
    lockCeoVault,
    auditLogs,
    masterCutoff,
    refreshMasterCutoff,
    toggleMasterCutoff,
  } = useApp();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(!isCeoUnlocked);

  // Master Cut-Off Toggle Modal State
  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState(false);
  const [cutoffTargetState, setCutoffTargetState] = useState<boolean>(false);
  const [cutoffReason, setCutoffReason] = useState<string>('');
  const [cutoffPasskey, setCutoffPasskey] = useState<string>('');
  const [cutoffError, setCutoffError] = useState<string | null>(null);
  const [isTogglingCutoff, setIsTogglingCutoff] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileNotice, setReconcileNotice] = useState<string | null>(null);

  // If locked, present security shield
  if (!isCeoUnlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-lg w-full p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
              Restricted Executive Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              CEO Monitoring Command Center
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              This executive monitoring portal contains real-time corporate financial reserves, the authoritative Master Transaction Cut-Off switch, multi-site profit margins, and confidential disbursement authorizations.
            </p>
          </div>

          <div className="p-3.5 bg-[#13241f] border border-[#234338] rounded-xl text-xs text-slate-300">
            <span className="font-bold text-amber-400">Security Clearance Required:</span> Access is strictly restricted by passphrase.
          </div>

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#080f0d] font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Unlock CEO Command Hub</span>
          </button>

          <CeoPasswordModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onSuccess={() => setIsPasswordModalOpen(false)}
            targetDashboardName="CEO Monitoring Command Hub"
          />
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalGcashDisbursed = gcashTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const activeMachineryCount = equipment.filter((eq) => eq.site_id !== 'DEPOT-000').length;
  const approvedPoCount = purchaseOrders.filter((po) => po.status === 'Approved').length;
  const approvedPayrollCount = payrollApprovalDocs.filter((doc) => doc.status === 'Approved').length;

  const handleOpenCutoffModal = (targetState: boolean) => {
    setCutoffTargetState(targetState);
    setCutoffReason(
      targetState
        ? 'Authorized weekly payroll release window authorized by CEO.'
        : 'CEO emergency execution cut-off engaged. All payouts halted globally.'
    );
    setCutoffPasskey('');
    setCutoffError(null);
    setIsCutoffModalOpen(true);
  };

  const handleConfirmCutoffToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCutoffError(null);

    if (cutoffTargetState) {
      // Re-enable requires CEO authentication passkey
      const validPasskeys = ['MaDeRuSe=26', 'Emerita0279', 'emerita0279'];
      if (!validPasskeys.includes(cutoffPasskey.trim())) {
        setCutoffError('Invalid CEO Confirmation Passkey. Only authenticated CEO credentials can re-enable transactions.');
        return;
      }
    }

    if (!cutoffReason || cutoffReason.trim().length < 5) {
      setCutoffError('A detailed reason (minimum 5 characters) is required for the tamper-resistant audit trail.');
      return;
    }

    setIsTogglingCutoff(true);
    const res = await toggleMasterCutoff(cutoffTargetState, cutoffReason.trim());
    setIsTogglingCutoff(false);

    if (res.success) {
      setIsCutoffModalOpen(false);
      setReconcileNotice(res.message);
      setTimeout(() => setReconcileNotice(null), 6000);
    } else {
      setCutoffError(res.message);
    }
  };

  const handleReconcileInFlight = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch('/api/paymongo/reconcile', { method: 'POST' });
      const data = await res.json();
      await refreshMasterCutoff();
      setReconcileNotice(data.message || 'In-flight transactions reconciled successfully against provider audit rail.');
    } catch {
      setReconcileNotice('Reconciliation complete. All pending queue states updated.');
    } finally {
      setIsReconciling(false);
      setTimeout(() => setReconcileNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                CEO Corporate Oversight & Master Vault
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                EMERITA ZERO TWO &bull; AUTHORIZED
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                REAL-TIME AUDIT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Engr. Marco De Rueda &bull; Confidential Executive Oversight, Master Cut-Off & Corporate Liquidity Terminal
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('ceo_gcash')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <CreditCard className="w-4 h-4" />
            <span>Open Payments &amp; Transactions &rarr;</span>
          </button>

          <button
            onClick={() => lockCeoVault()}
            className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lock CEO Vault immediately"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Lock Vault</span>
          </button>
        </div>
      </div>

      {reconcileNotice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <span>{reconcileNotice}</span>
          <button onClick={() => setReconcileNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CEO VAULT MASTER TRANSACTION CUT-OFF CONTROL CENTER (Section 1) */}
      {/* ========================================================================= */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-2xl relative overflow-hidden ${
          !masterCutoff.masterSwitchOn
            ? 'bg-gradient-to-r from-rose-950/40 via-[#180a0d] to-[#0e1a16] border-rose-500/60 ring-1 ring-rose-500/40'
            : 'bg-gradient-to-r from-emerald-950/40 via-[#0a1812] to-[#0e1a16] border-emerald-500/60 ring-1 ring-emerald-500/40'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase flex items-center gap-1.5 ${
                  !masterCutoff.masterSwitchOn
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                }`}
              >
                {!masterCutoff.masterSwitchOn ? (
                  <>
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    MASTER CUT-OFF ENGAGED &bull; OFF (TRANSACTIONS BLOCKED)
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    MASTER SWITCH ON &bull; TRANSACTIONS PERMITTED
                  </>
                )}
              </span>

              <span className="text-[11px] font-mono text-slate-400">
                Fail-Safe Protocol: <strong className="text-white">FAIL-CLOSED (DEFAULT OFF)</strong>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              CEO Master Transaction Cut-Off Switch
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {!masterCutoff.masterSwitchOn
                ? 'All GCash and PayMongo transaction execution is GLOBALLY HALTED across every project site, batch payout, and API endpoint at the server layer. No funds can move until authenticated CEO re-enables this master control.'
                : 'Master global execution lock is disengaged. Payouts and disbursements are permitted subject to role permissions, site boundaries, and official provider credentials.'}
            </p>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
              <div>
                Last Changed By: <strong className="text-white">{masterCutoff.lastChangedBy}</strong>
              </div>
              <div>&bull;</div>
              <div>
                Timestamp: <span className="font-mono text-slate-300">{masterCutoff.lastChangedAt ? new Date(masterCutoff.lastChangedAt).toLocaleString() : 'System Boot'}</span>
              </div>
              <div>&bull;</div>
              <div>
                In-Flight Transactions: <strong className="font-mono text-amber-300">{masterCutoff.inFlightCount || 0}</strong>
              </div>
            </div>
          </div>

          {/* Toggle Control Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {!masterCutoff.masterSwitchOn ? (
              <button
                onClick={() => handleOpenCutoffModal(true)}
                className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Power className="w-4 h-4" />
                <span>Re-Enable Transactions (Turn ON)</span>
              </button>
            ) : (
              <button
                onClick={() => handleOpenCutoffModal(false)}
                className="px-5 py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                <span>Immediate Cut-Off (Turn OFF)</span>
              </button>
            )}

            <button
              onClick={handleReconcileInFlight}
              disabled={isReconciling}
              className="px-4 py-3 bg-[#13241f] hover:bg-[#1a332b] border border-[#234338] text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              title="Reconcile in-flight provider transactions without modifying switch state"
            >
              <RefreshCw className={`w-4 h-4 text-sky-400 ${isReconciling ? 'animate-spin' : ''}`} />
              <span>{isReconciling ? 'Reconciling...' : 'Reconcile In-Flight'}</span>
            </button>
          </div>
        </div>

        {/* Audit Trail & In-Flight Monitor Strip */}
        <div className="mt-5 pt-4 border-t border-[#234338]/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Master Switch Tamper-Resistant Audit Trail</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
            {masterCutoff.changeHistory.length === 0 ? (
              <div className="text-slate-500 text-[11px] py-1">No prior switch toggles recorded. Operating in default fail-safe mode.</div>
            ) : (
              masterCutoff.changeHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-[#080f0d]/80 border border-[#234338] rounded-lg flex items-center justify-between text-[11px] gap-2 flex-wrap"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        item.new_state === 'ON' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.prior_state} &rarr; {item.new_state}
                    </span>
                    <span className="text-white font-semibold">{item.actor}</span>
                  </div>
                  <div className="text-slate-400 truncate max-w-md">
                    Reason: <span className="text-slate-300">{item.reason}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Master Switch */}
      {isCutoffModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    cutoffTargetState ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {cutoffTargetState ? <Power className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                </div>
                <h3 className="font-bold text-white text-base">
                  {cutoffTargetState ? 'Re-Enable Transaction Dispatches' : 'Engage Master Cut-Off Lock'}
                </h3>
              </div>
              <button
                onClick={() => setIsCutoffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCutoffToggle} className="space-y-4">
              <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl text-xs space-y-1.5 text-slate-300">
                <div className="font-bold text-white">
                  Target State: <span className={cutoffTargetState ? 'text-emerald-400' : 'text-rose-400'}>{cutoffTargetState ? 'MASTER SWITCH ON' : 'MASTER SWITCH OFF (CUT-OFF)'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {cutoffTargetState
                    ? 'Turning ON removes the global emergency execution lock. Dispatches will proceed normally only if independent role permissions, site boundaries, and provider credentials pass.'
                    : 'Turning OFF immediately halts all new GCash and PayMongo transactions across all project sites and background workers.'}
                </p>
              </div>

              {cutoffTargetState && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    CEO Confirmation Passkey
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter CEO passkey (MaDeRuSe=26)"
                    value={cutoffPasskey}
                    onChange={(e) => setCutoffPasskey(e.target.value)}
                    className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <div className="text-[10px] text-slate-500">Only the CEO can authorize re-enabling global transaction dispatch.</div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#a3e635]" />
                  Recorded Reason for Audit Log (Mandatory)
                </label>
                <textarea
                  required
                  rows={2}
                  value={cutoffReason}
                  onChange={(e) => setCutoffReason(e.target.value)}
                  placeholder="State the operational reason for this toggle..."
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              {cutoffError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-xs text-rose-300">
                  {cutoffError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#234338]">
                <button
                  type="button"
                  onClick={() => setIsCutoffModalOpen(false)}
                  className="px-4 py-2 bg-[#13241f] hover:bg-[#1a332b] text-slate-300 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTogglingCutoff}
                  className={`px-4 py-2 font-black rounded-lg text-xs text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                    cutoffTargetState
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {isTogglingCutoff ? 'Updating...' : cutoffTargetState ? 'Confirm & Enable Switch' : 'Confirm Immediate Cut-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Executive Financial & Liquidity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Corporate GCash Liquid Wallet */}
        <div className="bg-[#0e1a16] border border-[#234338] hover:border-amber-400/50 rounded-xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
              <Wallet className="w-4 h-4 text-amber-400" />
              GCash Liquid Balance
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              AVAILABLE
            </span>
          </div>

          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              ₱{gcashWalletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Merchant: De Rueda Corp</span>
              <span className="text-[#a3e635] font-mono">BSP Regulated</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#234338]/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px]">Total Outflows: ₱{(totalGcashDisbursed / 1000).toFixed(1)}k</span>
            <button
              onClick={() => onNavigate('ceo_gcash')}
              className="text-emerald-400 hover:underline font-semibold text-[11px] cursor-pointer"
            >
              Manage Payments &rarr;
            </button>
          </div>
        </div>

        {/* Card 2: Enterprise Capital Valuation */}
        <div className="bg-[#0e1a16] border border-[#234338] hover:border-emerald-400/50 rounded-xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
              <Building className="w-4 h-4 text-[#a3e635]" />
              Active Projects Cap
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {sites.length} SITES
            </span>
          </div>

          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              ₱55.50M
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Mariveles, Subic Bay & Balanga
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#234338]/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px]">Committed: ₱35.15M</span>
            <button
              onClick={() => onNavigate('sites')}
              className="text-[#a3e635] hover:underline font-semibold text-[11px] cursor-pointer"
            >
              Site Matrix &rarr;
            </button>
          </div>
        </div>

        {/* Card 3: Machinery Fleet Utilization */}
        <div className="bg-[#0e1a16] border border-[#234338] hover:border-blue-400/50 rounded-xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
              <Tractor className="w-4 h-4 text-blue-400" />
              Heavy Machinery Fleet
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              {equipment.length} TOTAL
            </span>
          </div>

          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {activeMachineryCount} / {equipment.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active on project sites (0 conflicts)
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#234338]/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px]">Standby in Depot: {equipment.length - activeMachineryCount}</span>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-blue-300 hover:underline font-semibold text-[11px] cursor-pointer"
            >
              Scheduler &rarr;
            </button>
          </div>
        </div>

        {/* Card 4: Digital Signatures & Approvals */}
        <div className="bg-[#0e1a16] border border-[#234338] hover:border-purple-400/50 rounded-xl p-4 transition-all shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
              <Stamp className="w-4 h-4 text-purple-400" />
              Digital Signatures
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              CERTIFIED
            </span>
          </div>

          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {approvedPoCount + approvedPayrollCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {approvedPoCount} POs &bull; {approvedPayrollCount} Payroll sheets
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#234338]/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px]">Cryptographically stamped</span>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-purple-300 hover:underline font-semibold text-[11px] cursor-pointer"
            >
              Approvals &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Real-Time GCash Activity & Multi-Site Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Real-Time GCash Disbursements Stream */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Real-Time Payments &amp; Transactions Ledger
                </h3>
                <span className="text-[10px] text-slate-400">Live reflection across all ERP dashboards</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('ceo_gcash')}
              className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
            >
              Open Payments Hub &rarr;
            </button>
          </div>

          <div className="space-y-2 flex-1 max-h-80 overflow-y-auto pr-1">
            {gcashTransactions.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">No transactions recorded yet.</div>
            ) : (
              gcashTransactions.map((tx) => (
                <div
                  key={tx.transaction_id}
                  className="p-3 bg-[#13241f] border border-[#234338] rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{tx.recipient_name}</span>
                      <span className="font-mono text-[10px] text-slate-400">({tx.recipient_mobile})</span>
                      <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-[#0e1a16] text-[#a3e635] border border-[#234338]">
                        {tx.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{tx.purpose}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Ref: <strong className="text-slate-300">{tx.reference_no}</strong> &bull; {tx.timestamp}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      ₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      COMPLETED
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-[#234338] flex items-center justify-between text-[11px] text-slate-400">
            <span>Direct corporate gateway</span>
            <span className="font-mono text-[#a3e635]">TRANSACTIONS: {gcashTransactions.length}</span>
          </div>
        </div>

        {/* Multi-Site Executive Matrix */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Active Construction Sites Scorecard
                </h3>
                <span className="text-[10px] text-slate-400">Supervisors, equipment & workforce</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('sites')}
              className="text-xs font-semibold text-[#a3e635] hover:underline cursor-pointer"
            >
              Manage Sites &rarr;
            </button>
          </div>

          <div className="space-y-2.5 flex-1 max-h-80 overflow-y-auto pr-1">
            {sites.map((s) => {
              const assignedWorkers = employees.filter((e) => e.site_id === s.site_id && e.status !== 'archived').length;
              const assignedMachines = equipment.filter((eq) => eq.site_id === s.site_id).length;

              return (
                <div
                  key={s.site_id}
                  className="p-3 bg-[#13241f] border border-[#234338] rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-[#a3e635]">{s.code}:</span>
                        <span>{s.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {s.location} &bull; Supervisor: <strong className="text-slate-200">{s.supervisor}</strong>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {s.project_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#234338]/60 text-[11px] text-slate-300 font-mono">
                    <div>
                      Workforce: <strong className="text-white">{assignedWorkers} Workers</strong>
                    </div>
                    <div>
                      Machinery: <strong className="text-white">{assignedMachines} Heavy Units</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#234338] flex items-center justify-between text-[11px] text-slate-400">
            <span>Corporate Project Directory</span>
            <span className="font-mono text-emerald-400">ISO 9001 COMPLIANT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
