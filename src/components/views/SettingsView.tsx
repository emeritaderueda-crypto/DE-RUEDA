import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Save, KeyRound, Shield, Building2, CheckCircle2, LogOut, RotateCcw, Lock, Eye, EyeOff } from 'lucide-react';
import {
  getStoredPassword,
  saveStoredPassword,
  resetCredentialsToDefault,
  DEFAULT_CREDENTIALS,
} from '../../utils/credentials';
import { AccessPointRole } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, addAuditLog, currentUser, logout } = useApp();

  const [companyForm, setCompanyForm] = useState({
    company_name: settings.company_name,
    company_address: settings.company_address,
    contact_email: settings.contact_email,
    contact_phone: settings.contact_phone,
    master_drive_link: settings.master_drive_link,
  });

  const [rulesForm, setRulesForm] = useState({
    work_hours_standard: settings.work_hours_standard,
    break_minutes: settings.break_minutes,
    break_schedule: settings.break_schedule,
    anti_duplicate_minutes: settings.anti_duplicate_minutes,
    sss_default_rate: settings.sss_default_rate,
    philhealth_default_rate: settings.philhealth_default_rate,
  });

  const [pwForm, setPwForm] = useState({
    access_point: 'ceo',
    current_password: '',
    new_password: '',
  });

  const [revealedRoles, setRevealedRoles] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

  const toggleRoleKeyReveal = (role: string) => {
    setRevealedRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(companyForm);
    setFeedback('Company information updated successfully.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleRulesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(rulesForm);
    setFeedback('Operational timekeeping & payroll rules updated.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback('');
    const role = pwForm.access_point as AccessPointRole;
    const currentExpected = getStoredPassword(role);

    if (pwForm.current_password.trim() !== currentExpected) {
      setErrorFeedback(`Incorrect current password for ${role.toUpperCase()}. Verification failed.`);
      return;
    }

    if (!pwForm.new_password.trim()) {
      setErrorFeedback('New password cannot be empty.');
      return;
    }

    saveStoredPassword(role, pwForm.new_password.trim());
    addAuditLog('CHANGE_PASSWORD', 'CREDENTIALS', role, `Updated access key for ${role}`);
    setFeedback(`Security master key updated for ${role.toUpperCase()}.`);
    setPwForm({ access_point: role, current_password: '', new_password: '' });
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleResetCredentials = () => {
    resetCredentialsToDefault();
    setFeedback('Master credentials reset to factory default policy.');
    setPwForm({ access_point: 'ceo', current_password: '', new_password: '' });
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Enterprise System Settings
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Operational Parameters, Shift Schedules & Security Keys</span>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Company Profile Card */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#234338] mb-4">
              <Building2 className="w-4 h-4 text-[#a3e635]" />
              <h2 className="text-sm font-bold text-white">Company Identity & Public Information</h2>
            </div>

            <form onSubmit={handleCompanySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Corporate Name</label>
                <input
                  type="text"
                  required
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Head Office Address</label>
                <input
                  type="text"
                  required
                  value={companyForm.company_address}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_address: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={companyForm.contact_email}
                    onChange={(e) => setCompanyForm({ ...companyForm, contact_email: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={companyForm.contact_phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, contact_phone: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Master Google Drive Vault URL</label>
                <input
                  type="url"
                  required
                  value={companyForm.master_drive_link}
                  onChange={(e) => setCompanyForm({ ...companyForm, master_drive_link: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Company Info
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Operational & Break Rules Card */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#234338] mb-4">
              <Settings className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Shift Standards & Break Calculation Rules</h2>
            </div>

            <form onSubmit={handleRulesSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Standard Work Hours / Shift</label>
                  <input
                    type="number"
                    required
                    value={rulesForm.work_hours_standard}
                    onChange={(e) => setRulesForm({ ...rulesForm, work_hours_standard: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Break Minutes Deducted</label>
                  <input
                    type="number"
                    required
                    value={rulesForm.break_minutes}
                    onChange={(e) => setRulesForm({ ...rulesForm, break_minutes: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mandatory Break Schedule</label>
                <input
                  type="text"
                  required
                  value={rulesForm.break_schedule}
                  onChange={(e) => setRulesForm({ ...rulesForm, break_schedule: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                />
                <div className="text-[10px] text-slate-500 mt-1">Deducts 90 minutes (1.5 hours) from elapsed turnstile shift</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Anti-Duplicate Window (Mins)</label>
                  <input
                    type="number"
                    required
                    value={rulesForm.anti_duplicate_minutes}
                    onChange={(e) => setRulesForm({ ...rulesForm, anti_duplicate_minutes: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SSS Employee Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={rulesForm.sss_default_rate}
                    onChange={(e) => setRulesForm({ ...rulesForm, sss_default_rate: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669] flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Update Shift Rules
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Password Management */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#234338]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Access Point Security & Credential Governance</h2>
            </div>
            <button
              type="button"
              onClick={handleResetCredentials}
              className="text-xs text-slate-400 hover:text-[#a3e635] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset passwords to system defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to DRC Defaults</span>
            </button>
          </div>

          {/* Protected Credential Badges (Strict Security Policy: Never Display Plaintext Keys) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['ceo', 'admin 1', 'admin 2'] as AccessPointRole[]).map((r) => {
              const isUserRole = currentUser?.access_point === r;
              return (
                <div
                  key={r}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isUserRole
                      ? 'bg-[#13241f] border-[#a3e635]/40 text-white'
                      : 'bg-[#080f0d] border-[#234338] text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {DEFAULT_CREDENTIALS[r].label}
                    </div>
                    <div className="font-mono font-bold text-xs text-[#a3e635] mt-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Protected &amp; Encrypted</span>
                    </div>
                  </div>
                  {isUserRole && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#a3e635] text-[#080f0d] rounded">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs max-w-xl">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Access Point</label>
                <select
                  value={pwForm.access_point}
                  onChange={(e) => setPwForm({ ...pwForm, access_point: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white uppercase font-bold"
                >
                  <option value="ceo">CEO</option>
                  <option value="admin 1">Admin 1</option>
                  <option value="admin 2">Admin 2</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  placeholder="Current"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  placeholder="New password"
                />
              </div>
            </div>

            {errorFeedback && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {errorFeedback}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-[#13241f] border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Update Access Point Key
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setFeedback('Successfully logged out of current access point.');
                    setTimeout(() => setFeedback(''), 3000);
                  }}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Log Out ({currentUser.access_point.toUpperCase()})</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
