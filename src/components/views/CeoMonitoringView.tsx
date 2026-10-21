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
  } = useApp();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(!isCeoUnlocked);

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
              This executive monitoring portal contains real-time corporate financial reserves, multi-site profit margins, and confidential GCash disbursement authorizations.
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
                CEO Corporate Oversight & Monitoring Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                EMERITA ZERO TWO &bull; AUTHORIZED
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                REAL-TIME SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Engr. Marco De Rueda &bull; Confidential Executive Oversight & Corporate Liquidity Terminal
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
              3 SITES
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
