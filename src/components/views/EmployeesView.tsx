import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { generateSvgQRCode, generateQrDataUrl } from '../../utils/qrGenerator';
import {
  UserPlus,
  QrCode,
  Search,
  Filter,
  Edit,
  Archive,
  RefreshCw,
  Printer,
  Download,
  X,
  CreditCard,
  HardHat,
  ExternalLink,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const {
    employees,
    sites,
    currentSite,
    addEmployee,
    updateEmployee,
    archiveEmployee,
    rehireEmployee,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState(currentSite);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'archived'>('active');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [badgeEmp, setBadgeEmp] = useState<Employee | null>(null);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    position: 'Lead Mason / Foreman',
    daily_rate: 750,
    site_id: 'SITE-001',
    email: '',
    contact_number: '',
    sss_number: '',
    philhealth_number: '',
    gcash_number: '',
    drive_link: '',
  });

  const filtered = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesQ =
      emp.name.toLowerCase().includes(q) ||
      emp.employee_id.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q);

    const matchesSite = siteFilter === 'ALL' || emp.site_id === siteFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesQ && matchesSite && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addEmployee({
      name: formData.name.trim(),
      position: formData.position.trim(),
      daily_rate: Number(formData.daily_rate),
      site_id: formData.site_id,
      email: formData.email.trim(),
      contact_number: formData.contact_number.trim(),
      sss_number: formData.sss_number.trim(),
      philhealth_number: formData.philhealth_number.trim(),
      gcash_number: formData.gcash_number.trim(),
      drive_link: formData.drive_link.trim(),
      status: 'active',
    });
    setIsAddOpen(false);
    setBadgeEmp(created);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    updateEmployee(editingEmp.employee_id, editingEmp);
    setEditingEmp(null);
  };

  const handleDownloadQrPng = async (emp: Employee) => {
    try {
      const payload = JSON.stringify({ employee_id: emp.employee_id, qr_version: emp.qr_version });
      const dataUrl = await generateQrDataUrl(payload, 400);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `DRC_Badge_QR_${emp.employee_id}_v${emp.qr_version}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.warn('QR download error:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Employee Masterlist & HR Management
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Automated ID Sequence: <strong className="text-white font-mono">DRC-EMP-YYYY-000001</strong></span>
            <span>·</span>
            <span>Government IDs & Automatic QR Life-Cycle</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBatchOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-[#a3e635]" />
            Print Batch Badges
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            + Add New Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID number, trade..."
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Project Sites</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Workers</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          Showing {filtered.length} workers
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Employee ID</th>
                <th className="p-3">Full Name & Contact</th>
                <th className="p-3">Trade / Position</th>
                <th className="p-3">Site</th>
                <th className="p-3 text-right">Daily Rate</th>
                <th className="p-3">Govt & GCash IDs</th>
                <th className="p-3 text-center">QR Ver</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No employees matching the search filters.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-[#13241f]/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#a3e635] whitespace-nowrap">
                      {emp.employee_id}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{emp.name}</div>
                      <div className="text-[11px] text-slate-400">{emp.contact_number || emp.email}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{emp.position}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-300">{emp.site_id}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ₱{emp.daily_rate.toFixed(2)}
                    </td>
                    <td className="p-3 text-[11px] text-slate-400 space-y-0.5 font-mono">
                      <div>SSS: {emp.sss_number || 'N/A'}</div>
                      <div>PhilHealth: {emp.philhealth_number || 'N/A'}</div>
                      <div className="text-slate-300">GCash: {emp.gcash_number || 'None'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold text-[#a3e635]">v{emp.qr_version}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          emp.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setBadgeEmp(emp)}
                          className="px-2 py-1 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-[#a3e635] rounded-md text-[11px] font-semibold flex items-center gap-1"
                          title="View & Print ID Badge"
                        >
                          <CreditCard className="w-3 h-3 text-[#a3e635]" />
                          ID Badge
                        </button>
                        <button
                          onClick={() => setEditingEmp(emp)}
                          className="p-1.5 hover:bg-[#13241f] rounded-md text-slate-400 hover:text-white"
                          title="Edit Employee"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {emp.status === 'active' ? (
                          <button
                            onClick={() => archiveEmployee(emp.employee_id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-md text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
                            title="Archive Worker"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const newOne = rehireEmployee(emp.employee_id);
                              setBadgeEmp(newOne);
                            }}
                            className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Rehire Worker"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Rehire
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#a3e635]" />
                <span>Register New Construction Employee</span>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Manuel R. Gomez"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trade / Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Lead Mason / Welder"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Project Site *</label>
                  <select
                    value={formData.site_id}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daily Wage Rate (PHP) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="+63 917 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gmail / Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="worker@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SSS Number</label>
                  <input
                    type="text"
                    value={formData.sss_number}
                    onChange={(e) => setFormData({ ...formData, sss_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="34-XXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PhilHealth Number</label>
                  <input
                    type="text"
                    value={formData.philhealth_number}
                    onChange={(e) => setFormData({ ...formData, philhealth_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="12-XXXXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GCash Registered No.</label>
                  <input
                    type="tel"
                    value={formData.gcash_number}
                    onChange={(e) => setFormData({ ...formData, gcash_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="0917XXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee Drive Folder / Docs Link</label>
                <input
                  type="url"
                  value={formData.drive_link}
                  onChange={(e) => setFormData({ ...formData, drive_link: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  placeholder="https://drive.google.com/drive/folders/..."
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16]"
                >
                  Generate ID & Print Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
              <div className="font-bold text-white text-sm">
                Edit Employee Record: <span className="text-[#a3e635] font-mono">{editingEmp.employee_id}</span>
              </div>
              <button onClick={() => setEditingEmp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-2.5 rounded-lg text-emerald-300 text-[11px]">
                <strong>Site Reassignment Rule:</strong> If you change the assigned site, the QR code version automatically increments and the previous QR becomes inactive.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.name}
                    onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trade / Position *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.position}
                    onChange={(e) => setEditingEmp({ ...editingEmp, position: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Project Site *</label>
                  <select
                    value={editingEmp.site_id}
                    onChange={(e) => setEditingEmp({ ...editingEmp, site_id: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daily Wage Rate (PHP) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingEmp.daily_rate}
                    onChange={(e) => setEditingEmp({ ...editingEmp, daily_rate: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editingEmp.contact_number}
                    onChange={(e) => setEditingEmp({ ...editingEmp, contact_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GCash Number</label>
                  <input
                    type="tel"
                    value={editingEmp.gcash_number}
                    onChange={(e) => setEditingEmp({ ...editingEmp, gcash_number: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ID Card & QR Badge Preview Modal */}
      {badgeEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setBadgeEmp(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white no-print"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 no-print">
              <h2 className="text-lg font-bold text-white">Official Worker Badge & QR Matrix</h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Physical Turnstile Card &bull; Formatted for High-Contrast Direct Thermal/Color ID Card Printers
              </div>
            </div>

            {/* Printable Cards (Front and Back) */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {/* Front Badge */}
              <div className="w-[260px] h-[380px] bg-white text-[#0f291e] border-2 border-[#1b4332] rounded-xl overflow-hidden flex flex-col shadow-xl">
                <div className="bg-[#0f291e] p-3 text-center border-b-2 border-[#a3e635]">
                  <div className="font-black text-xs text-[#a3e635] tracking-wider">DE RUEDA CONSTRUCTION</div>
                  <div className="text-[8px] text-emerald-200 uppercase font-semibold">Authorized Field Identification</div>
                </div>

                <div className="p-4 flex-1 flex flex-col items-center justify-between">
                  <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-[#0f291e] flex items-center justify-center text-slate-500 font-bold text-2xl">
                    <HardHat className="w-10 h-10 text-emerald-800" />
                  </div>

                  <div className="text-center">
                    <div className="font-extrabold text-sm text-slate-900 leading-tight">{badgeEmp.name}</div>
                    <div className="text-xs text-emerald-800 font-bold mt-0.5">{badgeEmp.position}</div>
                  </div>

                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
                    <div className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold">Employee ID Key</div>
                    <div className="font-mono font-bold text-xs text-slate-900">{badgeEmp.employee_id}</div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] text-slate-600 border-t border-slate-200 pt-2 font-medium">
                    <span>Site: <strong>{badgeEmp.site_id}</strong></span>
                    <span>Valid: <strong>2027</strong></span>
                  </div>
                </div>
              </div>

              {/* Back Badge with QR */}
              <div className="w-[260px] h-[380px] bg-white text-[#0f291e] border-2 border-[#1b4332] rounded-xl overflow-hidden flex flex-col shadow-xl">
                <div className="bg-[#0f291e] p-2 text-center border-b-2 border-[#a3e635]">
                  <div className="font-extrabold text-[11px] text-[#a3e635]">TIMEKEEPING QR CODE</div>
                  <div className="text-[8px] text-emerald-200">Version {badgeEmp.qr_version} &bull; Turnstile Scanner</div>
                </div>

                <div className="p-4 flex-1 flex flex-col items-center justify-between">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generateSvgQRCode(
                        JSON.stringify({ employee_id: badgeEmp.employee_id, qr_version: badgeEmp.qr_version }),
                        150
                      ),
                    }}
                  />

                  <div className="text-center text-[9px] text-slate-600 px-2 leading-relaxed">
                    Scan on site entry tablet or turnstile camera for Time In and Time Out.
                  </div>

                  <div className="w-full text-center font-mono text-[8px] text-slate-400 border-t border-slate-100 pt-1.5 truncate">
                    PAYLOAD: {badgeEmp.employee_id}-v{badgeEmp.qr_version}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Physical Badge
              </button>
              <button
                onClick={() => handleDownloadQrPng(badgeEmp)}
                className="px-4 py-2 bg-[#10b981] text-white font-bold text-xs rounded-lg hover:bg-[#059669] flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download QR (PNG)
              </button>
              <button
                onClick={() => setBadgeEmp(null)}
                className="px-4 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Badges Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#234338] no-print">
              <div>
                <h2 className="text-base font-bold text-white">Batch Printable ID Badges</h2>
                <div className="text-xs text-slate-400">All {filtered.length} currently filtered workers ready for batch printing</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print All Badges
                </button>
                <button onClick={() => setIsBatchOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((emp) => (
                <div
                  key={emp.employee_id}
                  className="bg-white text-slate-900 border border-slate-300 rounded-lg p-3 text-center flex flex-col items-center justify-between shadow-xs"
                >
                  <div className="w-full bg-[#0f291e] text-[#a3e635] font-black text-[10px] py-1 rounded-sm">
                    DE RUEDA CONSTRUCTION
                  </div>
                  <div className="mt-2 font-extrabold text-xs text-slate-900">{emp.name}</div>
                  <div className="text-[10px] text-emerald-800 font-semibold">{emp.position}</div>
                  <div className="font-mono text-[9px] text-slate-500 font-bold">{emp.employee_id}</div>
                  <div
                    className="my-2"
                    dangerouslySetInnerHTML={{
                      __html: generateSvgQRCode(
                        JSON.stringify({ employee_id: emp.employee_id, qr_version: emp.qr_version }),
                        100
                      ),
                    }}
                  />
                  <div className="text-[8px] text-slate-500">QR Version {emp.qr_version} &bull; {emp.site_id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
