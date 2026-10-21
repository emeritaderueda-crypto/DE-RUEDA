import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminUserAccount, AccessPointRole } from '../../types';
import {
  saveUserSpecificPassword,
  getUserSpecificPassword,
  generateBackupCodes,
} from '../../utils/credentials';
import {
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Plus,
  Building,
  Users,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Smartphone,
  AlertTriangle,
  X,
  FileCheck2,
} from 'lucide-react';

export const AdminAccountsSecurityTab: React.FC = () => {
  const {
    adminAccounts,
    updateAdminAccount,
    createAdminAccount,
    sites,
    addAuditLog,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | AccessPointRole>('ALL');

  // Change Password Modal
  const [editingAccount, setEditingAccount] = useState<AdminUserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Backup Codes Modal
  const [viewingBackupCodesAccount, setViewingBackupCodesAccount] = useState<AdminUserAccount | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Account Form Drawer
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    email: '',
    role: 'admin 2' as AccessPointRole,
    assignedSite: 'SITE-001',
    initialPassword: '',
    enableMfa: true,
  });

  // Feedback banner
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  const filteredAccounts = adminAccounts.filter((acc) => {
    if (roleFilter !== 'ALL' && acc.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = acc.name.toLowerCase().includes(q);
      const matchEmail = acc.email.toLowerCase().includes(q);
      const matchSite = acc.assignedSites.join(' ').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchSite) return false;
    }
    return true;
  });

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !newPasswordInput.trim()) return;

    saveUserSpecificPassword(editingAccount.email, newPasswordInput.trim());
    addAuditLog(
      'UPDATE_USER_PASSWORD',
      'ACCESS_CONTROL',
      editingAccount.id,
      `Updated custom credential key for account ${editingAccount.email} (${editingAccount.role})`
    );

    setBannerFeedback(`Unique password updated successfully for ${editingAccount.name}.`);
    setEditingAccount(null);
    setNewPasswordInput('');
    setTimeout(() => setBannerFeedback(null), 4000);
  };

  const handleToggleMfa = (acc: AdminUserAccount) => {
    const nextState = !acc.mfaEnabled;
    const backupCodes = nextState ? generateBackupCodes() : undefined;
    updateAdminAccount(acc.id, {
      mfaEnabled: nextState,
      backupCodes: backupCodes || acc.backupCodes,
    });
    addAuditLog(
      nextState ? 'ENABLE_MFA' : 'DISABLE_MFA',
      'SECURITY_POLICY',
      acc.id,
      `${nextState ? 'Enabled' : 'Disabled'} Two-Factor Authentication for ${acc.email}`
    );
    setBannerFeedback(`2FA ${nextState ? 'Enabled' : 'Disabled'} for ${acc.name}.`);
    setTimeout(() => setBannerFeedback(null), 3000);
  };

  const handleRegenerateBackupCodes = (acc: AdminUserAccount) => {
    const freshCodes = generateBackupCodes();
    updateAdminAccount(acc.id, { backupCodes: freshCodes });
    setViewingBackupCodesAccount({ ...acc, backupCodes: freshCodes });
    addAuditLog(
      'REGENERATE_BACKUP_CODES',
      'SECURITY_POLICY',
      acc.id,
      `Generated 4 fresh one-time recovery codes for ${acc.email}`
    );
    setBannerFeedback(`Generated 4 new backup codes for ${acc.name}.`);
    setTimeout(() => setBannerFeedback(null), 3000);
  };

  const handleCreateNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountForm.name.trim() || !newAccountForm.email.trim() || !newAccountForm.initialPassword.trim()) {
      return;
    }

    const assigned = newAccountForm.role === 'ceo' || newAccountForm.role === 'admin 1' ? ['ALL'] : [newAccountForm.assignedSite];
    const backupCodes = newAccountForm.enableMfa ? generateBackupCodes() : undefined;

    const created = createAdminAccount({
      name: newAccountForm.name.trim(),
      email: newAccountForm.email.trim().toLowerCase(),
      role: newAccountForm.role,
      assignedSites: assigned,
      mfaEnabled: newAccountForm.enableMfa,
      mfaSecret: 'KBSWY3DPEHPK3PXP',
      backupCodes,
      status: 'active',
    });

    saveUserSpecificPassword(created.email, newAccountForm.initialPassword.trim());
    addAuditLog(
      'CREATE_ADMIN_ACCOUNT',
      'ACCESS_CONTROL',
      created.id,
      `Created ${created.role.toUpperCase()} account for ${created.name} (${created.email}). Assigned: ${assigned.join(', ')}`
    );

    setIsNewAccountOpen(false);
    setBannerFeedback(`Admin account created for ${created.name} with site isolation [${assigned.join(', ')}].`);
    setNewAccountForm({
      name: '',
      email: '',
      role: 'admin 2',
      assignedSite: 'SITE-001',
      initialPassword: '',
      enableMfa: true,
    });
    setTimeout(() => setBannerFeedback(null), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Feedback */}
      {bannerFeedback && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerFeedback}</span>
          </div>
          <button onClick={() => setBannerFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Overview & Policy Card */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                  Multiple Admin Accounts &amp; Site-Level Isolation
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  SPECIFICATION SECTION 8
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  DOLE &amp; ISO 9001 AUDITED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Enforces individual identities for every supervisor and administrator. Site-scoped Admin 2 accounts are strictly restricted to their designated physical projects (e.g. Mariveles, Subic, Balanga) on both client-side navigation and server-side RPC middleware.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNewAccountOpen(!isNewAccountOpen)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#10b981] hover:from-emerald-500 hover:to-[#059669] text-[#080f0d] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Site-Scoped Admin 2</span>
          </button>
        </div>

        {/* Role & Hub Access Matrix Table (Sec 2 & 3) */}
        <div className="mt-5 pt-4 border-t border-[#234338]">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Role &amp; Operations Hub Access Matrix
          </div>
          <div className="border border-[#234338] rounded-lg overflow-x-auto bg-[#080f0d]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#13241f] text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-[#234338]">
                <tr>
                  <th className="p-2.5">Corporate Role</th>
                  <th className="p-2.5">Restricted CEO Vault</th>
                  <th className="p-2.5">Executive Distribution Hub</th>
                  <th className="p-2.5">Site-Scoped Payment Hub</th>
                  <th className="p-2.5">Site Boundary Permission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#234338] text-[11px]">
                <tr className="hover:bg-[#13241f]/40">
                  <td className="p-2.5 font-bold text-amber-300">CEO (Emerita De Rueda)</td>
                  <td className="p-2.5 text-emerald-400 font-semibold">Full Unlocked Access</td>
                  <td className="p-2.5 text-emerald-400 font-semibold">Full Executive Access</td>
                  <td className="p-2.5 text-emerald-400 font-semibold">All Sites Access</td>
                  <td className="p-2.5 text-slate-300 font-mono">ALL (Company-wide)</td>
                </tr>
                <tr className="hover:bg-[#13241f]/40">
                  <td className="p-2.5 font-bold text-blue-300">Admin 1 (HR Lead)</td>
                  <td className="p-2.5 text-rose-400 font-semibold">Blocked (403)</td>
                  <td className="p-2.5 text-emerald-400 font-semibold">Company-wide Payroll &amp; Meals</td>
                  <td className="p-2.5 text-rose-400 font-semibold">Blocked (403)</td>
                  <td className="p-2.5 text-slate-300 font-mono">ALL (Company-wide Payroll)</td>
                </tr>
                <tr className="hover:bg-[#13241f]/40">
                  <td className="p-2.5 font-bold text-teal-300">Admin 2 (Site Ops / Foreman)</td>
                  <td className="p-2.5 text-rose-400 font-semibold">Blocked (403)</td>
                  <td className="p-2.5 text-rose-400 font-semibold">Blocked (403)</td>
                  <td className="p-2.5 text-emerald-400 font-semibold">Assigned Site Salary Payouts</td>
                  <td className="p-2.5 text-amber-400 font-mono font-bold">Strictly Assigned Site ONLY</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Account Creation Drawer */}
      {isNewAccountOpen && (
        <form
          onSubmit={handleCreateNewAccount}
          className="bg-[#11211b] border-2 border-emerald-500/40 rounded-xl p-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Register Site-Scoped Admin 2 Account
            </span>
            <button
              type="button"
              onClick={() => setIsNewAccountOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name &amp; Title *</label>
              <input
                type="text"
                required
                value={newAccountForm.name}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                placeholder="e.g. Engr. Joseph Ramos (Site Ops)"
                className="w-full bg-[#080f0d] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email Address *</label>
              <input
                type="email"
                required
                value={newAccountForm.email}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, email: e.target.value })}
                placeholder="e.g. admin2.mariveles2@deruedaconstruction.com"
                className="w-full bg-[#080f0d] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Project Site Boundary *</label>
              <select
                value={newAccountForm.assignedSite}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, assignedSite: e.target.value })}
                className="w-full bg-[#080f0d] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                {sites.map((s) => (
                  <option key={s.site_id} value={s.site_id}>
                    {s.site_id} &bull; {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={newAccountForm.initialPassword}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, initialPassword: e.target.value })}
                placeholder="Enter unique password..."
                className="w-full bg-[#080f0d] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="enableMfa"
                checked={newAccountForm.enableMfa}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, enableMfa: e.target.checked })}
                className="rounded border-[#234338] text-emerald-500 focus:ring-0"
              />
              <label htmlFor="enableMfa" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Enable Two-Factor Authentication (MFA) &amp; Generate Backup Codes
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewAccountOpen(false)}
              className="px-4 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#10b981] text-[#080f0d] font-bold text-xs uppercase rounded-lg hover:from-emerald-500 hover:to-[#059669]"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-white text-[#080f0d]'
                : 'bg-[#13241f] text-slate-300 hover:text-white border border-[#234338]'
            }`}
          >
            All Accounts ({adminAccounts.length})
          </button>
          <button
            onClick={() => setRoleFilter('ceo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleFilter === 'ceo'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#13241f] text-amber-300 hover:text-white border border-[#234338]'
            }`}
          >
            CEO (Emerita)
          </button>
          <button
            onClick={() => setRoleFilter('admin 1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleFilter === 'admin 1'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-[#13241f] text-blue-300 hover:text-white border border-[#234338]'
            }`}
          >
            Admin 1 (HR Lead)
          </button>
          <button
            onClick={() => setRoleFilter('admin 2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleFilter === 'admin 2'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-[#13241f] text-emerald-300 hover:text-white border border-[#234338]'
            }`}
          >
            Admin 2 (Site Ops)
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, email, or site..."
          className="bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 w-full sm:w-64"
        />
      </div>

      {/* Accounts List Table */}
      <div className="border border-[#234338] rounded-xl overflow-hidden bg-[#0c1613]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#13241f] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-[#234338]">
              <tr>
                <th className="p-3">Administrator</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Site Isolation</th>
                <th className="p-3">2FA / MFA</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]">
              {filteredAccounts.map((acc) => {
                const isCurrent = currentUser?.email?.toLowerCase() === acc.email.toLowerCase();
                const isSiteScoped = acc.role === 'admin 2';

                return (
                  <tr key={acc.id} className="hover:bg-[#13241f]/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{acc.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{acc.email}</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {acc.role === 'ceo' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          CEO
                        </span>
                      ) : acc.role === 'admin 1' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          Admin 1 (HR)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          Admin 2 (Site Ops)
                        </span>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {acc.assignedSites.includes('ALL') ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ALL (Company-wide)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 flex-wrap">
                          {acc.assignedSites.map((s) => {
                            const siteObj = sites.find((site) => site.site_id === s);
                            return (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                title={`Physical boundary locked to ${siteObj?.name || s}`}
                              >
                                {s} {siteObj ? `(${siteObj.name.split(' ')[0]})` : ''}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {acc.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Enabled (TOTP)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {acc.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingAccount(acc);
                            setNewPasswordInput('');
                          }}
                          className="px-2.5 py-1 bg-[#13241f] border border-[#234338] hover:border-amber-400 text-amber-300 rounded text-xs font-semibold cursor-pointer"
                          title="Set unique account password"
                        >
                          Password
                        </button>

                        <button
                          onClick={() => handleToggleMfa(acc)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer ${
                            acc.mfaEnabled
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          }`}
                        >
                          {acc.mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </button>

                        {acc.mfaEnabled && (
                          <button
                            onClick={() => setViewingBackupCodesAccount(acc)}
                            className="px-2.5 py-1 bg-[#13241f] border border-[#234338] hover:border-slate-400 text-slate-300 rounded text-xs font-semibold cursor-pointer"
                            title="View one-time emergency backup recovery codes"
                          >
                            Backup Codes
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewPassword}
            className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div>
                <h3 className="text-base font-bold text-white uppercase">Set Account Password</h3>
                <p className="text-xs text-slate-400">{editingAccount.name} ({editingAccount.email})</p>
              </div>
              <button type="button" onClick={() => setEditingAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Unique Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new account password..."
                  className="w-full bg-[#080f0d] border border-[#234338] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Per Sec 2.3: Each admin account maintains their own individual password and identity, removing reliance on shared master credentials.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="px-4 py-2 bg-[#13241f] border border-[#234338] text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-lg"
              >
                Save Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Backup Codes Modal */}
      {viewingBackupCodesAccount && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div>
                <h3 className="text-base font-bold text-white uppercase flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  One-Time Backup Recovery Codes
                </h3>
                <p className="text-xs text-slate-400">{viewingBackupCodesAccount.name}</p>
              </div>
              <button type="button" onClick={() => setViewingBackupCodesAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              These single-use recovery codes allow the user to unlock their account or access operational hubs if their primary TOTP device is unavailable. Each code can only be used once.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(viewingBackupCodesAccount.backupCodes || []).map((code) => (
                <div
                  key={code}
                  onClick={() => copyToClipboard(code)}
                  className="p-2.5 bg-[#080f0d] border border-[#234338] rounded-lg font-mono text-xs text-emerald-400 font-bold text-center cursor-pointer hover:border-emerald-400 transition-colors flex items-center justify-between"
                >
                  <span>{code}</span>
                  {copiedCode === code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRegenerateBackupCodes(viewingBackupCodesAccount)}
                className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-amber-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Codes</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingBackupCodesAccount(null)}
                className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
