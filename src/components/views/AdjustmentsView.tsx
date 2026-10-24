import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectAdjustment, AdjustmentCategory, AdjustmentWorkflowState } from '../../types';
import {
  SlidersHorizontal,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  Clock,
  ArrowRight,
  AlertTriangle,
  Building,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
  FileText,
  User,
  X,
  Sparkles,
} from 'lucide-react';

export const AdjustmentsView: React.FC = () => {
  const {
    projectAdjustments,
    addAdjustment,
    reviewAdjustment,
    applyAdjustment,
    sites,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [reviewingAdjustment, setReviewingAdjustment] = useState<ProjectAdjustment | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // New adjustment request form
  const [formData, setFormData] = useState({
    site_id: sites[0]?.site_id || 'SITE-001',
    category: 'Budget & Financial Limit' as AdjustmentCategory,
    title: '',
    detailed_reason: '',
    requested_effective_date: new Date().toISOString().substring(0, 10),
    before_value: '',
    proposed_after_value: '',
    delta: '',
    impact_summary: '',
    affected_modules: ['Budget', 'Materials & Inventory'],
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const filteredAdjustments = projectAdjustments.filter((adj) => {
    const matchSearch =
      adj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.adjustment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.detailed_reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || adj.category === selectedCategory;
    const matchState = selectedState === 'ALL' || adj.state === selectedState;
    return matchSearch && matchCat && matchState;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.detailed_reason.trim() || !formData.before_value.trim() || !formData.proposed_after_value.trim()) {
      showNotification('Please fill all mandatory fields: Title, Reason, Current Value, and Proposed After Value.');
      return;
    }

    const targetSite = sites.find((s) => s.site_id === formData.site_id) || sites[0];

    const newAdj = addAdjustment({
      project_id: targetSite?.site_id || 'SITE-001',
      project_name: targetSite?.name || 'Project Site',
      site_id: targetSite?.site_id || 'SITE-001',
      category: formData.category,
      title: formData.title.trim(),
      detailed_reason: formData.detailed_reason.trim(),
      requester: currentUser?.name || 'Site Field Supervisor',
      requester_role: currentUser?.access_point.toUpperCase() || 'SUPERVISOR',
      requested_effective_date: formData.requested_effective_date,
      before_value: formData.before_value.trim(),
      proposed_after_value: formData.proposed_after_value.trim(),
      delta: formData.delta.trim() || 'Custom Adjustment Delta',
      impact_summary: formData.impact_summary.trim() || 'Downstream modules updated upon formal commitment.',
      affected_modules: formData.affected_modules,
    });

    setIsAddOpen(false);
    setFormData({
      site_id: sites[0]?.site_id || 'SITE-001',
      category: 'Budget & Financial Limit',
      title: '',
      detailed_reason: '',
      requested_effective_date: new Date().toISOString().substring(0, 10),
      before_value: '',
      proposed_after_value: '',
      delta: '',
      impact_summary: '',
      affected_modules: ['Budget', 'Materials & Inventory'],
    });

    showNotification(`Submitted formal adjustment request ${newAdj.adjustment_id} for review.`);
  };

  const handleReviewDecision = (decision: 'Approved' | 'Rejected' | 'Returned for Changes') => {
    if (!reviewingAdjustment) return;
    reviewAdjustment(reviewingAdjustment.adjustment_id, decision, reviewNotes);
    setReviewingAdjustment(null);
    setReviewNotes('');
    showNotification(`Adjustment ${reviewingAdjustment.adjustment_id} recorded as ${decision}.`);
  };

  const handleApply = (adjId: string) => {
    const res = applyAdjustment(adjId);
    showNotification(res.message);
  };

  const getStateBadgeClass = (state: AdjustmentWorkflowState) => {
    switch (state) {
      case 'Applied':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'Approved':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/50';
      case 'Under Review':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'Submitted':
        return 'bg-sky-950/80 text-sky-300 border-sky-500/50';
      case 'Returned for Changes':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
      case 'Rejected':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#0a1128] border border-[#10b981] text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-5 h-5 text-[#10b981] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-[#070d1f] via-[#0f1c3d] to-[#070d1f] border border-[#1e3a8a]/50 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e3a8a]/60 text-amber-300 border border-amber-400/30 uppercase">
                Section 14 Spec Standard
              </span>
              <span className="text-xs text-slate-400">Formal Change Control Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Site &amp; Project Adjustment Center
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Controlled change management for construction contracts, scope items, budgets, and milestone schedules. Enforces strict before/after values, impact analysis, two-party approval gates, and transactional execution.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Request Adjustment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#070d1f] border border-[#1e3a8a]/40 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by adjustment title, project name, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a1128] border border-[#1e3a8a]/50 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0a1128] border border-[#1e3a8a]/50 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8]"
          >
            <option value="ALL">All Categories</option>
            <option value="Budget & Financial Limit">Budget &amp; Contract Limit</option>
            <option value="Work Scope">Work Scope</option>
            <option value="Schedule & Milestones">Schedule &amp; Milestones</option>
            <option value="Site Operational Details">Site Operational Details</option>
            <option value="Materials & Inventory">Materials &amp; Inventory</option>
          </select>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-[#0a1128] border border-[#1e3a8a]/50 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Applied">Applied (Committed)</option>
            <option value="Returned for Changes">Returned for Changes</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Adjustments Cards List */}
      <div className="space-y-4">
        {filteredAdjustments.map((adj) => {
          const isCanReview =
            currentUser?.access_point === 'ceo' ||
            currentUser?.access_point === 'admin 1';

          return (
            <div
              key={adj.adjustment_id}
              className="bg-[#070d1f] border border-[#1e3a8a]/50 rounded-2xl p-5 shadow-md hover:border-amber-500/40 transition-all duration-200 space-y-4"
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e3a8a]/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0f1c3d] text-amber-300 border border-amber-500/30">
                    {adj.adjustment_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e3a8a]/40 text-slate-300 border border-[#1e3a8a]/60">
                    {adj.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{adj.project_name}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase border ${getStateBadgeClass(
                      adj.state
                    )}`}
                  >
                    {adj.state}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Req Date: {adj.requested_effective_date}
                  </span>
                </div>
              </div>

              {/* Title & Detailed Reason */}
              <div>
                <h3 className="text-base font-black text-white leading-snug">{adj.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{adj.detailed_reason}</p>
              </div>

              {/* Before vs After Comparison Grid (Section 14 requirement) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Current Baseline Value:
                  </span>
                  <div className="p-2 bg-[#070d1f] rounded-lg border border-slate-700/40 text-slate-300 font-mono text-[11px]">
                    {adj.before_value}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-300 block mb-1">
                    Proposed After Value:
                  </span>
                  <div className="p-2 bg-amber-950/20 rounded-lg border border-amber-500/40 text-amber-200 font-mono text-[11px] font-bold">
                    {adj.proposed_after_value}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                    Calculated Delta &amp; Variance:
                  </span>
                  <div className="p-2 bg-emerald-950/20 rounded-lg border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-black">
                    {adj.delta}
                  </div>
                </div>
              </div>

              {/* Impact Analysis & Downstream Consequences */}
              <div className="p-3 bg-[#0f1c3d]/40 border border-[#1e3a8a]/30 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-sky-300 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Impact Analysis &amp; Downstream Consequences</span>
                </div>
                <p className="text-slate-300 text-[11px]">{adj.impact_summary}</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Affected Modules:</span>
                  {adj.affected_modules.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#070d1f] text-slate-300 border border-[#1e3a8a]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Audit Signoff & Decision Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#1e3a8a]/30 text-xs">
                <div className="space-y-0.5 text-[11px] text-slate-400 font-mono">
                  <div>
                    Requested by: <strong className="text-slate-200">{adj.requester}</strong> ({adj.requester_role})
                  </div>
                  {adj.reviewer_approver && (
                    <div>
                      Decision by: <strong className="text-slate-200">{adj.reviewer_approver}</strong> · {adj.decision_timestamp?.slice(0, 10)}
                    </div>
                  )}
                  {adj.decision_notes && (
                    <div className="text-slate-400 italic">Notes: "{adj.decision_notes}"</div>
                  )}
                </div>

                {/* Action Buttons depending on state */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Under Review / Submitted state -> Review actions */}
                  {(adj.state === 'Submitted' || adj.state === 'Under Review') && isCanReview && (
                    <button
                      onClick={() => {
                        setReviewingAdjustment(adj);
                        setReviewNotes('');
                      }}
                      className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Review &amp; Decide</span>
                    </button>
                  )}

                  {/* Approved state -> Transactional Commit */}
                  {adj.state === 'Approved' && (
                    <button
                      onClick={() => handleApply(adj.adjustment_id)}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply &amp; Commit to Project</span>
                    </button>
                  )}

                  {/* Applied state confirmation */}
                  {adj.state === 'Applied' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Committed on {adj.application_timestamp?.slice(0, 10)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAdjustments.length === 0 && (
        <div className="text-center py-12 bg-[#070d1f] border border-[#1e3a8a]/40 rounded-2xl p-8 space-y-3">
          <SlidersHorizontal className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Project Adjustments Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All project scopes and contract budgets are currently running on their baseline parameters.
          </p>
        </div>
      )}

      {/* New Project Adjustment Request Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#070d1f] border border-[#1e3a8a] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3a8a]/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  New Project Adjustment Request
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Target Project Site *</label>
                  <select
                    value={formData.site_id}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Adjustment Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  >
                    <option value="Budget & Financial Limit">Budget &amp; Financial Limit</option>
                    <option value="Work Scope">Work Scope</option>
                    <option value="Schedule & Milestones">Schedule &amp; Milestones</option>
                    <option value="Site Operational Details">Site Operational Details</option>
                    <option value="Staffing & Supervision">Staffing &amp; Supervision</option>
                    <option value="Materials & Inventory">Materials &amp; Inventory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Adjustment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Additional Structural Precast Beams Variation Order"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Detailed Operational Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why this change is necessary (client request, municipal change, engineering requirement)..."
                  value={formData.detailed_reason}
                  onChange={(e) => setFormData({ ...formData, detailed_reason: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Before / Baseline Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₱36,200,000.00 or Nov 05, 2026"
                    value={formData.before_value}
                    onChange={(e) => setFormData({ ...formData, before_value: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Proposed After Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₱38,500,000.00 or Nov 12, 2026"
                    value={formData.proposed_after_value}
                    onChange={(e) => setFormData({ ...formData, proposed_after_value: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Delta / Difference</label>
                  <input
                    type="text"
                    placeholder="e.g. +₱2,300,000.00 or +7 Days"
                    value={formData.delta}
                    onChange={(e) => setFormData({ ...formData, delta: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Requested Effective Date</label>
                  <input
                    type="date"
                    required
                    value={formData.requested_effective_date}
                    onChange={(e) => setFormData({ ...formData, requested_effective_date: e.target.value })}
                    className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Impact Analysis Summary</label>
                <textarea
                  rows={2}
                  placeholder="Detail consequences on schedule, procurement deliveries, and workforce allocation..."
                  value={formData.impact_summary}
                  onChange={(e) => setFormData({ ...formData, impact_summary: e.target.value })}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow cursor-pointer"
                >
                  Submit for Formal Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Decision Modal */}
      {reviewingAdjustment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#070d1f] border border-[#1e3a8a] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3a8a]/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Executive Review: {reviewingAdjustment.adjustment_id}
                </h3>
              </div>
              <button
                onClick={() => setReviewingAdjustment(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl space-y-1">
                <div className="text-white font-bold text-sm">{reviewingAdjustment.title}</div>
                <div className="text-slate-400 text-[11px]">{reviewingAdjustment.detailed_reason}</div>
                <div className="pt-2 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Delta: <strong className="text-amber-300">{reviewingAdjustment.delta}</strong></span>
                  <span className="text-slate-400">Project: <strong className="text-white">{reviewingAdjustment.project_name}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">
                  Executive Decision Notes / Directives
                </label>
                <textarea
                  rows={3}
                  placeholder="Record justification, contract clause reference, or amendments..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-[#0a1128] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#1e3a8a]/40">
                <button
                  type="button"
                  onClick={() => handleReviewDecision('Rejected')}
                  className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold rounded-xl cursor-pointer"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewDecision('Returned for Changes')}
                  className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold rounded-xl cursor-pointer"
                >
                  Return for Changes
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewDecision('Approved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Adjustment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
