import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  X,
  Ticket,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Send,
  Ban,
  FileText,
  Lock,
  Layers,
  History,
} from 'lucide-react';
import { EnterpriseInvitation, PendingAccountRecord, SecurityAuditLogRecord } from '../../types';

interface SecurityInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityInvitationsModal: React.FC<SecurityInvitationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, sites } = useApp();
  const currentRole = currentUser?.access_point || 'admin 1';
  const [activeTab, setActiveTab] = useState<'pending' | 'create' | 'ledger' | 'audit'>('pending');

  // Pending Accounts State
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccountRecord[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  // Invitations Ledger State
  const [invitations, setInvitations] = useState<EnterpriseInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogRecord[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Create Invitation Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPosition, setNewPosition] = useState('Lead Mason');
  const [newRole, setNewRole] = useState<'admin 1' | 'admin 2' | 'site head' | 'ceo'>('admin 2');
  const [newSiteId, setNewSiteId] = useState('SITE-001');
  const [newExpiryHours, setNewExpiryHours] = useState('48');
  const [newNotes, setNewNotes] = useState('');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [createdInviteToken, setCreatedInviteToken] = useState<string | null>(null);

  // Action status
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const isCeoOrHr = currentRole === 'ceo' || currentRole === 'admin 1';

  const fetchPendingAccounts = async () => {
    setIsLoadingPending(true);
    setActionError(null);
    try {
      const token = localStorage.getItem('DERUEDA_AUTH_TOKEN') || sessionStorage.getItem('DERUEDA_AUTH_TOKEN');
      const response = await fetch('/api/auth/accounts/pending', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPendingAccounts(data.pending_accounts || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingPending(false);
    }
  };

  const fetchInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const token = localStorage.getItem('DERUEDA_AUTH_TOKEN') || sessionStorage.getItem('DERUEDA_AUTH_TOKEN');
      const response = await fetch('/api/auth/invitations', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setInvitations(data.invitations || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const token = localStorage.getItem('DERUEDA_AUTH_TOKEN') || sessionStorage.getItem('DERUEDA_AUTH_TOKEN');
      const response = await fetch('/api/auth/audit-logs?limit=50', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActionError(null);
      setActionSuccess(null);
      setCreatedInviteToken(null);
      fetchPendingAccounts();
      fetchInvitations();
      fetchAuditLogs();
    }
  }, [isOpen]);

  const handleApproveAccount = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(userId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const token = localStorage.getItem('DERUEDA_AUTH_TOKEN') || sessionStorage.getItem('DERUEDA_AUTH_TOKEN');
      const response = await fetch('/api/auth/accounts/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          user_id: userId,
          action,
          notes: action === 'APPROVE' ? 'Approved by HR Lead / CEO' : 'Rejected during onboarding review',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setActionError(data.error || 'Failed to update account status.');
      } else {
        setActionSuccess(
          action === 'APPROVE'
            ? `Account successfully approved! User is now ACTIVE and permitted to log in with MFA.`
            : `Account application rejected.`
        );
        fetchPendingAccounts();
        fetchAuditLogs();
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error communicating with server.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setActionError('Valid email is required.');
      return;
    }

    setIsCreatingInvite(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const token = localStorage.getItem('DERUEDA_AUTH_TOKEN') || sessionStorage.getItem('DERUEDA_AUTH_TOKEN');
      const response = await fetch('/api/auth/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          assigned_position: newPosition,
          assigned_role: newRole,
          assigned_sites: [newSiteId],
          expires_in_hours: parseInt(newExpiryHours, 10),
          notes: newNotes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setActionError(data.error || 'Failed to create invitation.');
      } else {
        setCreatedInviteToken(data.invitation.token);
        setActionSuccess(`Invitation token successfully generated for ${newEmail}.`);
        setNewEmail('');
        setNewNotes('');
        fetchInvitations();
        fetchAuditLogs();
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error.');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    setActionError(null);

    try {
      const token = localStorage.getItem('DERUEDA_AUTH_TOKEN') || sessionStorage.getItem('DERUEDA_AUTH_TOKEN');
      const response = await fetch('/api/auth/invitations/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          invitation_id: invitationId,
          reason: 'Revoked by authorized enterprise administrator',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setActionError(data.error || 'Failed to revoke invitation.');
      } else {
        setActionSuccess('Invitation revoked successfully.');
        fetchInvitations();
        fetchAuditLogs();
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleInvalidateAllSessions = async () => {
    if (!window.confirm('Are you sure you want to invalidate ALL active sessions? Users will be forced to re-authenticate under the new verified identity model.')) {
      return;
    }

    try {
      const token = localStorage.getItem('DERUEDA_AUTH_TOKEN') || sessionStorage.getItem('DERUEDA_AUTH_TOKEN');
      const response = await fetch('/api/auth/sessions/invalidate-all', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setActionSuccess(data.message || 'All sessions successfully invalidated.');
        fetchAuditLogs();
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to invalidate sessions.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-[#0a1128] border border-[#1e3a8a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1e3a8a]/40 flex items-center justify-between bg-[#070d1f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <span>Enterprise Security &amp; Access Control</span>
                <span className="text-[10px] font-mono font-bold bg-[#1e3a8a] text-sky-200 px-2 py-0.5 rounded">
                  Formal Spec Active
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Invitation-Only Onboarding · Pending Approval Gate · Position-Based Access Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Alerts */}
        {actionError && (
          <div className="mx-5 mt-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="mx-5 mt-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e3a8a]/40 bg-[#050914] px-5 gap-2 text-xs font-bold pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'pending'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Approvals</span>
            {pendingAccounts.length > 0 && (
              <span className="ml-1 bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {pendingAccounts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'create'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Issue New Invitation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'ledger'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-sky-400" />
            <span>Invitations Ledger</span>
            <span className="ml-1 bg-sky-500/20 text-sky-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {invitations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'audit'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Security Audit Trail</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 grow">
          {/* TAB 1: PENDING APPROVALS */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Pending Account Applications</h3>
                  <p className="text-[11px] text-slate-400">
                    Registered candidates with valid invitation tokens awaiting explicit HR/CEO activation
                  </p>
                </div>
                <button
                  onClick={fetchPendingAccounts}
                  className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPending ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {pendingAccounts.length === 0 ? (
                <div className="p-8 text-center bg-[#070d1f] border border-[#1e3a8a]/30 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">No Pending Account Approvals</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    All registered employees have been reviewed. Signup grants zero access until approved.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-3.5 bg-[#0b132b] border border-[#1e3a8a]/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{account.name}</span>
                          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                            PENDING APPROVAL
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>
                            Email: <strong className="text-white">{account.email}</strong>
                          </span>
                          <span>
                            Position: <strong className="text-sky-300">{account.position}</strong>
                          </span>
                          <span>
                            Site Scope:{' '}
                            <strong className="text-emerald-300">{account.assignedSites?.join(', ')}</strong>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Registered:{' '}
                          {account.createdAt ? new Date(account.createdAt).toLocaleString() : 'Recent'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveAccount(account.id, 'APPROVE')}
                          disabled={processingId === account.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Approve &amp; Activate</span>
                        </button>
                        <button
                          onClick={() => handleApproveAccount(account.id, 'REJECT')}
                          disabled={processingId === account.id}
                          className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ISSUE NEW INVITATION */}
          {activeTab === 'create' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h3 className="text-sm font-black text-white">Issue Single-Use Corporate Invitation</h3>
                <p className="text-[11px] text-slate-400">
                  Generate an expiring cryptographic invitation token bound strictly to a verified candidate email and job position.
                </p>
              </div>

              {createdInviteToken && (
                <div className="p-4 bg-emerald-950/50 border border-emerald-500/60 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Single-Use Invitation Generated Successfully</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdInviteToken}
                      className="grow bg-[#070d1f] border border-emerald-500/40 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white tracking-wider"
                    />
                    <button
                      onClick={() => copyToClipboard(createdInviteToken)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedToken === createdInviteToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken === createdInviteToken ? 'Copied!' : 'Copy Token'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Forward this token to the candidate. It is valid for {newExpiryHours} hours and can only be used once.
                  </p>
                </div>
              )}

              <form onSubmit={handleCreateInvitation} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Candidate Corporate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                    placeholder="e.g. employee.name@deruedaconstruction.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Assigned Job Position
                    </label>
                    <select
                      value={newPosition}
                      onChange={(e) => {
                        setNewPosition(e.target.value);
                        if (e.target.value.includes('CEO')) setNewRole('ceo');
                        else if (e.target.value.includes('HR')) setNewRole('admin 1');
                        else if (e.target.value.includes('Supervisor') || e.target.value.includes('Head')) setNewRole('site head');
                        else setNewRole('admin 2');
                      }}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10b981]"
                    >
                      <option value="Lead Mason">Lead Mason (Skilled Trade)</option>
                      <option value="Carpenter">Carpenter (Skilled Trade)</option>
                      <option value="Foreman">Foreman (Site Field Ops)</option>
                      <option value="Site Engineer">Site Engineer (Technical Ops)</option>
                      <option value="Safety Officer">Safety Officer (OSHC Compliance)</option>
                      <option value="Timekeeper">Timekeeper (DTR &amp; Canteen)</option>
                      <option value="Project Manager">Project Manager (Site Operations)</option>
                      <option value="Accountant">Accountant (Disbursements)</option>
                      <option value="HR Officer">HR Officer (Workforce &amp; Onboarding)</option>
                      <option value="Executive CEO">Executive CEO (Corporate Oversight)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Assigned Site Scope
                    </label>
                    <select
                      value={newSiteId}
                      onChange={(e) => setNewSiteId(e.target.value)}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10b981]"
                    >
                      <option value="ALL">ALL Sites (Executive &amp; Corporate HR)</option>
                      {sites.map((s) => (
                        <option key={s.site_id} value={s.site_id}>
                          {s.site_id} — {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Access Level / Tier
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10b981]"
                    >
                      <option value="admin 2">admin 2 (Site Ops / Field Workforce)</option>
                      <option value="admin 1">admin 1 (HR Officer / Corporate Admin)</option>
                      <option value="site head">site head (Field Supervisor)</option>
                      <option value="ceo">ceo (Executive Level)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Token Validity Window
                    </label>
                    <select
                      value={newExpiryHours}
                      onChange={(e) => setNewExpiryHours(e.target.value)}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10b981]"
                    >
                      <option value="24">24 Hours (Fast Turnaround)</option>
                      <option value="48">48 Hours (Standard Corporate)</option>
                      <option value="72">72 Hours (Weekend Window)</option>
                      <option value="168">7 Days (Extended Onboarding)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Internal Notes / Justification
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. Approved replacement for foundation phase rebar lead mason on Site 001."
                    className="w-full bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingInvite}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingInvite ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Issue &amp; Sign Cryptographic Invitation</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: INVITATIONS LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Corporate Invitations Registry</h3>
                  <p className="text-[11px] text-slate-400">
                    Comprehensive log of all single-use invitation tokens, statuses, and usage timestamps
                  </p>
                </div>
                <button
                  onClick={fetchInvitations}
                  className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInvitations ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e3a8a]/40 bg-[#070d1f] text-slate-400 font-semibold text-[11px] uppercase">
                      <th className="py-2.5 px-3">Token</th>
                      <th className="py-2.5 px-3">Candidate Email</th>
                      <th className="py-2.5 px-3">Position</th>
                      <th className="py-2.5 px-3">Site Scope</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Expires</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3a8a]/20">
                    {invitations.map((inv) => {
                      const isPending = inv.status === 'PENDING';
                      return (
                        <tr key={inv.id} className="hover:bg-blue-950/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-300">
                            <span className="flex items-center gap-1.5">
                              <span>{inv.token}</span>
                              <button
                                onClick={() => copyToClipboard(inv.token)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                                title="Copy token"
                              >
                                {copiedToken === inv.token ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-white">{inv.email}</td>
                          <td className="py-2.5 px-3 text-slate-300">{inv.assignedPosition}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-400">
                            {inv.assignedSites?.join(', ')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                inv.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : inv.status === 'ACCEPTED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : inv.status === 'REVOKED'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-slate-700/40 text-slate-400'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isPending && (
                              <button
                                onClick={() => handleRevokeInvitation(inv.id)}
                                disabled={processingId === inv.id}
                                className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-bold rounded cursor-pointer disabled:opacity-50"
                              >
                                Revoke
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
          )}

          {/* TAB 4: SECURITY AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Immutable Security Audit Trail</h3>
                  <p className="text-[11px] text-slate-400">
                    Chronological audit records of all authentication events, invitations, and session invalidations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {currentRole === 'ceo' && (
                    <button
                      onClick={handleInvalidateAllSessions}
                      className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                      title="Invalidates all sessions across the enterprise for cutover compliance"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cutover: Invalidate All Sessions</span>
                    </button>
                  )}
                  <button
                    onClick={fetchAuditLogs}
                    className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#070d1f] border border-[#1e3a8a]/30 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 grow">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : log.status === 'BLOCKED'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          by <strong className="text-slate-200">{log.actorEmail}</strong> ({log.actorRole})
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1e3a8a]/40 bg-[#070d1f] flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            De Rueda Construction ERP · Enterprise Security System
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#13241f] hover:bg-[#234338] text-white rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
