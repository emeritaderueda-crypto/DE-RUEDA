import React from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  Wifi,
  Database,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface RoadmapComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoadmapComplianceModal: React.FC<RoadmapComplianceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#13241f] border-b border-[#234338] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  Real GCash Gateway &amp; Enterprise Governance
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REAL GATEWAY ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                De Rueda Construction Inc. Enterprise Resource Planning &bull; Real GCash Upgrade Specification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5 text-emerald-200">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Real Provider API Gateway Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-300/90">
              Disbursements and balance checks execute against the authorized <strong>Server-Side GCash Business Gateway</strong> with cryptographic idempotency keys, real telco SMS payslip dispatch via Semaphore, DOLE D.O. 13 compliant receipts, and automated audit logs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Lock className="w-4 h-4 text-[#a3e635]" />
                <span>Three-Tier RBAC Governance</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Strict separation of authority: <strong>CEO Vault</strong> (confidential executive clearance), <strong>Lead Admin (A1)</strong> for payroll locking &amp; DTR overrides, and <strong>Site Ops (A2)</strong> for field meal deductions.
              </p>
            </div>

            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Field Offline Durability</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Service Worker precaches accredited canteen menu standards and app shell. Site timekeepers record meal chits without signal loss in remote Bataan and Subic reclamation areas.
              </p>
            </div>

            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span>Audit Trail &amp; Document Vault</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                All transactions, deductions, batch disbursements, and biometric turnstile scans log immutable event records with timestamps, actor IDs, and hash integrity.
              </p>
            </div>

            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Concessionaire Reconciliation</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Automatic generation of printable concessionaire billing sheets, digital meal pass chits, and multi-site spending aggregation in the Central Reports Hub.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#13241f] border-t border-[#234338] p-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            DRC-ERP-ROADMAP-P0P1 &bull; OCT 2026
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
