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
  RefreshCw,
  Ticket,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { DeRuedaLogo } from '../brand/DeRuedaLogo';

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
  const { login } = useApp();
  const [authTab, setAuthTab] = useState<'signin' | 'redeem_invitation'>('signin');

  // Sign In States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPendingApprovalNotice, setIsPendingApprovalNotice] = useState(false);

  // Invitation Registration States
  const [inviteToken, setInviteToken] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenValidationInfo, setTokenValidationInfo] = useState<{
    valid: boolean;
    assignedPosition?: string;
    assignedRole?: string;
    assignedSites?: string[];
    company?: string;
    expiresAt?: string;
  } | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    email: string;
    position: string;
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setMfaCode('');
      setRequiresMfa(false);
      setError('');
      setShowPassword(false);
      setIsSubmitting(false);
      setIsPendingApprovalNotice(false);
      setRegistrationSuccess(null);
      setTokenValidationInfo(null);
    }
  }, [isOpen]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPendingApprovalNotice(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please provide an authorized corporate email address.');
      return;
    }

    const entered = password.trim();
    if (!entered) {
      setError('Please enter your authorization password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: entered,
          mfa_code: mfaCode.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.pending_approval) {
          setIsPendingApprovalNotice(true);
          setError(data.error || 'Account registration is pending formal approval by HR or CEO.');
          setIsSubmitting(false);
          return;
        }

        if (data.require_mfa) {
          setRequiresMfa(true);
          setError('Two-Factor Authentication required: enter 6-digit TOTP from your authenticator app (or recovery code).');
          setIsSubmitting(false);
          return;
        }

        setError(data.error || 'Authentication failed. Please verify your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Store authoritative server session token
      if (data.session_token) {
        try {
          sessionStorage.setItem('DERUEDA_AUTH_TOKEN', data.session_token);
          localStorage.setItem('DERUEDA_AUTH_TOKEN', data.session_token);
        } catch {
          // ignore
        }
      }

      // Complete login in app state using authoritative server session role
      const targetRole = (data.user?.role as AccessPointRole) || 'ceo';
      login(targetRole, data.user?.email || trimmedEmail);

      if (onSuccessLogin) {
        onSuccessLogin();
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Network connection failed while authenticating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateToken = async () => {
    const trimmed = inviteToken.trim();
    if (!trimmed) {
      setError('Please enter a corporate invitation token to validate.');
      return;
    }

    setIsValidatingToken(true);
    setError('');
    try {
      const response = await fetch('/api/auth/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: trimmed,
          email: inviteEmail.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid, expired, revoked, or already-used invitation token.');
        setTokenValidationInfo(null);
      } else {
        setTokenValidationInfo({
          valid: true,
          assignedPosition: data.invitation?.assignedPosition,
          assignedRole: data.invitation?.assignedRole,
          assignedSites: data.invitation?.assignedSites,
          company: data.invitation?.company,
          expiresAt: data.invitation?.expiresAt,
        });
        if (data.invitation?.email && !inviteEmail) {
          setInviteEmail(data.invitation.email);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Could not validate invitation token with corporate server.');
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleRegisterInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteToken.trim()) {
      setError('A valid corporate invitation token is required.');
      return;
    }
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setError('A valid corporate email address is required.');
      return;
    }
    if (invitePassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (!inviteFullName.trim()) {
      setError('Full legal name is required for verified corporate registration.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: inviteToken.trim(),
          email: inviteEmail.trim(),
          password: invitePassword,
          full_name: inviteFullName.trim(),
          phone: invitePhone.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to complete invitation registration.');
      } else {
        setRegistrationSuccess({
          email: data.email || inviteEmail,
          position: data.position || tokenValidationInfo?.assignedPosition || 'Team Member',
          message:
            data.message ||
            'Registration successful! Your account is in PENDING APPROVAL status. An authorized HR Officer or Executive CEO must review and activate your account before you can log in.',
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Network error occurred while submitting registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#0a1128] border border-[#1e3a8a] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Architectural Brand Logo */}
        <div className="px-5 py-4 border-b border-[#1e3a8a]/40 flex items-center justify-between bg-[#070d1f]">
          <DeRuedaLogo size="sm" variant="horizontal" theme="dark" showSubtitle={true} />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs: Sign In vs. Redeem Corporate Invitation */}
        <div className="grid grid-cols-2 bg-[#050914] border-b border-[#1e3a8a]/40 p-1.5 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthTab('signin');
              setError('');
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authTab === 'signin'
                ? 'bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Verified Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('redeem_invitation');
              setError('');
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authTab === 'redeem_invitation'
                ? 'bg-emerald-900/90 text-emerald-200 shadow-xs border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span>Redeem Invitation</span>
          </button>
        </div>

        {authTab === 'signin' ? (
          <form onSubmit={handleSignInSubmit} className="p-5 space-y-4">
            <div className="text-center">
              <h2 className="text-base font-black text-white">Enterprise Authentication</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Sign in with verified corporate credentials
              </p>
            </div>

            {/* Neutral Access Restriction Notice */}
            <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-300 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-slate-300">
                Access is restricted to authorized De Rueda Construction personnel. All sign-in attempts and session activities are logged and monitored.
              </p>
            </div>

            {/* Pending Approval Alert Banner */}
            {isPendingApprovalNotice && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Account Pending Approval (0 Protected Access)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  In accordance with the enterprise security specification, invitation signup alone grants
                  zero access to ERP systems. Your account must be explicitly approved and activated by an HR
                  Officer or the Executive CEO.
                </p>
              </div>
            )}

            {/* Email input */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Verified Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                  placeholder="name@deruedaconstruction.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-password"
                  className="text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Authorization Password
                </label>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#a3e635]" />
                  PBKDF2 Salted Verification
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
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
            </div>

            {/* Mandatory MFA Step if challenged */}
            {requiresMfa && (
              <div className="p-3 bg-[#0e1a16] border border-[#a3e635]/60 rounded-xl space-y-2 animate-in fade-in">
                <label
                  htmlFor="auth-mfa"
                  className="text-xs font-bold text-[#a3e635] flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
                  <span>Enter 6-Digit Authenticator TOTP Code (or Recovery Code)</span>
                </label>
                <input
                  id="auth-mfa"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="e.g. 027902 or RC-XXXX-XXXX"
                  className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-sm text-center font-mono font-bold tracking-widest text-[#a3e635] focus:outline-none focus:border-[#a3e635]"
                  maxLength={14}
                  autoFocus
                />
                <p className="text-[10px] text-slate-400">
                  Enter live code from Google Authenticator, Authy, or one-time backup recovery code.
                </p>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Identity...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>{requiresMfa ? 'Verify MFA & Sign In' : 'Sign In with Credentials'}</span>
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-between border-t border-[#1e3a8a]/40 text-xs">
              <span className="text-slate-400 text-[11px]">
                Registration is by corporate invitation only
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* REDEEM INVITATION / REGISTER WORKFLOW */
          <div className="p-5 space-y-4">
            {registrationSuccess ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-3 text-center animate-in fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Registration Application Submitted</h3>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>
                    <strong className="text-emerald-300">Email:</strong> {registrationSuccess.email}
                  </p>
                  <p>
                    <strong className="text-emerald-300">Assigned Position:</strong>{' '}
                    {registrationSuccess.position}
                  </p>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-[11px] mt-2">
                    <AlertTriangle className="w-4 h-4 inline-block mr-1 text-amber-400 align-middle" />
                    <strong>STATUS: PENDING APPROVAL</strong> — Per formal security policy, signup
                    grants zero access. An authorized HR Officer or Executive CEO must review and
                    approve your account before system access is granted.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationSuccess(null);
                    setAuthTab('signin');
                  }}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterInviteSubmit} className="space-y-3.5">
                <div className="text-center">
                  <h2 className="text-base font-black text-white">Redeem Enterprise Invitation</h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Self-registration is retired. Only valid, expiring invitations can begin signup.
                  </p>
                </div>

                {/* Invitation Token Input with Pre-Validation */}
                <div>
                  <label
                    htmlFor="reg-token"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
                  >
                    Single-Use Invitation Token
                  </label>
                  <div className="flex gap-2">
                    <div className="relative grow">
                      <Ticket className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-token"
                        type="text"
                        required
                        value={inviteToken}
                        onChange={(e) => {
                          setInviteToken(e.target.value);
                          setTokenValidationInfo(null);
                        }}
                        className="w-full bg-[#13241f] border border-[#234338] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-[#10b981]"
                        placeholder="e.g. INV-DRC-2026-MASON-8812"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleValidateToken}
                      disabled={isValidatingToken || !inviteToken.trim()}
                      className="px-3 py-2 bg-[#1e3a8a] hover:bg-[#2563eb] text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isValidatingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Check Token'}
                    </button>
                  </div>
                </div>

                {/* Token details badge if validated */}
                {tokenValidationInfo && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Valid Corporate Invitation Confirmed</span>
                    </div>
                    <div className="text-[11px] text-slate-300 grid grid-cols-2 gap-1 mt-1">
                      <div>
                        <span className="text-slate-400">Position:</span>{' '}
                        <strong>{tokenValidationInfo.assignedPosition}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Site Scope:</span>{' '}
                        <strong>{tokenValidationInfo.assignedSites?.join(', ')}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
                  >
                    Bound Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                      placeholder="e.g. candidate@deruedaconstruction.com"
                    />
                  </div>
                </div>

                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
                    >
                      Full Legal Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={inviteFullName}
                      onChange={(e) => setInviteFullName(e.target.value)}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                      placeholder="e.g. Juan De La Cruz"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
                    >
                      Mobile Phone (Optional)
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                      placeholder="+63 9XX XXX XXXX"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
                  >
                    Set Account Password (Min. 8 characters)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-[#10b981]"
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Disclosure notice */}
                <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-[11px] text-slate-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Mandatory Approval Workflow:</strong> Completing registration creates an
                    account in <span className="text-amber-300 font-semibold">Pending Approval</span> status.
                    Signup grants zero protected access until approved by HR Lead or Executive CEO.
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registering Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Submit Invitation Registration</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
