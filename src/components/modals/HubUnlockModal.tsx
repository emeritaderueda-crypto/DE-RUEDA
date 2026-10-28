import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GcashHubType } from '../../types';
import {
  Shield,
  Lock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Building,
  Users,
} from 'lucide-react';

interface HubUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetHubId: GcashHubType;
}

export const HubUnlockModal: React.FC<HubUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetHubId,
}) => {
  const { unlockHub, currentUser } = useApp();

  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const hubConfig = {
    ceo_hub: {
      name: 'CEO Dedicated GCash Operations Hub',
      roleRequirement: 'Strictly Restricted to CEO Account',
      allowedRoles: ['ceo'],
      badge: 'EMERITA RESTRICTED',
      color: 'amber',
      desc: 'Direct execution of corporate payment disbursements for weekly worker salaries, site operations, and emergency funding.',
    },
    exec_distribution_hub: {
      name: 'Executive Operations Corporate Payment Hub',
      roleRequirement: 'Authorized for CEO & Admin 1 (HR Lead)',
      allowedRoles: ['ceo', 'admin 1'],
      badge: 'HR EXECUTIVE',
      color: 'emerald',
      desc: 'Company-wide weekly salary batch execution, canteen concessionaire meal disbursements, and automated SMS payslip dispatch.',
    },
    admin2_distribution_hub: {
      name: 'Time & Payroll Engine Site Payment Hub',
      roleRequirement: 'Authorized for CEO & Site-Scoped Admin 2',
      allowedRoles: ['ceo', 'admin 2'],
      badge: 'SITE OPS (ISOLATED)',
      color: 'sky',
      desc: 'Site-level worker weekly salary disbursement with strict physical site boundary enforcement.',
    },
  }[targetHubId];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      const res = await unlockHub(targetHubId, password.trim(), mfaCode.trim() || undefined);
      setIsVerifying(false);
      if (res.success) {
        setPassword('');
        setMfaCode('');
        onSuccess();
      } else {
        setError(res.error || 'Access Denied: Verification failed.');
      }
    } catch (err: any) {
      setIsVerifying(false);
      setError(err?.message || 'Authorization error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-[#234338] flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white tracking-tight uppercase">
                  GCash Operations Gate
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {hubConfig.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong className="text-white">{hubConfig.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Matrix Notice */}
        <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white flex items-center justify-between text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Role &amp; Identity Verification
            </span>
            <span className="text-[10px] text-slate-400 font-mono">5-Min Inactivity Timeout</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {hubConfig.desc}
          </p>
          <div className="pt-1.5 border-t border-[#234338]/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Signed in as: <strong className="text-emerald-400">{currentUser?.email || 'Guest'}</strong></span>
            <span className="uppercase text-amber-300">({currentUser?.access_point || 'none'})</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Your Account Password / PIN
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Authoritative Credentials
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter authorized password..."
                className="w-full px-3.5 py-2.5 bg-[#080f0d] border border-[#234338] focus:border-emerald-400 rounded-xl text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                MFA / One-Time Backup Code <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">RFC 6238 TOTP</span>
            </div>
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="e.g. 123456 or RC-XXXX-XXXX"
              className="w-full px-3.5 py-2.5 bg-[#080f0d] border border-[#234338] focus:border-emerald-400 rounded-xl text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#13241f] border border-[#234338] hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-[#10b981] hover:from-emerald-500 hover:to-[#059669] text-[#080f0d] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock Terminal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
