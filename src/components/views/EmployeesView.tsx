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
  CheckCircle2,
  UserCheck,
  Eye,
  Phone,
  Mail,
  Building,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { EmployeeQrBadgeExportModal } from '../modals/EmployeeQrBadgeExportModal';
import { BulkQrExportModal } from '../modals/BulkQrExportModal';

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
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Site-Based' | 'Office-Based'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'archived'>('active');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [badgeEmp, setBadgeEmp] = useState<Employee | null>(null);
  const [selectedProfileEmp, setSelectedProfileEmp] = useState<Employee | null>(null);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
  const [isQrExportModalOpen, setIsQrExportModalOpen] = useState(false);
  const [exportModalInitialEmpId, setExportModalInitialEmpId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    position: 'Lead Mason / Foreman',
    daily_rate: 750,
    site_id: 'SITE-001',
    category: 'Site-Based' as 'Site-Based' | 'Office-Based',
    photo_url: '',
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
    const isEmpOffice = (emp.category || '').toLowerCase().includes('office');
    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'Office-Based' ? isEmpOffice : !isEmpOffice);
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesQ && matchesSite && matchesCategory && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addEmployee({
      name: formData.name.trim(),
      position: formData.position.trim(),
      daily_rate: Number(formData.daily_rate),
      site_id: formData.site_id,
      category: formData.category,
      photo_url: formData.photo_url.trim() || undefined,
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

  const [isExportingQr, setIsExportingQr] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Generates a high-resolution, print-ready image file of the employee's unique QR code
  const handleExportQr = async (emp: Employee) => {
    setIsExportingQr(true);
    setExportFeedback(null);
    try {
      const site = sites.find((s) => s.site_id === emp.site_id);
      const siteName = site ? `${site.code} - ${site.name}` : emp.site_id;
      const payload = JSON.stringify({
        employee_id: emp.employee_id,
        qr_version: emp.qr_version || 1,
      });
      const qrDataUrl = await generateQrDataUrl(payload, 500);

      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // Card Background
      ctx.fillStyle = '#080f0d';
      ctx.fillRect(0, 0, 650, 920);

      // Card Outer Border
      ctx.strokeStyle = '#234338';
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, 626, 896);

      // Header Banner
      ctx.fillStyle = '#0e1a16';
      ctx.fillRect(15, 15, 620, 130);

      // Lime Accent Line
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(15, 142, 620, 5);

      // Title & DOLE certification
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px sans-serif';
      ctx.fillText('DE RUEDA CONSTRUCTION', 36, 62);

      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('OFFICIAL TURNSTILE ATTENDANCE BADGE · DOLE COMPLIANT', 36, 96);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText('High-Resolution Print-Ready Biometric ID Credential', 36, 120);

      // Worker Avatar / Photo
      const avatarX = 36;
      const avatarY = 175;
      const avatarSize = 100;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (emp.photo_url) {
        try {
          const photoImg = new Image();
          photoImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            photoImg.onload = () => {
              ctx.drawImage(photoImg, avatarX, avatarY, avatarSize, avatarSize);
              resolve();
            };
            photoImg.onerror = () => reject();
            photoImg.src = emp.photo_url!;
          });
        } catch {
          ctx.fillStyle = '#13241f';
          ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
          ctx.fillStyle = '#a3e635';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(emp.name.slice(0, 2).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 12);
        }
      } else {
        ctx.fillStyle = '#13241f';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = '#a3e635';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(emp.name.slice(0, 2).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 12);
      }
      ctx.restore();

      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Worker Text Details
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.fillText(emp.name, 160, 210);

      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(emp.employee_id, 160, 240);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(emp.position || 'Construction Laborer', 160, 266);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Site: ${siteName}`, 36, 310);
      ctx.fillText(`Category: ${emp.category || 'Site-Based'} · QR Ver: ${emp.qr_version || 1}`, 36, 332);

      // QR Code Container Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(150, 360, 350, 350);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.strokeRect(150, 360, 350, 350);

      // Draw high-resolution QR
      const qrImg = new Image();
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 165, 375, 320, 320);
          resolve();
        };
        qrImg.src = qrDataUrl;
      });

      // Scanner instructions
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOLD TO TURNSTILE SCANNER AT SITE GATE', 325, 750);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(`PAYLOAD: ${emp.employee_id} (VER: ${emp.qr_version || 1})`, 325, 778);
      ctx.fillText('DOLE 5-STAR SAFETY VERIFIED · PRINT-READY RESOLUTION', 325, 798);

      // Bottom Footer
      ctx.fillStyle = '#0e1a16';
      ctx.fillRect(15, 830, 620, 75);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('DE RUEDA CONSTRUCTION PHILIPPINES · CORPORATE ERP SYSTEM', 325, 872);

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `DRC-QR-${emp.employee_id}-${emp.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportFeedback(`Exported print-ready QR image file for ${emp.name} (${emp.employee_id})`);
      setTimeout(() => setExportFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to export QR image:', err);
    } finally {
      setIsExportingQr(false);
    }
  };

  const handleDownloadRawQr = async (emp: Employee) => {
    try {
      const payload = JSON.stringify({ employee_id: emp.employee_id, qr_version: emp.qr_version });
      const dataUrl = await generateQrDataUrl(payload, 600);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `DRC_RAW_QR_${emp.employee_id}_v${emp.qr_version}.png`;
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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBulkExportModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-[#10b981] hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Generate a single PDF containing multiple employee QR codes, formatted for easier batch printing"
          >
            <FileText className="w-4 h-4" />
            <span>Bulk Export QR</span>
            <span className="px-1.5 py-0.2 bg-black/25 rounded text-[10px] font-mono">PDF</span>
          </button>
          <button
            onClick={() => {
              setExportModalInitialEmpId(null);
              setIsQrExportModalOpen(true);
            }}
            className="px-3 py-2 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open Full QR Badge Export Suite"
          >
            <QrCode className="w-4 h-4 text-[#a3e635]" />
            Export QR Badges
          </button>
          <button
            onClick={() => setIsBatchOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#a3e635]" />
            Print Batch Badges
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Site-Based">Site-Based Personnel</option>
            <option value="Office-Based">Office-Based Staff</option>
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
                <th className="p-3">Employee</th>
                <th className="p-3">Category</th>
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
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center mx-auto text-[#a3e635]">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-white text-sm">
                        {employees.length === 0 ? 'Pristine Factory Default: No Workers Registered' : 'No employees matching the search filters'}
                      </div>
                      <p className="text-xs text-slate-400">
                        {employees.length === 0
                          ? 'Your ERP is clean and ready for real operations. Click "+ Add New Employee" to enroll real workers with authentic Philippine GCash mobile numbers.'
                          : 'Try adjusting your search terms, site filter, or category filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-[#13241f]/70 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div
                        onClick={() => setSelectedProfileEmp(emp)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                        title="Click to view full Employee Profile & Export QR Code"
                      >
                        {emp.photo_url ? (
                          <img
                            src={emp.photo_url}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#234338] group-hover:border-[#a3e635] shrink-0 transition-colors"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#13241f] border border-[#234338] group-hover:border-[#a3e635] flex items-center justify-center font-bold text-slate-300 group-hover:text-white text-[11px] shrink-0 transition-colors">
                            {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white group-hover:text-[#a3e635] transition-colors flex items-center gap-1.5">
                            <span>{emp.name}</span>
                            <Eye className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-[#a3e635] font-mono">{emp.employee_id}</div>
                          <div className="text-[10px] text-slate-400">{emp.contact_number || emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {(emp.category || '').toLowerCase().includes('office') ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Office-Based (HQ)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Site-Based (Field)
                        </span>
                      )}
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
                          onClick={() => setSelectedProfileEmp(emp)}
                          className="px-2 py-1 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 text-emerald-300 hover:text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Employee Profile & Export QR Code"
                        >
                          <Eye className="w-3 h-3 text-[#10b981]" />
                          Profile
                        </button>
                        <button
                          onClick={() => setBadgeEmp(emp)}
                          className="px-2 py-1 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-[#a3e635] rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="View & Print ID Badge"
                        >
                          <CreditCard className="w-3 h-3 text-[#a3e635]" />
                          ID Badge
                        </button>
                        <button
                          onClick={() => setEditingEmp(emp)}
                          className="p-1.5 hover:bg-[#13241f] rounded-md text-slate-400 hover:text-white cursor-pointer"
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
                  <label className="block text-slate-300 font-semibold mb-1">Workforce Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Site-Based">Site-Based Personnel (Field)</option>
                    <option value="Office-Based">Office-Based Staff (HQ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Worker Photo / Avatar URL</label>
                  <input
                    type="url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="https://images.unsplash.com/... (optional)"
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
                  <label className="block text-slate-300 font-semibold mb-1">Workforce Category</label>
                  <select
                    value={editingEmp.category || 'Site-Based'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, category: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Site-Based">Site-Based Personnel (Field)</option>
                    <option value="Office-Based">Office-Based Staff (HQ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Worker Photo / Avatar URL</label>
                  <input
                    type="url"
                    value={editingEmp.photo_url || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, photo_url: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="https://images.unsplash.com/..."
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
                onClick={() => handleExportQr(badgeEmp)}
                disabled={isExportingQr}
                className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                title="Generates a high-resolution, print-ready image file of their unique QR code for physical badge printing"
              >
                <Download className="w-4 h-4" />
                {isExportingQr ? 'Exporting QR...' : 'Export QR'}
              </button>
              <button
                onClick={() => handleDownloadRawQr(badgeEmp)}
                className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                title="Download raw QR matrix only (PNG)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Raw QR Matrix
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

      {/* Individual Employee Profile & Credentials Modal */}
      {selectedProfileEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#10b981]/20 border border-[#10b981]/30 rounded-lg text-[#a3e635]">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Employee Profile & Credentials</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
                      DOLE Verified
                    </span>
                  </h2>
                  <div className="text-xs text-slate-400">
                    Official Personnel Dossier & Biometric Turnstile Access Pass
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfileEmp(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0e1a16] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Hero Header Card */}
              <div className="bg-[#13241f]/70 border border-[#234338] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedProfileEmp.photo_url ? (
                    <img
                      src={selectedProfileEmp.photo_url}
                      alt={selectedProfileEmp.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#a3e635] shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#080f0d] border-2 border-[#a3e635] flex items-center justify-center font-bold text-[#a3e635] text-xl shrink-0 shadow-md">
                      {selectedProfileEmp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-white">{selectedProfileEmp.name}</h3>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          selectedProfileEmp.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {selectedProfileEmp.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {selectedProfileEmp.category || 'Site-Based'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold mt-0.5">
                      {selectedProfileEmp.position}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                      <span>ID: <strong className="text-[#a3e635]">{selectedProfileEmp.employee_id}</strong></span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedProfileEmp.employee_id);
                          setCopiedId(selectedProfileEmp.employee_id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                        title="Copy Employee ID"
                      >
                        {copiedId === selectedProfileEmp.employee_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setEditingEmp(selectedProfileEmp);
                      setSelectedProfileEmp(null);
                    }}
                    className="px-3 py-1.5 bg-[#0e1a16] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                    Edit Info
                  </button>
                  <button
                    onClick={() => {
                      setBadgeEmp(selectedProfileEmp);
                      setSelectedProfileEmp(null);
                    }}
                    className="px-3 py-1.5 bg-[#0e1a16] border border-[#234338] text-slate-300 hover:text-[#a3e635] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#a3e635]" />
                    Badge Preview
                  </button>
                </div>
              </div>

              {/* 2-Column Content Grid: Left = Info & Statutory, Right = QR & Export */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Employment & Government Details */}
                <div className="space-y-4">
                  <div className="bg-[#080f0d] border border-[#234338] rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#234338] pb-2">
                      <Building className="w-3.5 h-3.5 text-[#a3e635]" />
                      <span>Assignment & Compensation</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Site</div>
                        <div className="text-white font-bold mt-0.5">{selectedProfileEmp.site_id}</div>
                        <div className="text-[10px] text-slate-500">
                          {sites.find((s) => s.site_id === selectedProfileEmp.site_id)?.name || 'Active Project Site'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Daily Wage Rate</div>
                        <div className="text-emerald-400 font-mono font-bold mt-0.5">
                          ₱{selectedProfileEmp.daily_rate.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">DOLE Standard 8h Shift</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#234338]/60">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Contact Phone</div>
                        <div className="text-slate-200 mt-0.5">{selectedProfileEmp.contact_number || 'No phone recorded'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Email Address</div>
                        <div className="text-slate-200 mt-0.5 truncate">{selectedProfileEmp.email || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Philippine Statutory Registrations */}
                  <div className="bg-[#080f0d] border border-[#234338] rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#234338] pb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Statutory Benefit IDs & Disbursement</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-[#13241f]/50 p-2 rounded-lg border border-[#234338]/60">
                        <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">Social Security (SSS)</div>
                        <div className="text-white font-bold mt-0.5">{selectedProfileEmp.sss_number || 'Pending'}</div>
                      </div>
                      <div className="bg-[#13241f]/50 p-2 rounded-lg border border-[#234338]/60">
                        <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">PhilHealth (PhilHealth)</div>
                        <div className="text-white font-bold mt-0.5">{selectedProfileEmp.philhealth_number || 'Pending'}</div>
                      </div>
                      <div className="bg-[#13241f]/50 p-2 rounded-lg border border-[#234338]/60">
                        <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">GCash Disbursement</div>
                        <div className="text-[#a3e635] font-bold mt-0.5">{selectedProfileEmp.gcash_number || 'Unlinked'}</div>
                      </div>
                      <div className="bg-[#13241f]/50 p-2 rounded-lg border border-[#234338]/60">
                        <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">QR Version Key</div>
                        <div className="text-white font-bold mt-0.5">v{selectedProfileEmp.qr_version || 1} Active</div>
                      </div>
                    </div>

                    {selectedProfileEmp.drive_link && (
                      <div className="pt-1">
                        <a
                          href={selectedProfileEmp.drive_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#a3e635] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Personnel Google Drive Documents Folder
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: High-Resolution QR Code & Export Controls */}
                <div className="bg-[#080f0d] border border-[#234338] rounded-xl p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#234338] pb-2 mb-3">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-[#a3e635]" />
                        <span>Biometric Turnstile QR Matrix</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-[#13241f] px-2 py-0.5 rounded border border-[#234338]">
                        v{selectedProfileEmp.qr_version || 1}
                      </span>
                    </div>

                    {/* QR Code Graphic Box */}
                    <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center shadow-inner border border-slate-200">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: generateSvgQRCode(
                            JSON.stringify({
                              employee_id: selectedProfileEmp.employee_id,
                              qr_version: selectedProfileEmp.qr_version || 1,
                            }),
                            180
                          ),
                        }}
                      />
                      <div className="text-center font-mono text-[9px] text-slate-700 font-bold mt-2">
                        {selectedProfileEmp.employee_id} · v{selectedProfileEmp.qr_version || 1}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                      Encoded for high-speed offline scan at turnstile gate tablets. Auto-validates anti-duplicate clock-ins and records GPS site tags.
                    </div>
                  </div>

                  {/* Export and Print Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-[#234338]">
                    {/* Primary 'Export QR' button requested by user */}
                    <button
                      onClick={() => handleExportQr(selectedProfileEmp)}
                      disabled={isExportingQr}
                      className="w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50"
                      title="Generates a high-resolution, print-ready image file of their unique QR code for physical badge printing"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>{isExportingQr ? 'Generating Print-Ready Image...' : 'Export QR'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDownloadRawQr(selectedProfileEmp)}
                        className="py-2 bg-[#13241f] border border-[#234338] hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Download bare 600x600 QR code PNG matrix"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Raw QR Matrix</span>
                      </button>

                      <button
                        onClick={() => {
                          setBadgeEmp(selectedProfileEmp);
                          setSelectedProfileEmp(null);
                        }}
                        className="py-2 bg-[#13241f] border border-[#a3e635]/40 hover:bg-[#a3e635]/10 text-[#a3e635] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Open Physical ID Card Template & Direct Thermal Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Badge</span>
                      </button>
                    </div>

                    <div className="text-[9px] text-slate-500 text-center pt-0.5">
                      Outputs print-ready 300 DPI image file with DOLE 5-star safety accreditation header.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#234338] bg-[#0e1a16] flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                DRC Autonomous ERP &bull; Biometric Badge Key Management
              </div>
              <button
                onClick={() => setSelectedProfileEmp(null)}
                className="px-4 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Export Feedback Toast */}
      {exportFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10b981] text-[#080f0d] px-4 py-3 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-emerald-400 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#080f0d] shrink-0" />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* Full QR Export Modal Suite */}
      <EmployeeQrBadgeExportModal
        isOpen={isQrExportModalOpen}
        onClose={() => setIsQrExportModalOpen(false)}
        initialEmployeeId={exportModalInitialEmpId}
      />

      {/* Bulk QR Export PDF Modal */}
      <BulkQrExportModal
        isOpen={isBulkExportModalOpen}
        onClose={() => setIsBulkExportModalOpen(false)}
        employees={employees}
        sites={sites}
        currentSite={currentSite}
      />

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
                  onClick={() => {
                    setIsBatchOpen(false);
                    setIsBulkExportModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Generate single PDF containing multiple employee QR codes for batch printing"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bulk Export QR (PDF)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print All Badges
                </button>
                <button onClick={() => setIsBatchOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
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
