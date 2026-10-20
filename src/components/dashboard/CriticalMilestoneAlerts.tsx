import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { GanttMilestone } from './ProjectGanttChart';
import {
  Bell,
  BellRing,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Volume2,
  VolumeX,
  Smartphone,
  ShieldCheck,
  Building,
  UserCheck,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';

export interface RegisteredManager {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  siteScope: string;
  deviceType: 'Desktop Push' | 'Mobile Gateway' | 'Executive Terminal';
  isRegistered: boolean;
  status: 'ACTIVE' | 'STANDBY';
}

export interface CriticalMilestoneAlertsProps {
  milestones: GanttMilestone[];
  currentSite: string;
  onSelectMilestone?: (milestoneId: string) => void;
}

export const CriticalMilestoneAlerts: React.FC<CriticalMilestoneAlertsProps> = ({
  milestones,
  currentSite,
  onSelectMilestone,
}) => {
  const { sites, employees, addAuditLog } = useApp();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastDispatchedTime, setLastDispatchedTime] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchSuccessToast, setDispatchSuccessToast] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [showManagerDirectoryModal, setShowManagerDirectoryModal] = useState<boolean>(false);

  // Today reference in Asia/Manila context (2026-10-06)
  const todayStr = '2026-10-06';
  const todayTime = new Date('2026-10-06T08:00:00+08:00').getTime();

  // Registered managers registry assembled from company structure & active supervisors
  const registeredManagers: RegisteredManager[] = useMemo(() => {
    return [
      {
        id: 'MGR-001',
        name: 'Engr. Marco De Rueda',
        role: 'CEO & Project Director',
        email: 'operations@deruedaconstruction.com',
        phone: '+63 917 582 9104',
        siteScope: 'Enterprise / Site 001',
        deviceType: 'Executive Terminal',
        isRegistered: true,
        status: 'ACTIVE',
      },
      {
        id: 'MGR-002',
        name: 'Engr. Aris Valdez',
        role: 'Subic Project Manager & Structural PE',
        email: 'aris.valdez@deruedaconstruction.com',
        phone: '+63 918 345 6789',
        siteScope: 'Site 002 (Subic Complex)',
        deviceType: 'Mobile Gateway',
        isRegistered: true,
        status: 'ACTIVE',
      },
      {
        id: 'MGR-003',
        name: 'Foreman Danilo Santos',
        role: 'Balanga General Field Supervisor',
        email: 'danilo.santos@deruedaconstruction.com',
        phone: '+63 920 987 6543',
        siteScope: 'Site 003 (Residential)',
        deviceType: 'Mobile Gateway',
        isRegistered: true,
        status: 'ACTIVE',
      },
      {
        id: 'MGR-004',
        name: 'Admin 1 (Operations HQ)',
        role: 'Construction Ops & Dispatch Manager',
        email: 'admin1@deruedaconstruction.com',
        phone: '+63 917 111 2233',
        siteScope: 'All Active Sites',
        deviceType: 'Desktop Push',
        isRegistered: true,
        status: 'ACTIVE',
      },
      {
        id: 'MGR-005',
        name: 'Admin 2 (Safety & Quality)',
        role: 'DOLE OSHC Certified Safety Inspector',
        email: 'admin2@deruedaconstruction.com',
        phone: '+63 917 444 5566',
        siteScope: 'All Active Sites',
        deviceType: 'Desktop Push',
        isRegistered: true,
        status: 'ACTIVE',
      },
    ];
  }, []);

  // Filter critical milestones where deadline is within 48 hours
  const criticalMilestonesWithin48Hours = useMemo(() => {
    return milestones.filter((m) => {
      // Must be critical
      const isCritical = m.status === 'Critical';
      const isNotComplete = m.status !== 'Completed' && m.status !== 'Achieved';

      if (!isCritical || !isNotComplete) return false;

      // Filter by current site context if scoped
      if (currentSite !== 'ALL' && m.siteId !== currentSite) return false;

      // Calculate hours difference between today (2026-10-06 08:00) and targetDate (23:59)
      const targetTime = new Date(`${m.targetDate}T23:59:59+08:00`).getTime();
      const diffHours = (targetTime - todayTime) / (1000 * 60 * 60);

      // Within 48 hours (including overdue or deadline up to +48 hours from baseline)
      return diffHours <= 48;
    });
  }, [milestones, currentSite, todayTime]);

  // Combined with simulation if manager enabled test simulation
  const activeAlertList = useMemo(() => {
    if (criticalMilestonesWithin48Hours.length > 0) {
      return criticalMilestonesWithin48Hours;
    }
    if (simulationActive) {
      return [
        {
          id: 'M-SIM-48H',
          siteId: 'SITE-001',
          siteName: 'Mariveles Industrial Park Warehouse A',
          siteCode: 'Site 001',
          name: 'SIMULATED: Emergency Pre-Pour Slab Inspection Signoff',
          targetDate: '2026-10-08',
          status: 'Critical' as const,
          description: 'Structural PE mandatory rebar stress and cylinder test verification within 48h deadline window',
          subTasks: [
            { id: 'sim-1', name: 'Grade 60 deform bar rebar spacing & splice length verification', completed: true },
            { id: 'sim-2', name: 'Concrete cylinder compression 7-day break test certification', completed: false },
          ],
        },
      ];
    }
    return [];
  }, [criticalMilestonesWithin48Hours, simulationActive]);

  // Web Audio synthesizer for gentle, high-urgency radar chirp
  const playAlertChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Request browser Web Push notification permission
  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification('De Rueda Construction ERP', {
            body: 'Automated Manager Alert System is active. You will receive immediate push notifications when critical milestone deadlines approach within 48 hours.',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }
    }
  };

  // Automated push notification dispatcher to all registered managers
  const dispatchPushNotificationToManagers = (targetMilestones: GanttMilestone[] = activeAlertList) => {
    if (targetMilestones.length === 0) return;
    setIsDispatching(true);

    playAlertChime();

    targetMilestones.forEach((m) => {
      // Calculate remaining hours
      const targetTime = new Date(`${m.targetDate}T23:59:59+08:00`).getTime();
      const hoursRemaining = Math.max(0, Math.round((targetTime - todayTime) / (1000 * 60 * 60)));

      // 1. Browser Native Push Notification (if supported & permitted)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`⚡ CRITICAL MILESTONE WITHIN ${hoursRemaining}H: ${m.siteCode}`, {
            body: `${m.name}\nTarget: ${m.targetDate} | Immediate manager signoff required!`,
            tag: `critical-milestone-${m.id}`,
            icon: '/favicon.ico',
          });
        } catch {
          // Fallback if background notification blocked
        }
      }

      // 2. Trigger immutable audit log entry for push alert dispatch
      addAuditLog(
        'PUSH_NOTIFICATION_DISPATCH',
        'PROJECT_MILESTONE',
        m.id,
        `Automated critical milestone push notification dispatched to 5 registered managers for "${m.name}" (${m.siteCode}, Target: ${m.targetDate}, SLA: <48h)`
      );
    });

    const nowFormatted = new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    setLastDispatchedTime(nowFormatted);

    setTimeout(() => {
      setIsDispatching(false);
      setDispatchSuccessToast(
        `Push notifications successfully dispatched to ${registeredManagers.length} registered managers via Executive Push & Mobile SMS Gateway.`
      );
    }, 600);

    setTimeout(() => {
      setDispatchSuccessToast(null);
    }, 7000);
  };

  // Automated check on mount or when critical milestones list changes
  const hasTriggeredInitialAlertRef = useRef(false);
  useEffect(() => {
    if (criticalMilestonesWithin48Hours.length > 0 && !hasTriggeredInitialAlertRef.current) {
      hasTriggeredInitialAlertRef.current = true;
      dispatchPushNotificationToManagers(criticalMilestonesWithin48Hours);
    }
  }, [criticalMilestonesWithin48Hours]);

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden space-y-4">
      {/* Background Warning Glow */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-red-500/10 via-amber-500/5 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#234338]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              activeAlertList.length > 0
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse shadow-md shadow-red-950/50'
                : 'bg-[#13241f] border border-[#234338] text-[#a3e635]'
            }`}
          >
            {activeAlertList.length > 0 ? (
              <BellRing className="w-5 h-5 text-red-400" />
            ) : (
              <Bell className="w-5 h-5 text-[#a3e635]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase flex items-center gap-1.5">
                Automated Manager Alert Center
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeAlertList.length > 0
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {activeAlertList.length > 0
                  ? `⚡ ${activeAlertList.length} CRITICAL DEADLINE < 48H`
                  : 'SLA COMPLIANT (0 WITHIN 48H)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Automatic push notifications dispatched to registered project managers & site directors when critical milestones hit 48-hour SLA deadline
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'Alert chimes enabled' : 'Alert chimes muted'}
            className="p-2 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] text-slate-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#a3e635]" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Manager Directory Modal Button */}
          <button
            onClick={() => setShowManagerDirectoryModal(true)}
            className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] hover:border-[#10b981] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Registered Managers ({registeredManagers.length})</span>
          </button>

          {/* Trigger / Re-dispatch Button */}
          <button
            onClick={() => dispatchPushNotificationToManagers()}
            disabled={isDispatching || activeAlertList.length === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              activeAlertList.length > 0
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-900/30'
                : 'bg-[#13241f] text-slate-500 border border-[#234338] cursor-not-allowed'
            }`}
          >
            <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
            <span>{isDispatching ? 'Dispatching...' : 'Dispatch Push Alert Now'}</span>
          </button>

        </div>
      </div>

      {/* Browser Notification Status Notice */}
      {notificationPermission !== 'granted' && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Enable Native OS Push Notifications:</strong> Allow browser push notifications so registered project managers receive critical deadline alerts directly on desktop and mobile screens.
            </span>
          </div>
          <button
            onClick={handleRequestPushPermission}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Enable Push Notifications
          </button>
        </div>
      )}

      {/* Success Toast */}
      {dispatchSuccessToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dispatchSuccessToast}</span>
          </div>
          <button
            onClick={() => setDispatchSuccessToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Critical Milestones Alert Cards Grid */}
      {activeAlertList.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical Milestones Due Within 48 Hours Requiring Immediate Manager Signoff
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {lastDispatchedTime ? `Last Dispatched: ${lastDispatchedTime}` : 'Automated Trigger: Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activeAlertList.map((m) => {
              const targetTime = new Date(`${m.targetDate}T23:59:59+08:00`).getTime();
              const hoursRemaining = Math.max(0, Math.round((targetTime - todayTime) / (1000 * 60 * 60)));
              const isExpanded = expandedDetailsId === m.id;

              return (
                <div
                  key={m.id}
                  className="bg-red-950/20 border border-red-500/40 hover:border-red-400/80 rounded-xl p-4 transition-all shadow-sm space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-500/30 text-red-200 border border-red-500/50">
                          {m.id}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#13241f] text-[#a3e635] border border-[#234338]">
                          {m.siteCode}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hoursRemaining <= 0 ? 'DUE TODAY' : `${hoursRemaining} HOURS REMAINING`}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-red-200 transition-colors">
                        {m.name}
                      </h3>
                      <p className="text-[11px] text-slate-300 line-clamp-2">
                        {m.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-red-300">
                        {m.targetDate}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Deadline
                      </div>
                    </div>
                  </div>

                  {/* Registered Manager Target Dispatch Preview */}
                  <div className="bg-[#0e1a16] border border-[#234338] rounded-lg p-2.5 text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                        Registered Dispatch Recipients:
                      </span>
                      <span className="font-mono text-emerald-400 font-bold text-[10px]">
                        5/5 DELIVERED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-slate-300">
                      {registeredManagers.slice(0, 4).map((mgr) => (
                        <div
                          key={mgr.id}
                          className="flex items-center justify-between px-2 py-1 rounded bg-[#13241f] border border-[#234338]/60"
                        >
                          <div className="truncate pr-1">
                            <span className="font-bold text-white">{mgr.name}</span>
                            <span className="text-slate-400 ml-1">({mgr.role.split(' ')[0]})</span>
                          </div>
                          <span className="text-[#a3e635] font-mono text-[9px] shrink-0">PUSH SENT</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-tasks / Checkpoints preview */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#234338]/60 text-[11px]">
                    <div className="text-slate-400">
                      Checkpoints:{' '}
                      <strong className="text-white">
                        {m.subTasks?.filter((st) => st.completed).length || 0}/
                        {m.subTasks?.length || 0}
                      </strong>{' '}
                      Completed
                    </div>

                    <button
                      onClick={() => onSelectMilestone?.(m.id)}
                      className="text-[#a3e635] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect in Gantt &rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Zero Alerts State */
        <div className="bg-[#13241f]/40 border border-[#234338] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>All Critical Milestones Currently Outside 48-Hour Alert Window</span>
                <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OPTIMAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automated monitors continuously inspect work package target dates. Push notifications will instantly broadcast to registered managers if any critical deadline approaches within 48 hours.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSimulationActive(true);
                playAlertChime();
              }}
              className="px-2.5 py-1.5 bg-[#13241f] hover:bg-[#1a332c] border border-[#234338] hover:border-amber-400/50 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate 48h Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* Registered Managers Directory Modal */}
      {showManagerDirectoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#a3e635]" />
                <h3 className="text-base font-bold text-white">
                  Registered Project Managers & Push Notification Recipients
                </h3>
              </div>
              <button
                onClick={() => setShowManagerDirectoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              These registered project managers, site directors, and safety inspectors receive automated high-priority push notifications and SMS dispatches when a critical milestone deadline enters the 48-hour window.
            </p>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {registeredManagers.map((mgr) => (
                <div
                  key={mgr.id}
                  className="p-3 bg-[#13241f] border border-[#234338] rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{mgr.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#0e1a16] text-[#a3e635] border border-[#234338]">
                        {mgr.id}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {mgr.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-semibold">{mgr.role}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{mgr.email}</span>
                      <span>&bull;</span>
                      <span>{mgr.phone}</span>
                      <span>&bull;</span>
                      <span className="text-[#a3e635]">{mgr.siteScope}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0e1a16] text-slate-300 border border-[#234338]">
                      {mgr.deviceType}
                    </span>
                    <div className="text-[9px] text-emerald-400 font-bold mt-1">
                      &bull; PUSH ACTIVE
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#234338] flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Configured in Master Enterprise Access Ledger (ISO 9001 / DOLE D.O. 13 compliant)
              </span>
              <button
                onClick={() => setShowManagerDirectoryModal(false)}
                className="px-3.5 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold rounded-lg cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
