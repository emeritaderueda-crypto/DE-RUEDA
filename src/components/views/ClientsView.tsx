import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientRecord, ClientProgressReport, Site } from '../../types';
import {
  Briefcase,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Building,
  Calendar,
  ShieldCheck,
  Edit,
  X,
  ExternalLink,
  Clock,
  ArrowRight,
  Eye,
  Check,
  FileCheck,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const {
    clients,
    addClient,
    updateClient,
    verifyClientEmail,
    sites,
    progressReports,
    addProgressReport,
    sendProgressReport,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [emailEditReason, setEmailEditReason] = useState('');
  const [activeReportClient, setActiveReportClient] = useState<ClientRecord | null>(null);
  const [previewReport, setPreviewReport] = useState<ClientProgressReport | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);

  // New Client Form state
  const [formData, setFormData] = useState({
    company_name: '',
    client_type: 'company' as const,
    contact_person: '',
    contact_role: '',
    primary_email: '',
    secondary_email: '',
    phone_number: '',
    address: '',
    preferred_channel: 'Email' as const,
    internal_notes: '',
  });

  // Report Form state
  const [reportFormData, setReportFormData] = useState({
    project_id: '',
    milestone_pct: 50,
    reporting_period: 'Week 42 (Oct 2026)',
    summary: '',
    completed_work: '',
    current_activities: '',
    next_steps: '',
    delays_issues: '',
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const filteredClients = clients.filter((c) => {
    const matchSearch =
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.primary_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'ALL' || c.client_type === selectedType;
    return matchSearch && matchType;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.primary_email.trim() || !formData.contact_person.trim()) {
      showNotification('Please fill in required fields: Company Name, Contact Person, and Primary Email.');
      return;
    }

    const result = addClient({
      company_name: formData.company_name.trim(),
      client_type: formData.client_type,
      contact_person: formData.contact_person.trim(),
      contact_role: formData.contact_role.trim() || undefined,
      primary_email: formData.primary_email.trim(),
      secondary_email: formData.secondary_email.trim() || undefined,
      phone_number: formData.phone_number.trim() || undefined,
      address: formData.address.trim() || undefined,
      preferred_channel: formData.preferred_channel,
      status: 'active',
      internal_notes: formData.internal_notes.trim() || undefined,
      email_verified: false,
      created_by: currentUser?.name || 'Staff User',
    });

    if (!result.success) {
      showNotification(`Failed to create client: ${result.error}`);
      return;
    }

    setIsAddOpen(false);
    setFormData({
      company_name: '',
      client_type: 'company',
      contact_person: '',
      contact_role: '',
      primary_email: '',
      secondary_email: '',
      phone_number: '',
      address: '',
      preferred_channel: 'Email',
      internal_notes: '',
    });
    showNotification(`Client record ${result.client?.client_id} created successfully.`);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    updateClient(
      editingClient.client_id,
      {
        company_name: editingClient.company_name.trim(),
        contact_person: editingClient.contact_person.trim(),
        contact_role: editingClient.contact_role?.trim() || undefined,
        primary_email: editingClient.primary_email.trim(),
        secondary_email: editingClient.secondary_email?.trim() || undefined,
        phone_number: editingClient.phone_number?.trim() || undefined,
        address: editingClient.address?.trim() || undefined,
        preferred_channel: editingClient.preferred_channel,
        internal_notes: editingClient.internal_notes?.trim() || undefined,
      },
      emailEditReason.trim() || 'Client contact detail update'
    );

    setEditingClient(null);
    setEmailEditReason('');
    showNotification(`Updated profile for ${editingClient.company_name}.`);
  };

  const handleOpenCreateReport = (client: ClientRecord) => {
    setActiveReportClient(client);
    const clientSites = sites.filter((s) => s.client_id === client.client_id);
    const defaultSite = clientSites[0] || sites[0];

    setReportFormData({
      project_id: defaultSite?.site_id || '',
      milestone_pct: 50,
      reporting_period: 'Week 42 (Oct 2026)',
      summary: `Executive milestone progress report for ${client.company_name}.`,
      completed_work: 'Civil works foundation poured, structural steel delivered and erection underway on bays 1-8.',
      current_activities: 'Roof framing and purlin assembly; MEPFS conduit layout with project inspector.',
      next_steps: 'Wall panel installation and fire sprinkler hydrostatic pressure testing.',
      delays_issues: 'No critical path delays reported.',
    });
  };

  const handleCreateReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportClient) return;

    const targetSite = sites.find((s) => s.site_id === reportFormData.project_id) || sites[0];

    const report = addProgressReport({
      project_id: targetSite?.site_id || 'SITE-001',
      project_name: targetSite?.name || 'Construction Project',
      client_id: activeReportClient.client_id,
      client_name: activeReportClient.company_name,
      recipient_email: activeReportClient.primary_email,
      milestone_pct: Number(reportFormData.milestone_pct),
      reporting_period: reportFormData.reporting_period,
      summary: reportFormData.summary,
      completed_work: reportFormData.completed_work,
      current_activities: reportFormData.current_activities,
      next_steps: reportFormData.next_steps,
      delays_issues: reportFormData.delays_issues || undefined,
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80',
          caption: 'Milestone Progress: Primary Structure & Slab',
          date: new Date().toISOString().substring(0, 10),
        },
      ],
      prepared_by: currentUser?.name || 'Project Engineer',
      delivery_status: 'Ready for Review',
    });

    setActiveReportClient(null);
    setPreviewReport(report);
    showNotification(`Drafted ${report.milestone_pct}% progress report for ${activeReportClient.company_name}.`);
  };

  const handleSendProgressReport = async (reportId: string) => {
    setIsSendingReport(true);
    const res = await sendProgressReport(reportId);
    setIsSendingReport(false);
    if (res.success) {
      showNotification(res.message);
      // update preview if open
      if (previewReport && previewReport.report_id === reportId) {
        setPreviewReport((prev) => (prev ? { ...prev, delivery_status: 'Delivered', sent_at: new Date().toISOString() } : null));
      }
    } else {
      showNotification(`Delivery Error: ${res.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#0a1128] border border-[#38bdf8] text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-5 h-5 text-[#38bdf8] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-[#070d1f] via-[#0f1c3d] to-[#070d1f] border border-[#1e3a8a]/50 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#38bdf8]/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e3a8a]/60 text-sky-300 border border-sky-400/30 uppercase">
                Section 4 &amp; 5 Spec Standard
              </span>
              <span className="text-xs text-slate-400">Owner / Client Directory</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Client Management &amp; Communications
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Authoritative records of project commissioning Clients. Features structured email validation, verified mailbox state, linked project oversight, and formal milestone progress report delivery.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Client</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#070d1f] border border-[#1e3a8a]/40 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company name, contact person, or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a1128] border border-[#1e3a8a]/50 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-semibold uppercase hidden md:inline">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#0a1128] border border-[#1e3a8a]/50 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8]"
          >
            <option value="ALL">All Categories</option>
            <option value="company">Corporate / Enterprise</option>
            <option value="organization">Organization / Government</option>
            <option value="individual">Individual Owner</option>
          </select>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const linkedSites = sites.filter((s) => s.client_id === client.client_id);
          const clientReports = progressReports.filter((r) => r.client_id === client.client_id);
          const latestReport = clientReports[0];

          return (
            <div
              key={client.client_id}
              className="bg-[#070d1f] border border-[#1e3a8a]/50 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4 hover:border-sky-500/50 transition-all duration-200"
            >
              <div className="space-y-3">
                {/* Header: ID, Category & Edit */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0f1c3d] text-sky-300 border border-[#1e3a8a]">
                        {client.client_id}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {client.client_type}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1 leading-snug">
                      {client.company_name}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setEditingClient(client);
                      setEmailEditReason('');
                    }}
                    className="p-1.5 rounded-lg bg-[#0f1c3d] text-slate-400 hover:text-white border border-[#1e3a8a] hover:border-sky-400 transition-colors cursor-pointer"
                    title="Edit Client Details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Contact Person & Position */}
                <div className="p-3 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{client.contact_person}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{client.contact_role || 'Primary Liaison'}</span>
                  </div>

                  {/* Primary Email with Verification Status Badge */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e3a8a]/30">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-mono text-slate-200 truncate">{client.primary_email}</span>
                    </div>

                    {client.email_verified ? (
                      <span
                        className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                        title={`Verified mailbox on ${client.email_verified_at?.slice(0, 10)}`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => verifyClientEmail(client.client_id)}
                        className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900 transition-colors cursor-pointer"
                        title="Click to mark email verified after staff confirmation"
                      >
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        Verify
                      </button>
                    )}
                  </div>

                  {/* Secondary email & phone */}
                  {client.phone_number && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.phone_number}</span>
                    </div>
                  )}

                  {client.address && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Linked Projects / Sites Overview */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold uppercase">Commissioned Projects</span>
                    <span className="text-sky-400 font-mono font-bold">{linkedSites.length} Active</span>
                  </div>
                  {linkedSites.length > 0 ? (
                    <div className="space-y-1">
                      {linkedSites.map((s) => (
                        <div
                          key={s.site_id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#0f1c3d]/60 border border-[#1e3a8a]/30 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-white font-medium truncate">{s.name}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                            {s.completion_pct || 0}% Complete
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No construction projects linked yet.</p>
                  )}
                </div>

                {/* Latest Report / Communication State */}
                {latestReport && (
                  <div className="p-2.5 bg-[#081024] border border-sky-900/40 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 uppercase font-semibold">Latest Progress Report:</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                        {latestReport.delivery_status}
                      </span>
                    </div>
                    <div className="text-slate-200 text-[11px] font-medium truncate">
                      {latestReport.milestone_pct}% Milestone: {latestReport.summary}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Target: {latestReport.recipient_email}
                    </div>
                  </div>
                )}

                {/* Internal Notes (Restricted) */}
                {client.internal_notes && (
                  <div className="text-[11px] text-slate-400 bg-[#0f1c3d]/40 p-2 rounded border border-[#1e3a8a]/20">
                    <span className="text-[9px] uppercase font-bold text-amber-300 block mb-0.5">Internal Client Notes:</span>
                    <p className="italic">{client.internal_notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#1e3a8a]/40 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenCreateReport(client)}
                  className="flex-1 py-2 px-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Draft Report</span>
                </button>

                {clientReports.length > 0 && (
                  <button
                    onClick={() => setPreviewReport(clientReports[0])}
                    className="py-2 px-3 bg-[#0f1c3d] hover:bg-[#142550] border border-[#1e3a8a] text-sky-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    title="View Progress Reports"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reports ({clientReports.length})</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12 bg-[#070d1f] border border-[#1e3a8a]/40 rounded-2xl p-8 space-y-3">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Client Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search filter or register a new Client commissioning construction projects.
          </p>
        </div>
      )}

      {/* Register New Client Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#070d1f] border border-[#1e3a8a] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3a8a]/50">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Register New Client Record
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Miguel Logistics & Cold Storage Corp."
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Client Category *
                  </label>
                  <select
                    value={formData.client_type}
                    onChange={(e: any) => setFormData({ ...formData, client_type: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="company">Corporate / Enterprise</option>
                    <option value="organization">Organization / NGO</option>
                    <option value="government">Government / LGU</option>
                    <option value="individual">Individual Owner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Preferred Delivery Channel
                  </label>
                  <select
                    value={formData.preferred_channel}
                    onChange={(e: any) => setFormData({ ...formData, preferred_channel: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="Email">Email Delivery</option>
                    <option value="Portal">Client Portal</option>
                    <option value="Phone">Phone / Direct</option>
                    <option value="SMS">SMS Notice</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Contact Person Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Atty. Roberto Tan"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Position / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VP Infrastructure"
                    value={formData.contact_role}
                    onChange={(e) => setFormData({ ...formData, contact_role: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Primary Email Address * (First-Class Field)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rtan@smlogistics.com.ph"
                  value={formData.primary_email}
                  onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-400"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Per Section 4, this structured email is used exclusively for verified progress report delivery.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Secondary Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. billing@smlogistics.com.ph"
                    value={formData.secondary_email}
                    onChange={(e) => setFormData({ ...formData, secondary_email: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +63 917 889 1204"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Office / Site Correspondence Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bataan Economic Zone, Mariveles, Bataan"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Internal Notes (Restricted to Staff)
                </label>
                <textarea
                  rows={2}
                  placeholder="Private billing preferences or inspection notes. Never exposed to customer."
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e3a8a]/40">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-[#0f1c3d] text-slate-300 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Register Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Profile Modal with Audit Reason Prompt */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#070d1f] border border-[#1e3a8a] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3a8a]/50">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Update Client Profile ({editingClient.client_id})
                </h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editingClient.company_name}
                  onChange={(e) => setEditingClient({ ...editingClient, company_name: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={editingClient.contact_person}
                    onChange={(e) => setEditingClient({ ...editingClient, contact_person: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Contact Role</label>
                  <input
                    type="text"
                    value={editingClient.contact_role || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, contact_role: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Primary Email (Section 4 Audit Required)
                </label>
                <input
                  type="email"
                  required
                  value={editingClient.primary_email}
                  onChange={(e) => setEditingClient({ ...editingClient, primary_email: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold uppercase mb-1">
                  Reason for Email or Profile Change (Audit Trail Requirement) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client official corporate domain migration per legal notice"
                  value={emailEditReason}
                  onChange={(e) => setEmailEditReason(e.target.value)}
                  className="w-full bg-[#0a1128] border border-amber-500/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Per Section 4, email changes are preserved in append-only audit history with old/new values.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editingClient.internal_notes || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, internal_notes: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e3a8a]/40">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 bg-[#0f1c3d] text-slate-300 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!emailEditReason.trim()}
                  className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  Commit Update &amp; Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Draft Progress Report Modal */}
      {activeReportClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#070d1f] border border-[#1e3a8a] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3a8a]/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Draft Customer Progress Report (Section 5)
                </h3>
              </div>
              <button
                onClick={() => setActiveReportClient(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Recipient Client:</span>
              <div className="text-white font-bold text-sm">{activeReportClient.company_name}</div>
              <div className="flex items-center gap-1.5 font-mono text-sky-300 text-[11px]">
                <Mail className="w-3.5 h-3.5" />
                <span>{activeReportClient.primary_email}</span>
              </div>
            </div>

            <form onSubmit={handleCreateReportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Project Site *</label>
                  <select
                    value={reportFormData.project_id}
                    onChange={(e) => setReportFormData({ ...reportFormData, project_id: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">
                    Completion Milestone *
                  </label>
                  <select
                    value={reportFormData.milestone_pct}
                    onChange={(e) => setReportFormData({ ...reportFormData, milestone_pct: Number(e.target.value) })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 font-bold text-emerald-400"
                  >
                    <option value={25}>25% Substructure / Groundworks</option>
                    <option value={50}>50% Structural Framing &amp; Decking</option>
                    <option value={75}>75% Enclosure &amp; MEPFS Roughed-In</option>
                    <option value={100}>100% Substantial Handover &amp; Punchlist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Reporting Period *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Week 42 (Oct 13 - Oct 19, 2026)"
                  value={reportFormData.reporting_period}
                  onChange={(e) => setReportFormData({ ...reportFormData, reporting_period: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Executive Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={reportFormData.summary}
                  onChange={(e) => setReportFormData({ ...reportFormData, summary: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Completed Work *</label>
                <textarea
                  rows={2}
                  required
                  value={reportFormData.completed_work}
                  onChange={(e) => setReportFormData({ ...reportFormData, completed_work: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Current Activities *</label>
                <input
                  type="text"
                  required
                  value={reportFormData.current_activities}
                  onChange={(e) => setReportFormData({ ...reportFormData, current_activities: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Next Steps *</label>
                <input
                  type="text"
                  required
                  value={reportFormData.next_steps}
                  onChange={(e) => setReportFormData({ ...reportFormData, next_steps: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e3a8a]/40">
                <button
                  type="button"
                  onClick={() => setActiveReportClient(null)}
                  className="px-4 py-2 bg-[#0f1c3d] text-slate-300 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Generate Report Draft</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Report PDF Preview & Official Email Send Modal (Section 5) */}
      {previewReport && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#070d1f] border border-[#1e3a8a] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3a8a]/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Customer Progress Report #{previewReport.report_id}
                </h3>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Report Document Paper Preview */}
            <div className="bg-white text-slate-900 rounded-xl p-6 shadow-inner space-y-4 font-sans text-xs">
              {/* Document Header */}
              <div className="flex items-start justify-between border-b pb-3 border-slate-200">
                <div>
                  <div className="text-lg font-black tracking-tight text-emerald-800">
                    de RUEDA CONSTRUCTION
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Executive Milestone Progress Report
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black font-mono text-emerald-700">
                    {previewReport.milestone_pct}% MILESTONE
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Ref: {previewReport.report_id}
                  </div>
                </div>
              </div>

              {/* Client & Project Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Client:</span>
                  <div className="font-bold text-slate-800">{previewReport.client_name}</div>
                  <div className="font-mono text-slate-600 text-[11px]">{previewReport.recipient_email}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Project:</span>
                  <div className="font-bold text-slate-800">{previewReport.project_name}</div>
                  <div className="text-slate-600 text-[11px]">{previewReport.reporting_period}</div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                    1. Executive Summary
                  </span>
                  <p className="text-slate-800">{previewReport.summary}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                    2. Completed Construction Scope
                  </span>
                  <p className="text-slate-800">{previewReport.completed_work}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                      3. Current On-Site Activities
                    </span>
                    <p className="text-slate-800">{previewReport.current_activities}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                      4. Planned Next Steps
                    </span>
                    <p className="text-slate-800">{previewReport.next_steps}</p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              {previewReport.photos && previewReport.photos.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1.5">
                    Approved Dated Site Photos
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {previewReport.photos.map((p, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden border border-slate-200">
                        <img src={p.url} alt={p.caption} className="w-full h-28 object-cover" />
                        <div className="p-1.5 bg-slate-50 text-[10px] text-slate-700 font-medium flex items-center justify-between">
                          <span className="truncate">{p.caption}</span>
                          <span className="font-mono text-slate-400 shrink-0">{p.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signoff and Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Prepared by: {previewReport.prepared_by}</span>
                <span>Approved by: {previewReport.approved_by || 'CEO Verification Required'}</span>
              </div>
            </div>

            {/* Email Dispatch Control Notice */}
            <div className="p-3.5 bg-[#0a1128] border border-[#1e3a8a] rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Delivery Status:</span>
                <span className="font-bold text-sky-300">{previewReport.delivery_status}</span>
                {previewReport.sent_at && (
                  <span className="text-slate-400 text-[10px] block font-mono">Sent: {previewReport.sent_at}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="px-3 py-1.5 bg-[#0f1c3d] text-slate-300 hover:text-white rounded-lg cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  disabled={isSendingReport || previewReport.delivery_status === 'Sending'}
                  onClick={() => handleSendProgressReport(previewReport.report_id)}
                  className="px-4 py-1.5 bg-linear-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-lg shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSendingReport
                      ? 'Transmitting via SMTP...'
                      : previewReport.delivery_status === 'Delivered'
                      ? 'Resend Official Email'
                      : 'Approve & Send to Client'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
