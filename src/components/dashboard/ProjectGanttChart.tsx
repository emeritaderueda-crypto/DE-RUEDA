import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
// Master Project Work Breakdown Data for De Rueda Construction Sites
import {
  Calendar,
  Layers,
  Flag,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ChevronRight,
  Maximize2,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  CalendarCheck,
  Check,
  CheckSquare,
  Square,
  ListTodo,
  Percent,
} from 'lucide-react';

export interface MilestoneSubTask {
  id: string;
  name: string;
  completed: boolean;
  assignedRole?: string;
}

export interface GanttTask {
  id: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  name: string;
  category: 'Civil Works' | 'Structural' | 'Architectural' | 'MEPF' | 'Handover';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  progress: number; // 0 to 100
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Delayed';
  supervisor: string;
  isCriticalPath?: boolean;
}

export interface GanttMilestone {
  id: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  name: string;
  targetDate: string; // YYYY-MM-DD
  status: 'Completed' | 'In Progress' | 'Upcoming' | 'Critical' | 'Achieved';
  description: string;
  subTasks?: MilestoneSubTask[];
}

export const STORAGE_MILESTONES_KEY = 'DERUEDA_ERP_GANTT_MILESTONES_CLEAN_V1';


// Master Project Work Breakdown Data for De Rueda Construction Sites
export const GANTT_TASKS: GanttTask[] = [];

export const GANTT_MILESTONES: GanttMilestone[] = [];

export interface MilestoneProgressInfo {
  percentage: number;
  completedCount: number;
  totalCount: number;
}

export const getMilestoneProgress = (m: GanttMilestone): MilestoneProgressInfo => {
  if (m.subTasks && m.subTasks.length > 0) {
    const completedCount = m.subTasks.filter((st) => st.completed).length;
    const totalCount = m.subTasks.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    return { percentage, completedCount, totalCount };
  }

  // Fallback if no sub-tasks are defined
  if (m.status === 'Completed' || m.status === 'Achieved') {
    return { percentage: 100, completedCount: 1, totalCount: 1 };
  }
  if (m.status === 'In Progress') {
    return { percentage: 60, completedCount: 3, totalCount: 5 };
  }
  return { percentage: 0, completedCount: 0, totalCount: 1 };
};

export interface MilestoneVisualConfig {
  normStatus: 'In Progress' | 'Completed' | 'Upcoming' | 'Critical';
  color: string;
  fillColor: string;
  haloColor: string;
  ringColor: string;
  badgeText: string;
  diamondSize: number;
  showPulseHalo: boolean;
  lineDash: string;
  lineWidth: number;
  opacity: number;
  lineOpacity: number;
  isSpotlighted: boolean;
}

export const getMilestoneConfig = (
  rawStatus: string,
  isAutoHighlight: boolean,
  activeFilter: 'all' | 'in_progress' | 'completed' | 'upcoming' | 'critical'
): MilestoneVisualConfig => {
  const normStatus: 'In Progress' | 'Completed' | 'Upcoming' | 'Critical' =
    rawStatus === 'Achieved' || rawStatus === 'Completed'
      ? 'Completed'
      : rawStatus === 'In Progress'
      ? 'In Progress'
      : rawStatus === 'Critical'
      ? 'Critical'
      : 'Upcoming';

  const isMatch =
    activeFilter === 'all' ||
    (activeFilter === 'in_progress' && normStatus === 'In Progress') ||
    (activeFilter === 'completed' && normStatus === 'Completed') ||
    (activeFilter === 'upcoming' && normStatus === 'Upcoming') ||
    (activeFilter === 'critical' && normStatus === 'Critical');

  const isDimmed = activeFilter !== 'all' && !isMatch;
  const isSpotlighted = activeFilter !== 'all' && isMatch;

  if (normStatus === 'In Progress') {
    return {
      normStatus,
      color: '#f59e0b', // Radiant Amber / Gold
      fillColor: '#f59e0b',
      haloColor: 'rgba(245, 158, 11, 0.28)',
      ringColor: '#fbbf24',
      badgeText: 'IN PROGRESS',
      diamondSize: isAutoHighlight ? 12 : 10,
      showPulseHalo: isAutoHighlight,
      lineDash: '4,3',
      lineWidth: isAutoHighlight ? 2 : 1.2,
      opacity: isDimmed ? 0.2 : 1,
      lineOpacity: isDimmed ? 0.1 : isAutoHighlight ? 0.85 : 0.45,
      isSpotlighted,
    };
  }

  if (normStatus === 'Completed') {
    return {
      normStatus,
      color: '#10b981', // Crisp Emerald Green
      fillColor: '#10b981',
      haloColor: 'rgba(16, 185, 129, 0.22)',
      ringColor: '#34d399',
      badgeText: 'COMPLETED',
      diamondSize: isAutoHighlight ? 11 : 10,
      showPulseHalo: isAutoHighlight,
      lineDash: '2,2',
      lineWidth: isAutoHighlight ? 1.8 : 1,
      opacity: isDimmed ? 0.2 : 1,
      lineOpacity: isDimmed ? 0.1 : isAutoHighlight ? 0.8 : 0.45,
      isSpotlighted,
    };
  }

  if (normStatus === 'Critical') {
    return {
      normStatus,
      color: '#ef4444', // Red
      fillColor: '#ef4444',
      haloColor: 'rgba(239, 68, 68, 0.25)',
      ringColor: '#f87171',
      badgeText: 'CRITICAL',
      diamondSize: 11,
      showPulseHalo: true,
      lineDash: '3,2',
      lineWidth: 2,
      opacity: isDimmed ? 0.2 : 1,
      lineOpacity: isDimmed ? 0.1 : 0.6,
      isSpotlighted,
    };
  }

  // Upcoming
  return {
    normStatus,
    color: '#38bdf8', // Sky Blue
    fillColor: '#38bdf8',
    haloColor: 'rgba(56, 189, 248, 0.15)',
    ringColor: '#7dd3fc',
    badgeText: 'UPCOMING',
    diamondSize: 9,
    showPulseHalo: false,
    lineDash: '3,3',
    lineWidth: 1,
    opacity: isDimmed ? 0.2 : 0.85,
    lineOpacity: isDimmed ? 0.1 : 0.35,
    isSpotlighted,
  };
};

interface TooltipData {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  dateRange: string;
  durationDays: number;
  progress?: number;
  status: string;
  supervisor?: string;
  category?: string;
  isMilestone?: boolean;
  subTasks?: MilestoneSubTask[];
  completedSubTasks?: number;
  totalSubTasks?: number;
  milestoneId?: string;
}

export interface ProjectGanttChartProps {
  initialSiteFilter?: string;
  externalSiteFilter?: string;
  onSiteFilterChange?: (site: string) => void;
  externalStatusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  externalCriticalOnly?: boolean;
  onCriticalOnlyChange?: (criticalOnly: boolean) => void;
  externalMilestones?: GanttMilestone[];
  onMilestonesChange?: (milestones: GanttMilestone[]) => void;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  initialSiteFilter = 'ALL',
  externalSiteFilter,
  onSiteFilterChange,
  externalStatusFilter,
  onStatusFilterChange,
  externalCriticalOnly,
  onCriticalOnlyChange,
  externalMilestones,
  onMilestonesChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [internalSiteFilter, setInternalSiteFilter] = useState<string>(initialSiteFilter);
  const siteFilter = externalSiteFilter !== undefined ? externalSiteFilter : internalSiteFilter;
  const setSiteFilter = (site: string) => {
    setInternalSiteFilter(site);
    onSiteFilterChange?.(site);
  };

  const [internalStatusFilter, setInternalStatusFilter] = useState<string>('ALL');
  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const setStatusFilter = (status: string) => {
    setInternalStatusFilter(status);
    onStatusFilterChange?.(status);
  };

  const [internalCriticalOnly, setInternalCriticalOnly] = useState<boolean>(false);
  const criticalOnly = externalCriticalOnly !== undefined ? externalCriticalOnly : internalCriticalOnly;
  const setCriticalOnly = (val: boolean) => {
    setInternalCriticalOnly(val);
    onCriticalOnlyChange?.(val);
  };

  const [viewMode, setViewMode] = useState<'all' | 'critical' | 'milestones'>('all');
  const [timeZoom, setTimeZoom] = useState<'full' | 'quarter'>('full');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMilestones, setShowMilestones] = useState<boolean>(true);
  const [showSubTaskTracker, setShowSubTaskTracker] = useState<boolean>(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Auto-Highlight State for visually distinguishing 'In Progress' vs 'Completed' milestones
  const [isAutoHighlight, setIsAutoHighlight] = useState<boolean>(true);
  const [highlightMilestoneFilter, setHighlightMilestoneFilter] = useState<
    'all' | 'in_progress' | 'completed' | 'upcoming' | 'critical'
  >('all');

  // Editable Milestones State with localStorage persistence and sub-task migration
  const [milestones, setMilestones] = useState<GanttMilestone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MILESTONES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => {
            const defaultM = GANTT_MILESTONES.find((dm) => dm.id === m.id);
            return {
              ...m,
              status: m.status === 'Achieved' ? 'Completed' : m.status,
              subTasks:
                Array.isArray(m.subTasks) && m.subTasks.length > 0
                  ? m.subTasks
                  : (defaultM?.subTasks || [
                      {
                        id: `st-${m.id}-1`,
                        name: `${m.name} - Initial Engineering Signoff`,
                        completed: m.status === 'Completed' || m.status === 'Achieved',
                      },
                      {
                        id: `st-${m.id}-2`,
                        name: `${m.name} - Field Quality Assurance Audit`,
                        completed: m.status === 'Completed' || m.status === 'Achieved',
                      },
                    ]),
            };
          });
        }
      }
    } catch {
      // storage unavailable
    }
    return GANTT_MILESTONES;
  });

  // Modal state for editing/adding milestones
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState<boolean>(false);
  const [editingMilestone, setEditingMilestone] = useState<GanttMilestone | null>(null);
  const [newModalSubTaskName, setNewModalSubTaskName] = useState<string>('');
  const [quickAddInputs, setQuickAddInputs] = useState<Record<string, string>>({});
  const [milestoneFormData, setMilestoneFormData] = useState<{
    name: string;
    siteId: string;
    targetDate: string;
    status: 'Completed' | 'In Progress' | 'Upcoming' | 'Critical';
    description: string;
    subTasks: MilestoneSubTask[];
  }>({
    name: '',
    siteId: 'SITE-001',
    targetDate: '2026-10-20',
    status: 'In Progress',
    description: '',
    subTasks: [],
  });

  // Save milestones helper
  const saveMilestonesToStateAndStorage = (updated: GanttMilestone[]) => {
    setMilestones(updated);
    onMilestonesChange?.(updated);
    try {
      localStorage.setItem(STORAGE_MILESTONES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('derueda_milestones_updated', { detail: updated }));
    } catch {
      // ignore storage errors
    }
  };

  // Keep internal state synchronized with external prop updates
  useEffect(() => {
    if (externalMilestones) {
      setMilestones(externalMilestones);
    }
  }, [externalMilestones]);

  // Listen for external bulk milestone updates
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

  // Toggle sub-task directly with dynamic milestone progress bar and status updates
  const handleToggleSubTask = (milestoneId: string, subTaskId: string) => {
    const updated = milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      const subTasks = (m.subTasks || []).map((st) =>
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      );
      const { percentage } = getMilestoneProgress({ ...m, subTasks });

      let newStatus = m.status;
      if (percentage === 100) {
        newStatus = 'Completed';
      } else if (percentage > 0) {
        newStatus = 'In Progress';
      } else if (m.status === 'Completed') {
        newStatus = 'Upcoming';
      }

      return {
        ...m,
        status: newStatus,
        subTasks,
      };
    });
    saveMilestonesToStateAndStorage(updated);
  };

  const handleQuickAddSubTask = (milestoneId: string) => {
    const text = quickAddInputs[milestoneId]?.trim();
    if (!text) return;
    const updated = milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      const subTasks = [
        ...(m.subTasks || []),
        {
          id: `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          name: text,
          completed: false,
        },
      ];
      const { percentage } = getMilestoneProgress({ ...m, subTasks });
      return {
        ...m,
        status: percentage === 100 ? 'Completed' : percentage > 0 ? 'In Progress' : m.status,
        subTasks,
      };
    });
    saveMilestonesToStateAndStorage(updated);
    setQuickAddInputs((prev) => ({ ...prev, [milestoneId]: '' }));
  };

  const handleOpenAddMilestone = () => {
    setEditingMilestone(null);
    setNewModalSubTaskName('');
    setMilestoneFormData({
      name: '',
      siteId: siteFilter !== 'ALL' ? siteFilter : 'SITE-001',
      targetDate: '2026-10-20',
      status: 'In Progress',
      description: '',
      subTasks: [
        {
          id: `st-${Date.now()}-1`,
          name: 'Primary Structural Inspection & Signoff',
          completed: false,
        },
        {
          id: `st-${Date.now()}-2`,
          name: 'QA/QC Punchlist Clearing & Lab Test Logs',
          completed: false,
        },
      ],
    });
    setIsMilestoneModalOpen(true);
  };

  const handleOpenEditMilestone = (m: GanttMilestone) => {
    setEditingMilestone(m);
    setNewModalSubTaskName('');
    const normalizedStatus = (m.status === 'Achieved' ? 'Completed' : m.status) as any;
    setMilestoneFormData({
      name: m.name,
      siteId: m.siteId,
      targetDate: m.targetDate,
      status: normalizedStatus,
      description: m.description,
      subTasks: m.subTasks ? [...m.subTasks] : [],
    });
    setIsMilestoneModalOpen(true);
  };

  const handleToggleModalSubTask = (subTaskId: string) => {
    setMilestoneFormData((prev) => {
      const updatedSubTasks = prev.subTasks.map((st) =>
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      );
      const { percentage } = getMilestoneProgress({ ...prev, subTasks: updatedSubTasks } as any);
      let newStatus = prev.status;
      if (percentage === 100) {
        newStatus = 'Completed';
      } else if (percentage > 0 && prev.status === 'Upcoming') {
        newStatus = 'In Progress';
      }
      return {
        ...prev,
        status: newStatus,
        subTasks: updatedSubTasks,
      };
    });
  };

  const handleAddModalSubTask = () => {
    if (!newModalSubTaskName.trim()) return;
    const newSt: MilestoneSubTask = {
      id: `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      name: newModalSubTaskName.trim(),
      completed: false,
    };
    setMilestoneFormData((prev) => {
      const updatedSubTasks = [...prev.subTasks, newSt];
      const { percentage } = getMilestoneProgress({ ...prev, subTasks: updatedSubTasks } as any);
      return {
        ...prev,
        status: percentage === 100 ? 'Completed' : percentage > 0 ? 'In Progress' : prev.status,
        subTasks: updatedSubTasks,
      };
    });
    setNewModalSubTaskName('');
  };

  const handleRemoveModalSubTask = (subTaskId: string) => {
    setMilestoneFormData((prev) => {
      const updatedSubTasks = prev.subTasks.filter((st) => st.id !== subTaskId);
      const { percentage } = getMilestoneProgress({ ...prev, subTasks: updatedSubTasks } as any);
      return {
        ...prev,
        status: percentage === 100 ? 'Completed' : percentage > 0 ? 'In Progress' : prev.status,
        subTasks: updatedSubTasks,
      };
    });
  };

  const handleDeleteMilestone = (id: string) => {
    const updated = milestones.filter((m) => m.id !== id);
    saveMilestonesToStateAndStorage(updated);
    setIsMilestoneModalOpen(false);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneFormData.name.trim() || !milestoneFormData.targetDate) return;

    const siteLookup: Record<string, { code: string; name: string }> = {
      'SITE-001': { code: 'Site 001', name: 'Mariveles Industrial Park Warehouse A' },
      'SITE-002': { code: 'Site 002', name: 'Subic Commercial Complex' },
      'SITE-003': { code: 'Site 003', name: 'Balanga Residential Heights - Phase 2' },
    };

    const siteInfo = siteLookup[milestoneFormData.siteId] || {
      code: milestoneFormData.siteId,
      name: milestoneFormData.siteId,
    };

    if (editingMilestone) {
      // Update existing
      const updated = milestones.map((m) =>
        m.id === editingMilestone.id
          ? {
              ...m,
              name: milestoneFormData.name.trim(),
              siteId: milestoneFormData.siteId,
              siteCode: siteInfo.code,
              siteName: siteInfo.name,
              targetDate: milestoneFormData.targetDate,
              status: milestoneFormData.status,
              description: milestoneFormData.description.trim(),
              subTasks: milestoneFormData.subTasks,
            }
          : m
      );
      saveMilestonesToStateAndStorage(updated);
    } else {
      // Add new
      const defaultSubTasks: MilestoneSubTask[] =
        milestoneFormData.subTasks.length > 0
          ? milestoneFormData.subTasks
          : [
              {
                id: `st-${Date.now()}-1`,
                name: `${milestoneFormData.name.trim()} - Primary Inspection Signoff`,
                completed: milestoneFormData.status === 'Completed',
              },
              {
                id: `st-${Date.now()}-2`,
                name: `${milestoneFormData.name.trim()} - QA/QC Lab Documentation`,
                completed: milestoneFormData.status === 'Completed',
              },
            ];

      const newMilestone: GanttMilestone = {
        id: `M-${Date.now().toString(36).toUpperCase()}`,
        siteId: milestoneFormData.siteId,
        siteCode: siteInfo.code,
        siteName: siteInfo.name,
        name: milestoneFormData.name.trim(),
        targetDate: milestoneFormData.targetDate,
        status: milestoneFormData.status,
        description: milestoneFormData.description.trim(),
        subTasks: defaultSubTasks,
      };
      saveMilestonesToStateAndStorage([...milestones, newMilestone]);
    }

    setIsMilestoneModalOpen(false);
  };

  // Today reference date in Asia/Manila context
  const TODAY_STR = '2026-10-06';
  const todayDate = useMemo(() => new Date(`${TODAY_STR}T00:00:00+08:00`), []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return GANTT_TASKS.filter((t) => {
      if (siteFilter !== 'ALL' && t.siteId !== siteFilter) return false;
      if ((viewMode === 'critical' || criticalOnly) && !t.isCriticalPath) return false;

      // Completion Status filter
      if (statusFilter && statusFilter !== 'ALL') {
        if (statusFilter === 'Critical') {
          if (!t.isCriticalPath) return false;
        } else if (statusFilter === 'In Progress') {
          if (t.status !== 'In Progress' && !(t.progress > 0 && t.progress < 100)) return false;
        } else if (statusFilter === 'Completed') {
          if (t.status !== 'Completed' && t.progress !== 100) return false;
        } else if (statusFilter === 'Scheduled') {
          if (t.status !== 'Scheduled' && t.progress !== 0) return false;
        } else if (statusFilter === 'Delayed') {
          if (t.status !== 'Delayed') return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.supervisor.toLowerCase().includes(q) ||
          t.siteCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [siteFilter, viewMode, criticalOnly, statusFilter, searchQuery]);

  // Filter milestones from dynamic state
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (siteFilter !== 'ALL' && m.siteId !== siteFilter) return false;
      if (criticalOnly && m.status !== 'Critical') return false;

      // Completion Status filter
      if (statusFilter && statusFilter !== 'ALL') {
        const normStatus = m.status === 'Achieved' ? 'Completed' : m.status;
        if (statusFilter === 'Critical') {
          if (m.status !== 'Critical') return false;
        } else if (statusFilter === 'In Progress') {
          if (normStatus !== 'In Progress') return false;
        } else if (statusFilter === 'Completed') {
          if (normStatus !== 'Completed') return false;
        } else if (statusFilter === 'Scheduled') {
          if (normStatus !== 'Upcoming') return false;
        } else if (statusFilter === 'Delayed') {
          if (normStatus !== 'Critical') return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.siteCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [milestones, siteFilter, criticalOnly, statusFilter, searchQuery]);

  // Aggregate milestone counts for color-coded key
  const milestoneCounts = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let upcoming = 0;
    let critical = 0;

    filteredMilestones.forEach((m) => {
      const st = m.status === 'Achieved' ? 'Completed' : m.status;
      if (st === 'In Progress') inProgress++;
      else if (st === 'Completed') completed++;
      else if (st === 'Critical') critical++;
      else upcoming++;
    });

    return { inProgress, completed, upcoming, critical, total: filteredMilestones.length };
  }, [filteredMilestones]);

  // Combined row items to render in Gantt rows
  const rowItems = useMemo(() => {
    if (viewMode === 'milestones') {
      return filteredMilestones.map((m) => ({
        type: 'milestone' as const,
        id: m.id,
        name: m.name,
        siteCode: m.siteCode,
        siteName: m.siteName,
        date: m.targetDate,
        raw: m,
      }));
    }

    return filteredTasks.map((t) => ({
      type: 'task' as const,
      id: t.id,
      name: t.name,
      siteCode: t.siteCode,
      siteName: t.siteName,
      startDate: t.startDate,
      endDate: t.endDate,
      progress: t.progress,
      status: t.status,
      category: t.category,
      isCriticalPath: t.isCriticalPath,
      raw: t,
    }));
  }, [filteredTasks, filteredMilestones, viewMode]);

  // D3 Chart Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 960;
    const margin = { top: 50, right: 35, bottom: 35, left: 240 };
    const width = Math.max(containerWidth, 800) - margin.left - margin.right;

    const rowHeight = 36;
    const height = Math.max(rowItems.length * rowHeight, 180);

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    // Time domain definition
    let domainStart = new Date('2026-02-01T00:00:00+08:00');
    let domainEnd = new Date('2027-02-28T00:00:00+08:00');

    if (timeZoom === 'quarter') {
      domainStart = new Date('2026-08-01T00:00:00+08:00');
      domainEnd = new Date('2026-12-31T00:00:00+08:00');
    }

    const xScale = d3.scaleTime().domain([domainStart, domainEnd]).range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(rowItems.map((d) => d.id))
      .range([0, height])
      .padding(0.25);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Month Grid Columns & Alternate Background Striping
    const months = d3.timeMonth.range(domainStart, domainEnd);
    months.forEach((m, idx) => {
      const x1 = xScale(m);
      const nextMonth = d3.timeMonth.offset(m, 1);
      const x2 = xScale(nextMonth > domainEnd ? domainEnd : nextMonth);
      const w = Math.max(x2 - x1, 0);

      if (idx % 2 === 1) {
        g.append('rect')
          .attr('x', x1)
          .attr('y', 0)
          .attr('width', w)
          .attr('height', height)
          .attr('fill', '#ffffff')
          .attr('opacity', 0.02);
      }

      // Vertical month grid line
      g.append('line')
        .attr('x1', x1)
        .attr('y1', 0)
        .attr('x2', x1)
        .attr('y2', height)
        .attr('stroke', '#234338')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,3');
    });

    // Time Header (Month Labels)
    const headerGroup = g.append('g').attr('class', 'timeline-header');
    months.forEach((m) => {
      const x = xScale(m);
      const monthFormat = d3.timeFormat("%b '%y");
      headerGroup
        .append('text')
        .attr('x', x + 8)
        .attr('y', -16)
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '600')
        .text(monthFormat(m));
    });

    // Timeline top divider line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', -6)
      .attr('x2', width)
      .attr('y2', -6)
      .attr('stroke', '#234338')
      .attr('stroke-width', 1.5);

    // Timeline bottom divider line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', height)
      .attr('x2', width)
      .attr('y2', height)
      .attr('stroke', '#234338')
      .attr('stroke-width', 1);

    // Left Y-Axis separator line
    svg
      .append('line')
      .attr('x1', margin.left)
      .attr('y1', margin.top - 20)
      .attr('x2', margin.left)
      .attr('y2', margin.top + height)
      .attr('stroke', '#234338')
      .attr('stroke-width', 1.5);

    // Left Row Headers (Task / Milestone Labels outside chart area)
    const labelGroup = svg.append('g').attr('transform', `translate(16, ${margin.top})`);

    rowItems.forEach((item) => {
      const y = yScale(item.id) || 0;
      const barH = yScale.bandwidth();

      // Row hover highlight background
      g.append('rect')
        .attr('x', 0)
        .attr('y', y - 2)
        .attr('width', width)
        .attr('height', barH + 4)
        .attr('fill', '#ffffff')
        .attr('opacity', 0)
        .attr('class', `row-bg-${item.id}`)
        .style('transition', 'opacity 0.15s ease');

      // Left site tag
      labelGroup
        .append('text')
        .attr('x', 0)
        .attr('y', y + barH / 2 - 4)
        .attr('fill', '#a3e635')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '700')
        .text(item.siteCode);

      if (item.type === 'milestone') {
        const m = item.raw as GanttMilestone;
        const cfg = getMilestoneConfig(m.status, isAutoHighlight, highlightMilestoneFilter);
        const { percentage, completedCount, totalCount } = getMilestoneProgress(m);

        labelGroup
          .append('circle')
          .attr('cx', 52)
          .attr('cy', y + barH / 2 - 7)
          .attr('r', 3)
          .attr('fill', cfg.color);

        labelGroup
          .append('text')
          .attr('x', 58)
          .attr('y', y + barH / 2 - 4)
          .attr('fill', cfg.color)
          .attr('font-size', '8px')
          .attr('font-weight', '800')
          .attr('font-family', 'monospace')
          .text(cfg.badgeText);

        // Visual mini percentage progress bar under title in left column
        const miniTrackW = 68;
        const miniTrackH = 4;
        const miniFillW = Math.max((miniTrackW * percentage) / 100, percentage > 0 ? 3 : 0);

        const miniBarG = labelGroup
          .append('g')
          .attr('transform', `translate(142, ${y + barH / 2 - 8})`);

        miniBarG
          .append('rect')
          .attr('width', miniTrackW)
          .attr('height', miniTrackH)
          .attr('rx', 2)
          .attr('fill', '#0e1a16')
          .attr('stroke', '#234338')
          .attr('stroke-width', 0.8);

        if (miniFillW > 0) {
          miniBarG
            .append('rect')
            .attr('width', miniFillW)
            .attr('height', miniTrackH)
            .attr('rx', 2)
            .attr('fill', cfg.color);
        }

        miniBarG
          .append('text')
          .attr('x', miniTrackW + 4)
          .attr('y', miniTrackH - 0.5)
          .attr('fill', cfg.color)
          .attr('font-size', '8px')
          .attr('font-weight', '700')
          .attr('font-family', 'monospace')
          .text(`${percentage}%`);
      }

      // Left task / milestone title (truncated cleanly if long)
      const fullTitle = item.name;
      const maxLen = 27;
      const displayTitle = fullTitle.length > maxLen ? fullTitle.substring(0, maxLen) + '…' : fullTitle;

      const titleEl = labelGroup
        .append('text')
        .attr('x', 0)
        .attr('y', y + barH / 2 + 9)
        .attr('fill', '#f1f5f9')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('cursor', 'pointer')
        .text(displayTitle);

      titleEl.append('title').text(fullTitle);
    });

    // Render Bars or Milestones
    rowItems.forEach((item) => {
      const y = yScale(item.id) || 0;
      const barH = yScale.bandwidth();

      if (item.type === 'task') {
        const task = item.raw as GanttTask;
        const taskStart = new Date(`${task.startDate}T00:00:00+08:00`);
        const taskEnd = new Date(`${task.endDate}T23:59:59+08:00`);

        const x1 = Math.max(xScale(taskStart), 0);
        const x2 = Math.min(xScale(taskEnd), width);
        const barW = Math.max(x2 - x1, 4);

        const progressW = (barW * task.progress) / 100;

        // Background Planned Duration Bar
        const barBg = g
          .append('rect')
          .attr('x', x1)
          .attr('y', y)
          .attr('width', barW)
          .attr('height', barH)
          .attr('rx', 5)
          .attr('fill', task.isCriticalPath ? '#3b1c1c' : '#132822')
          .attr('stroke', task.isCriticalPath ? '#ef4444' : '#234338')
          .attr('stroke-width', 1)
          .attr('cursor', 'pointer');

        // Progress Completed Fill Bar
        let progressFill = '#10b981'; // emerald
        if (task.status === 'Completed') progressFill = '#a3e635'; // lime
        else if (task.isCriticalPath) progressFill = '#f59e0b'; // amber

        g.append('rect')
          .attr('x', x1)
          .attr('y', y)
          .attr('width', progressW)
          .attr('height', barH)
          .attr('rx', 5)
          .attr('fill', progressFill)
          .attr('opacity', 0.85)
          .attr('pointer-events', 'none');

        // Percentage label inside or next to the bar
        if (barW > 45) {
          g.append('text')
            .attr('x', x1 + 8)
            .attr('y', y + barH / 2 + 4)
            .attr('fill', task.progress > 40 ? '#080f0d' : '#e2e8f0')
            .attr('font-size', '10px')
            .attr('font-weight', '700')
            .attr('font-family', 'monospace')
            .attr('pointer-events', 'none')
            .text(`${task.progress}%`);
        } else {
          g.append('text')
            .attr('x', x1 + barW + 6)
            .attr('y', y + barH / 2 + 4)
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .attr('font-family', 'monospace')
            .attr('pointer-events', 'none')
            .text(`${task.progress}%`);
        }

        // Critical Path Badge or Status Dot
        if (task.isCriticalPath && barW > 80) {
          g.append('circle')
            .attr('cx', x1 + barW - 10)
            .attr('cy', y + barH / 2)
            .attr('r', 3)
            .attr('fill', '#ef4444')
            .attr('pointer-events', 'none');
        }

        // Mouse hover interaction for Task Bar
        barBg
          .on('mouseenter', (event: MouseEvent) => {
            d3.select(`.row-bg-${item.id}`).attr('opacity', 0.05);
            const durationDays = Math.round((taskEnd.getTime() - taskStart.getTime()) / 86400000);
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              title: task.name,
              subtitle: `${task.siteCode} · ${task.siteName}`,
              dateRange: `${task.startDate} to ${task.endDate}`,
              durationDays,
              progress: task.progress,
              status: task.status,
              supervisor: task.supervisor,
              category: task.category,
              isMilestone: false,
            });
          })
          .on('mousemove', (event: MouseEvent) => {
            setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
          })
          .on('mouseleave', () => {
            d3.select(`.row-bg-${item.id}`).attr('opacity', 0);
            setTooltip(null);
          });
      } else {
        // Milestone item row
        const m = item.raw as GanttMilestone;
        const cfg = getMilestoneConfig(m.status, isAutoHighlight, highlightMilestoneFilter);
        const { percentage, completedCount, totalCount } = getMilestoneProgress(m);
        const targetD = new Date(`${m.targetDate}T00:00:00+08:00`);
        const mx = xScale(targetD);

        const milestoneG = g
          .append('g')
          .attr('transform', `translate(${mx}, ${y + barH / 2})`)
          .attr('cursor', 'pointer')
          .attr('opacity', cfg.opacity);

        // Radiant Pulse / Halo behind milestone when auto-highlight is active
        if (cfg.showPulseHalo) {
          milestoneG
            .append('circle')
            .attr('r', cfg.diamondSize + 6)
            .attr('fill', cfg.haloColor)
            .attr('stroke', cfg.ringColor)
            .attr('stroke-width', 1.2)
            .attr('stroke-dasharray', cfg.normStatus === 'In Progress' ? '3,2' : 'none')
            .attr('opacity', 0.85);
        }

        // Connecting subtle line
        g.append('line')
          .attr('x1', mx)
          .attr('y1', 0)
          .attr('x2', mx)
          .attr('y2', height)
          .attr('stroke', cfg.color)
          .attr('stroke-width', cfg.lineWidth)
          .attr('stroke-dasharray', cfg.lineDash)
          .attr('opacity', cfg.lineOpacity);

        // Milestone Diamond Marker
        milestoneG
          .append('polygon')
          .attr(
            'points',
            `0,-${cfg.diamondSize} ${cfg.diamondSize},0 0,${cfg.diamondSize} -${cfg.diamondSize},0`
          )
          .attr('fill', cfg.color)
          .attr('stroke', '#080f0d')
          .attr('stroke-width', 2);

        // Center dot
        milestoneG
          .append('circle')
          .attr('r', 2)
          .attr('fill', cfg.normStatus === 'In Progress' ? '#ffffff' : '#f0fdf4');

        // VISUAL PERCENTAGE PROGRESS BAR FOR MILESTONE
        const pBarW = 160;
        const pBarH = 18;
        const pBarFillW = Math.max((pBarW * percentage) / 100, percentage > 0 ? 5 : 0);

        let pBarX = mx + 16;
        let isRightAligned = false;
        if (pBarX + pBarW + 70 > width) {
          pBarX = Math.max(10, mx - pBarW - 16);
          isRightAligned = true;
        }

        const pBarG = g
          .append('g')
          .attr('transform', `translate(${pBarX}, ${y + barH / 2 - pBarH / 2})`)
          .attr('cursor', 'pointer')
          .attr('opacity', cfg.opacity);

        // Progress bar background track
        pBarG
          .append('rect')
          .attr('width', pBarW)
          .attr('height', pBarH)
          .attr('rx', 5)
          .attr('fill', '#0a1411')
          .attr('stroke', '#234338')
          .attr('stroke-width', 1.2);

        // Progress bar fill
        if (pBarFillW > 0) {
          pBarG
            .append('rect')
            .attr('width', pBarFillW)
            .attr('height', pBarH)
            .attr('rx', 5)
            .attr('fill', cfg.color)
            .attr('opacity', 0.85);
        }

        // Percentage label & sub-tasks count inside/over progress bar
        pBarG
          .append('text')
          .attr('x', pBarW / 2)
          .attr('y', pBarH / 2 + 3.5)
          .attr('text-anchor', 'middle')
          .attr('fill', percentage > 45 ? '#080f0d' : '#f8fafc')
          .attr('font-size', '9.5px')
          .attr('font-weight', '900')
          .attr('font-family', 'monospace')
          .attr('pointer-events', 'none')
          .text(`${percentage}% · ${completedCount}/${totalCount} Sub-tasks`);

        // Milestone Name Label next to progress bar
        const titleX = isRightAligned ? pBarX - 8 : pBarX + pBarW + 8;
        const titleAnchor = isRightAligned ? 'end' : 'start';
        g.append('text')
          .attr('x', titleX)
          .attr('y', y + barH / 2 + 4)
          .attr('text-anchor', titleAnchor)
          .attr('fill', cfg.color)
          .attr('font-size', '10.5px')
          .attr('font-weight', '700')
          .attr('opacity', cfg.opacity)
          .attr('cursor', 'pointer')
          .text(m.name)
          .on('click', () => handleOpenEditMilestone(m));

        const handleMilestoneHover = (event: MouseEvent) => {
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            title: m.name,
            subtitle: `${m.siteCode} · ${m.siteName}`,
            dateRange: `${m.targetDate} (Click to toggle sub-tasks)`,
            durationDays: 1,
            status: cfg.normStatus,
            isMilestone: true,
            progress: percentage,
            subTasks: m.subTasks || [],
            completedSubTasks: completedCount,
            totalSubTasks: totalCount,
            milestoneId: m.id,
          });
        };

        milestoneG
          .on('mouseenter', handleMilestoneHover)
          .on('mousemove', (event: MouseEvent) => {
            setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
          })
          .on('mouseleave', () => setTooltip(null))
          .on('click', () => {
            setTooltip(null);
            handleOpenEditMilestone(m);
          });

        pBarG
          .on('mouseenter', handleMilestoneHover)
          .on('mousemove', (event: MouseEvent) => {
            setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
          })
          .on('mouseleave', () => setTooltip(null))
          .on('click', () => {
            setTooltip(null);
            handleOpenEditMilestone(m);
          });
      }
    });

    // Milestone Diamonds overlay across task rows when showMilestones is toggled
    if (showMilestones && viewMode !== 'milestones') {
      filteredMilestones.forEach((m) => {
        const mDate = new Date(`${m.targetDate}T00:00:00+08:00`);
        if (mDate >= domainStart && mDate <= domainEnd) {
          const mx = xScale(mDate);
          const cfg = getMilestoneConfig(m.status, isAutoHighlight, highlightMilestoneFilter);
          const { percentage, completedCount, totalCount } = getMilestoneProgress(m);

          // Floating flag pin along top header
          const flagG = g
            .append('g')
            .attr('transform', `translate(${mx}, -16)`)
            .attr('cursor', 'pointer')
            .attr('opacity', cfg.opacity);

          // Top pin radiant glow circle when auto-highlight is active
          if (cfg.showPulseHalo) {
            flagG
              .append('circle')
              .attr('cx', 0)
              .attr('cy', -2)
              .attr('r', 8)
              .attr('fill', cfg.haloColor)
              .attr('stroke', cfg.ringColor)
              .attr('stroke-width', 1)
              .attr('opacity', 0.9);
          }

          flagG
            .append('polygon')
            .attr('points', '0,-7 9,-3 0,1')
            .attr('fill', cfg.color);

          flagG
            .append('line')
            .attr('x1', 0)
            .attr('y1', -6)
            .attr('x2', 0)
            .attr('y2', height + 16)
            .attr('stroke', cfg.color)
            .attr('stroke-width', cfg.lineWidth)
            .attr('stroke-dasharray', cfg.lineDash)
            .attr('opacity', cfg.lineOpacity);

          // Visual Percentage Progress Bar Pill on milestone header pin
          const pinBarW = 38;
          const pinBarH = 7;
          const pinFilledW = Math.max((pinBarW * percentage) / 100, percentage > 0 ? 3 : 0);

          const pinBarG = flagG
            .append('g')
            .attr('transform', `translate(-${pinBarW / 2}, -24)`);

          pinBarG
            .append('rect')
            .attr('width', pinBarW)
            .attr('height', pinBarH)
            .attr('rx', 3)
            .attr('fill', '#080f0d')
            .attr('stroke', cfg.color)
            .attr('stroke-width', 0.8);

          if (pinFilledW > 0) {
            pinBarG
              .append('rect')
              .attr('width', pinFilledW)
              .attr('height', pinBarH)
              .attr('rx', 3)
              .attr('fill', cfg.color);
          }

          pinBarG
            .append('text')
            .attr('x', pinBarW / 2)
            .attr('y', -3)
            .attr('text-anchor', 'middle')
            .attr('fill', cfg.color)
            .attr('font-size', '8px')
            .attr('font-weight', '900')
            .attr('font-family', 'monospace')
            .text(`${percentage}%`);

          flagG
            .on('mouseenter', (event: MouseEvent) => {
              setTooltip({
                x: event.clientX,
                y: event.clientY,
                title: m.name,
                subtitle: `${m.siteCode} · ${m.description}`,
                dateRange: `${m.targetDate} (Click to toggle sub-tasks)`,
                durationDays: 1,
                status: cfg.normStatus,
                isMilestone: true,
                progress: percentage,
                subTasks: m.subTasks || [],
                completedSubTasks: completedCount,
                totalSubTasks: totalCount,
                milestoneId: m.id,
              });
            })
            .on('mousemove', (event: MouseEvent) => {
              setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
            })
            .on('mouseleave', () => setTooltip(null))
            .on('click', () => {
              setTooltip(null);
              handleOpenEditMilestone(m);
            });
        }
      });
    }

    // Vertical "TODAY" beacon line (2026-10-06 Asia/Manila)
    if (todayDate >= domainStart && todayDate <= domainEnd) {
      const todayX = xScale(todayDate);

      // Background glow line
      g.append('line')
        .attr('x1', todayX)
        .attr('y1', -25)
        .attr('x2', todayX)
        .attr('y2', height)
        .attr('stroke', '#a3e635')
        .attr('stroke-width', 3)
        .attr('opacity', 0.25);

      // Sharp today line
      g.append('line')
        .attr('x1', todayX)
        .attr('y1', -25)
        .attr('x2', todayX)
        .attr('y2', height)
        .attr('stroke', '#a3e635')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,2');

      // Top "TODAY" pill tag
      const todayTag = g
        .append('g')
        .attr('transform', `translate(${todayX}, -34)`)
        .attr('pointer-events', 'none');

      todayTag
        .append('rect')
        .attr('x', -36)
        .attr('y', 0)
        .attr('width', 72)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#a3e635');

      todayTag
        .append('text')
        .attr('x', 0)
        .attr('y', 11)
        .attr('text-anchor', 'middle')
        .attr('fill', '#080f0d')
        .attr('font-size', '9px')
        .attr('font-weight', '900')
        .attr('font-family', 'monospace')
        .text('TODAY · OCT 6');
    }
  }, [
    rowItems,
    timeZoom,
    filteredMilestones,
    showMilestones,
    viewMode,
    todayDate,
    isAutoHighlight,
    highlightMilestoneFilter,
  ]);


  // Aggregate stats
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'In Progress').length;
  const avgProgress = totalTasks
    ? Math.round(filteredTasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks)
    : 0;

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col space-y-4 shadow-lg">
      {/* Component Header & Executive Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#234338]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Project Gantt & Milestone Timeline
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>D3-Powered Interactive Schedule</span>
                <span>·</span>
                <span>Baseline: <strong className="text-white">Asia/Manila</strong></span>
                <span>·</span>
                <span>Today: <strong className="text-[#a3e635]">{TODAY_STR}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Overall Velocity:</span>
            <span className="text-[#a3e635] font-bold text-sm">{avgProgress}%</span>
          </div>

          <div className="bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Active Packages:</span>
            <span className="text-white font-bold">{inProgressTasks}</span>
            <span className="text-slate-500 font-sans text-[10px]">({completedTasks} done)</span>
          </div>

          <div className="hidden sm:flex bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 items-center gap-2.5">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Milestones:</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]" title="In Progress Milestones">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block animate-pulse"></span>
                {milestoneCounts.inProgress} Active
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]" title="Completed Milestones">
                <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block"></span>
                {milestoneCounts.completed} Done
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Views, and Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#13241f]/70 border border-[#234338] rounded-lg p-2.5">
        {/* Site Segmented Selector */}
        <div className="flex items-center gap-1">
          {[
            { id: 'ALL', label: 'All Projects' },
            { id: 'SITE-001', label: 'Site 001 (Mariveles)' },
            { id: 'SITE-002', label: 'Site 002 (Subic)' },
            { id: 'SITE-003', label: 'Site 003 (Balanga)' },
          ].map((site) => (
            <button
              key={site.id}
              onClick={() => setSiteFilter(site.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                siteFilter === site.id
                  ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {site.label}
            </button>
          ))}
        </div>

        {/* View Mode & Zoom Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode */}
          <div className="flex items-center bg-[#0e1a16] border border-[#234338] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'all' ? 'bg-[#234338] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setViewMode('critical')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'critical' ? 'bg-[#ef4444]/30 text-red-200 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical Path
            </button>
            <button
              onClick={() => setViewMode('milestones')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'milestones' ? 'bg-[#a3e635]/20 text-[#a3e635] font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Milestones Only
            </button>
          </div>

          {/* Time Zoom */}
          <div className="flex items-center bg-[#0e1a16] border border-[#234338] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setTimeZoom('full')}
              className={`px-2 py-0.5 rounded transition-colors ${
                timeZoom === 'full' ? 'bg-[#234338] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2026-2027
            </button>
            <button
              onClick={() => setTimeZoom('quarter')}
              className={`px-2 py-0.5 rounded transition-colors ${
                timeZoom === 'quarter' ? 'bg-[#234338] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Q3-Q4 '26
            </button>
          </div>

          {/* Toggle Milestone Indicators */}
          {viewMode !== 'milestones' && (
            <button
              onClick={() => setShowMilestones(!showMilestones)}
              className={`px-2 py-1 border rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                showMilestones
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-[#0e1a16] border-[#234338] text-slate-400 hover:text-white'
              }`}
              title="Toggle milestone flags on timeline"
            >
              <Flag className="w-3 h-3" />
              <span>Milestones</span>
            </button>
          )}

          {/* Auto-Highlight Feature Toggle */}
          <button
            onClick={() => setIsAutoHighlight(!isAutoHighlight)}
            className={`px-2.5 py-1 border rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isAutoHighlight
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30 shadow-xs'
                : 'bg-[#0e1a16] border-[#234338] text-slate-400 hover:text-white'
            }`}
            title="Auto-highlight visually distinguishes In Progress vs Completed milestones"
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                isAutoHighlight ? 'text-amber-400 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span>Auto-Highlight</span>
            {isAutoHighlight && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
            )}
          </button>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-[#0e1a16] border border-[#234338] rounded-md text-xs text-white placeholder-slate-500 outline-none focus:border-[#a3e635] w-28 sm:w-36"
            />
          </div>

          {/* Manager Milestone Tracking Actions */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-[#234338]">
            <button
              onClick={handleOpenAddMilestone}
              className="px-2.5 py-1 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1"
              title="Add a critical project completion date or target milestone"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
            <button
              onClick={() => {
                setViewMode('milestones');
              }}
              className={`px-2 py-1 border rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'milestones'
                  ? 'bg-[#a3e635]/20 border-[#a3e635]/40 text-[#a3e635]'
                  : 'bg-[#13241f] border-[#234338] text-slate-300 hover:text-white'
              }`}
              title="View all editable milestones table"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Milestones ({filteredMilestones.length})</span>
            </button>
            <button
              onClick={() => setShowSubTaskTracker(!showSubTaskTracker)}
              className={`px-2 py-1 border rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                showSubTaskTracker
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-[#13241f] border-[#234338] text-slate-400 hover:text-white'
              }`}
              title="Toggle Sub-Task Progress Tracker panel"
            >
              <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sub-Tasks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Distinct Color-Coded Key for 'In Progress' vs 'Completed' Milestones */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#0b1612] border border-[#234338] rounded-xl px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Milestone Color Key:</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            {isAutoHighlight
              ? 'Auto-highlight active · Click any key to isolate on chart'
              : 'Click any key to isolate matching milestones'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* In Progress Key */}
          <button
            onClick={() =>
              setHighlightMilestoneFilter((prev) =>
                prev === 'in_progress' ? 'all' : 'in_progress'
              )
            }
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
              highlightMilestoneFilter === 'in_progress'
                ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-sm'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-500/15'
            }`}
            title="Click to spotlight In Progress milestones"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rotate-45 bg-[#f59e0b] inline-block shadow-sm"></span>
              <span className="absolute -inset-1 rounded-full bg-amber-400/30 animate-pulse"></span>
            </div>
            <span>In Progress</span>
            <span className="px-1.5 py-0.5 bg-amber-500/30 rounded text-[10px] font-mono font-extrabold text-amber-100">
              {milestoneCounts.inProgress}
            </span>
          </button>

          {/* Completed Key */}
          <button
            onClick={() =>
              setHighlightMilestoneFilter((prev) =>
                prev === 'completed' ? 'all' : 'completed'
              )
            }
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
              highlightMilestoneFilter === 'completed'
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40 shadow-sm'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/15'
            }`}
            title="Click to spotlight Completed milestones"
          >
            <div className="flex items-center justify-center">
              <span className="w-2.5 h-2.5 rotate-45 bg-[#10b981] inline-block shadow-sm"></span>
            </div>
            <span>Completed</span>
            <span className="px-1.5 py-0.5 bg-emerald-500/30 rounded text-[10px] font-mono font-extrabold text-emerald-100">
              {milestoneCounts.completed}
            </span>
          </button>

          {/* Upcoming Key */}
          <button
            onClick={() =>
              setHighlightMilestoneFilter((prev) =>
                prev === 'upcoming' ? 'all' : 'upcoming'
              )
            }
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
              highlightMilestoneFilter === 'upcoming'
                ? 'bg-sky-500/25 border-sky-400 text-sky-200 ring-2 ring-sky-400/40 shadow-sm'
                : 'bg-[#13241f] border-[#234338] text-slate-300 hover:border-sky-500/40'
            }`}
            title="Click to spotlight Upcoming scheduled milestones"
          >
            <span className="w-2.5 h-2.5 rotate-45 border border-sky-400 bg-sky-950/40 inline-block"></span>
            <span>Upcoming</span>
            <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] font-mono font-bold text-slate-300">
              {milestoneCounts.upcoming}
            </span>
          </button>

          {/* Critical Path Key */}
          <button
            onClick={() =>
              setHighlightMilestoneFilter((prev) =>
                prev === 'critical' ? 'all' : 'critical'
              )
            }
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
              highlightMilestoneFilter === 'critical'
                ? 'bg-red-500/25 border-red-400 text-red-200 ring-2 ring-red-400/40 shadow-sm'
                : 'bg-[#13241f] border-[#234338] text-slate-300 hover:border-red-500/40'
            }`}
            title="Click to spotlight Critical path milestones"
          >
            <span className="w-2.5 h-2.5 rotate-45 bg-[#ef4444] inline-block"></span>
            <span>Critical Path</span>
            <span className="px-1.5 py-0.5 bg-red-950/50 rounded text-[10px] font-mono font-bold text-red-300">
              {milestoneCounts.critical}
            </span>
          </button>

          {/* Reset filter button if a spotlight is active */}
          {highlightMilestoneFilter !== 'all' && (
            <button
              onClick={() => setHighlightMilestoneFilter('all')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-dashed border-[#234338]"
              title="Reset spotlight filter and show all"
            >
              Show All
            </button>
          )}
        </div>
      </div>


      {/* D3 Gantt Chart Viewport */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto bg-[#0a1411] border border-[#234338] rounded-xl p-2 sm:p-3 relative select-none"
      >
        <svg ref={svgRef} className="block w-full min-w-[760px]"></svg>

        {/* Floating Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'fixed',
              left: `${tooltip.x + 14}px`,
              top: `${tooltip.y + 14}px`,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
            className="bg-[#0e1a16]/95 border border-[#a3e635]/60 text-white p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs text-xs animate-in fade-in duration-100"
          >
            <div className="font-bold text-sm text-white mb-0.5">{tooltip.title}</div>
            <div className="text-[11px] text-[#a3e635] font-semibold mb-2">{tooltip.subtitle}</div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">{tooltip.isMilestone ? 'Target Date:' : 'Schedule:'}</span>
                <span className="font-mono text-white">{tooltip.dateRange}</span>
              </div>

              {!tooltip.isMilestone && (
                <>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-mono text-white">{tooltip.durationDays} calendar days</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Completion:</span>
                    <span className="font-mono text-emerald-400 font-bold">{tooltip.progress}%</span>
                  </div>
                  {tooltip.supervisor && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Lead:</span>
                      <span className="text-slate-200">{tooltip.supervisor}</span>
                    </div>
                  )}
                  {tooltip.category && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Work Package:</span>
                      <span className="text-slate-200">{tooltip.category}</span>
                    </div>
                  )}
                </>
              )}

              {tooltip.isMilestone && (
                <div className="pt-2 border-t border-[#234338] mt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#a3e635]" />
                      <span>Sub-Task Progress:</span>
                    </span>
                    <span className="font-mono font-bold text-[#a3e635]">
                      {tooltip.progress ?? 0}% ({tooltip.completedSubTasks ?? 0}/{tooltip.totalSubTasks ?? 0})
                    </span>
                  </div>

                  {/* Visual Percentage Progress Bar in Tooltip */}
                  <div className="w-full bg-[#13241f] h-2.5 rounded-full overflow-hidden border border-[#234338] p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${tooltip.progress ?? 0}%`,
                        backgroundColor:
                          (tooltip.progress ?? 0) === 100
                            ? '#10b981'
                            : (tooltip.progress ?? 0) > 0
                            ? '#f59e0b'
                            : '#38bdf8',
                      }}
                    />
                  </div>

                  {/* Sub-Task Checklist */}
                  {tooltip.subTasks && tooltip.subTasks.length > 0 && (
                    <div className="space-y-1 pt-1 max-h-36 overflow-y-auto pr-1">
                      {tooltip.subTasks.map((st) => (
                        <div key={st.id} className="flex items-start gap-1.5 text-[10.5px] leading-tight">
                          <span className={`shrink-0 mt-0.5 ${st.completed ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {st.completed ? '✓' : '○'}
                          </span>
                          <span className={st.completed ? 'text-slate-400 line-through' : 'text-slate-200'}>
                            {st.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-[#a3e635] pt-0.5 flex items-center gap-1 font-semibold">
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Click milestone to edit or toggle sub-tasks</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-4 pt-1 border-t border-[#234338] mt-1">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-semibold flex items-center gap-1.5 ${
                    tooltip.status === 'Completed' || tooltip.status === 'Achieved'
                      ? 'text-[#10b981]'
                      : tooltip.status === 'In Progress'
                      ? 'text-[#f59e0b]'
                      : tooltip.status === 'Critical'
                      ? 'text-red-400'
                      : 'text-sky-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      tooltip.status === 'Completed' || tooltip.status === 'Achieved'
                        ? 'bg-[#10b981]'
                        : tooltip.status === 'In Progress'
                        ? 'bg-[#f59e0b] animate-ping'
                        : tooltip.status === 'Critical'
                        ? 'bg-red-400'
                        : 'bg-sky-400'
                    }`}
                  />
                  <span>
                    {tooltip.status === 'Achieved'
                      ? 'Completed (Signed Off)'
                      : tooltip.status === 'In Progress'
                      ? 'In Progress (Active)'
                      : tooltip.status === 'Completed'
                      ? 'Completed (Signed Off)'
                      : tooltip.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Legend & Next Upcoming Milestone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        {/* Visual Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-[#f59e0b] inline-block shadow-xs"></span>
            <span className="text-amber-300 font-semibold">In Progress Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-[#10b981] inline-block shadow-xs"></span>
            <span className="text-emerald-300 font-semibold">Completed Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 border border-sky-400 bg-sky-950/40 inline-block"></span>
            <span>Upcoming Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-xs bg-[#ef4444]"></span>
            <span>Critical Path Work</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[#a3e635]">
            <span className="w-1.5 h-2.5 border-r border-[#a3e635] border-dashed inline-block"></span>
            <span>Today (Oct 06)</span>
          </div>
        </div>

        {/* Immediate Next Milestone Alert with Click-to-Edit */}
        {filteredMilestones.length > 0 && (
          <div
            onClick={() => {
              const nextM =
                filteredMilestones.find((m) => m.status === 'In Progress') ||
                filteredMilestones.find((m) => m.status === 'Critical') ||
                filteredMilestones.find((m) => m.status === 'Upcoming') ||
                filteredMilestones[0];
              if (nextM) handleOpenEditMilestone(nextM);
            }}
            className="flex items-center gap-2 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] px-3 py-1 rounded-lg cursor-pointer transition-colors"
            title="Click to view or edit this active or upcoming milestone"
          >
            <Clock className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
            <span className="text-[11px] text-slate-300 truncate">
              {filteredMilestones.some((m) => m.status === 'In Progress')
                ? 'Active Target:'
                : filteredMilestones.some((m) => m.status === 'Critical')
                ? 'Critical Milestone:'
                : 'Next Milestone:'}{' '}
              <strong className="text-white">
                {(
                  filteredMilestones.find((m) => m.status === 'In Progress') ||
                  filteredMilestones.find((m) => m.status === 'Critical') ||
                  filteredMilestones.find((m) => m.status === 'Upcoming') ||
                  filteredMilestones[0]
                )?.name}{' '}
                (
                {(
                  filteredMilestones.find((m) => m.status === 'In Progress') ||
                  filteredMilestones.find((m) => m.status === 'Critical') ||
                  filteredMilestones.find((m) => m.status === 'Upcoming') ||
                  filteredMilestones[0]
                )?.targetDate}
                )
              </strong>
            </span>
            <Edit2 className="w-3 h-3 text-[#a3e635]" />
          </div>
        )}
      </div>

      {/* Milestone Sub-Task Completion Tracker Panel */}
      {showSubTaskTracker && (
        <div className="bg-[#0b1612] border border-[#234338] rounded-xl p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#234338]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
                <ListTodo className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Milestone Sub-Task Progress Tracker</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Live Sync with Gantt
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Toggle completion status of sub-tasks to dynamically update percentage progress bars across the Gantt chart
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                {filteredMilestones.length} Milestones Tracked
              </span>
              <button
                onClick={handleOpenAddMilestone}
                className="px-2.5 py-1 bg-[#234338] hover:bg-[#a3e635] hover:text-[#080f0d] text-slate-200 hover:font-bold rounded-md transition-colors text-xs flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>New Milestone</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredMilestones.map((m) => {
              const { percentage, completedCount, totalCount } = getMilestoneProgress(m);
              const cfg = getMilestoneConfig(m.status, isAutoHighlight, highlightMilestoneFilter);

              return (
                <div
                  key={m.id}
                  className="bg-[#0e1a16] border border-[#234338] hover:border-[#336353] rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-all shadow-sm"
                >
                  <div className="space-y-2">
                    {/* Header: Site, Status, Edit */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#13241f] text-[#a3e635] border border-[#234338]">
                          {m.siteCode}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            cfg.normStatus === 'In Progress'
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : cfg.normStatus === 'Completed'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : cfg.normStatus === 'Critical'
                              ? 'bg-red-500/15 border-red-500/40 text-red-300'
                              : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full inline-block ${
                              cfg.normStatus === 'In Progress'
                                ? 'bg-[#f59e0b] animate-ping'
                                : cfg.normStatus === 'Completed'
                                ? 'bg-[#10b981]'
                                : cfg.normStatus === 'Critical'
                                ? 'bg-[#ef4444]'
                                : 'bg-[#38bdf8]'
                            }`}
                          />
                          <span>{cfg.badgeText}</span>
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenEditMilestone(m)}
                        className="text-slate-400 hover:text-[#a3e635] p-1 rounded hover:bg-[#13241f] transition-colors"
                        title="Edit Milestone"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Milestone Name & Date */}
                    <div>
                      <h4 className="font-bold text-xs text-white leading-snug line-clamp-1" title={m.name}>
                        {m.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                        <span>Target: <strong className="text-slate-200">{m.targetDate}</strong></span>
                        <span className="truncate max-w-[140px] text-slate-500">{m.siteName}</span>
                      </div>
                    </div>

                    {/* Visual Percentage Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400 text-[10px] font-sans font-semibold">
                          Completion Progress:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-extrabold text-xs"
                            style={{ color: cfg.color }}
                          >
                            {percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({completedCount}/{totalCount})
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#080f0d] h-3 rounded-full overflow-hidden border border-[#234338] relative p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-300 shadow-sm"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: cfg.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Interactive Sub-Tasks Checklist */}
                    <div className="pt-2 space-y-1.5 border-t border-[#1a332a]">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Sub-Tasks (Click to toggle):
                      </div>

                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {(m.subTasks || []).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleToggleSubTask(m.id, st.id)}
                            className={`w-full flex items-start gap-2 p-1.5 rounded-lg text-left text-[11px] transition-all cursor-pointer ${
                              st.completed
                                ? 'bg-emerald-950/25 border border-emerald-500/30 text-slate-300'
                                : 'bg-[#13241f] border border-[#234338] hover:border-slate-500 text-slate-200'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0">
                              {st.completed ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </span>
                            <span
                              className={`leading-tight flex-1 ${
                                st.completed ? 'line-through text-slate-400' : 'text-slate-200'
                              }`}
                            >
                              {st.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Add Sub-Task field on card */}
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#1a332a]">
                    <input
                      type="text"
                      placeholder="Add sub-task..."
                      value={quickAddInputs[m.id] || ''}
                      onChange={(e) =>
                        setQuickAddInputs({ ...quickAddInputs, [m.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAddSubTask(m.id);
                        }
                      }}
                      className="flex-1 px-2 py-1 bg-[#13241f] border border-[#234338] rounded-md text-[11px] text-white placeholder-slate-500 outline-none focus:border-[#a3e635]"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickAddSubTask(m.id)}
                      className="px-2 py-1 bg-[#234338] hover:bg-[#a3e635] hover:text-[#080f0d] text-slate-200 rounded-md text-[11px] font-bold transition-colors shrink-0 flex items-center gap-0.5 cursor-pointer"
                      title="Add sub-task to this milestone"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editable Milestone Modal for Managers */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl max-w-md w-full shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {editingMilestone ? 'Edit Critical Milestone' : 'Add Project Milestone'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Highlight critical completion dates directly in the Gantt timeline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Milestone Name / Critical Target <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steel Framing Topping Off, Power Energization..."
                  value={milestoneFormData.name}
                  onChange={(e) =>
                    setMilestoneFormData({ ...milestoneFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white outline-none focus:border-[#a3e635]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Site <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={milestoneFormData.siteId}
                    onChange={(e) =>
                      setMilestoneFormData({ ...milestoneFormData, siteId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white outline-none focus:border-[#a3e635]"
                  >
                    <option value="SITE-001">Site 001 - Mariveles</option>
                    <option value="SITE-002">Site 002 - Subic</option>
                    <option value="SITE-003">Site 003 - Balanga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Completion Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={milestoneFormData.targetDate}
                    onChange={(e) =>
                      setMilestoneFormData({ ...milestoneFormData, targetDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white font-mono outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Milestone Criticality & Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      value: 'In Progress',
                      label: 'In Progress',
                      color: 'border-amber-500/50 text-amber-300 bg-amber-950/30',
                      ring: 'ring-amber-400',
                      dot: 'bg-[#f59e0b]',
                    },
                    {
                      value: 'Completed',
                      label: 'Completed',
                      color: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/30',
                      ring: 'ring-emerald-400',
                      dot: 'bg-[#10b981]',
                    },
                    {
                      value: 'Upcoming',
                      label: 'Upcoming',
                      color: 'border-sky-500/50 text-sky-300 bg-sky-950/30',
                      ring: 'ring-sky-400',
                      dot: 'bg-[#38bdf8]',
                    },
                    {
                      value: 'Critical',
                      label: 'Critical Path',
                      color: 'border-red-500/50 text-red-300 bg-red-950/30',
                      ring: 'ring-red-400',
                      dot: 'bg-[#ef4444]',
                    },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        setMilestoneFormData({
                          ...milestoneFormData,
                          status: s.value as any,
                        })
                      }
                      className={`py-2 px-1.5 border rounded-lg text-center font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        milestoneFormData.status === s.value
                          ? `${s.color} ring-1 ${s.ring}`
                          : 'bg-[#13241f] border-[#234338] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0`}></span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Milestone Progress Bar & Sub-Tasks Management */}
              <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-3">
                {(() => {
                  const modalProgress = getMilestoneProgress({
                    ...milestoneFormData,
                    id: editingMilestone ? editingMilestone.id : 'temp',
                    siteCode: '',
                    siteName: '',
                  } as GanttMilestone);

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <ListTodo className="w-3.5 h-3.5 text-[#a3e635]" />
                          <span>Sub-Tasks & Deliverables</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-extrabold text-[#a3e635] bg-[#0e1a16] px-2 py-0.5 rounded border border-[#234338]">
                            {modalProgress.percentage}% Done
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({modalProgress.completedCount}/{modalProgress.totalCount})
                          </span>
                        </div>
                      </div>

                      {/* Visual Percentage Progress Bar */}
                      <div className="w-full bg-[#0a1411] h-3.5 rounded-full overflow-hidden border border-[#234338] relative p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-300 shadow-sm"
                          style={{
                            width: `${modalProgress.percentage}%`,
                            backgroundColor:
                              modalProgress.percentage === 100
                                ? '#10b981'
                                : modalProgress.percentage > 0
                                ? '#f59e0b'
                                : '#38bdf8',
                          }}
                        />
                      </div>

                      {/* Interactive Sub-Tasks Checklist */}
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {milestoneFormData.subTasks.length === 0 ? (
                          <div className="text-[11px] text-slate-500 italic py-1 text-center">
                            No sub-tasks added yet. Add engineering items below.
                          </div>
                        ) : (
                          milestoneFormData.subTasks.map((st) => (
                            <div
                              key={st.id}
                              className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-all ${
                                st.completed
                                  ? 'bg-emerald-950/20 border-emerald-500/30'
                                  : 'bg-[#0e1a16] border-[#234338]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleModalSubTask(st.id)}
                                className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                              >
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                    st.completed
                                      ? 'bg-[#10b981] border-[#10b981] text-black'
                                      : 'border-slate-500 hover:border-[#a3e635]'
                                  }`}
                                >
                                  {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span
                                  className={`text-xs ${
                                    st.completed
                                      ? 'text-slate-400 line-through'
                                      : 'text-slate-200 font-medium'
                                  }`}
                                >
                                  {st.name}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveModalSubTask(st.id)}
                                className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                                title="Remove sub-task"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Quick Add Sub-Task in Modal */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add sub-task (e.g. Pile load test signoff, Rebar QA)..."
                          value={newModalSubTaskName}
                          onChange={(e) => setNewModalSubTaskName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddModalSubTask();
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-[#0e1a16] border border-[#234338] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-[#a3e635]"
                        />
                        <button
                          type="button"
                          onClick={handleAddModalSubTask}
                          className="px-3 py-1.5 bg-[#234338] hover:bg-[#a3e635] hover:text-[#080f0d] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Manager Description / Engineering Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Geotechnical structural signoff, LGU occupancy clearance, crane dismantling..."
                  value={milestoneFormData.description}
                  onChange={(e) =>
                    setMilestoneFormData({ ...milestoneFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white outline-none focus:border-[#a3e635] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#234338]">
                {editingMilestone ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(editingMilestone.id)}
                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMilestoneModalOpen(false)}
                    className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingMilestone ? 'Save Milestone' : 'Add Milestone'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
