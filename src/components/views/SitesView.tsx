import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Site } from '../../types';
import { CanteenGcashPayoutModal } from '../modals/CanteenGcashPayoutModal';
import {
  Building,
  Plus,
  MapPin,
  User,
  Calendar,
  Edit,
  CheckCircle2,
  ArrowRight,
  X,
  UtensilsCrossed,
  Smartphone,
  Save,
  Copy,
  Check,
  AlertCircle,
  Briefcase,
  Layers,
  DollarSign,
  Clock,
  FileText,
  Sparkles,
  ShieldCheck,
  Eye,
  Hash,
  Activity,
  Users,
} from 'lucide-react';

export const SitesView: React.FC = () => {
  const {
    sites,
    employees,
    deductions,
    gcashTransactions,
    currentSite,
    setCurrentSite,
    addSite,
    updateSite,
    clients,
    materials,
    expenses,
    documents,
    progressReports,
    projectAdjustments,
    auditLogs,
  } = useApp();

  const [inspectingSite, setInspectingSite] = useState<Site | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<string>('overview');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  // Canteen GCash Payout Modal State
  const [canteenPayoutSite, setCanteenPayoutSite] = useState<Site | null>(null);
  const [isCanteenPayoutOpen, setIsCanteenPayoutOpen] = useState(false);

  // Inline Quick-Edit Canteen details for individual card
  const [inlineCanteenSiteId, setInlineCanteenSiteId] = useState<string | null>(null);
  const [inlineVendorName, setInlineVendorName] = useState('');
  const [inlineGcashNumber, setInlineGcashNumber] = useState('');
  const [inlineContactPerson, setInlineContactPerson] = useState('');

  // Notification Toast State
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [copiedGcashSiteId, setCopiedGcashSiteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    supervisor: '',
    start_date: '2026-10-06',
    end_date: '2027-04-30',
    notes: '',
    project_status: 'Active' as const,
    canteen_vendor_name: '',
    canteen_gcash_number: '',
    canteen_contact_person: '',
  });

  const handleCopyGcash = (siteId: string, gcashNumber: string) => {
    navigator.clipboard.writeText(gcashNumber);
    setCopiedGcashSiteId(siteId);
    setTimeout(() => setCopiedGcashSiteId(null), 2000);
  };

  const handleStartInlineCanteenEdit = (site: Site) => {
    setInlineCanteenSiteId(site.site_id);
    setInlineVendorName(site.canteen_vendor_name || `${site.name} Canteen Concessionaire`);
    setInlineGcashNumber(site.canteen_gcash_number || '');
    setInlineContactPerson(site.canteen_contact_person || 'Canteen Manager');
  };

  const handleSaveInlineCanteen = (siteId: string) => {
    let cleanMobile = inlineGcashNumber.trim().replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('63') && cleanMobile.length === 12) {
      cleanMobile = '0' + cleanMobile.slice(2);
    }

    updateSite(siteId, {
      canteen_vendor_name: inlineVendorName.trim() || 'Site Canteen Concessionaire',
      canteen_gcash_number: cleanMobile || '',
      canteen_contact_person: inlineContactPerson.trim() || 'Canteen Manager',
    });

    setInlineCanteenSiteId(null);
    setNotificationMsg(`Canteen concessionaire and GCash details updated successfully for ${siteId}.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleOpenCanteenPayout = (site: Site) => {
    setCanteenPayoutSite(site);
    setIsCanteenPayoutOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanMobile = formData.canteen_gcash_number.trim().replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('63') && cleanMobile.length === 12) {
      cleanMobile = '0' + cleanMobile.slice(2);
    }

    addSite({
      code: formData.code.trim(),
      name: formData.name.trim(),
      location: formData.location.trim(),
      supervisor: formData.supervisor.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      notes: formData.notes.trim(),
      project_status: formData.project_status,
      canteen_vendor_name: formData.canteen_vendor_name.trim() || `${formData.name.trim()} Canteen Concessionaire`,
      canteen_gcash_number: cleanMobile || '',
      canteen_contact_person: formData.canteen_contact_person.trim() || 'Canteen Manager',
    });

    setIsAddOpen(false);
    setFormData({
      code: '',
      name: '',
      location: '',
      supervisor: '',
      start_date: '2026-10-06',
      end_date: '2027-04-30',
      notes: '',
      project_status: 'Active',
      canteen_vendor_name: '',
      canteen_gcash_number: '',
      canteen_contact_person: '',
    });

    setNotificationMsg(`Registered project site ${formData.code} with designated canteen concessionaire and GCash details.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;

    let cleanMobile = (editingSite.canteen_gcash_number || '').trim().replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('63') && cleanMobile.length === 12) {
      cleanMobile = '0' + cleanMobile.slice(2);
    }

    updateSite(editingSite.site_id, {
      ...editingSite,
      canteen_gcash_number: cleanMobile || editingSite.canteen_gcash_number || '',
    });

    setNotificationMsg(`Updated site configuration and canteen settings for ${editingSite.code}.`);
    setEditingSite(null);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Construction Sites & Projects
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Central Luzon & Greater Manila Execution</span>
            <span>·</span>
            <span>Unlimited Scalable Project Expansion & Canteen GCash Settlement Hub</span>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Register New Project Site
        </button>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#0e1a16] border border-dashed border-[#234338] rounded-2xl">
            <Building className="w-10 h-10 text-lime-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white">No Project Sites Registered</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Your system is clean and ready. Click "Register New Project Site" to add your construction projects or site offices.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg hover:bg-[#84cc16] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Project Site</span>
            </button>
          </div>
        ) : (
          sites.map((site) => {
          const assignedWorkers = employees.filter((e) => e.site_id === site.site_id && e.status === 'active');
          const isSelected = currentSite === site.site_id;

          // Canteen automatic calculations for this site
          const siteCanteenCollected = deductions
            .filter((d) => d.site_id === site.site_id && !d.is_void)
            .reduce((sum, d) => sum + Number(d.canteen || 0), 0);

          const siteCanteenPaid = gcashTransactions
            .filter((tx) => tx.category === 'Site Canteen Payout' && tx.site_id === site.site_id && tx.status === 'COMPLETED')
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

          const siteCanteenOutstanding = Math.max(0, siteCanteenCollected - siteCanteenPaid);

          const isEditingInline = inlineCanteenSiteId === site.site_id;

          return (
            <div
              key={site.site_id}
              className={`bg-[#0e1a16] border rounded-xl overflow-hidden flex flex-col justify-between transition-colors shadow-md ${
                isSelected ? 'border-[#a3e635] shadow-[0_0_15px_rgba(163,230,53,0.15)]' : 'border-[#234338]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="p-4 bg-[#13241f] border-b border-[#234338] flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#a3e635]">{site.code}</div>
                    <h3 className="text-sm font-bold text-white mt-0.5 leading-snug">{site.name}</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                    {site.project_status}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{site.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Supervisor: <strong className="text-white">{site.supervisor}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{site.start_date || 'N/A'} &rarr; {site.end_date || 'N/A'}</span>
                  </div>

                  {site.notes && (
                    <div className="p-2.5 bg-[#080f0d] border border-[#234338] rounded-lg text-slate-400 text-[11px] leading-relaxed">
                      {site.notes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#234338]/40 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Active Workforce:</span>
                    <span className="font-mono font-bold text-[#a3e635]">{assignedWorkers.length} assigned</span>
                  </div>

                  {/* Section: Dedicated Site Canteen Concessionaire & GCash Settlement */}
                  <div className="mt-3 p-3 bg-[#080f0d] border border-[#234338] rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-lime-400" />
                        <span>Site Canteen Concessionaire</span>
                      </div>
                      {!isEditingInline ? (
                        <button
                          onClick={() => handleStartInlineCanteenEdit(site)}
                          className="text-[10px] text-slate-400 hover:text-lime-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit Canteen & GCash Details"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit GCash</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setInlineCanteenSiteId(null)}
                          className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {isEditingInline ? (
                      /* Inline Canteen Edit Form */
                      <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                            Concessionaire / Vendor Name
                          </label>
                          <input
                            type="text"
                            value={inlineVendorName}
                            onChange={(e) => setInlineVendorName(e.target.value)}
                            placeholder="e.g. Ate Maria's Canteen"
                            className="w-full bg-[#13241f] border border-[#234338] rounded px-2 py-1 text-white text-xs outline-none focus:border-lime-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                            Canteen GCash Mobile Number
                          </label>
                          <div className="relative">
                            <Smartphone className="w-3 h-3 text-sky-400 absolute left-2 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={inlineGcashNumber}
                              onChange={(e) => setInlineGcashNumber(e.target.value)}
                              placeholder="09171234567"
                              maxLength={12}
                              className="w-full pl-6 pr-2 py-1 bg-[#13241f] border border-[#234338] rounded text-white font-mono text-xs outline-none focus:border-lime-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                            Contact Person
                          </label>
                          <input
                            type="text"
                            value={inlineContactPerson}
                            onChange={(e) => setInlineContactPerson(e.target.value)}
                            placeholder="e.g. Maria Santos"
                            className="w-full bg-[#13241f] border border-[#234338] rounded px-2 py-1 text-white text-xs outline-none focus:border-lime-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveInlineCanteen(site.site_id)}
                          className="w-full py-1.5 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded hover:bg-[#84cc16] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Canteen Details</span>
                        </button>
                      </div>
                    ) : (
                      /* Display Canteen Info */
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <div className="font-semibold text-slate-200 truncate">
                              {site.canteen_vendor_name || `${site.name} Canteen Concessionaire`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Contact: {site.canteen_contact_person || 'Canteen Manager'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] px-2 py-1 rounded text-sky-400 font-mono font-bold shrink-0">
                            <Smartphone className="w-3 h-3 text-sky-400" />
                            <span>{site.canteen_gcash_number || 'Not configured'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyGcash(site.site_id, site.canteen_gcash_number || '')}
                              className="text-slate-400 hover:text-white p-0.5 cursor-pointer ml-0.5"
                              title="Copy GCash Number"
                            >
                              {copiedGcashSiteId === site.site_id ? (
                                <Check className="w-3 h-3 text-lime-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Live Financial Calculation Metrics */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-[#234338]/60 text-center text-[10px]">
                          <div className="bg-[#0e1a16] p-1.5 rounded border border-[#234338]/40">
                            <div className="text-slate-400 font-semibold uppercase text-[9px]">Deductions</div>
                            <div className="font-mono font-bold text-white mt-0.5">
                              ₱{siteCanteenCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="bg-[#0e1a16] p-1.5 rounded border border-[#234338]/40">
                            <div className="text-slate-400 font-semibold uppercase text-[9px]">Paid Out</div>
                            <div className="font-mono font-bold text-emerald-400 mt-0.5">
                              ₱{siteCanteenPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="bg-[#0e1a16] p-1.5 rounded border border-[#234338]/40">
                            <div className="text-slate-400 font-semibold uppercase text-[9px]">Outstanding</div>
                            <div className="font-mono font-black text-lime-400 mt-0.5">
                              ₱{siteCanteenOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        {/* Direct GCash Payout Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenCanteenPayout(site)}
                          className="w-full py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-500 hover:from-emerald-500 hover:to-lime-400 text-white font-extrabold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Disburse Canteen Payout via GCash</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-[#13241f] border-t border-[#234338] flex items-center justify-between gap-2">
                <button
                  onClick={() => setCurrentSite(site.site_id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[#a3e635] text-[#080f0d]'
                      : 'bg-[#0e1a16] border border-[#234338] text-slate-200 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isSelected ? 'Active Context' : 'Set Active Context'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setInspectingSite(site);
                      setActiveProfileTab('overview');
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0f1c3d] hover:bg-[#142550] border border-[#1e3a8a] text-sky-300 flex items-center gap-1 cursor-pointer"
                    title="Open Complete Project Profile (12 Tabs)"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Project Profile</span>
                  </button>

                  <button
                    onClick={() => setEditingSite(site)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-[#0e1a16] rounded-md cursor-pointer"
                    title="Edit Site Details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Add Site Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-[#a3e635]" />
                Register New Project Site
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Site 004"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Bataan Logistics Pier"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Geographic Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="Mariveles, Bataan"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervisor / Lead Engineer *</label>
                  <input
                    type="text"
                    required
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="Engr. Marco De Rueda"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Dedicated Canteen Details in Register Site */}
              <div className="p-3 bg-[#080f0d] border border-[#234338] rounded-lg space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase text-lime-400">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Site Canteen Concessionaire & GCash Setup</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Concessionaire Vendor Name</label>
                    <input
                      type="text"
                      value={formData.canteen_vendor_name}
                      onChange={(e) => setFormData({ ...formData, canteen_vendor_name: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                      placeholder="e.g. Bataan Worker Food Mess"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Canteen GCash Mobile Number</label>
                    <input
                      type="text"
                      value={formData.canteen_gcash_number}
                      onChange={(e) => setFormData({ ...formData, canteen_gcash_number: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                      placeholder="09171234567"
                      maxLength={12}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Canteen Contact Person</label>
                  <input
                    type="text"
                    value={formData.canteen_contact_person}
                    onChange={(e) => setFormData({ ...formData, canteen_contact_person: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Maria Santos"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Engineering Scope & Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-16"
                  placeholder="Structural specs, foundation details, delivery access..."
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] cursor-pointer"
                >
                  Register Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {editingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white">Edit Site: {editingSite.code}</h2>
              <button onClick={() => setEditingSite(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Code</label>
                  <input
                    type="text"
                    required
                    value={editingSite.code}
                    onChange={(e) => setEditingSite({ ...editingSite, code: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editingSite.name}
                    onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={editingSite.location}
                    onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervisor</label>
                  <input
                    type="text"
                    required
                    value={editingSite.supervisor}
                    onChange={(e) => setEditingSite({ ...editingSite, supervisor: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Status</label>
                  <select
                    value={editingSite.project_status}
                    onChange={(e) => setEditingSite({ ...editingSite, project_status: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={editingSite.end_date}
                    onChange={(e) => setEditingSite({ ...editingSite, end_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Dedicated Canteen Details in Edit Site */}
              <div className="p-3 bg-[#080f0d] border border-[#234338] rounded-lg space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase text-lime-400">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Site Canteen Concessionaire & GCash Configuration</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Concessionaire Vendor Name</label>
                    <input
                      type="text"
                      value={editingSite.canteen_vendor_name || ''}
                      onChange={(e) => setEditingSite({ ...editingSite, canteen_vendor_name: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                      placeholder="e.g. Ate Maria's Canteen"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Canteen GCash Mobile Number</label>
                    <input
                      type="text"
                      value={editingSite.canteen_gcash_number || ''}
                      onChange={(e) => setEditingSite({ ...editingSite, canteen_gcash_number: e.target.value })}
                      className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                      placeholder="09171234567"
                      maxLength={12}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Contact Person</label>
                  <input
                    type="text"
                    value={editingSite.canteen_contact_person || ''}
                    onChange={(e) => setEditingSite({ ...editingSite, canteen_contact_person: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Maria Santos"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes</label>
                <textarea
                  value={editingSite.notes}
                  onChange={(e) => setEditingSite({ ...editingSite, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-16"
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Canteen GCash Payout Modal */}
      {canteenPayoutSite && (
        <CanteenGcashPayoutModal
          isOpen={isCanteenPayoutOpen}
          onClose={() => {
            setIsCanteenPayoutOpen(false);
            setCanteenPayoutSite(null);
          }}
          site={canteenPayoutSite}
          onSuccess={(ref) => {
            setIsCanteenPayoutOpen(false);
            const sName = canteenPayoutSite.name;
            setCanteenPayoutSite(null);
            setNotificationMsg(`Canteen payout successfully disbursed via GCash for ${sName}. Ref: ${ref}`);
            setTimeout(() => setNotificationMsg(null), 6000);
          }}
        />
      )}
      {/* Master Specification Section 13: Project Profile Modal (12 Tabs) */}
      {inspectingSite && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#070d1f] border border-[#1e3a8a] rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#1e3a8a]/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0f1c3d] text-sky-300 border border-[#1e3a8a]">
                    {inspectingSite.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                    {inspectingSite.project_status}
                  </span>
                  <span className="text-xs text-slate-400">Section 13 Master Project Profile</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1 leading-snug">
                  {inspectingSite.name}
                </h2>
              </div>
              <button
                onClick={() => setInspectingSite(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0f1c3d] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 12-Tab Navigation Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#1e3a8a]/30 text-xs no-scrollbar">
              {[
                { id: 'overview', label: '1. Overview' },
                { id: 'client', label: '2. Client & Contacts' },
                { id: 'scope', label: '3. Work Scope' },
                { id: 'schedule', label: '4. Schedule & Milestones' },
                { id: 'budget', label: '5. Budget' },
                { id: 'team', label: '6. Team & Workforce' },
                { id: 'materials', label: '7. Materials' },
                { id: 'expenses', label: '8. Expenses' },
                { id: 'documents', label: '9. Documents' },
                { id: 'customer_updates', label: '10. Customer Updates' },
                { id: 'adjustments', label: '11. Adjustments' },
                { id: 'activity', label: '12. Activity History' },
              ].map((tab) => {
                const isActive = activeProfileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0284c7] text-white shadow-sm'
                        : 'bg-[#0f1c3d]/60 text-slate-400 hover:text-slate-200 hover:bg-[#0f1c3d]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="text-xs text-slate-300 min-h-[300px]">
              {/* Tab 1: Overview */}
              {activeProfileTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                      <div className="text-white font-bold">{inspectingSite.location}</div>
                    </div>
                    <div className="p-3 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Contract Value</span>
                      <div className="text-emerald-400 font-bold font-mono text-sm">
                        ₱{(inspectingSite.budget_contract_value || 35000000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-3 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Progress</span>
                      <div className="text-sky-300 font-bold font-mono text-sm">
                        {inspectingSite.completion_pct || 65}% Completed
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>Physical Completion Metric</span>
                      <span className="text-sky-400 font-bold">{inspectingSite.completion_pct || 65}%</span>
                    </div>
                    <div className="w-full bg-[#0a1128] rounded-full h-2.5 overflow-hidden border border-[#1e3a8a]/40">
                      <div
                        className="bg-linear-to-r from-sky-500 to-emerald-400 h-2.5 rounded-full"
                        style={{ width: `${inspectingSite.completion_pct || 65}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Description &amp; Technical Notes</span>
                    <p className="leading-relaxed text-slate-200">{inspectingSite.notes}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 bg-[#0f1c3d]/50 rounded-lg border border-[#1e3a8a]/30">
                      <span className="text-slate-400 block font-semibold">Start Execution Date:</span>
                      <span className="text-white font-mono">{inspectingSite.start_date}</span>
                    </div>
                    <div className="p-2.5 bg-[#0f1c3d]/50 rounded-lg border border-[#1e3a8a]/30">
                      <span className="text-slate-400 block font-semibold">Planned Handover Date:</span>
                      <span className="text-white font-mono">{inspectingSite.end_date}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Client & Contacts */}
              {activeProfileTab === 'client' && (
                <div className="space-y-4">
                  {(() => {
                    const linkedClient = clients.find((c) => c.client_id === inspectingSite.client_id) || clients[0];
                    return (
                      <div className="p-4 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Commissioning Client Record</span>
                            <h4 className="text-base font-black text-white">{inspectingSite.client_name || linkedClient?.company_name}</h4>
                            <div className="text-[11px] text-slate-400">{linkedClient?.contact_person} ({linkedClient?.contact_role || 'Director'})</div>
                          </div>
                          {linkedClient?.email_verified ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Verified Mailbox
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                              Verification Pending
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1e3a8a]/30">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Primary Structured Email</span>
                            <span className="font-mono text-sky-300 font-bold">{inspectingSite.client_email || linkedClient?.primary_email}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Contact Telephone</span>
                            <span className="text-slate-200">{linkedClient?.phone_number || '+63 917 889 1204'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Correspondence Address</span>
                          <span className="text-slate-300">{linkedClient?.address || inspectingSite.location}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab 3: Work Scope */}
              {activeProfileTab === 'scope' && (
                <div className="p-4 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-3">
                  <h4 className="font-black text-white text-sm">Contractual Scope of Work</h4>
                  <p className="leading-relaxed text-slate-200">
                    {inspectingSite.work_scope || 'Civil substructure works, bored pile foundations, structural steel framing, precast concrete hollow-core slabs, industrial insulated sandwich roofing, and MEPFS infrastructure compliant with National Building Code PD 1096.'}
                  </p>
                  <div className="pt-2 border-t border-[#1e3a8a]/30 flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-[#070d1f] rounded text-[10px] font-mono text-slate-300 border border-[#1e3a8a]">Deep Bored Piling</span>
                    <span className="px-2 py-0.5 bg-[#070d1f] rounded text-[10px] font-mono text-slate-300 border border-[#1e3a8a]">Structural Steelwork</span>
                    <span className="px-2 py-0.5 bg-[#070d1f] rounded text-[10px] font-mono text-slate-300 border border-[#1e3a8a]">MEPFS Rough-ins</span>
                    <span className="px-2 py-0.5 bg-[#070d1f] rounded text-[10px] font-mono text-slate-300 border border-[#1e3a8a]">Fire Protection BFP</span>
                  </div>
                </div>
              )}

              {/* Tab 4: Schedule & Milestones */}
              {activeProfileTab === 'schedule' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    {[
                      { pct: '25%', name: 'Substructure', status: 'Completed', date: '2026-09-20' },
                      { pct: '50%', name: 'Frame & Slabs', status: 'In Progress', date: '2026-10-30' },
                      { pct: '75%', name: 'Enclosure/MEP', status: 'Scheduled', date: '2026-12-15' },
                      { pct: '100%', name: 'Handover', status: 'Scheduled', date: '2027-04-30' },
                    ].map((m) => (
                      <div key={m.pct} className="p-3 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-1">
                        <span className="font-mono font-bold text-sky-400 text-sm">{m.pct}</span>
                        <div className="font-bold text-white text-[11px]">{m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.date}</div>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase block">{m.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Budget */}
              {activeProfileTab === 'budget' && (
                <div className="p-4 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#070d1f] rounded-lg border border-[#1e3a8a]/40">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Contract Budget</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        ₱{(inspectingSite.budget_contract_value || 35000000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="p-3 bg-[#070d1f] rounded-lg border border-[#1e3a8a]/40">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Materials Procured</span>
                      <span className="font-mono font-bold text-sky-400 text-sm">₱14,250,000.00</span>
                    </div>
                    <div className="p-3 bg-[#070d1f] rounded-lg border border-[#1e3a8a]/40">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Margin</span>
                      <span className="font-mono font-bold text-amber-300 text-sm">₱20,750,000.00</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Team & Workforce */}
              {activeProfileTab === 'team' && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Supervisor / Site Head:</span>
                      <div className="text-white font-bold text-sm">{inspectingSite.supervisor}</div>
                      <div className="text-[11px] text-sky-300 font-mono">{inspectingSite.supervisor_email || 'supervisor@deruedaconstruction.com'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Workforce:</span>
                      <div className="text-emerald-400 font-black text-lg">
                        {employees.filter((e) => e.site_id === inspectingSite.site_id).length} Active Workers
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: Materials */}
              {activeProfileTab === 'materials' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Site Materials &amp; Delivery Receipts</span>
                  {materials.filter((m) => m.site_id === inspectingSite.site_id).length > 0 ? (
                    materials
                      .filter((m) => m.site_id === inspectingSite.site_id)
                      .map((m) => (
                        <div key={m.material_id} className="p-2.5 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="text-white font-bold">{m.material_name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Ref: {m.delivery_ref} · {m.supplier}</span>
                          </div>
                          <span className="font-mono text-emerald-400 font-bold">{m.quantity} {m.unit}</span>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 bg-[#0a1128] rounded-lg text-center text-slate-400">
                      Standard site steel, cement, and aggregates inventory active under central depot dispatch.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 8: Expenses */}
              {activeProfileTab === 'expenses' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Site Project Expense Register</span>
                  <div className="p-3 bg-[#0a1128] rounded-xl border border-[#1e3a8a]/40 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Equipment Heavy Diesel Fuel &amp; Crane Mobilization</div>
                      <div className="text-[10px] text-slate-400 font-mono">Petron Mariveles Industrial Fuel Voucher</div>
                    </div>
                    <span className="font-mono font-bold text-rose-300">₱45,000.00</span>
                  </div>
                </div>
              )}

              {/* Tab 9: Documents */}
              {activeProfileTab === 'documents' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">DOLE &amp; Architectural Document Vault</span>
                  <div className="p-3 bg-[#0a1128] rounded-xl border border-[#1e3a8a]/40 space-y-1">
                    <div className="text-white font-bold">Approved DOLE D.O. 13 Construction Safety &amp; Health Program (CSHP)</div>
                    <div className="text-[10px] text-slate-400">Filed under 01_Executive_and_Compliance vault</div>
                  </div>
                  <div className="p-3 bg-[#0a1128] rounded-xl border border-[#1e3a8a]/40 space-y-1">
                    <div className="text-white font-bold">Approved Structural Engineering &amp; Foundation CAD Blueprints</div>
                    <div className="text-[10px] text-slate-400">Filed under 06_Project_Sites_and_Blueprints vault</div>
                  </div>
                </div>
              )}

              {/* Tab 10: Customer Updates */}
              {activeProfileTab === 'customer_updates' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Client Milestone Progress Reports</span>
                  {progressReports.filter((r) => r.project_id === inspectingSite.site_id).length > 0 ? (
                    progressReports
                      .filter((r) => r.project_id === inspectingSite.site_id)
                      .map((r) => (
                        <div key={r.report_id} className="p-3 bg-[#0a1128] rounded-xl border border-[#1e3a8a]/40 flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold">{r.milestone_pct}% Milestone: {r.summary}</div>
                            <div className="text-[10px] text-slate-400 font-mono">To: {r.recipient_email} · Status: {r.delivery_status}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                            {r.delivery_status}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 bg-[#0a1128] rounded-lg text-center text-slate-400">
                      No progress reports sent yet. Use Client Management to draft and dispatch milestone reports.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 11: Adjustments */}
              {activeProfileTab === 'adjustments' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Formal Scope &amp; Budget Adjustments</span>
                  {projectAdjustments.filter((a) => a.site_id === inspectingSite.site_id).length > 0 ? (
                    projectAdjustments
                      .filter((a) => a.site_id === inspectingSite.site_id)
                      .map((a) => (
                        <div key={a.adjustment_id} className="p-3 bg-[#0a1128] rounded-xl border border-[#1e3a8a]/40 flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold">{a.title}</div>
                            <div className="text-[10px] text-slate-400">Delta: {a.delta} · Category: {a.category}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                            {a.state}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 bg-[#0a1128] rounded-lg text-center text-slate-400">
                      Zero pending or applied variation orders. Scope running on baseline.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 12: Activity History */}
              {activeProfileTab === 'activity' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Append-Only Site Audit Trail</span>
                  {auditLogs.filter((l) => l.entity_id === inspectingSite.site_id || l.after_value?.includes(inspectingSite.name) || l.after_value?.includes(inspectingSite.code)).slice(0, 5).map((log) => (
                    <div key={log.audit_id} className="p-2.5 bg-[#0a1128] border border-[#1e3a8a]/30 rounded-lg text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                        <span>{log.actor}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="text-slate-200">{log.after_value || log.action}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#1e3a8a]/40 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingSite(null)}
                className="px-4 py-2 bg-[#0f1c3d] hover:bg-[#142550] text-slate-200 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
