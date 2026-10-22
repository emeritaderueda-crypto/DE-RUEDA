import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../layout/Sidebar';
import {
  ProjectGanttChart,
  GANTT_TASKS,
  GANTT_MILESTONES,
  GanttMilestone,
  STORAGE_MILESTONES_KEY,
} from '../dashboard/ProjectGanttChart';
import { CriticalMilestoneAlerts } from '../dashboard/CriticalMilestoneAlerts';
import { OverduePayoutNotificationWidget } from '../dashboard/OverduePayoutNotificationWidget';
import { LaborCapacityWidget } from '../dashboard/LaborCapacityWidget';
import { EquipmentSchedulerWidget } from '../dashboard/EquipmentSchedulerWidget';
import { ManagerApprovalsWidget } from '../dashboard/ManagerApprovalsWidget';
import { RealtimeGcashStreamWidget } from '../dashboard/RealtimeGcashStreamWidget';
import { SyncHealthMonitorWidget } from '../dashboard/SyncHealthMonitorWidget';
import { CeoPasswordModal } from '../modals/CeoPasswordModal';
import {
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  QrCode,
  UserPlus,
  Calculator,
  Printer,
  PackagePlus,
  Receipt,
  ArrowRight,
  ExternalLink,
  Filter,
  Flame,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  Check,
  TrendingUp,
  CheckSquare,
  Square,
  ListChecks,
  Zap,
  DollarSign,
  PieChart,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Stamp,
  Tractor,
  Wallet,
  UtensilsCrossed,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (page: PageId) => void;
  onOpenQrScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQrScanner,
}) => {
  const {
    employees,
    sites,
    attendance,
    payroll,
    paymentRecords,
    materials,
    expenses,
    auditLogs,
    currentSite,
    settings,
    isOnline,
    offlineStats,
    addAuditLog,
    isCeoUnlocked,
  } = useApp();

  const [isCeoPasswordModalOpen, setIsCeoPasswordModalOpen] = useState(false);

  // Gantt Chart Filter Panel State
  const [ganttSiteFilter, setGanttSiteFilter] = useState<string>(currentSite);
  const [ganttStatusFilter, setGanttStatusFilter] = useState<string>('ALL');
  const [ganttCriticalOnly, setGanttCriticalOnly] = useState<boolean>(false);

  // Editable Milestones State with localStorage persistence & synchronization with Gantt chart
  const [milestones, setMilestones] = useState<GanttMilestone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MILESTONES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missing = GANTT_MILESTONES.filter((gm) => !existingIds.has(gm.id));
          if (missing.length > 0) {
            const merged = [...parsed, ...missing];
            localStorage.setItem(STORAGE_MILESTONES_KEY, JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch {
      // storage unavailable
    }
    return GANTT_MILESTONES;
  });

  // Listen for milestone updates across components
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setMilestones(e.detail);
      }
    };
    window.addEventListener('derueda_milestones_updated', handleSync);
    return () => {
      window.removeEventListener('derueda_milestones_updated', handleSync);
    };
  }, []);

  // Sync with currentSite if user switches global header context
  useEffect(() => {
    if (currentSite) {
      setGanttSiteFilter(currentSite);
    }
  }, [currentSite]);

  const activeEmployees = employees.filter((e) => e.status !== 'archived');
  const filteredEmployees = currentSite === 'ALL'
    ? activeEmployees
    : activeEmployees.filter((e) => e.site_id === currentSite);

  // Present today (2026-10-06)
  const todayStr = '2026-10-06';
  const presentToday = attendance.filter(
    (a) => a.work_date === todayStr && (currentSite === 'ALL' || a.site_id === currentSite)
  );

  const filteredPayroll = currentSite === 'ALL'
    ? payroll
    : payroll.filter((p) => p.site_id === currentSite);

  const pendingPayrollCount = filteredPayroll.filter((p) => p.payment_status === 'Pending').length;
  const pendingProofCount = filteredPayroll.filter((p) => !p.proof_file_id || p.payment_status === 'Pending').length;

  // Notification System: Flag employee records awaiting payout > 48 hours
  const overduePayoutStats = useMemo(() => {
    const now = Date.now();
    let count = 0;
    let totalAmount = 0;
    paymentRecords.forEach((p) => {
      const siteMatch = currentSite === 'ALL' || p.site_id === currentSite;
      if (siteMatch && p.status === 'AWAITING_PAYMENT') {
        const createdTime = new Date(p.created_at || p.approved_at || Date.now()).getTime();
        const ageHours = (now - createdTime) / (1000 * 60 * 60);
        if (ageHours >= 48) {
          count += 1;
          totalAmount += p.expected_amount;
        }
      }
    });
    return { count, totalAmount };
  }, [paymentRecords, currentSite]);

  // ==========================================
  // PROJECT KPIS CALCULATIONS (FROM CONTEXT)
  // ==========================================

  // 1. Total Active Projects
  const activeSites = useMemo(() => {
    return sites.filter((s) => s.project_status === 'Active' || s.project_status === 'In Progress');
  }, [sites]);
  const totalActiveProjects = activeSites.length;

  // 2. Total Budget Utilization Percentage
  const SITE_BUDGETS: Record<string, number> = {
    'SITE-001': 25000000, // ₱25.0M Mariveles Industrial Warehouse A
    'SITE-002': 18500000, // ₱18.5M Subic Commercial Complex
    'SITE-003': 12000000, // ₱12.0M Balanga Residential Heights Phase 2
  };

  const SITE_BASELINES: Record<string, number> = {
    'SITE-001': 16850000, // Civil works, heavy grading, structural steel procurement
    'SITE-002': 11420000, // Shoring, excavation, foundation, post-tensioned slabs
    'SITE-003': 6880000,  // Land development, drainage conduits, duplex footings
  };

  const { totalAllocatedBudget, totalSpent, budgetUtilizationPct, remainingBudget, matSpend, expSpend, paySpend } = useMemo(() => {
    const effectiveSite = ganttSiteFilter === 'ALL' ? (currentSite === 'ALL' ? 'ALL' : currentSite) : ganttSiteFilter;
    let allocated = 0;
    let baseline = 0;

    if (effectiveSite === 'ALL') {
      allocated = Object.values(SITE_BUDGETS).reduce((a, b) => a + b, 0); // 55,500,000
      baseline = Object.values(SITE_BASELINES).reduce((a, b) => a + b, 0); // 35,150,000
    } else {
      allocated = SITE_BUDGETS[effectiveSite] || 25000000;
      baseline = SITE_BASELINES[effectiveSite] || 15000000;
    }

    const mSpend = materials
      .filter((m) => (effectiveSite === 'ALL' || m.site_id === effectiveSite) && m.is_archived === 0)
      .reduce((sum, m) => sum + (m.total_cost || 0), 0);

    const eSpend = expenses
      .filter((e) => (effectiveSite === 'ALL' || e.site_id === effectiveSite) && e.status === 'Approved')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const pSpend = payroll
      .filter((p) => effectiveSite === 'ALL' || p.site_id === effectiveSite)
      .reduce((sum, p) => sum + (p.gross_pay || 0), 0);

    const spent = baseline + mSpend + eSpend + pSpend;
    const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
    const remaining = Math.max(0, allocated - spent);

    return {
      totalAllocatedBudget: allocated,
      totalSpent: spent,
      budgetUtilizationPct: pct,
      remainingBudget: remaining,
      matSpend: mSpend,
      expSpend: eSpend,
      paySpend: pSpend,
    };
  }, [sites, materials, expenses, payroll, currentSite, ganttSiteFilter]);

  // 3. Overdue Milestone Count
  const overdueMilestones = useMemo(() => {
    return milestones.filter((m) => {
      const matchSite = ganttSiteFilter === 'ALL' ? true : m.siteId === ganttSiteFilter;
      const isPast = m.targetDate < todayStr;
      const isNotDone = m.status !== 'Completed' && m.status !== 'Achieved';
      return matchSite && isPast && isNotDone;
    });
  }, [milestones, ganttSiteFilter, todayStr]);

  const overdueMilestoneCount = overdueMilestones.length;

  // Real-time filter counts for Gantt work packages and milestones
  const matchingTasksCount = useMemo(() => {
    return GANTT_TASKS.filter((t) => {
      if (ganttSiteFilter !== 'ALL' && t.siteId !== ganttSiteFilter) return false;
      if (ganttCriticalOnly && !t.isCriticalPath) return false;
      if (ganttStatusFilter !== 'ALL') {
        if (ganttStatusFilter === 'Critical') {
          if (!t.isCriticalPath) return false;
        } else if (ganttStatusFilter === 'In Progress') {
          if (t.status !== 'In Progress' && !(t.progress > 0 && t.progress < 100)) return false;
        } else if (ganttStatusFilter === 'Completed') {
          if (t.status !== 'Completed' && t.progress !== 100) return false;
        } else if (ganttStatusFilter === 'Scheduled') {
          if (t.status !== 'Scheduled' && t.progress !== 0) return false;
        }
      }
      return true;
    }).length;
  }, [ganttSiteFilter, ganttStatusFilter, ganttCriticalOnly]);

  const matchingMilestonesCount = useMemo(() => {
    return milestones.filter((m) => {
      if (ganttSiteFilter !== 'ALL' && m.siteId !== ganttSiteFilter) return false;
      if (ganttCriticalOnly && m.status !== 'Critical') return false;
      if (ganttStatusFilter !== 'ALL') {
        const norm = m.status === 'Achieved' ? 'Completed' : m.status;
        if (ganttStatusFilter === 'Critical') {
          if (m.status !== 'Critical') return false;
        } else if (ganttStatusFilter === 'In Progress') {
          if (norm !== 'In Progress') return false;
        } else if (ganttStatusFilter === 'Completed') {
          if (norm !== 'Completed') return false;
        } else if (ganttStatusFilter === 'Scheduled') {
          if (norm !== 'Upcoming') return false;
        }
      }
      return true;
    }).length;
  }, [milestones, ganttSiteFilter, ganttStatusFilter, ganttCriticalOnly]);

  const criticalItemsCount = useMemo(() => {
    const critTasks = GANTT_TASKS.filter(
      (t) => (ganttSiteFilter === 'ALL' || t.siteId === ganttSiteFilter) && t.isCriticalPath
    ).length;
    const critMilestones = milestones.filter(
      (m) => (ganttSiteFilter === 'ALL' || m.siteId === ganttSiteFilter) && m.status === 'Critical'
    ).length;
    return critTasks + critMilestones;
  }, [milestones, ganttSiteFilter]);

  const siteCounts = useMemo(() => {
    const counts: Record<string, { tasks: number; milestones: number }> = {
      ALL: { tasks: GANTT_TASKS.length, milestones: milestones.length },
      'SITE-001': { tasks: 0, milestones: 0 },
      'SITE-002': { tasks: 0, milestones: 0 },
      'SITE-003': { tasks: 0, milestones: 0 },
    };

    GANTT_TASKS.forEach((t) => {
      if (counts[t.siteId]) counts[t.siteId].tasks++;
    });
    milestones.forEach((m) => {
      if (counts[m.siteId]) counts[m.siteId].milestones++;
    });

    return counts;
  }, [milestones]);

  const statusCounts = useMemo(() => {
    const baseTasks = GANTT_TASKS.filter(
      (t) => ganttSiteFilter === 'ALL' || t.siteId === ganttSiteFilter
    );
    const inProgress = baseTasks.filter((t) => t.status === 'In Progress').length;
    const completed = baseTasks.filter((t) => t.status === 'Completed').length;
    const scheduled = baseTasks.filter((t) => t.status === 'Scheduled').length;
    const critical = baseTasks.filter((t) => t.isCriticalPath).length;

    return {
      all: baseTasks.length,
      inProgress,
      completed,
      scheduled,
      critical,
    };
  }, [ganttSiteFilter]);

  // ==========================================
  // BULK MILESTONE UPDATE STATE & ACTIONS
  // ==========================================
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<Set<string>>(new Set());
  const [bulkActionSuccessMessage, setBulkActionSuccessMessage] = useState<string | null>(null);
  const [isBulkTransitioning, setIsBulkTransitioning] = useState<boolean>(false);

  // Eligible milestones matching current filter criteria
  const filterableMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (ganttSiteFilter !== 'ALL' && m.siteId !== ganttSiteFilter) return false;
      if (ganttCriticalOnly && m.status !== 'Critical') return false;
      if (ganttStatusFilter !== 'ALL') {
        const norm = m.status === 'Achieved' ? 'Completed' : m.status;
        if (ganttStatusFilter === 'Critical') {
          if (m.status !== 'Critical') return false;
        } else if (ganttStatusFilter === 'In Progress') {
          if (norm !== 'In Progress') return false;
        } else if (ganttStatusFilter === 'Completed') {
          if (norm !== 'Completed') return false;
        } else if (ganttStatusFilter === 'Scheduled') {
          if (norm !== 'Upcoming') return false;
        }
      }
      return true;
    });
  }, [milestones, ganttSiteFilter, ganttStatusFilter, ganttCriticalOnly]);

  const pendingFilterableMilestones = useMemo(() => {
    return filterableMilestones.filter((m) => m.status !== 'Completed' && m.status !== 'Achieved');
  }, [filterableMilestones]);

  const toggleMilestoneSelection = (id: string) => {
    setSelectedMilestoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allPendingIds = pendingFilterableMilestones.map((m) => m.id);
    const areAllSelected = allPendingIds.length > 0 && allPendingIds.every((id) => selectedMilestoneIds.has(id));
    if (areAllSelected) {
      setSelectedMilestoneIds(new Set());
    } else {
      setSelectedMilestoneIds(new Set(allPendingIds));
    }
  };

  const handleSelectOverdueOnly = () => {
    const overdueIds = overdueMilestones.map((m) => m.id);
    setSelectedMilestoneIds(new Set(overdueIds));
  };

  const handleClearSelection = () => {
    setSelectedMilestoneIds(new Set());
  };

  // Bulk update handler: single-click transition with audit log entry for each change
  const handleBulkCompleteMilestones = () => {
    if (selectedMilestoneIds.size === 0) return;
    setIsBulkTransitioning(true);

    let updatedCount = 0;

    const updatedMilestones = milestones.map((m) => {
      if (selectedMilestoneIds.has(m.id) && m.status !== 'Completed' && m.status !== 'Achieved') {
        updatedCount++;
        // Trigger audit log entry for each change as requested
        addAuditLog(
          'BULK_UPDATE_MILESTONE',
          'PROJECT_MILESTONE',
          m.id,
          `Transitioned milestone "${m.name}" (${m.siteCode}) to Completed status via Dashboard bulk manager`
        );

        // Mark all sub-tasks as completed as well
        const completedSubTasks = (m.subTasks || []).map((st) => ({
          ...st,
          completed: true,
        }));

        return {
          ...m,
          status: 'Completed' as const,
          subTasks: completedSubTasks,
        };
      }
      return m;
    });

    // Save to state and storage
    setMilestones(updatedMilestones);
    try {
      localStorage.setItem(STORAGE_MILESTONES_KEY, JSON.stringify(updatedMilestones));
      window.dispatchEvent(
        new CustomEvent('derueda_milestones_updated', { detail: updatedMilestones })
      );
    } catch {
      // storage unavailable
    }

    // Clear selection
    setSelectedMilestoneIds(new Set());
    setIsBulkTransitioning(false);

    // Show clear confirmation
    setBulkActionSuccessMessage(
      `Successfully transitioned ${updatedCount} milestone${updatedCount === 1 ? '' : 's'} to 'Completed' status. ${updatedCount} forensic audit log entries recorded in immutable ledger.`
    );

    setTimeout(() => {
      setBulkActionSuccessMessage(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Offline Site Mode Notification Banner */}
      {!isOnline && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>
              <strong>Construction Site Offline Mode Active:</strong> Operating from local encrypted cache ({offlineStats.cachedAttendanceCount} attendance logs, {offlineStats.cachedEmployeesCount} worker files). Scans and disbursements will automatically sync once site network recovers.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            OFFLINE CACHE
          </span>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Executive & Site Operations Dashboard
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Corporate Real-Time Control</span>
            <span>·</span>
            <span>Asia/Manila: <strong className="text-white font-mono">{todayStr}</strong></span>
            <span>·</span>
            <span>Context: <strong className="text-[#a3e635]">{currentSite}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQrScanner}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Scan Attendance QR
          </button>
          <button
            onClick={() => onNavigate('employees')}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#10b981]" />
            Manage Workforce
          </button>
          <button
            onClick={() => {
              if (isCeoUnlocked) {
                onNavigate('ceo_monitoring');
              } else {
                setIsCeoPasswordModalOpen(true);
              }
            }}
            className="px-3 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>CEO Command Vault</span>
            <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-amber-500/30 text-amber-300">
              RESTRICTED
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* PROJECT KPIS SUMMARY WIDGET (USING CONTEXT DATA)     */}
      {/* Displays: Total Active Projects, Total Budget         */}
      {/* Utilization %, and Overdue Milestone Count           */}
      {/* ==================================================== */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        {/* Subtle accent gradient glow */}
        <div className="absolute top-0 right-0 w-96 h-32 bg-gradient-to-l from-[#a3e635]/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#234338]/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635] shadow-inner">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                  Project KPIs Summary
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#13241f] text-[#a3e635] border border-[#234338]">
                  {currentSite === 'ALL' ? 'Cross-Enterprise Index' : `${currentSite} Operations`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Core delivery performance indicators across active building sites and commercial infrastructure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] text-slate-400 font-mono">
            <span>Operational Baseline:</span>
            <span className="text-white font-bold bg-[#13241f] px-2 py-0.5 rounded border border-[#234338]">
              {todayStr}
            </span>
          </div>
        </div>

        {/* 3 Core Project KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* KPI 1: Total Active Projects */}
          <div className="bg-[#13241f] border border-[#234338] hover:border-[#10b981]/50 rounded-xl p-4 transition-all flex flex-col justify-between group shadow-sm">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
                  <Building className="w-3.5 h-3.5 text-[#a3e635]" />
                  Total Active Projects
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {sites.length} REGISTERED
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                  {totalActiveProjects}
                </div>
                <div className="text-xs text-emerald-400 font-semibold">
                  / {sites.length} Active Sites
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                Full-scale construction sites currently active in Bataan & Subic Bay
              </p>
            </div>

            <div className="mt-3.5 pt-3 border-t border-[#234338]/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {sites.length === 0 ? (
                  <span className="text-[10px] text-slate-500 italic">No sites registered</span>
                ) : (
                  sites.map((s) => (
                    <span
                      key={s.site_id}
                      className="px-1.5 py-0.5 rounded bg-[#0e1a16] text-[10px] font-mono font-bold text-slate-300 border border-[#234338]"
                      title={`${s.code}: ${s.name}`}
                    >
                      {s.code}
                    </span>
                  ))
                )}
              </div>
              <button
                onClick={() => onNavigate('sites')}
                className="text-[#a3e635] hover:underline font-semibold flex items-center gap-0.5 text-[11px] cursor-pointer"
              >
                Sites &rarr;
              </button>
            </div>
          </div>

          {/* KPI 2: Total Budget Utilization Percentage */}
          <div className="bg-[#13241f] border border-[#234338] hover:border-[#10b981]/50 rounded-xl p-4 transition-all flex flex-col justify-between group shadow-sm">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
                  <PieChart className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Total Budget Utilization
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    budgetUtilizationPct > 90
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : budgetUtilizationPct > 75
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {budgetUtilizationPct <= 80 ? 'OPTIMAL TRACK' : 'HIGH UTILIZATION'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <div className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-white">
                  {budgetUtilizationPct.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  spent of ₱{(totalAllocatedBudget / 1_000_000).toFixed(1)}M cap
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="mt-2.5 w-full bg-[#0e1a16] h-2 rounded-full overflow-hidden border border-[#234338]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetUtilizationPct > 90
                      ? 'bg-red-500'
                      : budgetUtilizationPct > 75
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-[#10b981] to-[#a3e635]'
                  }`}
                  style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                <span>Committed: ₱{(totalSpent / 1_000_000).toFixed(2)}M</span>
                <span className="text-[#a3e635]">Liquidity: ₱{(remainingBudget / 1_000_000).toFixed(2)}M</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#234338]/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-[10px]">
                Materials: ₱{(matSpend / 1000).toFixed(0)}k · Ops: ₱{(expSpend / 1000).toFixed(0)}k · Wages: ₱{(paySpend / 1000).toFixed(0)}k
              </span>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-[#38bdf8] hover:underline font-semibold text-[11px] cursor-pointer"
              >
                Cost Ledger &rarr;
              </button>
            </div>
          </div>

          {/* KPI 3: Overdue Milestone Count */}
          <div
            className={`border rounded-xl p-4 transition-all flex flex-col justify-between group shadow-sm ${
              overdueMilestoneCount > 0
                ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400 ring-1 ring-amber-500/30'
                : 'bg-[#13241f] border-[#234338] hover:border-[#10b981]/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
                  <Clock className={`w-3.5 h-3.5 ${overdueMilestoneCount > 0 ? 'text-amber-400' : 'text-[#a3e635]'}`} />
                  Overdue Milestones
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    overdueMilestoneCount > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {overdueMilestoneCount > 0 ? 'ACTION REQUIRED' : 'ON SCHEDULE'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <div
                  className={`text-3xl sm:text-4xl font-black font-mono tabular-nums ${
                    overdueMilestoneCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {overdueMilestoneCount}
                </div>
                <div className="text-xs text-slate-400">
                  {overdueMilestoneCount === 1 ? 'deliverable past target' : 'deliverables past target'}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {overdueMilestoneCount > 0
                  ? `${overdueMilestones.map((m) => m.name).slice(0, 2).join(', ')}${overdueMilestones.length > 2 ? '...' : ''}`
                  : 'All scheduled engineering signoffs and work packages remain within SLA'}
              </p>
            </div>

            <div className="mt-3.5 pt-3 border-t border-[#234338]/60 flex items-center justify-between text-[11px]">
              {overdueMilestoneCount > 0 ? (
                <button
                  onClick={handleSelectOverdueOnly}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Auto-select overdue milestones in the bulk update panel below"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Select & Resolve in Bulk &rarr;</span>
                </button>
              ) : (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Milestone schedule compliant
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono">
                {milestones.filter((m) => m.status === 'Completed' || m.status === 'Achieved').length} / {milestones.length} Completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* NOTIFICATION SYSTEM: OVERDUE PAYOUT ALERT (> 48H)    */}
      {/* Flags employee records with Awaiting Payout status   */}
      {/* for more than 48 hours and highlights in Dashboard   */}
      {/* ==================================================== */}
      <OverduePayoutNotificationWidget onNavigate={onNavigate} />

      {/* ==================================================== */}
      {/* AUTOMATED MANAGER ALERT SYSTEM (CRITICAL MILESTONES) */}
      {/* Push notifications to registered managers for       */}
      {/* critical milestone deadlines within 48 hours         */}
      {/* ==================================================== */}
      <CriticalMilestoneAlerts
        milestones={milestones}
        currentSite={currentSite}
        onSelectMilestone={(milestoneId) => {
          setGanttStatusFilter('Critical');
          setGanttCriticalOnly(true);
        }}
      />
      {/* ==================================================== */}
      {/* SYNC HEALTH MONITOR WIDGET                          */}
      {/* Real-time status of the synchronization service,    */}
      {/* active connection, and elapsed time since last sync */}
      {/* ==================================================== */}
      <SyncHealthMonitorWidget
        onNavigateToSettings={() => onNavigate('settings')}
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Overdue Payout (>48h) Alert Card */}
        <div
          onClick={() => onNavigate('ceo_gcash')}
          className={`rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all ${
            overduePayoutStats.count > 0
              ? 'bg-linear-to-b from-amber-950/50 to-[#0e1a16] border-2 border-amber-500/70 hover:border-amber-400 shadow-lg shadow-amber-950/40 group'
              : 'bg-[#0e1a16] border border-[#234338]'
          }`}
          title="Click to view all overdue payments in the Payment Records Hub"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-300 flex items-center gap-1.5">
              {overduePayoutStats.count > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
              Payout &gt; 48h
            </span>
            <AlertTriangle className={`w-4 h-4 ${overduePayoutStats.count > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              {overduePayoutStats.count}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 truncate font-mono">
              ₱{overduePayoutStats.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} &bull; Action Req.
            </div>
          </div>
        </div>
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Workforce</span>
            <Users className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {filteredEmployees.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Workers registered ({currentSite})
            </div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Projects</span>
            <Building className="w-4 h-4 text-[#a3e635]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {sites.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Bataan, Subic & Zambales
            </div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {presentToday.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Clocked in today ({todayStr})
            </div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Pending Payroll</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              {pendingPayrollCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Disbursements to finalize
            </div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Payment Proofs</span>
            <FileCheck2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {pendingProofCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              GCash / Cash vouchers
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operational Workflows */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Rapid Operations & Field Workflows
          </div>
          <span className="text-[11px] text-slate-500">Zero-friction shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => onNavigate('attendance')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Weekly DTR</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Review clock times</div>
          </button>

          <button
            onClick={() => onNavigate('deductions')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group cursor-pointer"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Deductions</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">SSS, PhilHealth & advances</div>
          </button>

          <button
            onClick={() => onNavigate('canteen')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-lime-400 rounded-lg text-left transition-colors group cursor-pointer"
          >
            <div className="text-xs font-semibold text-white group-hover:text-lime-300 flex items-center justify-between">
              <span>Canteen & GCash</span>
              <UtensilsCrossed className="w-3.5 h-3.5 text-lime-400" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Concessionaire & meals</div>
          </button>

          <button
            onClick={() => onNavigate('payroll')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Weekly Payroll</span>
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Gross/net calculation</div>
          </button>

          <button
            onClick={() => onNavigate('payslips')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>6/Page Payslips</span>
              <Printer className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Print batch sheets</div>
          </button>

          <button
            onClick={() => onNavigate('materials')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Materials Log</span>
              <PackagePlus className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Delivery receipts</div>
          </button>

          <button
            onClick={() => onNavigate('expenses')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Project Costs</span>
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Crane & diesel fuel</div>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* LABOR CAPACITY WIDGET (D3 VISUALIZATION)             */}
      {/* Visualizes allocation of workers across active sites */}
      {/* and highlights over-allocated resources              */}
      {/* ==================================================== */}
      <LaborCapacityWidget
        onNavigateToEmployees={() => onNavigate('employees')}
      />

      {/* ==================================================== */}
      {/* HEAVY EQUIPMENT & MACHINERY ALLOCATION SCHEDULER     */}
      {/* Conflict Prevention Engine & Site Resource Matching  */}
      {/* ==================================================== */}
      <EquipmentSchedulerWidget currentSite={currentSite} />

      {/* ==================================================== */}
      {/* DIGITAL SIGNATURE MANAGER (PURCHASE ORDERS & DTR)   */}
      {/* Mobile-Friendly Canvas Signatures & Approvals Hub    */}
      {/* ==================================================== */}
      <ManagerApprovalsWidget currentSite={currentSite} />

      {/* ==================================================== */}
      {/* REAL-TIME GCASH DISBURSEMENTS & OPERATIONAL LEDGER   */}
      {/* Live Sync with CEO Terminal & Site Operations        */}
      {/* ==================================================== */}
      <RealtimeGcashStreamWidget
        onOpenCeoGcash={() => {
          if (isCeoUnlocked) {
            onNavigate('ceo_gcash');
          } else {
            setIsCeoPasswordModalOpen(true);
          }
        }}
      />

      {/* Project Gantt Manager Filter Panel */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#234338]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Gantt Schedule & Milestone Filter Controls
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#13241f] text-[#a3e635] border border-[#234338]">
                  Site & Completion Status
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Filter by Project Site or Completion Status to pinpoint work packages and isolate critical path targets
              </p>
            </div>
          </div>

          {/* Quick Action Badges: Critical Items Spotlight & Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setGanttCriticalOnly(!ganttCriticalOnly)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                ganttCriticalOnly
                  ? 'bg-red-500/25 border-red-500 text-red-200 ring-2 ring-red-400/40 shadow-sm'
                  : 'bg-red-950/20 border-red-500/30 text-red-300 hover:bg-red-500/15 hover:border-red-400'
              }`}
              title="Quickly find and isolate all critical path items and high-impact deliverables"
            >
              <Flame className={`w-3.5 h-3.5 ${ganttCriticalOnly ? 'animate-bounce text-red-400' : 'text-red-400'}`} />
              <span>⚡ Critical Items Only</span>
              <span className="px-1.5 py-0.5 rounded bg-red-900/60 font-mono text-[10px] font-extrabold text-red-100">
                {criticalItemsCount}
              </span>
            </button>

            {(ganttSiteFilter !== 'ALL' || ganttStatusFilter !== 'ALL' || ganttCriticalOnly) && (
              <button
                onClick={() => {
                  setGanttSiteFilter('ALL');
                  setGanttStatusFilter('ALL');
                  setGanttCriticalOnly(false);
                }}
                className="px-2.5 py-1.5 bg-[#13241f] hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-[#234338] flex items-center gap-1.5 cursor-pointer"
                title="Reset all Gantt filters to default view"
              >
                <RotateCcw className="w-3 h-3 text-[#a3e635]" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls: Two Columns / Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Filter 1: Project Site */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#a3e635]" />
                <span>Filter by Project Site:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {ganttSiteFilter === 'ALL' ? 'All Active Projects' : ganttSiteFilter}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'ALL', code: 'ALL', name: 'All Sites', count: siteCounts.ALL.tasks },
                { id: 'SITE-001', code: 'Site 001', name: 'Mariveles', count: siteCounts['SITE-001'].tasks },
                { id: 'SITE-002', code: 'Site 002', name: 'Subic', count: siteCounts['SITE-002'].tasks },
                { id: 'SITE-003', code: 'Site 003', name: 'Balanga', count: siteCounts['SITE-003'].tasks },
              ].map((site) => {
                const isSelected = ganttSiteFilter === site.id;
                return (
                  <button
                    key={site.id}
                    onClick={() => setGanttSiteFilter(site.id)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#a3e635] text-[#080f0d] border-[#a3e635] font-bold shadow-sm'
                        : 'bg-[#13241f] border-[#234338] text-slate-300 hover:text-white hover:border-[#38bdf8]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-extrabold">{site.code}</span>
                      <span
                        className={`text-[9px] px-1 rounded font-mono font-semibold ${
                          isSelected ? 'bg-black/20 text-black' : 'bg-black/40 text-slate-400'
                        }`}
                      >
                        {site.count} tasks
                      </span>
                    </div>
                    <div className={`text-xs truncate font-semibold mt-1 ${isSelected ? 'text-[#080f0d]' : 'text-white'}`}>
                      {site.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 2: Completion Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Filter by Completion Status:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {ganttStatusFilter === 'ALL' ? 'All Statuses' : ganttStatusFilter}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'ALL', label: 'All Items', count: statusCounts.all, dot: null },
                { id: 'In Progress', label: 'In Progress', count: statusCounts.inProgress, dot: 'bg-[#f59e0b]' },
                { id: 'Completed', label: 'Completed', count: statusCounts.completed, dot: 'bg-[#10b981]' },
                { id: 'Scheduled', label: 'Scheduled', count: statusCounts.scheduled, dot: 'bg-[#38bdf8]' },
                { id: 'Critical', label: 'Critical Path', count: statusCounts.critical, dot: 'bg-[#ef4444]' },
              ].map((status) => {
                const isSelected = ganttStatusFilter === status.id;
                return (
                  <button
                    key={status.id}
                    onClick={() => setGanttStatusFilter(status.id)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#132822] border-[#a3e635] text-white ring-1 ring-[#a3e635] font-bold shadow-sm'
                        : 'bg-[#13241f] border-[#234338] text-slate-300 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {status.dot && <span className={`w-2 h-2 rounded-full ${status.dot} shrink-0`}></span>}
                        <span className="text-xs truncate font-semibold">{status.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">
                        {status.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* BULK UPDATE FEATURE IN GANTT FILTER PANEL            */}
        {/* Allows managers to select multiple milestones and    */}
        {/* transition them to 'Completed' status with a single  */}
        {/* click, triggering an audit log entry for each change */}
        {/* ==================================================== */}
        <div className="pt-3.5 border-t border-[#234338] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#a3e635]">
                <ListChecks className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Bulk Milestone Status Transition
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#13241f] text-[#a3e635] border border-[#234338]">
                    Single-Click Audit Log
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Select multiple milestones and transition them to 'Completed' with immutable audit log recording
                </span>
              </div>
            </div>

            {/* Selection Quick Actions & Single-Click Action Button */}
            <div className="flex items-center gap-2 flex-wrap">
              {pendingFilterableMilestones.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1.5 bg-[#13241f] hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold border border-[#234338] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Toggle select all non-completed milestones in current view"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>
                    {pendingFilterableMilestones.every((m) => selectedMilestoneIds.has(m.id))
                      ? 'Deselect All'
                      : `Select All Pending (${pendingFilterableMilestones.length})`}
                  </span>
                </button>
              )}

              {overdueMilestones.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectOverdueOnly}
                  className="px-2.5 py-1.5 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 rounded-lg text-[11px] font-semibold border border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Quick select all overdue milestones"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Overdue ({overdueMilestones.length})</span>
                </button>
              )}

              {selectedMilestoneIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2 py-1.5 text-slate-400 hover:text-white text-[11px] transition-colors cursor-pointer"
                >
                  Clear ({selectedMilestoneIds.size})
                </button>
              )}

              {/* Single-Click Bulk Action Button */}
              <button
                type="button"
                onClick={handleBulkCompleteMilestones}
                disabled={selectedMilestoneIds.size === 0 || isBulkTransitioning}
                className="px-3.5 py-1.5 bg-[#a3e635] hover:bg-[#84cc16] disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 text-[#080f0d] font-extrabold text-xs rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:shadow-none"
                title="Transition all selected milestones to 'Completed' status and record forensic audit logs"
              >
                <CheckCircle2 className="w-4 h-4 text-[#080f0d]" />
                <span>
                  {isBulkTransitioning
                    ? 'Updating Milestones...'
                    : selectedMilestoneIds.size === 0
                    ? 'Select Milestones to Complete'
                    : `Transition ${selectedMilestoneIds.size} to 'Completed'`}
                </span>
              </button>
            </div>
          </div>

          {/* Bulk Update Success Notification */}
          {bulkActionSuccessMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{bulkActionSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setBulkActionSuccessMessage(null)}
                className="text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Milestone Selection Multi-Select Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {filterableMilestones.map((m) => {
              const isSelected = selectedMilestoneIds.has(m.id);
              const isCompleted = m.status === 'Completed' || m.status === 'Achieved';
              const isOverdue = m.targetDate < todayStr && !isCompleted;

              return (
                <div
                  key={m.id}
                  onClick={() => !isCompleted && toggleMilestoneSelection(m.id)}
                  className={`p-2.5 rounded-lg border transition-all text-xs flex items-start gap-2.5 ${
                    isCompleted
                      ? 'bg-[#0e1a16]/60 border-[#234338]/40 opacity-60 cursor-default'
                      : isSelected
                      ? 'bg-[#152e24] border-[#a3e635] shadow-sm cursor-pointer ring-1 ring-[#a3e635]'
                      : isOverdue
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 cursor-pointer'
                      : 'bg-[#13241f] border-[#234338] hover:border-slate-500 cursor-pointer'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#a3e635]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-[10px] text-[#a3e635] shrink-0">
                        {m.id} · {m.siteCode}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold uppercase ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isOverdue
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : m.status === 'Critical'
                            ? 'bg-red-900/40 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {isOverdue ? '⚠️ OVERDUE' : m.status}
                      </span>
                    </div>

                    <div className="font-bold text-white truncate text-[11px] mt-0.5" title={m.name}>
                      {m.name}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="font-mono">Target: {m.targetDate}</span>
                      <span className="text-slate-500 font-mono truncate">
                        {m.subTasks?.filter((st) => st.completed).length || 0}/{m.subTasks?.length || 0} subtasks
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Filter Readout & Scope Banner */}
        <div className="bg-[#13241f] border border-[#234338] rounded-lg px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold">Gantt Filter Scope:</span>
            <span className="px-2 py-0.5 rounded bg-[#0e1a16] text-[#a3e635] font-mono font-bold border border-[#234338]">
              {ganttSiteFilter === 'ALL' ? 'All Sites' : ganttSiteFilter}
            </span>
            <span className="text-slate-600">/</span>
            <span className="px-2 py-0.5 rounded bg-[#0e1a16] text-white font-mono font-bold border border-[#234338]">
              {ganttStatusFilter === 'ALL' ? 'All Statuses' : ganttStatusFilter}
            </span>
            {ganttCriticalOnly && (
              <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 font-mono font-bold border border-red-500/40">
                ⚡ Critical Items Only
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>
              Showing: <strong className="text-white">{matchingTasksCount}</strong> Work Packages ·{' '}
              <strong className="text-[#a3e635]">{matchingMilestonesCount}</strong> Milestones
            </span>
            {criticalItemsCount > 0 && (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block"></span>
                {criticalItemsCount} Critical Items
              </span>
            )}
          </div>
        </div>
      </div>

      {/* D3 Project Gantt Chart & Milestone Timeline */}
      <ProjectGanttChart
        initialSiteFilter={currentSite}
        externalSiteFilter={ganttSiteFilter}
        onSiteFilterChange={setGanttSiteFilter}
        externalStatusFilter={ganttStatusFilter}
        onStatusFilterChange={setGanttStatusFilter}
        externalCriticalOnly={ganttCriticalOnly}
        onCriticalOnlyChange={setGanttCriticalOnly}
        externalMilestones={milestones}
        onMilestonesChange={setMilestones}
      />

      {/* Two Column Layout: Active Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Construction Sites */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-3">
            <div className="text-sm font-bold text-white">Active Construction Projects</div>
            <button
              onClick={() => onNavigate('sites')}
              className="text-xs font-semibold text-[#a3e635] hover:underline"
            >
              View Sites &rarr;
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {sites.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-[#234338] rounded-lg">
                No project sites registered yet. Register your first site in Sites &amp; Projects.
              </div>
            ) : (
              sites.map((s) => (
                <div
                  key={s.site_id}
                  className="p-3 bg-[#13241f] border border-[#234338] rounded-lg flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="text-[#a3e635]">{s.code}:</span>
                      <span>{s.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {s.location} &bull; Supervisor: <strong className="text-slate-300">{s.supervisor}</strong>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                      {s.project_status}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.end_date}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-[#234338] flex items-center justify-between text-xs text-slate-400">
            <span>Corporate Project Vault</span>
            <a
              href={settings.master_drive_link}
              target="_blank"
              rel="noreferrer"
              className="text-[#a3e635] hover:underline flex items-center gap-1 text-[11px]"
            >
              Master Google Drive <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Audit Activity Trail */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-3">
            <div className="text-sm font-bold text-white">Forensic Audit Activity Trail</div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-[#a3e635] hover:underline"
            >
              View Full Log &rarr;
            </button>
          </div>

          <div className="space-y-2.5 flex-1 divide-y divide-[#234338]/40">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.audit_id} className="pt-2 first:pt-0">
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="font-semibold text-white">
                    {log.action} <span className="text-slate-400 font-normal">({log.entity})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Actor: <strong className="text-slate-300">{log.actor}</strong> &bull; Target:{' '}
                  <code className="text-[#a3e635] text-[10px]">{log.entity_id}</code>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-[#234338] text-[11px] text-slate-500 flex items-center justify-between">
            <span>Immutable recording: logins, QR scans, and disbursements</span>
            <span className="font-mono text-emerald-400">COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* CEO Vault Security Access Modal */}
      <CeoPasswordModal
        isOpen={isCeoPasswordModalOpen}
        onClose={() => setIsCeoPasswordModalOpen(false)}
        onSuccess={() => {
          setIsCeoPasswordModalOpen(false);
          onNavigate('ceo_monitoring');
        }}
        targetDashboardName="CEO Executive Portal"
      />
    </div>
  );
};
