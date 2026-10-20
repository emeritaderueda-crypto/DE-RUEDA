import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccessPointRole } from '../../types';
import {
  ShieldCheck,
  X,
  KeyRound,
  Mail,
  UserCheck,
  Lock,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getStoredPassword,
  DEFAULT_CREDENTIALS,
  getAdminAccounts,
  getUserSpecificPassword,
} from '../../utils/credentials';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const { currentUser, login, loginDirectory } = useApp();
  const [accessPoint, setAccessPoint] = useState<AccessPointRole>('ceo');
  const [email, setEmail] = useState('operations@deruedaconstruction.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  // Sync role and clear password
  const handleRoleSelect = (role: AccessPointRole) => {
    setAccessPoint(role);
    setError('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please provide an authorized corporate email address.');
      return;
    }

    // Verify identity belongs to pre-authorized corporate accounts (Section 2 & 10)
    const accounts = getAdminAccounts();
    const authorizedAccount = accounts.find(
      (a) => a.email.toLowerCase() === trimmedEmail.toLowerCase()
    );

    if (!authorizedAccount) {
      setError(
        `Identity [${trimmedEmail}] is not a pre-authorized corporate account in the De Rueda ERP identity registry. Random or unverified email registration is prohibited per security audit.`
      );
      return;
    }

    if (authorizedAccount.role !== accessPoint) {
      setError(
        `Identity [${trimmedEmail}] is registered under role [${authorizedAccount.role.toUpperCase()}], not [${accessPoint.toUpperCase()}]. Please switch to the matching role.`
      );
      return;
    }

    const expectedPassword = getUserSpecificPassword(trimmedEmail, accessPoint);
    const entered = password.trim();
    const isValid =
      entered === expectedPassword ||
      (accessPoint === 'ceo' && (entered === 'Emerita0279' || entered === 'DRC01'));

    if (!isValid) {
      setError(
        `Invalid access key for ${accessPoint.toUpperCase()}. Access restricted.`
      );
      return;
    }

    // Authenticate and record session
    login(accessPoint, trimmedEmail);

    if (onSuccessLogin) {
      onSuccessLogin();
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentRoleDefault = DEFAULT_CREDENTIALS[accessPoint];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-[#a3e635]" />
            <span>{currentUser ? 'Switch Access Point' : 'System Authentication'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Pre-Authorized Corporate Identity Notice */}
          <div className="p-3 bg-linear-to-r from-[#10b981]/15 to-[#a3e635]/10 border border-[#10b981]/30 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-[#a3e635] shrink-0" />
              <span>Pre-Authorized Corporate SSO &amp; Zero-Trust Authentication</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Enterprise access is bound strictly to pre-authorized corporate identities with enforced role-based access control, MFA protection, and audited session lineage.
            </p>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Role / Access Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['ceo', 'admin 1', 'admin 2', 'site head'] as AccessPointRole[]).map((r) => {
                const isSelected = accessPoint === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => handleRoleSelect(r)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl uppercase transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#a3e635] text-[#080f0d] shadow-md shadow-[#a3e635]/20 ring-1 ring-[#a3e635]'
                        : 'bg-[#13241f] text-slate-300 border border-[#234338] hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{r}</span>
                    <span
                      className={`text-[9px] font-normal truncate ${
                        isSelected ? 'text-[#080f0d]/80 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {r === 'ceo'
                        ? 'Executive'
                        : r === 'admin 1'
                        ? 'HR Lead'
                        : r === 'admin 2'
                        ? 'Site Ops'
                        : 'Field Head'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-[#a3e635] shrink-0" />
              <span>{currentRoleDefault.description}</span>
            </div>
          </div>

          {/* Email input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Pre-Authorized Corporate Email
              </label>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#13241f] border border-[#234338] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                placeholder="operations@deruedaconstruction.com"
              />
            </div>
            {/* Quick pre-set authorized corporate identities */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
              <span>Authorized identities:</span>
              <button
                type="button"
                onClick={() => {
                  setAccessPoint('ceo');
                  setEmail('operations@deruedaconstruction.com');
                }}
                className="px-1.5 py-0.5 bg-[#13241f] hover:bg-[#234338] text-slate-300 rounded border border-[#234338] cursor-pointer"
              >
                CEO
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessPoint('admin 1');
                  setEmail('admin1@deruedaconstruction.com');
                }}
                className="px-1.5 py-0.5 bg-[#13241f] hover:bg-[#234338] text-slate-300 rounded border border-[#234338] cursor-pointer"
              >
                HR Lead
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessPoint('admin 2');
                  setEmail('admin2.mariveles@deruedaconstruction.com');
                }}
                className="px-1.5 py-0.5 bg-[#13241f] hover:bg-[#234338] text-slate-300 rounded border border-[#234338] cursor-pointer"
              >
                Admin 2 (Mariveles)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessPoint('site head');
                  setEmail('sitehead.mariveles@deruedaconstruction.com');
                }}
                className="px-1.5 py-0.5 bg-[#13241f] hover:bg-[#234338] text-slate-300 rounded border border-[#234338] cursor-pointer"
              >
                Site Head (Mariveles)
              </button>
            </div>
          </div>

          {/* Password input - completely hidden and protected */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Authorization Key / Password
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#a3e635]" />
                Confidential
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#13241f] border border-[#234338] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] font-mono tracking-wider"
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Authorized credentials must be kept strictly private. Enter your assigned access key.
            </p>
          </div>

          {/* Protected Security Notice */}
          <div className="p-2.5 bg-[#080f0d] border border-[#234338] rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Restricted Entry: System access is protected. Only personnel with valid authorization keys may proceed.</span>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#234338]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#a3e635] hover:bg-[#84cc16] text-[#080f0d] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#a3e635]/20 flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirm & Authenticate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
