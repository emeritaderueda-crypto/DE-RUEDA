import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProcurementTimelineItem } from '../../types';
import {
  GANTT_TASKS,
  GanttTask,
} from '../dashboard/ProjectGanttChart';
import {
  Calendar,
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ChevronRight,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  X,
  Package,
  Truck,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  DollarSign,
  Maximize2,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';

interface ProjectTimelineGanttProps {
  initialSiteId?: string;
  isCompactDashboardWidget?: boolean;
  onOpenFullView?: () => void;
}

export const ProjectTimelineGantt: React.FC<ProjectTimelineGanttProps> = ({
  initialSiteId,
  isCompactDashboardWidget = false,
  onOpenFullView,
}) => {
  const {
    sites,
    procurementTimeline,
    addProcurementTimelineItem,
    updateProcurementTimelineItem,
    deleteProcurementTimelineItem,
    currentSite,
    addAuditLog,
  } = useApp();

  const [siteFilter, setSiteFilter] = useState<string>(initialSiteId || currentSite || 'ALL');
  const [viewMode, setViewMode] = useState<'ALL' | 'SITE_PROGRESS' | 'PROCUREMENT'>('ALL');
  const [zoomLevel, setZoomLevel] = useState<'MONTHLY' | 'WEEKLY' | 'QUARTERLY'>('MONTHLY');
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(false);

  // Modal State for Adding/Editing Procurement Milestone
  const [isAddProcurementOpen, setIsAddProcurementOpen] = useState(false);
  const [editingProcurement, setEditingProcurement] = useState<ProcurementTimelineItem | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<GanttTask | null>(null);

  // Form State for New/Edit Procurement
  const [procForm, setProcForm] = useState<Omit<ProcurementTimelineItem, 'id'>>({
    site_id: 'SITE-001',
    site_name: 'Mariveles Industrial Park Warehouse A',
    material_name: '',
    category: 'Structural',
    supplier: '',
    quantity: 1,
    unit: 'Units',
    unit_cost: 0,
    total_cost: 0,
    target_delivery_date: '2026-11-15',
    status: 'PO_APPROVED',
    criticality: 'CRITICAL',
    lead_time_days: 14,
    associated_task_id: 'T-103',
    notes: '',
  });

  // Calculate timeline bounds (spanning from Feb 2026 to Jan 2027)
  const timelineStart = new Date('2026-02-01');
  const timelineEnd = new Date('2027-01-31');
  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));

  // Current Date PHT marker (Oct 18, 2026)
  const currentDate = new Date('2026-10-18');
  const currentDayOffset = Math.max(
    0,
    Math.min(totalDays, Math.ceil((currentDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)))
  );
  const currentMarkerPercent = (currentDayOffset / totalDays) * 100;

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return GANTT_TASKS.filter((t) => {
      if (siteFilter !== 'ALL' && t.siteId !== siteFilter) return false;
      if (criticalOnly && !t.isCriticalPath) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.siteName.toLowerCase().includes(q) ||
          t.supervisor.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [siteFilter, criticalOnly, searchQuery]);

  // Filter Procurement Items
  const filteredProcurement = useMemo(() => {
    return procurementTimeline.filter((p) => {
      if (siteFilter !== 'ALL' && p.site_id !== siteFilter) return false;
      if (criticalOnly && p.criticality !== 'CRITICAL') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.material_name.toLowerCase().includes(q) ||
          p.supplier.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.site_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [procurementTimeline, siteFilter, criticalOnly, searchQuery]);

  // Helper to convert date to percent position on timeline
  const getPercentOffset = (dateStr: string): number => {
    const d = new Date(dateStr);
    const offset = Math.ceil((d.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (offset / totalDays) * 100));
  };

  const getPercentWidth = (startStr: string, endStr: string): number => {
    const startP = getPercentOffset(startStr);
    const endP = getPercentOffset(endStr);
    return Math.max(1.5, endP - startP);
  };

  // KPI Calculations
  const averageSiteProgress = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    const sum = filteredTasks.reduce((acc, t) => acc + t.progress, 0);
    return Math.round(sum / filteredTasks.length);
  }, [filteredTasks]);

  const procurementDeliveredCount = useMemo(() => {
    return filteredProcurement.filter((p) => p.status === 'DELIVERED').length;
  }, [filteredProcurement]);

  const procurementTotalValue = useMemo(() => {
    return filteredProcurement.reduce((acc, p) => acc + (p.total_cost || 0), 0);
  }, [filteredProcurement]);

  const onTimeDeliveryRate = useMemo(() => {
    const completed = filteredProcurement.filter((p) => p.status === 'DELIVERED');
    if (completed.length === 0) return 100;
    const onTime = completed.filter((p) => {
      if (!p.actual_delivery_date) return true;
      return new Date(p.actual_delivery_date) <= new Date(p.target_delivery_date);
    });
    return Math.round((onTime.length / completed.length) * 100);
  }, [filteredProcurement]);

  // Month Columns definition for the timeline header
  const months = [
    { label: 'Feb 2026', start: '2026-02-01', days: 28 },
    { label: 'Mar 2026', start: '2026-03-01', days: 31 },
    { label: 'Apr 2026', start: '2026-04-01', days: 30 },
    { label: 'May 2026', start: '2026-05-01', days: 31 },
    { label: 'Jun 2026', start: '2026-06-01', days: 30 },
    { label: 'Jul 2026', start: '2026-07-01', days: 31 },
    { label: 'Aug 2026', start: '2026-08-01', days: 31 },
    { label: 'Sep 2026', start: '2026-09-01', days: 30 },
    { label: 'Oct 2026 (Now)', start: '2026-10-01', days: 31, isCurrent: true },
    { label: 'Nov 2026', start: '2026-11-01', days: 30 },
    { label: 'Dec 2026', start: '2026-12-01', days: 31 },
    { label: 'Jan 2027', start: '2027-01-01', days: 31 },
  ];

  // Handle Form Submit
  const handleSaveProcurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procForm.material_name.trim() || !procForm.supplier.trim()) {
      alert('Please fill out material name and supplier.');
      return;
    }

    const calculatedTotal = Number(procForm.quantity) * Number(procForm.unit_cost);
    const itemData = {
      ...procForm,
      total_cost: calculatedTotal > 0 ? calculatedTotal : Number(procForm.total_cost),
    };

    if (editingProcurement) {
      updateProcurementTimelineItem(editingProcurement.id, itemData);
    } else {
      addProcurementTimelineItem(itemData);
    }

    setIsAddProcurementOpen(false);
    setEditingProcurement(null);
  };

  const handleOpenEditProcurement = (item: ProcurementTimelineItem) => {
    setEditingProcurement(item);
    setProcForm({
      site_id: item.site_id,
      site_name: item.site_name,
      material_name: item.material_name,
      category: item.category,
      supplier: item.supplier,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost,
      target_delivery_date: item.target_delivery_date,
      status: item.status,
      criticality: item.criticality,
      lead_time_days: item.lead_time_days,
      associated_task_id: item.associated_task_id,
      notes: item.notes || '',
    });
    setIsAddProcurementOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Toolbar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/30">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Visual Project Timeline &amp; Gantt Engine</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Live Schedule Tracker
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronizes site construction milestones, work packages, and material procurement deliveries against official project schedules.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Layer Selector */}
            <div className="bg-[#13241f] p-1 rounded-xl border border-[#234338] flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'ALL'
                    ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Integrated
              </button>
              <button
                type="button"
                onClick={() => setViewMode('SITE_PROGRESS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'SITE_PROGRESS'
                    ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Site Progress
              </button>
              <button
                type="button"
                onClick={() => setViewMode('PROCUREMENT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'PROCUREMENT'
                    ? 'bg-[#a3e635] text-[#080f0d] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Procurement
              </button>
            </div>

            {/* Add Procurement Milestone Button */}
            <button
              type="button"
              onClick={() => {
                setEditingProcurement(null);
                setProcForm({
                  site_id: siteFilter !== 'ALL' ? siteFilter : 'SITE-001',
                  site_name:
                    sites.find((s) => s.site_id === siteFilter)?.name ||
                    'Mariveles Industrial Park Warehouse A',
                  material_name: '',
                  category: 'Structural',
                  supplier: '',
                  quantity: 10,
                  unit: 'Units',
                  unit_cost: 5000,
                  total_cost: 50000,
                  target_delivery_date: '2026-11-15',
                  status: 'PO_APPROVED',
                  criticality: 'CRITICAL',
                  lead_time_days: 14,
                  associated_task_id: 'T-103',
                  notes: '',
                });
                setIsAddProcurementOpen(true);
              }}
              className="px-3.5 py-2 bg-[#13241f] border border-[#a3e635]/40 hover:bg-[#a3e635] text-slate-200 hover:text-[#080f0d] font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Procurement Milestone</span>
            </button>

            {isCompactDashboardWidget && onOpenFullView && (
              <button
                type="button"
                onClick={onOpenFullView}
                className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Dedicated View</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#234338]/60">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Project Site Scope
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full bg-[#13241f] border border-[#234338] text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none cursor-pointer"
              >
                <option value="ALL">All Project Sites (Cross-Site Schedule)</option>
                {sites.map((s) => (
                  <option key={s.site_id} value={s.site_id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Search Milestone or Material
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search rebar, concrete, framing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#13241f] border border-[#234338] text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Timescale Scope
            </label>
            <div className="bg-[#13241f] border border-[#234338] rounded-xl px-3 py-2 text-xs flex items-center justify-between text-slate-300">
              <span className="font-mono font-semibold">Feb 2026 – Jan 2027</span>
              <span className="text-[10px] text-[#a3e635] font-bold font-mono">12 Months</span>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setCriticalOnly(!criticalOnly)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                criticalOnly
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-[#13241f] border-[#234338] text-slate-300 hover:text-white'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${criticalOnly ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>{criticalOnly ? 'Critical Path Only (Active)' : 'Filter Critical Path'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Average Site Progress
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#a3e635] font-mono mt-1">
            {averageSiteProgress}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across {filteredTasks.length} construction tasks</div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
            Procurement Fulfilled
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono mt-1">
            {procurementDeliveredCount} / {filteredProcurement.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Deliveries verified on-site</div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            On-Time Logistics Rate
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
            {onTimeDeliveryRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Schedule adherence metric</div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Committed Procurement
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">
            ₱{(procurementTotalValue / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Contracted materials value</div>
        </div>
      </div>

      {/* Visual Gantt Chart & Timeline Canvas */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl overflow-hidden shadow-2xl">
        {/* Timeline Header Strip */}
        <div className="p-3 bg-[#13241f] border-b border-[#234338] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#a3e635]" />
            <span className="font-bold text-white uppercase tracking-wider">
              {siteFilter === 'ALL' ? 'Integrated Multi-Site Schedule' : sites.find((s) => s.site_id === siteFilter)?.name || siteFilter}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Completed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
              <span>In Progress</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              <span>Procurement Link</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
              <span>Critical Path</span>
            </span>
          </div>
        </div>

        {/* Scrollable Timeline Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[960px] relative">
            {/* Months Header Row */}
            <div className="flex border-b border-[#234338] bg-[#080f0d] text-[10px] font-bold text-slate-400 sticky top-0 z-10">
              <div className="w-72 p-2.5 shrink-0 border-r border-[#234338] uppercase">
                Work Package / Milestone Item
              </div>
              <div className="flex-1 flex relative">
                {months.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 p-2 text-center border-r border-[#234338]/40 truncate ${
                      m.isCurrent ? 'bg-[#a3e635]/10 text-[#a3e635] font-black' : ''
                    }`}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Date Vertical Line (Oct 18, 2026 PHT) */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `calc(18rem + (100% - 18rem) * ${currentMarkerPercent / 100})` }}
            >
              <div className="w-px h-full bg-rose-500 border-r border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <div className="absolute top-1 -translate-x-1/2 bg-rose-500 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded shadow">
                TODAY
              </div>
            </div>

            {/* Section 1: Construction Site Progress Tasks */}
            {(viewMode === 'ALL' || viewMode === 'SITE_PROGRESS') && (
              <div className="divide-y divide-[#234338]/30">
                <div className="bg-[#13241f]/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-[#a3e635]" />
                  <span>Site Construction Work Packages &amp; Progress</span>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="p-4 text-xs text-slate-500 text-center">No construction tasks match current filters.</div>
                ) : (
                  filteredTasks.map((task) => {
                    const startPercent = getPercentOffset(task.startDate);
                    const widthPercent = getPercentWidth(task.startDate, task.endDate);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskDetail(task)}
                        className="flex items-center hover:bg-[#13241f]/60 transition-colors cursor-pointer group"
                      >
                        <div className="w-72 p-2.5 shrink-0 border-r border-[#234338] text-xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white group-hover:text-[#a3e635] transition-colors truncate">
                              {task.name}
                            </span>
                            {task.isCriticalPath && (
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-rose-500/20 text-rose-300 rounded shrink-0">
                                CP
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{task.siteCode}</span>
                            <span>&bull;</span>
                            <span>{task.category}</span>
                            <span>&bull;</span>
                            <span className="font-mono text-emerald-400">{task.progress}%</span>
                          </div>
                        </div>

                        <div className="flex-1 p-2 relative h-12 flex items-center">
                          {/* Progress Bar Container */}
                          <div
                            className="absolute h-6 rounded-md overflow-hidden shadow-sm flex items-center text-[10px] font-mono font-bold text-white px-2 transition-all group-hover:brightness-110"
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor:
                                task.status === 'Completed'
                                  ? '#10b981'
                                  : task.isCriticalPath
                                  ? '#0284c7'
                                  : '#3b82f6',
                            }}
                          >
                            {/* Inner Actual Completed Progress Fill */}
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-white/20"
                              style={{ width: `${task.progress}%` }}
                            />
                            <span className="relative z-10 truncate">{task.progress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Section 2: Procurement & Material Deliveries */}
            {(viewMode === 'ALL' || viewMode === 'PROCUREMENT') && (
              <div className="divide-y divide-[#234338]/30">
                <div className="bg-[#13241f]/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3 text-amber-400" />
                    <span>Procurement &amp; Material Deliveries Against Schedule</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#a3e635]">
                    {filteredProcurement.length} Contracted Deliveries
                  </span>
                </div>

                {filteredProcurement.length === 0 ? (
                  <div className="p-4 text-xs text-slate-500 text-center">No procurement items match current filters.</div>
                ) : (
                  filteredProcurement.map((proc) => {
                    const deliveryPercent = getPercentOffset(proc.target_delivery_date);

                    return (
                      <div
                        key={proc.id}
                        onClick={() => handleOpenEditProcurement(proc)}
                        className="flex items-center hover:bg-[#13241f]/60 transition-colors cursor-pointer group"
                      >
                        <div className="w-72 p-2.5 shrink-0 border-r border-[#234338] text-xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                              {proc.material_name}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1 py-0.2 rounded shrink-0 ${
                                proc.status === 'DELIVERED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : proc.status === 'IN_TRANSIT'
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {proc.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="truncate">{proc.supplier}</span>
                            <span>&bull;</span>
                            <span className="font-mono text-slate-300 font-semibold">
                              {proc.quantity} {proc.unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 p-2 relative h-10 flex items-center">
                          {/* Procurement Milestone Badge */}
                          <div
                            className="absolute -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold font-mono shadow-md transition-all group-hover:scale-105 z-10"
                            style={{
                              left: `${deliveryPercent}%`,
                              backgroundColor:
                                proc.status === 'DELIVERED'
                                  ? '#064e3b'
                                  : proc.status === 'IN_TRANSIT'
                                  ? '#0e3a4e'
                                  : '#3f2c06',
                              borderColor:
                                proc.status === 'DELIVERED'
                                  ? '#10b981'
                                  : proc.status === 'IN_TRANSIT'
                                  ? '#0ea5e9'
                                  : '#f59e0b',
                              color:
                                proc.status === 'DELIVERED'
                                  ? '#6ee7b7'
                                  : proc.status === 'IN_TRANSIT'
                                  ? '#7dd3fc'
                                  : '#fde68a',
                            }}
                          >
                            {proc.status === 'DELIVERED' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : proc.status === 'IN_TRANSIT' ? (
                              <Truck className="w-3 h-3 text-sky-400 animate-pulse" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-400" />
                            )}
                            <span className="truncate max-w-[140px]">{proc.target_delivery_date}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL: ADD / EDIT PROCUREMENT MILESTONE ================= */}
      {isAddProcurementOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#a3e635]" />
                <span className="text-sm font-bold text-white">
                  {editingProcurement ? 'Edit Procurement Milestone' : 'Link Material Delivery to Project Schedule'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProcurementOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#234338]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProcurement} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Project Site *</label>
                  <select
                    value={procForm.site_id}
                    onChange={(e) => {
                      const found = sites.find((s) => s.site_id === e.target.value);
                      setProcForm({
                        ...procForm,
                        site_id: e.target.value,
                        site_name: found?.name || e.target.value,
                      });
                    }}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trade / Category *</label>
                  <select
                    value={procForm.category}
                    onChange={(e) => setProcForm({ ...procForm, category: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none"
                  >
                    <option value="Structural">Structural (Steel, Rebar, Beams)</option>
                    <option value="Civil Works">Civil Works (Concrete, Excavation, Shoring)</option>
                    <option value="Architectural">Architectural (Roofing, Facade, Glass)</option>
                    <option value="MEPF">MEPF (Electrical, HVAC, Plumbing, Fire)</option>
                    <option value="Equipment">Equipment / Heavy Plant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Material / Procurement Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Insulated Sandwich Roofing Panels 0.5mm"
                  value={procForm.material_name}
                  onChange={(e) => setProcForm({ ...procForm, material_name: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contracted Supplier / Vendor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Union Galvasteel Corp."
                    value={procForm.supplier}
                    onChange={(e) => setProcForm({ ...procForm, supplier: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={procForm.target_delivery_date}
                    onChange={(e) => setProcForm({ ...procForm, target_delivery_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={procForm.quantity}
                    onChange={(e) => setProcForm({ ...procForm, quantity: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="sq.m / Tons / cu.m"
                    value={procForm.unit}
                    onChange={(e) => setProcForm({ ...procForm, unit: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit Cost (₱)</label>
                  <input
                    type="number"
                    value={procForm.unit_cost}
                    onChange={(e) => setProcForm({ ...procForm, unit_cost: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Delivery Status</label>
                  <select
                    value={procForm.status}
                    onChange={(e) => setProcForm({ ...procForm, status: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none"
                  >
                    <option value="DELIVERED">Delivered &amp; Inspected on Site</option>
                    <option value="IN_TRANSIT">In Transit (Dispatched)</option>
                    <option value="PO_APPROVED">PO Approved / Awaiting Dispatch</option>
                    <option value="PO_PENDING">Pending PO Approval</option>
                    <option value="DELAYED">Delayed / Critical Attention</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Criticality</label>
                  <select
                    value={procForm.criticality}
                    onChange={(e) => setProcForm({ ...procForm, criticality: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none"
                  >
                    <option value="CRITICAL">Critical Path Requirement</option>
                    <option value="NORMAL">Standard Delivery</option>
                    <option value="LOW">Low Criticality</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Associated Construction Work Package</label>
                <select
                  value={procForm.associated_task_id || ''}
                  onChange={(e) => setProcForm({ ...procForm, associated_task_id: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="">None / General Site Supply</option>
                  {GANTT_TASKS.filter((t) => t.siteId === procForm.site_id).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} - {t.name} ({t.startDate} to {t.endDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Logistics Memo</label>
                <textarea
                  rows={2}
                  value={procForm.notes}
                  onChange={(e) => setProcForm({ ...procForm, notes: e.target.value })}
                  placeholder="Carrier tracking, inspection certification, or staging bay details..."
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white outline-none placeholder-slate-500"
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-between">
                {editingProcurement && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this procurement milestone?')) {
                        deleteProcurementTimelineItem(editingProcurement.id);
                        setIsAddProcurementOpen(false);
                      }
                    }}
                    className="px-3 py-2 text-rose-400 hover:text-white hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsAddProcurementOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-black rounded-lg transition-colors cursor-pointer"
                  >
                    {editingProcurement ? 'Save Milestone' : 'Create Milestone'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TASK DETAIL VIEW ================= */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#234338] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#a3e635]" />
                <span className="text-sm font-bold text-white">Work Package Detail: {selectedTaskDetail.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#13241f] p-3 rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Project Site</div>
                  <div className="font-bold text-white mt-0.5">{selectedTaskDetail.siteName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{selectedTaskDetail.siteCode}</div>
                </div>

                <div className="bg-[#13241f] p-3 rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Supervisor Lead</div>
                  <div className="font-bold text-white mt-0.5">{selectedTaskDetail.supervisor}</div>
                  <div className="text-[10px] text-[#a3e635] font-semibold">{selectedTaskDetail.category}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#13241f] p-3 rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Planned Schedule</div>
                  <div className="font-mono text-white mt-0.5">{selectedTaskDetail.startDate} to {selectedTaskDetail.endDate}</div>
                </div>

                <div className="bg-[#13241f] p-3 rounded-xl border border-[#234338]">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Completion Status</div>
                  <div className="font-mono text-[#a3e635] font-black text-sm mt-0.5">{selectedTaskDetail.progress}% Complete</div>
                  <div className="text-[10px] text-slate-400">{selectedTaskDetail.status}</div>
                </div>
              </div>

              {/* Linked Procurement Items for this Work Package */}
              <div className="bg-[#13241f]/70 border border-[#234338] rounded-xl p-3">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Linked Procurement Deliveries for this Phase</span>
                </div>

                {procurementTimeline.filter((p) => p.associated_task_id === selectedTaskDetail.id).length === 0 ? (
                  <div className="text-slate-500 text-[11px]">No specific procurement delivery linked to this task.</div>
                ) : (
                  <div className="space-y-1.5">
                    {procurementTimeline
                      .filter((p) => p.associated_task_id === selectedTaskDetail.id)
                      .map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-[#080f0d] p-2 rounded-lg text-[11px]">
                          <div>
                            <div className="font-bold text-white">{p.material_name}</div>
                            <div className="text-[10px] text-slate-400">{p.supplier} · {p.quantity} {p.unit}</div>
                          </div>
                          <span className="font-mono text-emerald-400 font-bold">{p.target_delivery_date}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#234338] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTaskDetail(null)}
                className="px-4 py-1.5 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
