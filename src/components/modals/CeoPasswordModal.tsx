import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, KeyRound, AlertTriangle, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';

interface CeoPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetDashboardName?: string;
}

export const CeoPasswordModal: React.FC<CeoPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetDashboardName = 'Restricted CEO Command Center',
}) => {
  const { unlockCeoVault } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    setTimeout(() => {
      const success = unlockCeoVault(password);
      setIsVerifying(false);
      if (success) {
        setPassword('');
        onSuccess();
      } else {
        setError('Access Denied: Invalid CEO Security Passphrase. Access is strictly restricted.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/15 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight uppercase">
                  Executive CEO Security Gate
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  RESTRICTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong className="text-white">{targetDashboardName}</strong>
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

        {/* Informative notice */}
        <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Strict Access Enforcement
          </div>
          <p className="text-[11px] text-slate-400">
            Access to the CEO Monitoring Hub and dedicated GCash Operations Dashboard is strictly restricted by executive security protocol. Please enter the authorized CEO passphrase.
          </p>
        </div>

        {/* Passphrase Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Enter CEO Security Passphrase
            </label>
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
                placeholder="Enter passkey (Emerita0279)..."
                className="w-full px-3.5 py-2.5 bg-[#080f0d] border border-[#234338] focus:border-amber-400 rounded-xl text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-colors pr-10"
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

          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-200 animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#13241f] border border-[#234338] hover:border-slate-500 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#080f0d] font-black rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Verifying...' : 'Authorize & Unlock'}</span>
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-[#234338]/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>DE RUEDA EXECUTIVE CIPHER</span>
          <span>EMERITA PROTOCOL ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
